import { gate } from "toolgate-mcp";

async function runCommand(command: string): Promise<{ command: string }> {
  return { command };
}

export const runCommandTool = gate(
  {
    name: "run_command",
    risk: "destructive",
    requireApproval: true,
    allowedCommands: ["npm test", "npm run build"],
    deniedCommands: ["npm publish*", "rm -rf*"],
    audit: true
  },
  async ({ command }: { command: string }) => runCommand(command)
);
