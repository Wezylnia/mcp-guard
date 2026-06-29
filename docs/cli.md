# CLI

ToolGateKit includes a small CLI for manifest workflows.

## Generate a Manifest

```bash
toolgate manifest --config toolgate.config.json --out policy-manifest.json
```

Config format:

```json
{
  "name": "filesystem-mcp",
  "tools": [
    {
      "name": "read_file",
      "risk": "read",
      "allowedPaths": ["src/**"],
      "deniedPaths": [".env"],
      "audit": true
    }
  ]
}
```

The config is intentionally JSON-only. It is for static policy visibility and release checks, not for executing handlers.

## Validate a Manifest

```bash
toolgate validate-manifest --file policy-manifest.json
```

The command exits with code `0` for a valid manifest and `1` with field-level messages for invalid manifests.
