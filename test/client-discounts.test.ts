import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";
import { mcpAuthContext } from "../src/context/mcp-auth-context.js";

describe("list_client_discounts tool — inputSchema", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("is registered", () => {
    const tool = registry.getTool("list_client_discounts");
    expect(tool).toBeDefined();
  });

  it("accepts client_id only", () => {
    const tool = registry.getTool("list_client_discounts")!;
    expect(tool.inputSchema.safeParse({ client_id: 806 }).success).toBe(true);
  });

  it("accepts client_id + product_id", () => {
    const tool = registry.getTool("list_client_discounts")!;
    expect(
      tool.inputSchema.safeParse({ client_id: 806, product_id: 1492 }).success
    ).toBe(true);
  });

  it("rejects missing client_id", () => {
    const tool = registry.getTool("list_client_discounts")!;
    expect(tool.inputSchema.safeParse({}).success).toBe(false);
  });

  it("rejects non-positive client_id", () => {
    const tool = registry.getTool("list_client_discounts")!;
    expect(tool.inputSchema.safeParse({ client_id: 0 }).success).toBe(false);
  });

  it("rejects non-positive product_id", () => {
    const tool = registry.getTool("list_client_discounts")!;
    expect(tool.inputSchema.safeParse({ client_id: 806, product_id: 0 }).success).toBe(false);
  });
});

describe("list_client_discounts tool — execute via mocked fetch", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (...args) => {
      const url = String(args[0]);
      return new Response(
        JSON.stringify({ ok: true, rules_count: 5, url, rules: [] }),
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

  it("sends client_id=806 and product_id=1492 as query params when both are passed", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("list_client_discounts", {
        client_id: 806,
        product_id: 1492,
      });
      expect(out.isError).not.toBe(true);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("client_id=806");
    expect(calledUrl).toContain("product_id=1492");
  });

  it("sends only client_id when product_id is omitted", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      await registry.executeTool("list_client_discounts", { client_id: 806 });
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("client_id=806");
    expect(calledUrl).not.toContain("product_id");
  });

  it("result text contains rules_count", async () => {
    let result: Awaited<ReturnType<typeof registry.executeTool>>;
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      result = await registry.executeTool("list_client_discounts", {
        client_id: 806,
      });
    });
    expect(result!.content[0].text).toContain("5");
    expect(result!.isError).toBe(false);
  });
});
