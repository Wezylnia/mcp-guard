import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../src/cli/cli.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "toolgate-cli-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("cli", () => {
  it("prints help", async () => {
    const io = createIo();

    const exitCode = await runCli(["--help"], io);

    expect(exitCode).toBe(0);
    expect(io.stdoutText()).toContain("toolgate manifest");
  });

  it("creates a manifest from config", async () => {
    const configPath = path.join(tempDir, "toolgate.config.json");
    const outPath = path.join(tempDir, "policy-manifest.json");
    await writeFile(
      configPath,
      JSON.stringify({
        name: "example-server",
        tools: [
          {
            name: "read_file",
            risk: "read",
            allowedPaths: ["src/**"],
            audit: true
          }
        ]
      }),
      "utf8"
    );

    const exitCode = await runCli(["manifest", "--config", configPath, "--out", outPath], createIo());

    expect(exitCode).toBe(0);
    const manifest = JSON.parse(await readFile(outPath, "utf8"));
    expect(manifest.name).toBe("example-server");
    expect(manifest.tools[0].name).toBe("read_file");
  });

  it("validates manifest files", async () => {
    const manifestPath = path.join(tempDir, "policy-manifest.json");
    await writeFile(
      manifestPath,
      JSON.stringify({
        tools: [
          {
            name: "fetch_url",
            risk: "external",
            requiresApproval: false,
            audit: true
          }
        ]
      }),
      "utf8"
    );
    const io = createIo();

    const exitCode = await runCli(["validate-manifest", "--file", manifestPath], io);

    expect(exitCode).toBe(0);
    expect(io.stdoutText()).toContain("Manifest is valid.");
  });

  it("validates policy config files", async () => {
    const configPath = path.join(tempDir, "toolgate.config.json");
    await writeFile(
      configPath,
      JSON.stringify({ tools: [{ name: "run", rateLimit: { max: 0, windowMs: 1000 } }] }),
      "utf8"
    );
    const io = createIo();

    const exitCode = await runCli(["validate-config", "--file", configPath], io);

    expect(exitCode).toBe(1);
    expect(io.stderrText()).toContain("$.tools[0].rateLimit.max");
  });

  it("returns errors for invalid manifests", async () => {
    const manifestPath = path.join(tempDir, "bad-manifest.json");
    await writeFile(manifestPath, JSON.stringify({ tools: [{ name: "" }] }), "utf8");
    const io = createIo();

    const exitCode = await runCli(["validate-manifest", "--file", manifestPath], io);

    expect(exitCode).toBe(1);
    expect(io.stderrText()).toContain("$.tools[0].name");
  });

  it("summarizes filtered audit logs as JSON", async () => {
    const auditPath = path.join(tempDir, "audit.jsonl");
    await writeFile(
      auditPath,
      `${JSON.stringify({
        timestamp: "2026-01-01T00:00:00.000Z",
        tool: "read_file",
        risk: "read",
        decision: "blocked",
        requestId: "req-1",
        reason: "PATH_DENIED",
        durationMs: 4
      })}\n`,
      "utf8"
    );
    const io = createIo();

    const exitCode = await runCli(
      ["audit", "--file", auditPath, "--decision", "blocked", "--json"],
      io
    );

    expect(exitCode).toBe(0);
    expect(JSON.parse(io.stdoutText()).summary).toMatchObject({ total: 1, reasons: { PATH_DENIED: 1 } });
  });
});

function createIo(): {
  stdout: { write: (chunk: string) => boolean };
  stderr: { write: (chunk: string) => boolean };
  stdoutText: () => string;
  stderrText: () => string;
} {
  let stdout = "";
  let stderr = "";

  return {
    stdout: {
      write(chunk: string): boolean {
        stdout += chunk;
        return true;
      }
    },
    stderr: {
      write(chunk: string): boolean {
        stderr += chunk;
        return true;
      }
    },
    stdoutText: () => stdout,
    stderrText: () => stderr
  };
}
