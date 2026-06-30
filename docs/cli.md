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

## Validate Policy Config

```bash
toolgate validate-config --file toolgate.config.json
```

Validation reports field paths for invalid names, risk values, policy lists, timeouts, and rate
limits. It also rejects duplicate tool names. `manifest` runs the same validation before writing
output.

## Validate a Manifest

```bash
toolgate validate-manifest --file policy-manifest.json
```

The command exits with code `0` for a valid manifest and `1` with field-level messages for invalid manifests.

## Inspect Audit Logs

```bash
toolgate audit --file .toolgate/audit.jsonl --decision blocked --limit 100
```

Filters include `--tool`, `--decision`, `--reason`, `--since`, `--until`, and `--limit`. Add
`--json` for machine-readable summary and parse issues. The command exits with code `1` if any
malformed audit lines are found.

## Check Manifest Changes

```bash
toolgate check-manifest --base policy-main.json --head policy-pr.json
```

The default `danger` threshold returns exit code `1` for security-reducing changes. Use
`--fail-on warning` to also require review for newly added tools, or `--fail-on info` for any
manifest change. Add `--json` for CI reports.
