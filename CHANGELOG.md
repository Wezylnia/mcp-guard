# Changelog

## 0.7.0 - 2026-06-30

### Added

- Fail-closed synchronous and asynchronous custom policy rules.
- Privacy-conscious lifecycle observer events for telemetry adapters.
- Security-aware manifest comparison API and `check-manifest` CLI command.
- Reusable GitHub composite action for pull-request policy checks.

### Changed

- Policy manifests now expose custom rule names for review without serializing executable code.
- Malformed custom rule decisions fail closed as `POLICY_RULE_ERROR`.

## 0.5.0 - 2026-06-29

### Added

- Host-driven async approval providers with explicit approved, denied, and provider-error results.
- Runtime policy validation, duplicate tool-name checks, and `toolgate validate-config`.
- Streaming audit-log reading, filtering, summaries, and the `toolgate audit` command.
- Dependency-free `gateMcp()` and `toMcpToolResult()` MCP result adapters.

### Changed

- `gate()` now fails fast with `InvalidToolPolicyError` when policy configuration is invalid.
- Approval metadata is included in the final audit entry for approved or denied calls.

## 0.3.0 - 2026-06-29

- Added the manifest JSON schema, validation helpers, and CLI manifest workflows.

## 0.2.0 - 2026-06-29

- Added network and command policies, custom extractors, rate limiting, and policy presets.

## 0.1.0 - 2026-06-29

- Initial policy gate, path controls, redaction, timeout, audit logging, and manifest generation.
