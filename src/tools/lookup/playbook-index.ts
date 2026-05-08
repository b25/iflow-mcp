import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";

/**
 * Discovery helper: maps `.plans/*` scenario docs to MCP tool names (no network).
 */
export const iflowPlaybookIndexTool: Tool = {
  name: "iflow_playbook_index",
  description:
    "List scenario and planning tools (Phase 0 coverage, Scenariul 1 & 2 playbooks) and where they are documented in .plans/. No Api Point.",
  inputSchema: z.object({
    language: z.enum(["ro", "en"]).optional().default("ro"),
  }),
  execute: async ({ language }): Promise<MCPToolResult> => {
    const structuredContent = {
      scenario_and_planning_tools: [
        {
          tool: "product_scenarios_phase0",
          plans: [".plans/product-scenarios.md section B1"],
          summary:
            "Maps 35 frequent questions to registered MCP tools; reports coverage gaps.",
        },
        {
          tool: "scenariul_1",
          plans: [".plans/Scenariul_1.txt", ".plans/product-scenarios.md section C"],
          summary:
            "Unde pierdem bani? playbook; analyze_all / analyze_perspective → analyze_* tools.",
        },
        {
          tool: "scenariul_2",
          plans: [".plans/Scenariul_2.txt", ".plans/product-scenarios.md section D"],
          summary:
            "De ce nu mai merge ca înainte? playbook; diagnose → diff_diagnose.",
        },
        {
          tool: "health",
          plans: [],
          summary: "Configured Api Point keys and IFLOW_READ_ONLY (no UUID values).",
        },
      ],
      analyst_orchestration: [
        { tool: "where_are_we_losing_money", summary: "Runs all 8 analyze_* perspectives." },
        { tool: "diff_diagnose", summary: "Scenario 2 metric drift + events (needs Api Points)." },
      ],
      further_reading: [
        ".plans/product-scenarios.md",
        ".plans/architecture.md",
        ".plans/vision.md",
      ],
    };

    const text =
      language === "en"
        ? "Scenario/planning tool index — see structuredContent.scenario_and_planning_tools."
        : "Index tool-uri scenarii / planificare — vezi structuredContent.scenario_and_planning_tools.";

    return {
      content: [{ type: "text", text }],
      structuredContent,
    };
  },
};
