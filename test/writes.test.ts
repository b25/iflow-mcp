import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";
import { mcpAuthContext } from "../src/context/mcp-auth-context.js";
import { config } from "../src/iflow/config.js";

describe("phase 3.3 write tools — inputSchema", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it.each([
    "update_order_status",
    "mark_order_finished",
    "mark_order_billed",
    "add_client_note",
    "add_offer_comment",
  ])("%s registered", (key) => {
    expect(registry.getTool(key), `missing tool ${key}`).toBeDefined();
  });

  it("update_order_status whitelists status", () => {
    const tool = registry.getTool("update_order_status")!;
    expect(tool.inputSchema.safeParse({ order_id: 1, status: "FINISHED" }).success).toBe(true);
    expect(tool.inputSchema.safeParse({ order_id: 1, status: "WRONG" }).success).toBe(false);
  });

  it("mark_order_billed whitelists billing_status", () => {
    const tool = registry.getTool("mark_order_billed")!;
    expect(tool.inputSchema.safeParse({ order_id: 1, billing_status: "PAID" }).success).toBe(true);
    expect(tool.inputSchema.safeParse({ order_id: 1, billing_status: "GIFT" }).success).toBe(false);
  });

  it("add_offer_comment requires offer_id & text", () => {
    const tool = registry.getTool("add_offer_comment")!;
    expect(tool.inputSchema.safeParse({ offer_id: 1 }).success).toBe(false);
    expect(tool.inputSchema.safeParse({ offer_id: 1, text: "ok" }).success).toBe(true);
  });
});

describe("phase 3.3 write tools — IFLOW_READ_ONLY enforcement", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let originalReadOnly: boolean;

  beforeAll(() => {
    originalReadOnly = config.IFLOW_READ_ONLY;
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
  });

  afterAll(() => {
    (config as { IFLOW_READ_ONLY: boolean }).IFLOW_READ_ONLY = originalReadOnly;
    fetchSpy.mockRestore();
  });

  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("refuses write when IFLOW_READ_ONLY=true and does not fetch", async () => {
    (config as { IFLOW_READ_ONLY: boolean }).IFLOW_READ_ONLY = true;
    fetchSpy.mockClear();
    await mcpAuthContext.run({ scope: "tools:orders:write" }, async () => {
      const out = await registry.executeTool("update_order_status", {
        order_id: 1,
        status: "FINISHED",
      });
      expect(out.isError).toBe(true);
      expect(
        (out.content?.[0] as { text?: string } | undefined)?.text ?? ""
      ).toMatch(/IFLOW_READ_ONLY/i);
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("performs write when IFLOW_READ_ONLY=false", async () => {
    (config as { IFLOW_READ_ONLY: boolean }).IFLOW_READ_ONLY = false;
    fetchSpy.mockClear();
    await mcpAuthContext.run({ scope: "tools:orders:write" }, async () => {
      const out = await registry.executeTool("update_order_status", {
        order_id: 1,
        status: "FINISHED",
      });
      expect(out.isError).not.toBe(true);
    });
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("rejects without tools:orders:write scope", async () => {
    (config as { IFLOW_READ_ONLY: boolean }).IFLOW_READ_ONLY = false;
    await expect(
      mcpAuthContext.run({ scope: "tools:erp:read" }, () =>
        registry.executeTool("mark_order_finished", { order_id: 1 })
      )
    ).rejects.toThrow();
  });

  it("rejects without tools:offers:write scope", async () => {
    (config as { IFLOW_READ_ONLY: boolean }).IFLOW_READ_ONLY = false;
    await expect(
      mcpAuthContext.run({ scope: "tools:erp:read" }, () =>
        registry.executeTool("add_offer_comment", { offer_id: 1, text: "x" })
      )
    ).rejects.toThrow();
  });
});
