import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";
import { mcpAuthContext } from "../src/context/mcp-auth-context.js";

describe("document_communications tool — inputSchema", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("is registered", () => {
    const tool = registry.getTool("document_communications");
    expect(tool).toBeDefined();
  });

  it("accepts doc_type=invoice with series+number", () => {
    const tool = registry.getTool("document_communications")!;
    expect(
      tool.inputSchema.safeParse({ doc_type: "invoice", series: "ARS", number: 249250 }).success
    ).toBe(true);
  });

  it("accepts doc_type=offer with doc_id", () => {
    const tool = registry.getTool("document_communications")!;
    expect(
      tool.inputSchema.safeParse({ doc_type: "offer", doc_id: 5 }).success
    ).toBe(true);
  });

  it("accepts doc_type=order with number only", () => {
    const tool = registry.getTool("document_communications")!;
    expect(
      tool.inputSchema.safeParse({ doc_type: "order", number: 1001 }).success
    ).toBe(true);
  });

  it("rejects unknown doc_type", () => {
    const tool = registry.getTool("document_communications")!;
    expect(
      tool.inputSchema.safeParse({ doc_type: "receipt" }).success
    ).toBe(false);
  });

  it("rejects missing doc_type", () => {
    const tool = registry.getTool("document_communications")!;
    expect(
      tool.inputSchema.safeParse({ doc_id: 10 }).success
    ).toBe(false);
  });

  it("rejects limit over 500", () => {
    const tool = registry.getTool("document_communications")!;
    expect(
      tool.inputSchema.safeParse({ doc_type: "invoice", limit: 501 }).success
    ).toBe(false);
  });
});

describe("document_communications tool — execute via mocked fetch", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (...args) => {
      const url = String(args[0]);
      return new Response(
        JSON.stringify({ ok: true, sent: true, count: 2, url, results: [] }),
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

  it("sends doc_type=invoice&series=ARS&number=249250 as query params", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("document_communications", {
        doc_type: "invoice",
        series: "ARS",
        number: 249250,
      });
      expect(out.isError).not.toBe(true);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("doc_type=invoice");
    expect(calledUrl).toContain("series=ARS");
    expect(calledUrl).toContain("number=249250");
  });

  it("sends doc_type=offer&doc_id=5 and no series/number", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("document_communications", {
        doc_type: "offer",
        doc_id: 5,
      });
      expect(out.isError).not.toBe(true);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("doc_type=offer");
    expect(calledUrl).toContain("doc_id=5");
    expect(calledUrl).not.toContain("series=");
    expect(calledUrl).not.toContain("number=");
  });

  it("result text reflects sent status", async () => {
    let result: Awaited<ReturnType<typeof registry.executeTool>>;
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      result = await registry.executeTool("document_communications", {
        doc_type: "proforma",
        doc_id: 42,
      });
    });
    expect(result!.content[0].text).toContain("Sent");
  });
});
