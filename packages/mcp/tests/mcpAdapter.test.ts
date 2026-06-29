import { describe, expect, it, vi } from "vitest";
import { gateMcp, isMcpToolResult, toMcpToolResult } from "../src/mcp/adapter.js";

describe("MCP adapter", () => {
  it("preserves an existing MCP result from an allowed handler", async () => {
    const expected = {
      content: [{ type: "text", text: "hello" }],
      structuredContent: { value: "hello" }
    };
    const protectedHandler = gateMcp({ name: "hello" }, async () => expected);

    await expect(protectedHandler({})).resolves.toBe(expected);
  });

  it("maps policy failures to MCP error results", async () => {
    const handler = vi.fn();
    const protectedHandler = gateMcp(
      { name: "delete", risk: "destructive", requireApproval: true },
      handler,
      { includeStructuredContent: true }
    );

    const result = await protectedHandler({});

    expect(handler).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0]).toMatchObject({ type: "text" });
    expect(String(result.content[0].text)).toContain("APPROVAL_REQUIRED");
    expect(result.structuredContent?.toolgate).toMatchObject({
      ok: false,
      error: { code: "APPROVAL_REQUIRED" }
    });
  });

  it("adapts generic successful data and detects compatible results", () => {
    const adapted = toMcpToolResult({
      ok: true,
      data: { count: 2 },
      meta: { requestId: "r1", toolName: "count", risk: "read", durationMs: 1 }
    });

    expect(adapted.isError).toBeUndefined();
    expect(String(adapted.content[0].text)).toContain('"count":2');
    expect(isMcpToolResult(adapted)).toBe(true);
    expect(isMcpToolResult({ content: [{ text: "missing type" }] })).toBe(false);
  });
});
