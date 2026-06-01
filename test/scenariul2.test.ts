import { describe, it, expect, beforeEach } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";

describe("scenariul_2", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it("playbook returns framework and endpoint notes", async () => {
    const out = await registry.executeTool("scenariul_2", {
      action: "playbook",
      language: "ro",
    });
    const sc = out.structuredContent as {
      framework: { phases: unknown[] };
      causal_categories: unknown[];
      endpoint_design_notes_ro: string[];
      mcp_diagnose_tool: string;
    };
    expect(sc.framework.phases).toHaveLength(4);
    expect(sc.causal_categories).toHaveLength(6);
    expect(sc.endpoint_design_notes_ro.length).toBeGreaterThanOrEqual(7);
    expect(sc.mcp_diagnose_tool).toBe("diff_diagnose");
  });

  it("requires metric when action is diagnose", async () => {
    const parsed = registry.getTool("scenariul_2")!.inputSchema.safeParse({
      action: "diagnose",
    });
    expect(parsed.success).toBe(false);
  });

  it("scenario_2 alias behaves identically to scenariul_2", async () => {
    expect(registry.getTool("scenario_2")).toBeDefined();
    const out = await registry.executeTool("scenario_2", {
      action: "playbook",
      language: "en",
    });
    expect(out.content[0].text).toContain("Scenario 2 playbook");
    const sc = out.structuredContent as any;
    expect(sc.framework.phases).toHaveLength(4);
  });
});
