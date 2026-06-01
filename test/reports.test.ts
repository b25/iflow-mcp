import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";
import { mcpAuthContext } from "../src/context/mcp-auth-context.js";

describe("phase 2 report tools — inputSchema", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it.each([
    "report_sales",
    "report_profit",
    "report_total_sales",
    "report_quantity",
    "report_employee",
    "report_equipments_gantt",
    "report_stock_purchases",
    "report_dashboard_card",
    "accounting_partner_balance",
    "accounting_invoices_issued",
    "accounting_stock_balance",
    "accounting_intrastat",
  ])("%s registered", (key) => {
    expect(registry.getTool(key), `missing tool ${key}`).toBeDefined();
  });

  it("report_sales accepts rich filters", () => {
    const tool = registry.getTool("report_sales")!;
    expect(
      tool.inputSchema.safeParse({
        from: "2026-01-01T00:00:00",
        to: "2026-02-01T00:00:00",
        order_finished: "in_progress",
        client_id: 5,
        tag_ids: [1, 2],
        limit: 100,
      }).success
    ).toBe(true);
  });

  it("report_sales rejects bad order_finished", () => {
    const tool = registry.getTool("report_sales")!;
    expect(tool.inputSchema.safeParse({ order_finished: "bogus" }).success).toBe(false);
  });

  it("accounting_partner_balance requires year+month", () => {
    const tool = registry.getTool("accounting_partner_balance")!;
    expect(tool.inputSchema.safeParse({}).success).toBe(false);
    expect(tool.inputSchema.safeParse({ year: 2026, month: 5 }).success).toBe(true);
    expect(tool.inputSchema.safeParse({ year: 2026, month: 13 }).success).toBe(false);
  });

  it("report_dashboard_card whitelists card", () => {
    const tool = registry.getTool("report_dashboard_card")!;
    expect(tool.inputSchema.safeParse({ card: "orders_in_progress" }).success).toBe(true);
    expect(tool.inputSchema.safeParse({ card: "make_coffee" }).success).toBe(false);
  });
});

describe("phase 2 report tools — execute via mocked fetch", () => {
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

  it("report_sales forwards limit & q", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("report_sales", {
        limit: 25,
        q: "demo",
      });
      expect(out.isError).not.toBe(true);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("limit=25");
    expect(calledUrl).toContain("q=demo");
  });

  it("report_profit serializes years array", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("report_profit", {
        years: [2024, 2025],
      });
      expect(out.isError).not.toBe(true);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("years=2024%2C2025");
  });
});
