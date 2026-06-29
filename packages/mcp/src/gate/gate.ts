import type { AuditLogger } from "../audit/auditLogger.js";
import { createAuditLogger } from "../audit/jsonlAuditLogger.js";
import { noopAuditLogger } from "../audit/noopAuditLogger.js";
import { evaluatePolicy } from "../policy/evaluatePolicy.js";
import { assertPolicy } from "../policy/validatePolicy.js";
import { createRateLimiter } from "../rateLimit/rateLimiter.js";
import { redact } from "../redaction/redact.js";
import { ToolTimeoutError, withTimeout } from "../timeout/withTimeout.js";
import { createRequestId } from "../utils/createRequestId.js";
import { safeJsonClone, summarizeOutput } from "../utils/safeJson.js";
import {
  approvalDeniedError,
  approvalError,
  approvalRequiredError,
  createMeta,
  handlerError,
  policyViolationError,
  rateLimitedError,
  redactionError,
  timeoutError
} from "./result.js";
import type {
  ProtectedToolHandler,
  ToolGateContext,
  ToolGateResult,
  ToolHandler,
  ToolPolicy
} from "./types.js";

export function gate<TInput, TOutput>(
  policy: ToolPolicy,
  handler: ToolHandler<TInput, TOutput>
): ProtectedToolHandler<TInput, ToolGateResult<TOutput>> {
  assertPolicy(policy);
  const rateLimiter = createRateLimiter(policy.rateLimit);

  return async (input: TInput) => {
    const controller = new AbortController();
    const ctx: ToolGateContext = {
      toolName: policy.name,
      risk: policy.risk ?? "read",
      signal: controller.signal,
      startedAt: new Date(),
      requestId: createRequestId(),
      policy
    };
    const audit = resolveAuditLogger(policy);
    const auditInput = redactForLogs(input, policy);
    let approvalMetadata: Record<string, unknown> | undefined;

    const decision = evaluatePolicy(policy, input);
    if (!decision.allowed) {
      const error = policyViolationError(policy, decision);
      await safeAudit(audit, {
        timestamp: new Date().toISOString(),
        tool: policy.name,
        risk: ctx.risk,
        decision: "blocked",
        requestId: ctx.requestId,
        durationMs: createMeta(ctx).durationMs,
        reason: error.code,
        input: auditInput,
        metadata: policy.metadata
      });
      return { ok: false, error, meta: createMeta(ctx) };
    }

    if (policy.requireApproval) {
      if (!policy.approval) {
        const error = approvalRequiredError(policy);
        await auditBlocked(audit, policy, ctx, auditInput, error.code);
        return { ok: false, error, meta: createMeta(ctx) };
      }

      try {
        const rawDecision = await policy.approval({
          input,
          requestId: ctx.requestId,
          toolName: ctx.toolName,
          risk: ctx.risk,
          policy
        });
        const decision =
          typeof rawDecision === "boolean" ? { approved: rawDecision } : rawDecision;

        if (!decision.approved) {
          const error = approvalDeniedError(policy, decision.reason);
          await auditBlocked(audit, policy, ctx, auditInput, error.code, decision.metadata);
          return { ok: false, error, meta: createMeta(ctx) };
        }

        approvalMetadata = decision.metadata;
      } catch (error) {
        const normalizedError = approvalError(policy, error);
        await auditFailure(audit, policy, ctx, auditInput, normalizedError);
        return { ok: false, error: normalizedError, meta: createMeta(ctx) };
      }
    }

    const rateLimitDecision = rateLimiter?.check();
    if (rateLimitDecision && !rateLimitDecision.allowed) {
      const error = rateLimitedError(policy, rateLimitDecision.retryAfterMs ?? 0);
      await safeAudit(audit, {
        timestamp: new Date().toISOString(),
        tool: policy.name,
        risk: ctx.risk,
        decision: "blocked",
        requestId: ctx.requestId,
        durationMs: createMeta(ctx).durationMs,
        reason: error.code,
        input: auditInput,
        metadata: policy.metadata
      });
      return { ok: false, error, meta: createMeta(ctx) };
    }

    try {
      const output = await withTimeout(handler(input, ctx), policy.timeoutMs, controller, policy);
      let redactedOutput: TOutput;
      try {
        redactedOutput = policy.redact ? redact(output, policy.redact) : output;
      } catch (error) {
        const normalizedError = redactionError(policy, error);
        await auditFailure(audit, policy, ctx, auditInput, normalizedError);
        return { ok: false, error: normalizedError, meta: createMeta(ctx) };
      }

      await safeAudit(audit, {
        timestamp: new Date().toISOString(),
        tool: policy.name,
        risk: ctx.risk,
        decision: "allowed",
        requestId: ctx.requestId,
        durationMs: createMeta(ctx).durationMs,
        reason: policy.requireApproval ? "APPROVED" : undefined,
        input: auditInput,
        outputSummary: summarizeOutput(redactedOutput),
        metadata: mergeMetadata(policy.metadata, approvalMetadata)
      });

      return { ok: true, data: redactedOutput, meta: createMeta(ctx) };
    } catch (error) {
      const normalizedError =
        error instanceof ToolTimeoutError
          ? timeoutError(policy, error.timeoutMs)
          : handlerError(policy, error);

      await auditFailure(audit, policy, ctx, auditInput, normalizedError);
      return { ok: false, error: normalizedError, meta: createMeta(ctx) };
    }
  };
}

async function auditBlocked(
  audit: AuditLogger,
  policy: ToolPolicy,
  ctx: ToolGateContext,
  input: unknown,
  reason: string,
  approvalMetadata?: Record<string, unknown>
): Promise<void> {
  await safeAudit(audit, {
    timestamp: new Date().toISOString(),
    tool: policy.name,
    risk: ctx.risk,
    decision: "blocked",
    requestId: ctx.requestId,
    durationMs: createMeta(ctx).durationMs,
    reason,
    input,
    metadata: mergeMetadata(policy.metadata, approvalMetadata)
  });
}

function mergeMetadata(
  policyMetadata?: Record<string, unknown>,
  approvalMetadata?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!policyMetadata && !approvalMetadata) {
    return undefined;
  }
  return { ...policyMetadata, ...approvalMetadata };
}

function resolveAuditLogger(policy: ToolPolicy): AuditLogger {
  if (policy.audit && typeof policy.audit === "object") {
    return policy.audit;
  }
  if (policy.audit === true) {
    return createAuditLogger({ file: ".toolgate/audit.jsonl" });
  }
  return noopAuditLogger;
}

function redactForLogs(input: unknown, policy: ToolPolicy): unknown {
  if (policy.redact === false) {
    return safeJsonClone(input);
  }
  return redact(safeJsonClone(input), policy.redact || true);
}

async function auditFailure(
  audit: AuditLogger,
  policy: ToolPolicy,
  ctx: ToolGateContext,
  input: unknown,
  error: unknown
): Promise<void> {
  await safeAudit(audit, {
    timestamp: new Date().toISOString(),
    tool: policy.name,
    risk: ctx.risk,
    decision: "failed",
    requestId: ctx.requestId,
    durationMs: createMeta(ctx).durationMs,
    reason: typeof error === "object" && error && "code" in error ? String(error.code) : "ERROR",
    input,
    error,
    metadata: policy.metadata
  });
}

async function safeAudit(audit: AuditLogger, entry: Parameters<AuditLogger["log"]>[0]): Promise<void> {
  try {
    await audit.log(entry);
  } catch {
    // Audit logging should not crash tool calls by default. Custom loggers can record their own failures.
  }
}
