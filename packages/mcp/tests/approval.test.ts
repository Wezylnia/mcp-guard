import { describe, expect, it, vi } from "vitest";
import type { AuditEntry } from "../src/audit/auditLogger.js";
import { gate } from "../src/gate/gate.js";

describe("approval providers", () => {
  it("executes a handler after explicit approval", async () => {
    const handler = vi.fn(async () => "deleted");
    const approval = vi.fn(async (request) => ({
      approved: request.input.path === "tmp/file.txt",
      metadata: { approver: "host" }
    }));
    const protectedHandler = gate(
      { name: "delete_file", risk: "destructive", requireApproval: true, approval },
      handler
    );

    const result = await protectedHandler({ path: "tmp/file.txt" });

    expect(result.ok).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
    expect(approval).toHaveBeenCalledWith(
      expect.objectContaining({ toolName: "delete_file", risk: "destructive" })
    );
  });

  it("returns a structured denial and audits the decision", async () => {
    const entries: AuditEntry[] = [];
    const handler = vi.fn();
    const protectedHandler = gate(
      {
        name: "send_email",
        requireApproval: true,
        approval: async () => ({ approved: false, reason: "User rejected", metadata: { actor: "u1" } }),
        audit: {
          log: (entry) => {
            entries.push(entry);
          }
        }
      },
      handler
    );

    const result = await protectedHandler({ to: "person@example.com" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("approval_denied");
      expect(result.error.code).toBe("APPROVAL_DENIED");
      expect(result.error.details?.reason).toBe("User rejected");
    }
    expect(handler).not.toHaveBeenCalled();
    expect(entries[0]).toMatchObject({ decision: "blocked", reason: "APPROVAL_DENIED" });
    expect(entries[0].metadata).toEqual({ actor: "u1" });
  });

  it("normalizes approval provider failures", async () => {
    const protectedHandler = gate(
      {
        name: "dangerous_tool",
        requireApproval: true,
        approval: async () => {
          throw new Error("approval service unavailable");
        }
      },
      async () => "never"
    );

    const result = await protectedHandler({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("approval_error");
      expect(result.error.details?.message).toBe("approval service unavailable");
    }
  });
});
