import { gate } from "toolgate-mcp";

export const fetchUrlTool = gate(
  {
    name: "fetch_url",
    risk: "external",
    allowedDomains: ["api.github.com"],
    deniedDomains: ["metadata.google.internal"],
    timeoutMs: 10_000,
    redact: true,
    audit: true
  },
  async ({ url }: { url: string }, ctx) => {
    const response = await fetch(url, { signal: ctx.signal });
    return {
      status: response.status,
      text: await response.text()
    };
  }
);
