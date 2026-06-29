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
