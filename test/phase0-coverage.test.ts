import { describe, it, expect, beforeEach } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";
import { PHASE_0_B1 } from "../src/product-scenarios/phase0-b1.js";

describe("product_scenarios_phase0", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("reports 35 rows and marks known tools as registered", async () => {
    const out = await registry.executeTool("product_scenarios_phase0", {});
    const sc = out.structuredContent as {
      total_questions: number;
      rows: Array<{ mcp_tool: string; tool_registered: boolean }>;
    };
    expect(sc.total_questions).toBe(35);
    expect(sc.rows).toHaveLength(PHASE_0_B1.length);
    const getStock = sc.rows.find((r) => r.mcp_tool === "get_stock");
    expect(getStock?.tool_registered).toBe(true);
    const listDeliveries = sc.rows.find((r) => r.mcp_tool === "list_deliveries_today");
    expect(listDeliveries?.tool_registered).toBe(false);
  });
});
