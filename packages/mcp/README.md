# ToolGateKit

Policy, approval, redaction, timeout, and audit middleware for MCP server tools.

ToolGateKit is a small TypeScript library for developers building Model Context Protocol servers. It wraps existing tool handlers with explicit guardrails before those handlers are exposed to AI agents.

```bash
npm install @toolgate/mcp
```

## Quick Start

```ts
import { gate, createAuditLogger } from "@toolgate/mcp";

const audit = createAuditLogger({
  file: ".toolgate/audit.jsonl"
});

server.tool(
  "delete_file",
  schema,
  gate(
    {
      name: "delete_file",
      risk: "destructive",
      requireApproval: true,
      allowedPaths: ["src/**", "docs/**"],
      deniedPaths: [".env", "secrets/**", "node_modules/**"],
      timeoutMs: 10_000,
      redact: true,
      audit
    },
    async (input, ctx) => {
      await fs.rm(input.path, { signal: ctx.signal });
      return { ok: true };
    }
  )
);
```

When approval is required, ToolGateKit does not run the handler:

```json
{
  "ok": false,
  "error": {
    "type": "approval_required",
    "code": "APPROVAL_REQUIRED",
    "message": "Tool 'delete_file' requires user approval before execution."
  }
}
```

## Policy Examples

```ts
gate(
  {
    name: "read_file",
    risk: "read",
    allowedPaths: ["src/**", "docs/**"],
    deniedPaths: [".env", "secrets/**"],
    timeoutMs: 5000,
    redact: true,
    audit
  },
  async ({ path }) => ({
    content: await fs.readFile(path, "utf8")
  })
);
```

Path rules support common input keys: `path`, `filePath`, `filepath`, and `targetPath`.

Rules:

- deny rules win over allow rules
- paths are normalized before matching
- traversal and absolute paths are blocked
- if `allowedPaths` is set, paths outside it are denied

## Redaction

Set `redact: true` to redact sensitive values from handler output and audit logs.

Default redaction covers common sensitive keys such as `token`, `apiKey`, `secret`, `password`, `authorization`, `clientSecret`, and `connectionString`, plus common token patterns such as bearer tokens, GitHub tokens, OpenAI-style keys, and JWT-like strings.

```ts
import { redact } from "@toolgate/mcp";

redact({
  token: "ghp_abcdefghijklmnopqrstuvwxyz",
  public: "visible"
});
```

## Audit Logs

```ts
import { createAuditLogger } from "@toolgate/mcp";

const audit = createAuditLogger({
  file: ".toolgate/audit.jsonl"
});
```

Audit logs are append-only JSONL. Logging failures do not crash tool calls by default.

## Manifest

```ts
import { createManifest } from "@toolgate/mcp";

const manifest = createManifest(
  [
    {
      name: "read_file",
      risk: "read",
      allowedPaths: ["src/**"],
      deniedPaths: [".env"],
      audit: true,
      timeoutMs: 5000
    }
  ],
  { name: "filesystem-mcp" }
);
```

## Public API

```ts
export {
  gate,
  createAuditLogger,
  createManifest,
  redact,
  evaluatePolicy
};
```

## What ToolGateKit Does Not Do

ToolGateKit is not an MCP server, MCP client, gateway, proxy, agent framework, sandbox, hosted service, or approval UI. It does not run shell commands, delete files, send network requests, manage secrets, provide authentication, or call any LLM.

## Security Limitations

ToolGateKit is a policy middleware library. It reduces risk by enforcing explicit checks around tool handlers, but it is not a sandbox, container, authentication system, or complete security solution.

Important limitations:

- It cannot stop code inside a handler from doing something unsafe if the handler ignores policy inputs.
- It cannot fully prevent prompt injection.
- It cannot guarantee that a tool is safe.
- It cannot sandbox Node.js execution.
- Timeout cannot always kill underlying work if the handler ignores `AbortSignal`.
- Approval UI must be implemented by the surrounding host or application.

## Roadmap

v0.1 focuses on `gate()`, risk metadata, approval-required blocking, path allowlists and denylists, timeouts, basic redaction, JSONL audit logging, manifest generation, and structured errors.

Future versions may add network domain policy, command policy, rate limiting, custom input extractors, policy presets, OpenTelemetry spans, and MCP SDK integration helpers.
