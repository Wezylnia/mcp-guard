import type { PolicyManifest, PolicyManifestTool } from "./manifest.js";

export type ManifestChangeSeverity = "info" | "warning" | "danger";

export interface ManifestChange {
  severity: ManifestChangeSeverity;
  code: string;
  tool: string;
  field?: string;
  message: string;
  before?: unknown;
  after?: unknown;
}

export interface ManifestComparison {
  safe: boolean;
  changes: ManifestChange[];
}

const riskRank: Record<string, number> = {
  read: 0,
  write: 1,
  external: 2,
  destructive: 3
};

export function compareManifests(
  base: PolicyManifest,
  head: PolicyManifest
): ManifestComparison {
  const changes: ManifestChange[] = [];
  const baseTools = new Map(base.tools.map((tool) => [tool.name, tool]));
  const headTools = new Map(head.tools.map((tool) => [tool.name, tool]));

  for (const [name, tool] of headTools) {
    const previous = baseTools.get(name);
    if (!previous) {
      changes.push(change("warning", "TOOL_ADDED", name, `Tool '${name}' was added.`, undefined, tool));
      continue;
    }
    compareTool(previous, tool, changes);
  }
  for (const [name, tool] of baseTools) {
    if (!headTools.has(name)) {
      changes.push(change("info", "TOOL_REMOVED", name, `Tool '${name}' was removed.`, tool));
    }
  }

  return {
    safe: !changes.some((item) => item.severity === "danger"),
    changes
  };
}

function compareTool(
  base: PolicyManifestTool,
  head: PolicyManifestTool,
  changes: ManifestChange[]
): void {
  if (base.risk !== head.risk) {
    const increased = (riskRank[head.risk] ?? 0) > (riskRank[base.risk] ?? 0);
    changes.push(fieldChange(
      increased ? "danger" : "info",
      increased ? "RISK_INCREASED" : "RISK_DECREASED",
      head.name,
      "risk",
      `Tool '${head.name}' risk changed from '${base.risk}' to '${head.risk}'.`,
      base.risk,
      head.risk
    ));
  }
  compareBooleanProtection(base, head, "requiresApproval", "APPROVAL", changes);
  compareBooleanProtection(base, head, "audit", "AUDIT", changes);
  compareTimeout(base, head, changes);
  compareRateLimit(base, head, changes);
  compareLists(base, head, "allowedPaths", "ALLOW_PATHS", true, changes);
  compareLists(base, head, "allowedDomains", "ALLOW_DOMAINS", true, changes);
  compareLists(base, head, "allowedCommands", "ALLOW_COMMANDS", true, changes);
  compareLists(base, head, "deniedPaths", "DENY_PATHS", false, changes);
  compareLists(base, head, "deniedDomains", "DENY_DOMAINS", false, changes);
  compareLists(base, head, "deniedCommands", "DENY_COMMANDS", false, changes);
  compareLists(base, head, "customRules", "CUSTOM_RULES", false, changes);
}

function compareBooleanProtection(
  base: PolicyManifestTool,
  head: PolicyManifestTool,
  field: "requiresApproval" | "audit",
  code: string,
  changes: ManifestChange[]
): void {
  if (base[field] === head[field]) return;
  const removed = base[field] && !head[field];
  changes.push(fieldChange(
    removed ? "danger" : "info",
    `${code}_${removed ? "DISABLED" : "ENABLED"}`,
    head.name,
    field,
    `Tool '${head.name}' ${field} was ${removed ? "disabled" : "enabled"}.`,
    base[field],
    head[field]
  ));
}

function compareTimeout(
  base: PolicyManifestTool,
  head: PolicyManifestTool,
  changes: ManifestChange[]
): void {
  if (base.timeoutMs === head.timeoutMs) return;
  if (base.timeoutMs !== undefined && head.timeoutMs === undefined) {
    changes.push(fieldChange("danger", "TIMEOUT_REMOVED", head.name, "timeoutMs", `Tool '${head.name}' timeout was removed.`, base.timeoutMs));
  } else if (base.timeoutMs === undefined) {
    changes.push(fieldChange("info", "TIMEOUT_ADDED", head.name, "timeoutMs", `Tool '${head.name}' timeout was added.`, undefined, head.timeoutMs));
  } else {
    const increased = (head.timeoutMs ?? 0) > base.timeoutMs;
    changes.push(fieldChange(increased ? "warning" : "info", increased ? "TIMEOUT_INCREASED" : "TIMEOUT_DECREASED", head.name, "timeoutMs", `Tool '${head.name}' timeout changed.`, base.timeoutMs, head.timeoutMs));
  }
}

function compareRateLimit(
  base: PolicyManifestTool,
  head: PolicyManifestTool,
  changes: ManifestChange[]
): void {
  if (!base.rateLimit && !head.rateLimit) return;
  if (base.rateLimit && !head.rateLimit) {
    changes.push(fieldChange("danger", "RATE_LIMIT_REMOVED", head.name, "rateLimit", `Tool '${head.name}' rate limit was removed.`, base.rateLimit));
    return;
  }
  if (!base.rateLimit && head.rateLimit) {
    changes.push(fieldChange("info", "RATE_LIMIT_ADDED", head.name, "rateLimit", `Tool '${head.name}' rate limit was added.`, undefined, head.rateLimit));
    return;
  }
  const previous = base.rateLimit!;
  const current = head.rateLimit!;
  if (previous.max !== current.max) {
    const loosened = current.max > previous.max;
    changes.push(fieldChange(loosened ? "danger" : "info", loosened ? "RATE_LIMIT_MAX_INCREASED" : "RATE_LIMIT_MAX_DECREASED", head.name, "rateLimit.max", `Tool '${head.name}' rate limit maximum changed.`, previous.max, current.max));
  }
  if (previous.windowMs !== current.windowMs) {
    const loosened = current.windowMs < previous.windowMs;
    changes.push(fieldChange(loosened ? "danger" : "info", loosened ? "RATE_LIMIT_WINDOW_DECREASED" : "RATE_LIMIT_WINDOW_INCREASED", head.name, "rateLimit.windowMs", `Tool '${head.name}' rate limit window changed.`, previous.windowMs, current.windowMs));
  }
}

function compareLists(
  base: PolicyManifestTool,
  head: PolicyManifestTool,
  field: "allowedPaths" | "allowedDomains" | "allowedCommands" | "deniedPaths" | "deniedDomains" | "deniedCommands" | "customRules",
  code: string,
  allowList: boolean,
  changes: ManifestChange[]
): void {
  const previous = base[field];
  const current = head[field];
  if (!previous && !current) return;
  if (previous && !current) {
    changes.push(fieldChange("danger", `${code}_REMOVED`, head.name, field, `Tool '${head.name}' ${field} protection was removed.`, previous));
    return;
  }
  if (!previous && current) {
    changes.push(fieldChange("info", `${code}_ADDED`, head.name, field, `Tool '${head.name}' ${field} protection was added.`, undefined, current));
    return;
  }

  const previousSet = new Set(previous);
  const currentSet = new Set(current);
  const added = current!.filter((item) => !previousSet.has(item));
  const removed = previous!.filter((item) => !currentSet.has(item));
  if (added.length > 0) {
    changes.push(fieldChange(allowList ? "danger" : "info", `${code}_ENTRIES_ADDED`, head.name, field, `Tool '${head.name}' added ${field} entries.`, undefined, added));
  }
  if (removed.length > 0) {
    changes.push(fieldChange(allowList ? "info" : "danger", `${code}_ENTRIES_REMOVED`, head.name, field, `Tool '${head.name}' removed ${field} entries.`, removed));
  }
}

function fieldChange(
  severity: ManifestChangeSeverity,
  code: string,
  tool: string,
  field: string,
  message: string,
  before?: unknown,
  after?: unknown
): ManifestChange {
  return { ...change(severity, code, tool, message, before, after), field };
}

function change(
  severity: ManifestChangeSeverity,
  code: string,
  tool: string,
  message: string,
  before?: unknown,
  after?: unknown
): ManifestChange {
  return { severity, code, tool, message, before, after };
}
