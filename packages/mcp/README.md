# ToolGateKit

Put guardrails around your MCP tools.

`@toolgate/mcp` is a small TypeScript middleware library for Model Context Protocol server authors. It wraps existing tool handlers with policy checks for approval, path access, timeout, redaction, and audit logging.

```bash
npm install @toolgate/mcp
```

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

When approval is required, the handler is not executed:

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

## Features

- `gate(policy, handler)` middleware for MCP tool handlers
- risk metadata: `read`, `write`, `external`, `destructive`
- approval-required blocking
- path allowlists and denylists
- timeout handling with `AbortSignal`
- default secret redaction
- JSONL audit logging
- policy manifest generation
- structured error responses

## API

```ts
export {
  gate,
  createAuditLogger,
  createManifest,
  redact,
  evaluatePolicy
};
```

## Path Policy

ToolGateKit detects common input keys: `path`, `filePath`, `filepath`, and `targetPath`.

Rules:

- deny rules win over allow rules
- paths are normalized before matching
- traversal and absolute paths are blocked
- if `allowedPaths` is set, paths outside it are denied

## Security Boundary

ToolGateKit is not an MCP server, MCP client, gateway, proxy, sandbox, approval UI, agent framework, or authentication system. It reduces risk around handlers, but it does not make unsafe code safe by itself.

Important limitations:

- It cannot stop unsafe behavior inside a handler if the handler ignores policy inputs.
- It cannot fully prevent prompt injection.
- Timeout cannot always kill underlying work if the handler ignores `AbortSignal`.
- Approval UI must be implemented by the host application.

## Status

Early MVP for TypeScript MCP servers. ESM-first, Node.js 18+.
