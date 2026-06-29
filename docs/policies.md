# Policies

ToolGateKit policies describe the guardrails around one MCP tool handler.

```ts
import { gate } from "@toolgate/mcp";

const readFileTool = gate(
  {
    name: "read_file",
    risk: "read",
    allowedPaths: ["src/**", "docs/**"],
    deniedPaths: [".env", "secrets/**"],
    timeoutMs: 5000,
    redact: true
  },
  async ({ path }) => ({
    content: await fs.readFile(path, "utf8")
  })
);
```

## Risk Levels

- `read`: reads local or remote data without modifying it
- `write`: creates or updates data
- `external`: interacts with external services or APIs
- `destructive`: deletes, overwrites, sends irreversible actions, or runs dangerous operations

Risk levels are metadata in v0.1. They appear in results, logs, and manifests.

## Approval

When `requireApproval` is true, ToolGateKit blocks execution and returns a structured `APPROVAL_REQUIRED` response. It does not implement approval UI.

## Path Policy

Path policy is evaluated from common input fields: `path`, `filePath`, `filepath`, and `targetPath`.

Rules:

- denied paths win over allowed paths
- paths are normalized before matching
- traversal attempts and absolute paths are blocked
- if `allowedPaths` is present, paths outside it are denied
