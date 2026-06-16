import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";
import { mcpAuthContext } from "../src/context/mcp-auth-context.js";

describe("get_stock — inputSchema", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("accepts product_uuid alone", () => {
    const tool = registry.getTool("get_stock")!;
    expect(
      tool.inputSchema.safeParse({
        product_uuid: "00000000-0000-4000-8000-000000000001",
      }).success
    ).toBe(true);
  });

  it("accepts product_id alone", () => {
    const tool = registry.getTool("get_stock")!;
    expect(tool.inputSchema.safeParse({ product_id: 2799 }).success).toBe(true);
  });

  it("accepts both product_uuid and product_id", () => {
    const tool = registry.getTool("get_stock")!;
    expect(
      tool.inputSchema.safeParse({
        product_uuid: "00000000-0000-4000-8000-000000000001",
        product_id: 2799,
      }).success
    ).toBe(true);
  });

  it("rejects when neither product_uuid nor product_id provided", () => {
    const tool = registry.getTool("get_stock")!;
    expect(tool.inputSchema.safeParse({}).success).toBe(false);
  });

  it("rejects invalid product_uuid (not a UUID)", () => {
    const tool = registry.getTool("get_stock")!;
    expect(tool.inputSchema.safeParse({ product_uuid: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects non-positive product_id", () => {
    const tool = registry.getTool("get_stock")!;
    expect(tool.inputSchema.safeParse({ product_id: 0 }).success).toBe(false);
    expect(tool.inputSchema.safeParse({ product_id: -1 }).success).toBe(false);
  });
});

describe("get_stock — execute via mocked fetch", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (...args) => {
      const url = String(args[0]);
      return new Response(JSON.stringify({ quantity: 42, url }), {
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

  it("sends product_id=2799 in query when called with product_id", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("get_stock", { product_id: 2799 });
      expect(out.isError).not.toBe(true);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("product_id=2799");
    expect(calledUrl).not.toContain("product_uuid");
  });

  it("sends product_uuid in query when called with product_uuid", async () => {
    const uuid = "00000000-0000-4000-8000-000000000001";
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("get_stock", { product_uuid: uuid });
      expect(out.isError).not.toBe(true);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain(`product_uuid=${uuid}`);
    expect(calledUrl).not.toContain("product_id");
  });
});
