import { describe, expect, it } from "vitest";
import { createManifest } from "../src/manifest/manifest.js";

describe("manifest", () => {
  it("exports public policy visibility", () => {
    const manifest = createManifest(
      [
        {
          name: "read_file",
          risk: "read",
          allowedPaths: ["src/**"],
          deniedPaths: [".env"],
          audit: true,
          timeoutMs: 5000
        },
        {
          name: "delete_file",
          risk: "destructive",
          requireApproval: true
        }
      ],
      { name: "filesystem-mcp" }
    );

    expect(manifest).toEqual({
      name: "filesystem-mcp",
      tools: [
        {
          name: "read_file",
          description: undefined,
          risk: "read",
          requiresApproval: false,
          allowedPaths: ["src/**"],
          deniedPaths: [".env"],
          audit: true,
          timeoutMs: 5000,
          metadata: undefined
        },
        {
          name: "delete_file",
          description: undefined,
          risk: "destructive",
          requiresApproval: true,
          allowedPaths: undefined,
          deniedPaths: undefined,
          audit: false,
          timeoutMs: undefined,
          metadata: undefined
        }
      ]
    });
  });
});
