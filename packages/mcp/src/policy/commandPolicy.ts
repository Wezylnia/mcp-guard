import type { ToolPolicy } from "../gate/types.js";
import { globMatch } from "../utils/globMatch.js";

const commandKeys = ["command", "cmd", "script", "shellCommand"];

export interface CommandPolicyResult {
  allowed: boolean;
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export function extractPolicyCommands(input: unknown): string[] {
  if (!input || typeof input !== "object") {
    return [];
  }

  const record = input as Record<string, unknown>;
  return commandKeys.flatMap((key) => {
    const value = record[key];
    return typeof value === "string" ? [value] : [];
  });
}

export function evaluateCommandPolicy(policy: ToolPolicy, input: unknown): CommandPolicyResult {
  if (!policy.allowedCommands?.length && !policy.deniedCommands?.length) {
    return { allowed: true };
  }

  const commands = policy.extractCommands
    ? normalizeExtractorResult(policy.extractCommands(input))
    : extractPolicyCommands(input);

  if (commands.length === 0) {
    return { allowed: true };
  }

  for (const command of commands) {
    if (policy.deniedCommands?.length && globMatch(command, policy.deniedCommands)) {
      return denied(policy, command);
    }

    if (policy.allowedCommands?.length && !globMatch(command, policy.allowedCommands)) {
      return denied(policy, command);
    }
  }

  return { allowed: true };
}

function normalizeExtractorResult(value: string | string[] | undefined): string[] {
  if (typeof value === "string") {
    return [value];
  }

  return value ?? [];
}

function denied(policy: ToolPolicy, command: string): CommandPolicyResult {
  return {
    allowed: false,
    code: "COMMAND_DENIED",
    message: `Tool '${policy.name}' is not allowed to run command '${command}'.`,
    details: {
      command
    }
  };
}
