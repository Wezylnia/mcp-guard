# MCP Integration

`gateMcp()` adapts ToolGateKit results to the structural result shape used by MCP TypeScript
tool handlers without adding an MCP SDK dependency.

```ts
import { gateMcp } from "toolgate-mcp";

server.tool(
  "read_file",
  schema,
  gateMcp(
    {
      name: "read_file",
      allowedPaths: ["src/**"],
      deniedPaths: [".env"]
    },
    async ({ path }) => ({
      content: [{ type: "text", text: await fs.readFile(path, "utf8") }]
    })
  )
);
```

Allowed handlers that already return an MCP-compatible `content` array are preserved. Blocked,
timed-out, and failed calls become text results with `isError: true`. Generic successful values
are serialized into a text content block.

Set `{ includeStructuredContent: true }` only when the tool's declared output schema accepts a
top-level `toolgate` property. Otherwise structured content is omitted to avoid violating the
tool schema.

Use `toMcpToolResult()` when adaptation needs to happen separately from `gate()`, and
`isMcpToolResult()` for structural result checks.

## Preserve SDK Handler Context

MCP SDK handlers may receive a second `extra` argument containing request and transport context.
Use `gateMcpHandler()` to preserve it while policy extraction still runs against the actual tool
input:

```ts
server.tool(
  "read_file",
  schema,
  gateMcpHandler(policy, async (input, extra, toolgateContext) => ({
    content: [{ type: "text", text: await readForSession(input.path, extra.sessionId) }]
  }))
);
```

The registry equivalent is `toolgate.protectMcpHandler()`. Both helpers are structural and do not
add an MCP SDK runtime dependency.
