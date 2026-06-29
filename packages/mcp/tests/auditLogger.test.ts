import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createAuditLogger } from "../src/audit/jsonlAuditLogger.js";
import { gate } from "../src/gate/gate.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "toolgate-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("audit logger", () => {
  it("writes redacted JSONL entries", async () => {
    const auditFile = path.join(tempDir, "audit.jsonl");
    const protectedHandler = gate(
      {
        name: "read_file",
        audit: createAuditLogger({ file: auditFile }),
        redact: true
      },
      async () => ({ content: "hello" })
    );

    await protectedHandler({ path: "src/index.ts", token: "secret" });

    const lines = (await readFile(auditFile, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]);
    expect(entry.tool).toBe("read_file");
    expect(entry.decision).toBe("allowed");
    expect(entry.input.token).toBe("[REDACTED]");
  });
});
