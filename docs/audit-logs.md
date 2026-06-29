# Audit Logs

ToolGateKit can write JSONL audit logs for tool calls.

```ts
import { createAuditLogger, gate } from "@toolgate/mcp";

const audit = createAuditLogger({
  file: ".toolgate/audit.jsonl"
});

const tool = gate(
  {
    name: "read_file",
    audit,
    redact: true
  },
  async (input) => ({ ok: true })
);
```

Each line is one JSON object. Allowed, blocked, and failed calls are logged.

Logging failures do not crash tool calls by default. Custom loggers can implement stricter behavior if a host application needs it.

Logs are redacted by default unless `redact: false` is explicitly set.
