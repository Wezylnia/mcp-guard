import type { ToolPolicy } from "../gate/types.js";

export interface PolicyManifest {
  name?: string;
  tools: PolicyManifestTool[];
}

export interface PolicyManifestTool {
  name: string;
  description?: string;
  risk: string;
  requiresApproval: boolean;
  allowedPaths?: string[];
  deniedPaths?: string[];
  audit: boolean;
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
}

export function createManifest(
  policies: ToolPolicy[],
  options: { name?: string } = {}
): PolicyManifest {
  return {
    name: options.name,
    tools: policies.map((policy) => ({
      name: policy.name,
      description: policy.description,
      risk: policy.risk ?? "read",
      requiresApproval: policy.requireApproval ?? false,
      allowedPaths: policy.allowedPaths,
      deniedPaths: policy.deniedPaths,
      audit: Boolean(policy.audit),
      timeoutMs: policy.timeoutMs,
      metadata: policy.metadata
    }))
  };
}
