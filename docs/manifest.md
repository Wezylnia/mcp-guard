# Manifest

Use `createManifest` to export visible policy metadata.

```ts
import { createManifest } from "toolgate-mcp";

const manifest = createManifest(
  [
    {
      name: "read_file",
      risk: "read",
      allowedPaths: ["src/**"],
      deniedPaths: [".env"],
      allowedDomains: ["api.github.com"],
      allowedCommands: ["npm test"],
      rateLimit: {
        max: 10,
        windowMs: 60000
      },
      audit: true,
      timeoutMs: 5000
    }
  ],
  { name: "filesystem-mcp" }
);
```

The manifest is intended for developer visibility. It is not an authorization system and does not enforce policy by itself.

## Validation

ToolGateKit exports a JSON schema object and a lightweight validator:

```ts
import { policyManifestSchema, validateManifest } from "toolgate-mcp";

const result = validateManifest(manifest);
```

The schema is also available through the package subpath:

```ts
import { policyManifestSchema } from "toolgate-mcp/schema";
```

## CLI

Create a manifest from a JSON config:

```bash
toolgate manifest --config toolgate.config.json --out policy-manifest.json
```

Validate a manifest:

```bash
toolgate validate-manifest --file policy-manifest.json
```
