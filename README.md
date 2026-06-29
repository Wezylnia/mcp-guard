# ToolGateKit

Put guardrails around your MCP tools.

ToolGateKit is a small TypeScript middleware library for developers building Model Context Protocol servers. It wraps existing tool handlers with policy checks for approval, path access, timeout, redaction, and audit logging.

It is published as:

```bash
npm install @toolgate/mcp
```

## Why

MCP tools often touch files, APIs, databases, tickets, email, shell commands, or internal systems. ToolGateKit lets server authors define clear, testable boundaries before an AI agent can run those handlers.

```ts
import { createAuditLogger, gate } from "@toolgate/mcp";

const audit = createAuditLogger({
  file: ".toolgate/audit.jsonl"
});

const readFileTool = gate(
  {
    name: "read_file",
    risk: "read",
    allowedPaths: ["src/**", "docs/**"],
    deniedPaths: [".env", "secrets/**"],
    timeoutMs: 5000,
    redact: true,
    audit
  },
  async ({ path }, ctx) => ({
    content: await fs.readFile(path, { encoding: "utf8", signal: ctx.signal })
  })
);
```

## What It Does

- Wraps MCP tool handlers with `gate(policy, handler)`
- Blocks approval-required tools with structured responses
- Enforces file path allowlists and denylists
- Applies handler timeouts with `AbortSignal`
- Redacts common secrets from output and logs
- Writes append-only JSONL audit logs
- Exports a policy manifest for visibility

## What It Is Not

ToolGateKit is not an MCP server, MCP client, gateway, proxy, sandbox, approval UI, agent framework, or authentication system. It reduces risk around handlers, but it does not make unsafe code safe by itself.

## Status

Early MVP for TypeScript MCP servers. The package is ESM-first and targets Node.js 18+.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm audit
```

## Docs

- [Package README](packages/mcp/README.md)
- [Policies](docs/policies.md)
- [Audit logs](docs/audit-logs.md)
- [Redaction](docs/redaction.md)
- [Manifest](docs/manifest.md)
- [Limitations](docs/limitations.md)
- [Examples](docs/examples.md)
