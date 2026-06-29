# ToolGateKit

Put guardrails around your MCP tools.

`@toolgate/mcp` is a TypeScript middleware package for Model Context Protocol server authors. It wraps existing tool handlers and enforces a declared policy before an AI agent can use that handler.

```bash
npm install @toolgate/mcp
```

## What It Does

ToolGateKit protects tool handlers at the point where they are registered. A policy can say:

- this tool is `read`, `write`, `external`, or `destructive`
- this tool requires approval before execution
- this tool may only access specific file paths
- this tool must time out after a fixed duration
- this tool output and audit logs should redact secrets
- this tool call should be written to a JSONL audit log

It returns structured results instead of throwing for expected policy failures.

## Quick Start

```ts
import { createAuditLogger, gate } from "@toolgate/mcp";

const audit = createAuditLogger({
  file: ".toolgate/audit.jsonl"
});

const deleteFileTool = gate(
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
  async ({ path }) => {
    await fs.rm(path);
    return { ok: true };
  }
);
```

Because this policy requires approval, the handler is not executed:

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

## Execution Flow

For every protected call, ToolGateKit:

1. Normalizes and evaluates policy inputs.
2. Blocks path violations and approval-required calls.
3. Creates a handler context with `requestId`, `risk`, `startedAt`, and `AbortSignal`.
4. Runs the handler with timeout protection.
5. Redacts output when enabled.
6. Writes an audit log entry when configured.
7. Returns `{ ok: true, data, meta }` or `{ ok: false, error, meta }`.

## Path Policy

ToolGateKit detects common input keys: `path`, `filePath`, `filepath`, and `targetPath`.

Rules:

- deny rules win over allow rules
- paths are normalized before matching
- traversal and absolute paths are blocked
- if `allowedPaths` is set, paths outside it are denied

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

## Security Boundary

ToolGateKit is not an MCP server, MCP client, gateway, proxy, sandbox, approval UI, agent framework, or authentication system. It reduces risk around tool handlers, but it does not make unsafe handler code safe by itself.

Important limitations:

- It cannot stop unsafe behavior inside a handler if the handler ignores policy inputs.
- It cannot fully prevent prompt injection.
- Timeout cannot always kill underlying work if the handler ignores `AbortSignal`.
- Approval UI must be implemented by the host application.

## Status

Early MVP for TypeScript MCP servers. ESM-first, Node.js 18+.
