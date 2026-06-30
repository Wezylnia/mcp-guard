import type { PolicyManifest } from "./manifest.js";

export interface ManifestValidationIssue {
  path: string;
  message: string;
}

export interface ManifestValidationResult {
  valid: boolean;
  issues: ManifestValidationIssue[];
}

export const policyManifestSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://toolgatekit.dev/schemas/policy-manifest.schema.json",
  title: "ToolGateKit Policy Manifest",
  type: "object",
  additionalProperties: false,
  properties: {
    schemaVersion: { const: "1.0" },
    name: { type: "string" },
    tools: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "risk", "requiresApproval", "audit"],
        properties: {
          name: { type: "string", minLength: 1 },
          description: { type: "string" },
          risk: {
            type: "string",
            enum: ["read", "write", "external", "destructive"]
          },
          requiresApproval: { type: "boolean" },
          allowedPaths: stringArraySchema(),
          deniedPaths: stringArraySchema(),
          allowedDomains: stringArraySchema(),
          deniedDomains: stringArraySchema(),
          allowedCommands: stringArraySchema(),
          deniedCommands: stringArraySchema(),
          customRules: stringArraySchema(),
          rateLimit: {
            type: "object",
            additionalProperties: false,
            required: ["max", "windowMs"],
            properties: {
              max: { type: "integer", minimum: 1 },
              windowMs: { type: "number", minimum: 1 },
              keyed: { type: "boolean" },
              namespace: { type: "string", minLength: 1 }
            }
          },
          audit: { type: "boolean" },
          timeoutMs: { type: "number", minimum: 1 },
          metadata: { type: "object" }
        }
      }
    }
  },
  required: ["schemaVersion", "tools"]
} as const;

export function validateManifest(manifest: unknown): ManifestValidationResult {
  const issues: ManifestValidationIssue[] = [];

  if (!isRecord(manifest)) {
    return invalid("$", "Manifest must be an object.");
  }

  if (manifest.schemaVersion !== "1.0") {
    issues.push({ path: "$.schemaVersion", message: "schemaVersion must be '1.0'." });
  }

  if ("name" in manifest && typeof manifest.name !== "string") {
    issues.push({ path: "$.name", message: "Name must be a string." });
  }

  if (!Array.isArray(manifest.tools)) {
    issues.push({ path: "$.tools", message: "Tools must be an array." });
    return { valid: issues.length === 0, issues };
  }

  manifest.tools.forEach((tool, index) => {
    validateManifestTool(tool, `$.tools[${index}]`, issues);
  });

  return {
    valid: issues.length === 0,
    issues
  };
}

function validateManifestTool(
  tool: unknown,
  path: string,
  issues: ManifestValidationIssue[]
): void {
  if (!isRecord(tool)) {
    issues.push({ path, message: "Tool must be an object." });
    return;
  }

  if (typeof tool.name !== "string" || tool.name.length === 0) {
    issues.push({ path: `${path}.name`, message: "Tool name must be a non-empty string." });
  }

  if (!["read", "write", "external", "destructive"].includes(String(tool.risk))) {
    issues.push({ path: `${path}.risk`, message: "Tool risk is invalid." });
  }

  if (typeof tool.requiresApproval !== "boolean") {
    issues.push({ path: `${path}.requiresApproval`, message: "requiresApproval must be a boolean." });
  }

  if (typeof tool.audit !== "boolean") {
    issues.push({ path: `${path}.audit`, message: "audit must be a boolean." });
  }

  validateOptionalStringArray(tool, "allowedPaths", path, issues);
  validateOptionalStringArray(tool, "deniedPaths", path, issues);
  validateOptionalStringArray(tool, "allowedDomains", path, issues);
  validateOptionalStringArray(tool, "deniedDomains", path, issues);
  validateOptionalStringArray(tool, "allowedCommands", path, issues);
  validateOptionalStringArray(tool, "deniedCommands", path, issues);
  validateOptionalStringArray(tool, "customRules", path, issues);

  if (tool.timeoutMs !== undefined && !isPositiveNumber(tool.timeoutMs)) {
    issues.push({ path: `${path}.timeoutMs`, message: "timeoutMs must be a positive number." });
  }

  if (tool.rateLimit !== undefined) {
    validateRateLimit(tool.rateLimit, `${path}.rateLimit`, issues);
  }
}

function validateOptionalStringArray(
  object: Record<string, unknown>,
  key: keyof PolicyManifest["tools"][number],
  path: string,
  issues: ManifestValidationIssue[]
): void {
  if (object[key] === undefined) {
    return;
  }

  const value = object[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    issues.push({ path: `${path}.${key}`, message: `${key} must be an array of strings.` });
  }
}

function validateRateLimit(
  value: unknown,
  path: string,
  issues: ManifestValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({ path, message: "rateLimit must be an object." });
    return;
  }

  if (!Number.isInteger(value.max) || !isPositiveNumber(value.max)) {
    issues.push({ path: `${path}.max`, message: "rateLimit.max must be a positive number." });
  }

  if (!isPositiveNumber(value.windowMs)) {
    issues.push({ path: `${path}.windowMs`, message: "rateLimit.windowMs must be a positive number." });
  }
  if (value.keyed !== undefined && typeof value.keyed !== "boolean") {
    issues.push({ path: `${path}.keyed`, message: "rateLimit.keyed must be a boolean." });
  }
  if (value.namespace !== undefined && (typeof value.namespace !== "string" || value.namespace.length === 0)) {
    issues.push({ path: `${path}.namespace`, message: "rateLimit.namespace must be a non-empty string." });
  }
}

function stringArraySchema(): { type: "array"; items: { type: "string" } } {
  return {
    type: "array",
    items: { type: "string" }
  };
}

function invalid(path: string, message: string): ManifestValidationResult {
  return {
    valid: false,
    issues: [{ path, message }]
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export { policyConfigSchema } from "../policy/configSchema.js";
