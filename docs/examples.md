# Examples

The repository includes a filesystem example in `packages/mcp/examples/filesystem-server/read-file.ts`.

It demonstrates:

- allowed path reads
- denied `.env` access
- JSONL audit logging
- output redaction
- timeout configuration

The example is intentionally framework-light. ToolGateKit wraps handlers; it does not implement the MCP protocol or replace the official MCP SDK.
