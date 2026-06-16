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
    expect(tool.inputSchema.safeParse({ order_id: 1, status: "FINISHED" }).success).toBe(
      true
    );
    expect(tool.inputSchema.safeParse({ order_id: 1, status: "WRONG" }).success).toBe(
      false
    );
  });

  it("mark_order_billed whitelists billing_status", () => {
    const tool = registry.getTool("mark_order_billed")!;
    expect(
      tool.inputSchema.safeParse({ order_id: 1, billing_status: "PAID" }).success
    ).toBe(true);
    expect(
      tool.inputSchema.safeParse({ order_id: 1, billing_status: "GIFT" }).success
    ).toBe(false);
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
      expect((out.content?.[0] as { text?: string } | undefined)?.text ?? "").toMatch(
        /IFLOW_READ_ONLY/i
      );
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

describe("add_client_note — notify_employee_ids forwarding", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let originalReadOnly: boolean;

  beforeAll(() => {
    originalReadOnly = config.IFLOW_READ_ONLY;
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response(JSON.stringify({ ok: true, note_id: 99 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    (config as { IFLOW_READ_ONLY: boolean }).IFLOW_READ_ONLY = false;
  });

  afterAll(() => {
    (config as { IFLOW_READ_ONLY: boolean }).IFLOW_READ_ONLY = originalReadOnly;
    fetchSpy.mockRestore();
  });

  beforeEach(() => {
    registry.clear();
    registerAllTools();
    fetchSpy.mockClear();
  });

  it("joins notify_employee_ids array to comma string in query", async () => {
    await mcpAuthContext.run({ scope: "tools:clients:write" }, async () => {
      await registry.executeTool("add_client_note", {
        client_id: 1,
        subject: "x",
        notify_employee_ids: [4, 7],
      });
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
    const calledUrl = new URL(fetchSpy.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get("notify_employee_ids")).toBe("4,7");
  });

  it("omits notify_employee_ids from query when not provided", async () => {
    await mcpAuthContext.run({ scope: "tools:clients:write" }, async () => {
      await registry.executeTool("add_client_note", {
        client_id: 1,
        subject: "x",
      });
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
    const calledUrl = new URL(fetchSpy.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.has("notify_employee_ids")).toBe(false);
  });
});

describe("create_order — Django registry contract (client/products JSON via GET)", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let originalReadOnly: boolean;

  beforeAll(() => {
    originalReadOnly = config.IFLOW_READ_ONLY;
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response(JSON.stringify({ ok: true, order_number: "ORD-1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    (config as { IFLOW_READ_ONLY: boolean }).IFLOW_READ_ONLY = false;
  });

  afterAll(() => {
    (config as { IFLOW_READ_ONLY: boolean }).IFLOW_READ_ONLY = originalReadOnly;
    fetchSpy.mockRestore();
  });

  beforeEach(() => {
    registry.clear();
    registerAllTools();
    fetchSpy.mockClear();
  });

  it("issues a GET with JSON-encoded client/products, date_order, and confirm token", async () => {
    const client = { name: "ACME", tax_code: "RO123" };
    const products = [{ id: 5, quantity: 2, vat: 21 }];
    await mcpAuthContext.run({ scope: "tools:orders:write" }, async () => {
      await registry.executeTool("create_order", {
        client,
        products,
        date_order: "2026-06-16",
        confirm: true,
      });
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [calledUrl, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("GET");
    const url = new URL(calledUrl);
    expect(url.searchParams.get("client")).toBe(JSON.stringify(client));
    expect(url.searchParams.get("products")).toBe(JSON.stringify(products));
    expect(url.searchParams.get("date_order")).toBe("2026-06-16");
    // currency must NOT be sent
    expect(url.searchParams.has("currency")).toBe(false);
    // confirm token is sent as a header
    const headers = init.headers as Record<string, string>;
    expect(headers["X-MCP-Confirm-Token"]).toBe("mcp_confirm=1");
  });

  it("does not send the confirm token when confirm is omitted", async () => {
    await mcpAuthContext.run({ scope: "tools:orders:write" }, async () => {
      await registry.executeTool("create_order", {
        client: { name: "ACME" },
        products: [{ code: "SKU1", quantity: 1 }],
        date_order: "2026-06-16",
      });
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-MCP-Confirm-Token"]).toBeUndefined();
  });
});
