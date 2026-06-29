# ToolGateKit

Policy, approval, redaction, timeout, and audit middleware for MCP server tools.

The npm package lives in [packages/mcp](packages/mcp). It exposes `@toolgate/mcp`, an ESM-first TypeScript library for wrapping Model Context Protocol tool handlers with explicit guardrails.

## Package

```bash
npm install @toolgate/mcp
```

```ts
import { gate, createAuditLogger } from "@toolgate/mcp";

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
  async ({ path }) => ({
    content: await fs.readFile(path, "utf8")
  })
);
```

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm audit
```

## Documentation

- [Policies](docs/policies.md)
- [Audit logs](docs/audit-logs.md)
- [Redaction](docs/redaction.md)
- [Manifest](docs/manifest.md)
- [Limitations](docs/limitations.md)
- [Examples](docs/examples.md)

## Scope

ToolGateKit is not an MCP server, MCP client, gateway, proxy, sandbox, approval UI, or agent framework. It is a focused developer library for adding clear, testable guardrails around existing MCP tool handlers.
