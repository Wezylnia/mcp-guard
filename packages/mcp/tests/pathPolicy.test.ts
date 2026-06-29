import { describe, expect, it } from "vitest";
import { gate } from "../src/gate/gate.js";

describe("path policy", () => {
  it("lets denylist win over allowlist", async () => {
    const protectedHandler = gate(
      {
        name: "read_file",
        allowedPaths: ["src/**", ".env"],
        deniedPaths: [".env"]
      },
      async () => "secret"
    );

    const result = await protectedHandler({ path: ".env" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PATH_DENIED");
    }
  });

  it("denies paths outside allowlist", async () => {
    const protectedHandler = gate(
      {
        name: "read_file",
        allowedPaths: ["src/**"]
      },
      async () => "ok"
    );

    const result = await protectedHandler({ filePath: "docs/readme.md" });

    expect(result.ok).toBe(false);
  });

  it("normalizes mixed slashes", async () => {
    const protectedHandler = gate(
      {
        name: "read_file",
        allowedPaths: ["src/**"]
      },
      async () => "ok"
    );

    const result = await protectedHandler({ targetPath: "src\\index.ts" });

    expect(result.ok).toBe(true);
  });

  it("blocks traversal attempts", async () => {
    const protectedHandler = gate(
      {
        name: "read_file",
        allowedPaths: ["src/**"]
      },
      async () => "ok"
    );

    const result = await protectedHandler({ path: "../.env" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PATH_DENIED");
    }
  });
});
