export { gate } from "./gate/gate.js";
export { createAuditLogger } from "./audit/jsonlAuditLogger.js";
export { createManifest } from "./manifest/manifest.js";
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
  ToolHandler,
  ToolPolicy,
  ToolRisk
} from "./gate/types.js";
export type { AuditEntry, AuditLogger, CreateAuditLoggerOptions } from "./audit/auditLogger.js";
export type { RedactionOptions } from "./redaction/redact.js";
