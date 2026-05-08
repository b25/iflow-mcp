import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { registry } from "../registry.js";
import { PHASE_0_B1 } from "../../product-scenarios/phase0-b1.js";

/**
 * Read-only coverage map for `.plans/product-scenarios.md` Phase 0 (35 questions).
 * Does not call iflow; compares planned tool names to the live registry.
 */
export const productScenariosPhase0Tool: Tool = {
  name: "product_scenarios_phase0",
  description:
    "Report which of the 35 frequent questions from .plans/product-scenarios.md (section B1) have a matching MCP tool registered in this server. No Api Point or network call.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const rows = PHASE_0_B1.map((row) => ({
      num: row.num,
      question_ro: row.questionRo,
      mcp_tool: row.mcpTool,
      backend_plan_status: row.backendPlanStatus,
      tool_registered: registry.getTool(row.mcpTool) !== undefined,
    }));
    const registered = rows.filter((r) => r.tool_registered).length;
    const missing = rows.filter((r) => !r.tool_registered).map((r) => r.mcp_tool);

    return {
      content: [
        {
          type: "text",
          text: `Faza 0 (35 întrebări): ${registered}/35 au un tool MCP înregistrat în acest server. Lipsește încă: ${missing.length ? missing.join(", ") : "nimic"}.`,
        },
      ],
      structuredContent: {
        source: ".plans/product-scenarios.md section B1",
        total_questions: PHASE_0_B1.length,
        tools_registered: registered,
        tools_missing: PHASE_0_B1.length - registered,
        missing_tool_names: missing,
        rows,
      },
    };
  },
};
