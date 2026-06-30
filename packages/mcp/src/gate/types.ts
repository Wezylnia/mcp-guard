import type { AuditLogger } from "../audit/auditLogger.js";
import type { RedactionOptions } from "../redaction/redact.js";

export type ToolRisk = "read" | "write" | "external" | "destructive";

export type ToolInputExtractor<T = string> = (input: unknown) => T | T[] | undefined;

export interface RateLimitOptions {
  max: number;
  windowMs: number;
}

export interface ApprovalRequest<TInput = unknown> {
  input: TInput;
  requestId: string;
  toolName: string;
  risk: ToolRisk;
  policy: ToolPolicy;
}

export interface ApprovalDecision {
  approved: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export type ApprovalProvider = (
  request: ApprovalRequest
) => boolean | ApprovalDecision | Promise<boolean | ApprovalDecision>;

export interface PolicyRuleDecision {
  allowed: boolean;
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface ToolPolicyRule {
  name: string;
  evaluate: (
    input: unknown,
    context: ToolGateContext
  ) => boolean | PolicyRuleDecision | Promise<boolean | PolicyRuleDecision>;
}

export interface ToolGateEventBase {
  requestId: string;
  toolName: string;
  risk: ToolRisk;
  timestamp: string;
  durationMs: number;
}

export type ToolGateEvent =
  | (ToolGateEventBase & { type: "started" })
  | (ToolGateEventBase & { type: "approved" })
  | (ToolGateEventBase & { type: "blocked"; code: string })
  | (ToolGateEventBase & { type: "completed"; outputSummary: Record<string, unknown> })
  | (ToolGateEventBase & { type: "failed"; code: string });

export type ToolGateObserver = (event: ToolGateEvent) => void | Promise<void>;

export interface ToolPolicy {
  name: string;
  description?: string;
  risk?: ToolRisk;
  requireApproval?: boolean;
  approval?: ApprovalProvider;
  rules?: ToolPolicyRule[];
  observe?: ToolGateObserver;
  allowedPaths?: string[];
  deniedPaths?: string[];
  extractPaths?: ToolInputExtractor;
  allowedDomains?: string[];
  deniedDomains?: string[];
  extractUrls?: ToolInputExtractor;
  allowedCommands?: string[];
  deniedCommands?: string[];
  extractCommands?: ToolInputExtractor;
  rateLimit?: RateLimitOptions;
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
  | "policy_error"
  | "approval_required"
  | "approval_denied"
  | "approval_error"
  | "rate_limited"
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
