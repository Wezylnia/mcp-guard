import type { ToolPolicy } from "../gate/types.js";

const urlKeys = ["url", "uri", "href", "endpoint", "targetUrl"];

export interface NetworkPolicyResult {
  allowed: boolean;
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export function extractPolicyUrls(input: unknown): string[] {
  if (!input || typeof input !== "object") {
    return [];
  }

  const record = input as Record<string, unknown>;
  return urlKeys.flatMap((key) => {
    const value = record[key];
    return typeof value === "string" ? [value] : [];
  });
}

export function evaluateNetworkPolicy(policy: ToolPolicy, input: unknown): NetworkPolicyResult {
  if (!policy.allowedDomains?.length && !policy.deniedDomains?.length) {
    return { allowed: true };
  }

  const urls = policy.extractUrls
    ? normalizeExtractorResult(policy.extractUrls(input))
    : extractPolicyUrls(input);

  if (urls.length === 0) {
    return { allowed: true };
  }

  for (const rawUrl of urls) {
    const hostname = getHostname(rawUrl);
    if (!hostname) {
      return denied(policy, rawUrl, "INVALID_URL", "URL is not valid.");
    }

    if (policy.deniedDomains?.some((domain) => domainMatches(hostname, domain))) {
      return denied(policy, rawUrl, "DOMAIN_DENIED");
    }

    if (
      policy.allowedDomains?.length &&
      !policy.allowedDomains.some((domain) => domainMatches(hostname, domain))
    ) {
      return denied(policy, rawUrl, "DOMAIN_DENIED");
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

function getHostname(rawUrl: string): string | undefined {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function domainMatches(hostname: string, rule: string): boolean {
  const normalizedRule = rule.toLowerCase();
  if (normalizedRule.startsWith("*.")) {
    const baseDomain = normalizedRule.slice(2);
    return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
  }

  return hostname === normalizedRule;
}

function denied(
  policy: ToolPolicy,
  url: string,
  code: string,
  reason?: string
): NetworkPolicyResult {
  return {
    allowed: false,
    code,
    message: `Tool '${policy.name}' is not allowed to access URL '${url}'.`,
    details: {
      url,
      reason
    }
  };
}
