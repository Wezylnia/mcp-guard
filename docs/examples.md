# Examples

For direct registration with an MCP SDK server, see [MCP Integration](mcp-integration.md).

The repository includes a filesystem example in `packages/mcp/examples/filesystem-server/read-file.ts`.

It demonstrates:

- allowed path reads
- denied `.env` access
- JSONL audit logging
- output redaction
- timeout configuration

## Network Tool

```ts
gate(
  {
    name: "fetch_url",
    risk: "external",
    allowedDomains: ["api.github.com"],
    deniedDomains: ["metadata.google.internal"],
    timeoutMs: 10_000,
    redact: true
  },
  async ({ url }, ctx) => {
    const response = await fetch(url, { signal: ctx.signal });
    return { text: await response.text() };
  }
);
```

## Command Tool

```ts
gate(
  {
    name: "run_command",
    risk: "destructive",
    requireApproval: true,
    allowedCommands: ["npm test", "npm run build"],
    deniedCommands: ["npm publish*", "rm -rf*"]
  },
  async ({ command }) => runCommand(command)
);
```

The example is intentionally framework-light. ToolGateKit wraps handlers; it does not implement the MCP protocol or replace the official MCP SDK.
