import { readFile, writeFile } from "node:fs/promises";
import { readAuditLog, summarizeAudit } from "../audit/readAuditLog.js";
import type { AuditDecision } from "../audit/auditLogger.js";
import { createManifest } from "../manifest/manifest.js";
import { validateManifest } from "../manifest/schema.js";
import { validatePolicies } from "../policy/validatePolicy.js";
import type { ToolPolicy } from "../gate/types.js";

export interface CliIo {
  stdout: Pick<NodeJS.WriteStream, "write">;
  stderr: Pick<NodeJS.WriteStream, "write">;
}

export interface ManifestConfig {
  name?: string;
  tools: ToolPolicy[];
}

export async function runCli(
  args: string[],
  io: CliIo = { stdout: process.stdout, stderr: process.stderr }
): Promise<number> {
  const [command, ...rest] = args;

  if (!command || command === "--help" || command === "-h") {
    writeHelp(io.stdout);
    return 0;
  }

  if (command === "manifest") {
    return runManifestCommand(rest, io);
  }

  if (command === "validate-manifest") {
    return runValidateManifestCommand(rest, io);
  }

  if (command === "validate-config") {
    return runValidateConfigCommand(rest, io);
  }

  if (command === "audit") {
    return runAuditCommand(rest, io);
  }

  io.stderr.write(`Unknown command '${command}'.\n`);
  writeHelp(io.stderr);
  return 1;
}

async function runManifestCommand(args: string[], io: CliIo): Promise<number> {
  const options = parseOptions(args);
  const configPath = options.config ?? options.c;

  if (!configPath) {
    io.stderr.write("Missing required --config option.\n");
    return 1;
  }

  const config = await readJson<ManifestConfig>(configPath);
  const validation = validatePolicies(config.tools);
  if (!validation.valid) {
    writeIssues(validation.issues, io.stderr);
    return 1;
  }

  const manifest = createManifest(config.tools, { name: config.name });
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

  const outPath = options.out ?? options.o;
  if (outPath) {
    await writeFile(outPath, serialized, "utf8");
  } else {
    io.stdout.write(serialized);
  }

  return 0;
}

async function runValidateConfigCommand(args: string[], io: CliIo): Promise<number> {
  const options = parseOptions(args);
  const configPath = options.file ?? options.f ?? options.config ?? options.c;
  if (!configPath) {
    io.stderr.write("Missing required --file option.\n");
    return 1;
  }

  const config = await readJson<ManifestConfig>(configPath);
  const result = validatePolicies(config.tools);
  if (result.valid) {
    io.stdout.write("Policy config is valid.\n");
    return 0;
  }
  writeIssues(result.issues, io.stderr);
  return 1;
}

async function runValidateManifestCommand(args: string[], io: CliIo): Promise<number> {
  const options = parseOptions(args);
  const manifestPath = options.file ?? options.f;

  if (!manifestPath) {
    io.stderr.write("Missing required --file option.\n");
    return 1;
  }

  const manifest = await readJson<unknown>(manifestPath);
  const result = validateManifest(manifest);

  if (result.valid) {
    io.stdout.write("Manifest is valid.\n");
    return 0;
  }

  for (const issue of result.issues) {
    io.stderr.write(`${issue.path}: ${issue.message}\n`);
  }
  return 1;
}

async function runAuditCommand(args: string[], io: CliIo): Promise<number> {
  const options = parseOptions(args);
  const file = options.file ?? options.f;
  if (!file) {
    io.stderr.write("Missing required --file option.\n");
    return 1;
  }

  try {
    const result = await readAuditLog(file, {
      tool: options.tool,
      decision: options.decision as AuditDecision | undefined,
      reason: options.reason,
      since: options.since,
      until: options.until,
      limit: options.limit === undefined ? undefined : Number(options.limit)
    });
    const summary = summarizeAudit(result.entries);

    if (options.json === "true") {
      io.stdout.write(`${JSON.stringify({ summary, issues: result.issues }, null, 2)}\n`);
    } else {
      writeAuditSummary(summary, io.stdout);
      for (const issue of result.issues) {
        io.stderr.write(`line ${issue.line}: ${issue.message}\n`);
      }
    }
    return result.issues.length === 0 ? 0 : 1;
  } catch (error) {
    io.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function parseOptions(args: string[]): Record<string, string | undefined> {
  const options: Record<string, string | undefined> = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("-")) {
      continue;
    }

    const normalized = arg.replace(/^-+/, "");
    const inlineSeparator = normalized.indexOf("=");
    if (inlineSeparator >= 0) {
      options[normalized.slice(0, inlineSeparator)] = normalized.slice(inlineSeparator + 1);
      continue;
    }

    const next = args[index + 1];
    if (next === undefined || next.startsWith("-")) {
      options[normalized] = "true";
    } else {
      options[normalized] = next;
      index += 1;
    }
  }

  return options;
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

function writeHelp(output: Pick<NodeJS.WriteStream, "write">): void {
  output.write(`ToolGateKit CLI

Usage:
  toolgate manifest --config toolgate.config.json [--out policy-manifest.json]
  toolgate validate-config --file toolgate.config.json
  toolgate validate-manifest --file policy-manifest.json
  toolgate audit --file .toolgate/audit.jsonl [--tool name] [--decision blocked] [--json]

Commands:
  manifest           Create a policy manifest from a JSON config.
  validate-config    Validate a JSON policy config.
  validate-manifest  Validate a policy manifest.
  audit              Filter and summarize a JSONL audit log.
`);
}

function writeAuditSummary(
  summary: ReturnType<typeof summarizeAudit>,
  output: Pick<NodeJS.WriteStream, "write">
): void {
  output.write(`Audit entries: ${summary.total}\n`);
  output.write(
    `Decisions: allowed=${summary.decisions.allowed} blocked=${summary.decisions.blocked} failed=${summary.decisions.failed}\n`
  );
  output.write(
    `Average duration: ${summary.averageDurationMs === null ? "n/a" : `${summary.averageDurationMs.toFixed(2)}ms`}\n`
  );
  for (const [tool, count] of Object.entries(summary.tools).sort(([a], [b]) => a.localeCompare(b))) {
    output.write(`Tool ${tool}: ${count}\n`);
  }
}

function writeIssues(
  issues: Array<{ path: string; message: string }>,
  output: Pick<NodeJS.WriteStream, "write">
): void {
  for (const issue of issues) {
    output.write(`${issue.path}: ${issue.message}\n`);
  }
}
