import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";
import { mcpAuthContext } from "../src/context/mcp-auth-context.js";

describe("list_employee_leave tool — inputSchema", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("is registered", () => {
    const tool = registry.getTool("list_employee_leave");
    expect(tool).toBeDefined();
  });

  it("accepts empty args (no filters)", () => {
    const tool = registry.getTool("list_employee_leave")!;
    expect(tool.inputSchema.safeParse({}).success).toBe(true);
  });

  it("accepts date only", () => {
    const tool = registry.getTool("list_employee_leave")!;
    expect(tool.inputSchema.safeParse({ date: "2026-06-12" }).success).toBe(true);
  });

  it("accepts from+to range", () => {
    const tool = registry.getTool("list_employee_leave")!;
    expect(
      tool.inputSchema.safeParse({ from: "2026-06-01", to: "2026-06-30" }).success
    ).toBe(true);
  });

  it("accepts all optional filters", () => {
    const tool = registry.getTool("list_employee_leave")!;
    expect(
      tool.inputSchema.safeParse({
        date: "2026-06-12",
        employee_id: 7,
        department_id: 2,
        leave_type: 1,
        limit: 50,
        offset: 0,
      }).success
    ).toBe(true);
  });

  it("rejects leave_type outside 0-2", () => {
    const tool = registry.getTool("list_employee_leave")!;
    expect(tool.inputSchema.safeParse({ leave_type: 3 }).success).toBe(false);
  });

  it("rejects leave_type below 0", () => {
    const tool = registry.getTool("list_employee_leave")!;
    expect(tool.inputSchema.safeParse({ leave_type: -1 }).success).toBe(false);
  });

  it("rejects limit over 1000", () => {
    const tool = registry.getTool("list_employee_leave")!;
    expect(tool.inputSchema.safeParse({ limit: 1001 }).success).toBe(false);
  });

  it("rejects non-positive employee_id", () => {
    const tool = registry.getTool("list_employee_leave")!;
    expect(tool.inputSchema.safeParse({ employee_id: 0 }).success).toBe(false);
  });
});

describe("list_employee_leave tool — execute via mocked fetch", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (...args) => {
      const url = String(args[0]);
      return new Response(
        JSON.stringify({ count: 3, url, results: [] }),
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

  it("sends date=2026-06-12 as query param", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      const out = await registry.executeTool("list_employee_leave", {
        date: "2026-06-12",
      });
      expect(out.isError).not.toBe(true);
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("date=2026-06-12");
  });

  it("sends from+to as query params", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      await registry.executeTool("list_employee_leave", {
        from: "2026-06-01",
        to: "2026-06-30",
      });
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("from=2026-06-01");
    expect(calledUrl).toContain("to=2026-06-30");
  });

  it("sends employee_id and leave_type as query params", async () => {
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      await registry.executeTool("list_employee_leave", {
        employee_id: 7,
        leave_type: 1,
      });
    });
    const calledUrl = String(fetchSpy.mock.calls.at(-1)![0]);
    expect(calledUrl).toContain("employee_id=7");
    expect(calledUrl).toContain("leave_type=1");
  });

  it("result text contains count", async () => {
    let result: Awaited<ReturnType<typeof registry.executeTool>>;
    await mcpAuthContext.run({ scope: "tools:erp:read" }, async () => {
      result = await registry.executeTool("list_employee_leave", {
        date: "2026-06-12",
      });
    });
    expect(result!.content[0].text).toContain("3");
    expect(result!.isError).toBe(false);
  });
});
