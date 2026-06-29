export { gate } from "./gate/gate.js";
export { createAuditLogger } from "./audit/jsonlAuditLogger.js";
export { readAuditLog, summarizeAudit } from "./audit/readAuditLog.js";
export { createManifest } from "./manifest/manifest.js";
export { gateMcp, isMcpToolResult, toMcpToolResult } from "./mcp/adapter.js";
export { policyManifestSchema, validateManifest } from "./manifest/schema.js";
export {
  destructiveFilesystemPolicy,
  externalApiPolicy,
  readOnlyFilesystemPolicy
} from "./presets/presets.js";
export { redact } from "./redaction/redact.js";
export { evaluatePolicy } from "./policy/evaluatePolicy.js";
export {
  assertPolicy,
  InvalidToolPolicyError,
  validatePolicies,
  validatePolicy
} from "./policy/validatePolicy.js";

export type {
  ApprovalDecision,
  ApprovalProvider,
  ApprovalRequest,
  ToolGateContext,
  ToolGateError,
  ToolGateErrorType,
  ToolGateMeta,
  ToolGateResult,
  ToolInputExtractor,
  ProtectedToolHandler,
  RateLimitOptions,
  ToolHandler,
  ToolPolicy,
  ToolRisk
} from "./gate/types.js";
export type { AuditEntry, AuditLogger, CreateAuditLoggerOptions } from "./audit/auditLogger.js";
export type {
  AuditQuery,
  AuditReadIssue,
  AuditReadResult,
  AuditSummary
} from "./audit/readAuditLog.js";
export type {
  ManifestValidationIssue,
  ManifestValidationResult
} from "./manifest/schema.js";
export type {
  PolicyValidationIssue,
  PolicyValidationResult
} from "./policy/validatePolicy.js";
export type {
  McpAdapterOptions,
  McpContentBlock,
  McpToolResult
} from "./mcp/adapter.js";
export type { RedactionOptions } from "./redaction/redact.js";
