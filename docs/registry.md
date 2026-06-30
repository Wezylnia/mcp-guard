# Tool Registry

`createToolGate()` centralizes shared defaults, protected handler creation, and manifest
collection for a server.

```ts
import { createAuditLogger, createToolGate } from "toolgate-mcp";

const toolgate = createToolGate({
  name: "filesystem-server",
  defaults: {
    timeoutMs: 5000,
    redact: true,
    audit: createAuditLogger({ file: ".toolgate/audit.jsonl" }),
    deniedPaths: [".env", "secrets/**"]
  }
});

server.tool(
  "read_file",
  schema,
  toolgate.protectMcp(
    { name: "read_file", risk: "read", allowedPaths: ["src/**"] },
    async ({ path }) => ({
      content: [{ type: "text", text: await fs.readFile(path, "utf8") }]
    })
  )
);

const manifest = toolgate.manifest();
```

The registry rejects duplicate tool names. Deny lists and custom rules from defaults are additive;
tool policies cannot remove them accidentally. Metadata is merged and observers are composed.
Other explicitly supplied tool fields override defaults.

`policies()` and `getPolicy()` return defensive copies so callers cannot mutate registered
policy lists. Use a separate registry for each server or independently versioned policy set.
