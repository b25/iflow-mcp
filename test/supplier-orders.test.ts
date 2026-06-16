import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";
import { mcpAuthContext } from "../src/context/mcp-auth-context.js";

describe("list_supplier_orders tool — inputSchema", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("is registered", () => {
    const tool = registry.getTool("list_supplier_orders");
    expect(tool).toBeDefined();
  });

  it("accepts empty args (no filters)", () => {
    const tool = registry.getTool("list_supplier_orders")!;
    expect(tool.inputSchema.safeParse({}).success).toBe(true);
  });

  it("accepts provider_id only", () => {
    const tool = registry.getTool("list_supplier_orders")!;
    expect(tool.inputSchema.safeParse({ provider_id: 160 }).success).toBe(true);
  });

  it("accepts status only", () => {
    const tool = registry.getTool("list_supplier_orders")!;
    expect(tool.inputSchema.safeParse({ status: 4 }).success).toBe(true);
  });

  it("accepts from+to date range", () => {
    const tool = registry.getTool("list_supplier_orders")!;
    expect(
      tool.inputSchema.safeParse({ from: "2026-01-01", to: "2026-06-30" }).success
    ).toBe(true);
  });

  it("accepts all optional filters", () => {
    const tool = registry.getTool("list_supplier_orders")!;
    expect(
      tool.inputSchema.safeParse({
        provider_id: 160,
        status: 4,
        from: "2026-01-01",
        to: "2026-06-30",
        product_id: 42,
        q: "cablu",
        delivery_from: "2026-02-01",
        delivery_to: "2026-07-01",
        limit: 50,
        offset: 0,
      }).success
    ).toBe(true);
  });

  it("rejects status outside 0-7", () => {
    const tool = registry.getTool("list_supplier_orders")!;
    expect(tool.inputSchema.safeParse({ status: 8 }).success).toBe(false);
  });

  it("rejects status below 0", () => {
    const tool = registry.getTool("list_supplier_orders")!;
    expect(tool.inputSchema.safeParse({ status: -1 }).success).toBe(false);
  });

  it("rejects limit over 200", () => {
    const tool = registry.getTool("list_supplier_orders")!;
    expect(tool.inputSchema.safeParse({ limit: 201 }).success).toBe(false);
  });

  it("rejects non-positive provider_id", () => {
    const tool = registry.getTool("list_supplier_orders")!;
    expect(tool.inputSchema.safeParse({ provider_id: 0 }).success).toBe(false);
  });

  it("rejects non-positive product_id", () => {
    const tool = registry.getTool("list_supplier_orders")!;
    expect(tool.inputSchema.safeParse({ product_id: -1 }).success).toBe(false);
  });
});

describe("list_supplier_orders tool — execute via mocked fetch", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (...args) => {
      const url = String(args[0]);
      return new Response(
        JSON.stringify({ count: 5, url, results: [] }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("sends status=4 and provider_id=160 as query params", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("list_supplier_orders", {
        status: 4,
        provider_id: 160,
      });
      expect(out.isError).not.toBe(true);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("status=4");
    expect(calledUrl).toContain("provider_id=160");
  });

  it("sends from+to as query params", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      await registry.executeTool("list_supplier_orders", {
        from: "2026-01-01",
        to: "2026-06-30",
      });
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("from=2026-01-01");
    expect(calledUrl).toContain("to=2026-06-30");
  });

  it("sends product_id as query param", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      await registry.executeTool("list_supplier_orders", { product_id: 42 });
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("product_id=42");
  });

  it("sends delivery_from and delivery_to as query params", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      await registry.executeTool("list_supplier_orders", {
        delivery_from: "2026-02-01",
        delivery_to: "2026-07-01",
      });
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("delivery_from=2026-02-01");
    expect(calledUrl).toContain("delivery_to=2026-07-01");
  });

  it("result text contains count", async () => {
    let result: Awaited<ReturnType<typeof registry.executeTool>>;
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      result = await registry.executeTool("list_supplier_orders", {
        status: 4,
        provider_id: 160,
      });
    });
    expect(result!.content[0].text).toContain("5");
    expect(result!.isError).toBe(false);
  });
});
