import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";
import { mcpAuthContext } from "../src/context/mcp-auth-context.js";

describe("phase 1.2 listings tools — inputSchema", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("list_orders accepts finished+limit", () => {
    const tool = registry.getTool("list_orders");
    expect(tool).toBeDefined();
    expect(tool!.inputSchema.safeParse({ finished: false, limit: 20 }).success).toBe(
      true
    );
    expect(
      tool!.inputSchema.safeParse({ order_by: "date_order_desc", from: "2026-01-01" })
        .success
    ).toBe(true);
  });

  it("list_orders rejects invalid order_by", () => {
    const tool = registry.getTool("list_orders");
    expect(tool!.inputSchema.safeParse({ order_by: "bogus" }).success).toBe(false);
  });

  it("list_orders rejects huge limit", () => {
    const tool = registry.getTool("list_orders");
    expect(tool!.inputSchema.safeParse({ limit: 1000000 }).success).toBe(false);
  });

  it.each([
    "list_offers",
    "list_invoices",
    "list_suppliers",
    "list_products_search",
    "list_clients_search",
    "list_purchases",
    "list_stock_movements",
    "list_activity",
    "list_notes",
    "list_comments",
    "mcp_tool_catalog",
    "mcp_query_assist",
  ])("%s is registered with object inputSchema", (key) => {
    const tool = registry.getTool(key);
    expect(tool, `tool ${key} missing from registry`).toBeDefined();
    expect(
      tool!.inputSchema.safeParse({}).success || tool!.name === "mcp_query_assist"
    ).toBe(true);
  });

  it("mcp_query_assist requires objective", () => {
    const tool = registry.getTool("mcp_query_assist");
    expect(tool!.inputSchema.safeParse({}).success).toBe(false);
    expect(tool!.inputSchema.safeParse({ objective: "show late orders" }).success).toBe(
      true
    );
  });

  it("list_partners accepts tag_ids both as array and string", () => {
    const tool = registry.getTool("list_partners");
    expect(tool).toBeDefined();
    expect(tool!.inputSchema.safeParse({ tag_ids: [1, 2, 3] }).success).toBe(true);
    expect(tool!.inputSchema.safeParse({ tag_ids: "1,2,3" }).success).toBe(true);
  });

  it("count_orders_in_progress accepts filters", () => {
    const tool = registry.getTool("count_orders_in_progress");
    expect(tool).toBeDefined();
    expect(
      tool!.inputSchema.safeParse({
        flow_id: 5,
        client_id: 12,
        from: "2026-01-01",
        to: "2026-02-01",
      }).success
    ).toBe(true);
  });

  it("diff_diagnose accepts whitelisted metric+interval+baseline", () => {
    const tool = registry.getTool("diff_diagnose");
    expect(tool).toBeDefined();
    expect(
      tool!.inputSchema.safeParse({
        metric: "revenue",
        interval: "month",
        baseline: "yoy",
      }).success
    ).toBe(true);
    expect(tool!.inputSchema.safeParse({ metric: "wat" }).success).toBe(false);
  });
});

describe("phase 1.2 listings tools — executeTool via mocked fetch", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (...args) => {
      const url = String(args[0]);
      return new Response(JSON.stringify({ ok: true, url, count: 0, results: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("list_orders sends query params via api-external endpoint", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("list_orders", {
        finished: false,
        limit: 5,
        order_by: "date_order_desc",
      });
      expect(out.isError).not.toBe(true);
    });
    expect(fetchSpy).toHaveBeenCalled();
    const lastCall = fetchSpy.mock.calls.at(-1)!;
    const calledUrl = String(lastCall[0]);
    expect(calledUrl).toContain("/api-external/v1/");
    expect(calledUrl).toContain("finished=false");
    expect(calledUrl).toContain("limit=5");
    expect(calledUrl).toContain("order_by=date_order_desc");
  });

  it("mcp_tool_catalog forwards category", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("mcp_tool_catalog", { category: "list" });
      expect(out.isError).not.toBe(true);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("category=list");
  });

  it("list_clients_search joins tag_ids array into csv", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("list_clients_search", {
        tag_ids: [1, 2, 3],
        q: "abc",
      });
      expect(out.isError).not.toBe(true);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("tag_ids=1%2C2%2C3");
    expect(calledUrl).toContain("q=abc");
  });
});
