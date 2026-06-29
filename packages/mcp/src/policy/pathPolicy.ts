import type { ToolPolicy } from "../gate/types.js";
import { globMatch } from "../utils/globMatch.js";
import { isTraversalPath, normalizePathForPolicy } from "../utils/normalizePath.js";

const pathKeys = ["path", "filePath", "filepath", "targetPath"];

export interface PathPolicyResult {
  allowed: boolean;
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export function extractPolicyPaths(input: unknown): string[] {
  if (!input || typeof input !== "object") {
    return [];
  }

  const record = input as Record<string, unknown>;
  return pathKeys.flatMap((key) => {
    const value = record[key];
    return typeof value === "string" ? [value] : [];
  });
}

export function evaluatePathPolicy(policy: ToolPolicy, input: unknown): PathPolicyResult {
  if (!policy.allowedPaths?.length && !policy.deniedPaths?.length) {
    return { allowed: true };
  }

  const paths = policy.extractPaths
    ? normalizeExtractorResult(policy.extractPaths(input))
    : extractPolicyPaths(input);
  if (paths.length === 0) {
    return { allowed: true };
  }

  for (const rawPath of paths) {
    const normalizedPath = normalizePathForPolicy(rawPath);

    if (isTraversalPath(rawPath)) {
      return denied(policy, normalizedPath, "Path traversal or absolute paths are not allowed.");
    }

    if (policy.deniedPaths?.length && globMatch(normalizedPath, policy.deniedPaths)) {
      return denied(policy, normalizedPath);
    }

    if (policy.allowedPaths?.length && !globMatch(normalizedPath, policy.allowedPaths)) {
      return denied(policy, normalizedPath);
    }
  }

  return { allowed: true };
}

function normalizeExtractorResult(value: string | string[] | undefined): string[] {
  if (typeof value === "string") {
    return [value];
  }

  return value ?? [];
}

function denied(policy: ToolPolicy, path: string, reason?: string): PathPolicyResult {
  return {
    allowed: false,
    code: "PATH_DENIED",
    message: `Tool '${policy.name}' is not allowed to access '${path}'.`,
    details: {
      path,
      reason
    }
  };
}
