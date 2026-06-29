import type { ToolGateContext, ToolGateError, ToolGateMeta, ToolPolicy } from "./types.js";
import type { PolicyDecision } from "../policy/evaluatePolicy.js";

export function createMeta(ctx: ToolGateContext): ToolGateMeta {
  return {
    requestId: ctx.requestId,
    toolName: ctx.toolName,
    risk: ctx.risk,
    durationMs: Date.now() - ctx.startedAt.getTime()
  };
}

export function approvalRequiredError(policy: ToolPolicy): ToolGateError {
  return {
    type: "approval_required",
    code: "APPROVAL_REQUIRED",
    message: `Tool '${policy.name}' requires user approval before execution.`,
    details: {
      risk: policy.risk ?? "read"
    }
  };
}

export function policyViolationError(policy: ToolPolicy, decision: PolicyDecision): ToolGateError {
  return {
    type: "policy_violation",
    code: decision.code ?? "POLICY_VIOLATION",
    message:
      decision.message ??
      `Tool '${policy.name}' is blocked by policy.`,
    details: decision.details
  };
}

export function timeoutError(policy: ToolPolicy, timeoutMs: number): ToolGateError {
  return {
    type: "timeout",
    code: "TOOL_TIMEOUT",
    message: `Tool '${policy.name}' exceeded timeout of ${timeoutMs}ms.`
  };
}

export function rateLimitedError(policy: ToolPolicy, retryAfterMs: number): ToolGateError {
  return {
    type: "rate_limited",
    code: "RATE_LIMITED",
    message: `Tool '${policy.name}' exceeded rate limit.`,
    details: {
      retryAfterMs
    }
  };
}

export function handlerError(policy: ToolPolicy, error: unknown): ToolGateError {
  return {
    type: "handler_error",
    code: "HANDLER_ERROR",
    message: `Tool '${policy.name}' handler failed.`,
    details: {
      message: error instanceof Error ? error.message : String(error)
    }
  };
}

export function redactionError(policy: ToolPolicy, error: unknown): ToolGateError {
  return {
    type: "redaction_error",
    code: "REDACTION_ERROR",
    message: `Tool '${policy.name}' output redaction failed.`,
    details: {
      message: error instanceof Error ? error.message : String(error)
    }
  };
}
