# Migrating to v1

ToolGateKit v1 keeps the existing `gate(policy, handler)` result contract. The breaking changes
are limited to static schema files and stricter validation.

## Config and Manifest Version

Policy configs and manifests now require:

```json
{ "schemaVersion": "1.0" }
```

Run the migration commands instead of editing generated files by hand:

```bash
toolgate migrate-config --file old-config.json --out toolgate.config.json
toolgate migrate-manifest --file old-manifest.json --out policy-manifest.json
```

Migration validates the complete document. Legacy manifests receive `redact: false` because older
manifests did not record redaction state. Regenerate from runtime policies when the real state is
known.

## Strict Validation

Unknown fields, duplicate tool names, malformed metadata, and unknown rate-limit fields now fail
validation. This aligns the runtime validators with the published JSON Schemas.

## Manifest Security Fields

Manifest tools now require `redact`. `check-manifest` treats disabling redaction as a dangerous
change. Keyed rate limits expose `keyed` and `namespace`, but never serialize extractor or store
implementations.

## Recommended v1 API

- Use `createToolGate()` for servers with multiple tools.
- Use `gateMcpHandler()` when an MCP SDK handler consumes the second `extra` argument.
- Use a shared `RateLimitStore` for distributed or cross-tool quotas.
- Use `createOpenTelemetryObserver()` for spans without adding ToolGateKit-specific SDK coupling.

The package remains ESM-first and supports Node.js 18 or newer.
