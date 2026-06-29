import path from "node:path";

export function normalizePathForPolicy(value: string): string {
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  return normalized.startsWith("./") ? normalized.slice(2) : normalized;
}

export function isTraversalPath(value: string): boolean {
  const normalized = normalizePathForPolicy(value);
  return normalized === ".." || normalized.startsWith("../") || path.isAbsolute(value);
}
