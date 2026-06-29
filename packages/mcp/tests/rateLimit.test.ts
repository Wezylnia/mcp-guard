import { describe, expect, it } from "vitest";
import { gate } from "../src/gate/gate.js";

describe("rate limiting", () => {
  it("blocks calls after max calls in a window", async () => {
    let calls = 0;
    const protectedHandler = gate(
      {
        name: "limited_tool",
        rateLimit: {
          max: 2,
          windowMs: 1000
        }
      },
      async () => {
        calls += 1;
        return { ok: true };
      }
    );

    expect((await protectedHandler({})).ok).toBe(true);
    expect((await protectedHandler({})).ok).toBe(true);
    const blocked = await protectedHandler({});

    expect(calls).toBe(2);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error.code).toBe("RATE_LIMITED");
      expect(blocked.error.type).toBe("rate_limited");
      expect(blocked.error.details?.retryAfterMs).toBeGreaterThan(0);
    }
  });
});
