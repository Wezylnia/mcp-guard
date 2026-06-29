import { readFile, writeFile } from "node:fs/promises";
import { createManifest } from "../manifest/manifest.js";
import { validateManifest } from "../manifest/schema.js";
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
  if (!Array.isArray(config.tools)) {
    io.stderr.write("Manifest config must contain a tools array.\n");
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

    options[normalized] = args[index + 1];
    index += 1;
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
  toolgate validate-manifest --file policy-manifest.json

Commands:
  manifest           Create a policy manifest from a JSON config.
  validate-manifest  Validate a policy manifest.
`);
}
