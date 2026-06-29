export { gate } from "./gate/gate.js";
export { createAuditLogger } from "./audit/jsonlAuditLogger.js";
export { createManifest } from "./manifest/manifest.js";
export { policyManifestSchema, validateManifest } from "./manifest/schema.js";
export {
  destructiveFilesystemPolicy,
  externalApiPolicy,
  readOnlyFilesystemPolicy
} from "./presets/presets.js";
export { redact } from "./redaction/redact.js";
export { evaluatePolicy } from "./policy/evaluatePolicy.js";

export type {
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
  ManifestValidationIssue,
  ManifestValidationResult
} from "./manifest/schema.js";
export type { RedactionOptions } from "./redaction/redact.js";
