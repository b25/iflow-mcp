import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";
import { mcpAuthContext } from "../src/context/mcp-auth-context.js";

describe("phase 4 assistant tools — inputSchema", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it.each([
    "mcp_assistant_intro",
    "mcp_data_dictionary",
    "mcp_clarify",
    "mcp_plan",
  ])("%s registered", (key) => {
    expect(registry.getTool(key), `missing tool ${key}`).toBeDefined();
  });

  it("mcp_assistant_intro whitelists topic", () => {
    const tool = registry.getTool("mcp_assistant_intro")!;
    expect(tool.inputSchema.safeParse({}).success).toBe(true);
    expect(tool.inputSchema.safeParse({ topic: "orders" }).success).toBe(true);
    expect(tool.inputSchema.safeParse({ topic: "diagnose" }).success).toBe(true);
    expect(tool.inputSchema.safeParse({ topic: "bogus" }).success).toBe(false);
  });

  it("mcp_data_dictionary whitelists entity", () => {
    const tool = registry.getTool("mcp_data_dictionary")!;
    expect(tool.inputSchema.safeParse({ entity: "products" }).success).toBe(true);
    expect(tool.inputSchema.safeParse({ entity: "spaceship" }).success).toBe(false);
  });

  it("mcp_clarify requires objective", () => {
    const tool = registry.getTool("mcp_clarify")!;
    expect(tool.inputSchema.safeParse({}).success).toBe(false);
    expect(tool.inputSchema.safeParse({ objective: "show late orders" }).success).toBe(true);
  });

  it("mcp_plan accepts answers object", () => {
    const tool = registry.getTool("mcp_plan")!;
    expect(
      tool.inputSchema.safeParse({
        objective: "late orders",
        answers: { scope: "doar in intarziere", period: "ultimele 30 zile", limit: 20 },
      }).success
    ).toBe(true);
  });
});

describe("phase 4 assistant tools — execute via mocked fetch", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    // Single body that satisfies all four assistant tools — they each look at
    // a different subset of fields, so we just return everything.
    const body = {
      overview: "iFlow ERP",
      language: "ro",
      top_questions: ["Q1", "Q2"],
      focus: [],
      count: 2,
      results: [{ entity: "orders" }, { entity: "offers" }],
      available_entities: ["orders", "offers"],
      matched_topics: ["orders"],
      clarifications: [
        {
          topic: "orders",
          questions: [{ id: "scope", prompt: "?", type: "enum", options: ["a", "b"] }],
        },
      ],
      step_count: 2,
      steps: [
        { tool: "list_orders", args: { finished: false }, why: "unfinished" },
        { tool: "order_delay_diagnosis", args: {}, why: "delays" },
      ],
    };
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
  });

  afterAll(() => fetchSpy.mockRestore());

  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("mcp_assistant_intro returns overview text", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("mcp_assistant_intro", { language: "ro" });
      expect(out.isError).not.toBe(true);
      expect((out.content?.[0] as { text?: string }).text).toContain("iFlow ERP");
    });
  });

  it("mcp_clarify forwards objective", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("mcp_clarify", {
        objective: "show late orders",
      });
      expect(out.isError).not.toBe(true);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("objective=show+late+orders");
  });

  it("mcp_plan serializes answers as JSON", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("mcp_plan", {
        objective: "stoc minim",
        answers: { focus: "sub stoc minim", limit: 5 },
      });
      expect(out.isError).not.toBe(true);
      expect((out.content?.[0] as { text?: string }).text).toMatch(/list_orders|order_delay_diagnosis/);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("answers=");
    // URLSearchParams encodes spaces as '+'; decodeURIComponent keeps '+' as '+'.
    expect(decodeURIComponent(calledUrl).replace(/\+/g, " ")).toContain(
      '"focus":"sub stoc minim"'
    );
  });
});
