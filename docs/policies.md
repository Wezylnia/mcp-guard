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

Risk levels are metadata. They appear in results, logs, and manifests.

## Approval

When `requireApproval` is true, ToolGateKit blocks execution and returns a structured `APPROVAL_REQUIRED` response. It does not implement approval UI.

## Path Policy

Path policy is evaluated from common input fields: `path`, `filePath`, `filepath`, and `targetPath`.

Rules:

- denied paths win over allowed paths
- paths are normalized before matching
- traversal attempts and absolute paths are blocked
- if `allowedPaths` is present, paths outside it are denied

Use `extractPaths` for custom input shapes.

## Network Policy

Network policy is evaluated from common input fields: `url`, `uri`, `href`, `endpoint`, and `targetUrl`.

```ts
gate(
  {
    name: "fetch_url",
    risk: "external",
    allowedDomains: ["api.github.com"],
    deniedDomains: ["metadata.google.internal"]
  },
  handler
);
```

Rules:

- denied domains win over allowed domains
- `*.example.com` matches `example.com` and subdomains
- invalid URLs are blocked when network policy is configured

Use `extractUrls` for custom input shapes.

## Command Policy

Command policy is evaluated from common input fields: `command`, `cmd`, `script`, and `shellCommand`.

```ts
gate(
  {
    name: "run_command",
    risk: "destructive",
    allowedCommands: ["npm test", "npm run build"],
    deniedCommands: ["npm publish*"]
  },
  handler
);
```

Rules:

- denied commands win over allowed commands
- command matching uses glob patterns

Use `extractCommands` for custom input shapes.

## Rate Limit

```ts
gate(
  {
    name: "search_docs",
    rateLimit: {
      max: 20,
      windowMs: 60_000
    }
  },
  handler
);
```

Rate limiting is in-memory per protected handler instance.
