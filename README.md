# ToolGateKit

Put guardrails around your MCP tools.

ToolGateKit is a TypeScript middleware library for developers building Model Context Protocol servers. It wraps your existing MCP tool handlers and checks a declared policy before the handler runs.

Use it when a tool can read files, write data, call APIs, delete records, send messages, or expose sensitive output to an AI agent.

```bash
npm install toolgate-mcp
```

## What Problem It Solves

MCP tools are just functions, but once an agent can call them they need explicit boundaries:

- Can this tool read any path, or only `src/**`?
- Should `.env`, `secrets/**`, or `node_modules/**` always be blocked?
- Does a destructive tool require approval before it runs?
- Should secrets be redacted before output is returned?
- Should every tool call be written to an audit log?
- What happens if the handler hangs?

ToolGateKit puts those checks next to the handler, so the policy is visible, testable, and versioned with your server code.

## How It Works

```text
policy + handler -> protected handler
```

For each call, ToolGateKit:

1. Evaluates the declared policy.
2. Blocks approval-required or policy-violating calls.
3. Runs the handler with timeout support.
4. Redacts sensitive output if enabled.
5. Writes an audit entry if configured.
6. Returns a structured success or error result.

## Example

```ts
import { createAuditLogger, gate } from "toolgate-mcp";

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

If the agent asks for `.env`, the handler is not executed:

```json
{
  "ok": false,
  "error": {
    "type": "policy_violation",
    "code": "PATH_DENIED",
    "message": "Tool 'read_file' is not allowed to access '.env'."
  }
}
```

## Core Features

- `gate(policy, handler)` wrapper for MCP tool handlers
- risk levels: `read`, `write`, `external`, `destructive`
- approval-required blocking for dangerous tools
- path allowlists and denylists with deny-first behavior
- network domain allowlists and denylists
- command allowlists and denylists
- in-memory rate limiting per protected handler
- custom input extractors for paths, URLs, and commands
- policy presets for common filesystem and external API tools
- timeout handling with `AbortSignal`
- default redaction for common secrets and tokens
- append-only JSONL audit logs, with `audit: true` writing to `.toolgate/audit.jsonl`
- policy manifest export for visibility
- predictable structured errors

## What It Is Not

ToolGateKit is not an MCP server, MCP client, gateway, proxy, sandbox, approval UI, agent framework, or authentication system. It reduces risk around tool handlers, but it does not make unsafe handler code safe by itself.

## Status

v0.2 development for TypeScript MCP servers. ESM-first, Node.js 18+.

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
