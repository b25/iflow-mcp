import { describe, it, expect, beforeEach } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";
import { SCENARIO_1_PERSPECTIVES } from "../src/product-scenarios/scenariul-1.js";

describe("scenariul_1", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("playbook returns 8 perspectives and endpoint notes without calling iflow", async () => {
    const out = await registry.executeTool("scenariul_1", { action: "playbook", language: "ro" });
    const sc = out.structuredContent as {
      perspectives: typeof SCENARIO_1_PERSPECTIVES;
      endpoint_design_notes_ro: string[];
      analyze_tool_names_in_order: string[];
    };
    expect(sc.perspectives).toHaveLength(8);
    expect(sc.endpoint_design_notes_ro.length).toBeGreaterThanOrEqual(7);
    expect(sc.analyze_tool_names_in_order).toEqual(
      SCENARIO_1_PERSPECTIVES.map((p) => p.mcpAnalyzeTool)
    );
  });

  it("requires perspective when action is analyze_perspective", async () => {
    const parsed = registry.getTool("scenariul_1")!.inputSchema.safeParse({
      action: "analyze_perspective",
    });
    expect(parsed.success).toBe(false);
  });
});
