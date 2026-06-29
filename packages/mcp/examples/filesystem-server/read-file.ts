import { readFile } from "node:fs/promises";
import { createAuditLogger, gate } from "../../src/index.js";

const audit = createAuditLogger({
  file: ".toolgate/audit.jsonl"
});

export const readFileTool = gate(
  {
    name: "read_file",
    risk: "read",
    allowedPaths: ["src/**", "docs/**"],
    deniedPaths: [".env", "secrets/**"],
    timeoutMs: 5000,
    redact: true,
    audit
  },
  async ({ path }: { path: string }) => ({
    content: await readFile(path, "utf8")
  })
);

export async function demo(): Promise<void> {
  console.log(await readFileTool({ path: "src/index.ts" }));
  console.log(await readFileTool({ path: ".env" }));
}
