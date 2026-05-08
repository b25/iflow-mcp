import { describe, it, expect, beforeEach } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";

describe("iflow_playbook_index", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("returns scenario tool names and doc paths", async () => {
    const out = await registry.executeTool("iflow_playbook_index", { language: "ro" });
    const sc = out.structuredContent as {
      scenario_and_planning_tools: Array<{ tool: string }>;
      further_reading: string[];
    };
    const names = sc.scenario_and_planning_tools.map((t) => t.tool);
    expect(names).toContain("scenariul_1");
    expect(names).toContain("scenariul_2");
    expect(names).toContain("product_scenarios_phase0");
    expect(sc.further_reading.some((p) => p.includes("product-scenarios"))).toBe(true);
  });
});
