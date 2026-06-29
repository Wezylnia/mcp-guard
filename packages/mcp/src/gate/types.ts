import type { AuditLogger } from "../audit/auditLogger.js";
import type { RedactionOptions } from "../redaction/redact.js";

export type ToolRisk = "read" | "write" | "external" | "destructive";

export interface ToolPolicy {
  name: string;
  description?: string;
  risk?: ToolRisk;
  requireApproval?: boolean;
  allowedPaths?: string[];
  deniedPaths?: string[];
  timeoutMs?: number;
  redact?: boolean | RedactionOptions;
  audit?: boolean | AuditLogger;
  metadata?: Record<string, unknown>;
}

export interface ToolGateContext {
  toolName: string;
  risk: ToolRisk;
  signal: AbortSignal;
  startedAt: Date;
  requestId: string;
  policy: ToolPolicy;
}

export type ToolHandler<TInput, TOutput> = (
  input: TInput,
  ctx: ToolGateContext
) => TOutput | Promise<TOutput>;

export type ProtectedToolHandler<TInput, TOutput> = (
  input: TInput
) => TOutput | Promise<TOutput>;

export type ToolGateErrorType =
  | "policy_violation"
  | "approval_required"
  | "timeout"
  | "handler_error"
  | "redaction_error"
  | "audit_error";

export interface ToolGateError {
  type: ToolGateErrorType;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ToolGateMeta {
  requestId: string;
  toolName: string;
  risk: ToolRisk;
  durationMs: number;
}

export type ToolGateResult<T> =
  | {
      ok: true;
      data: T;
      meta: ToolGateMeta;
    }
  | {
      ok: false;
      error: ToolGateError;
      meta: ToolGateMeta;
    };
