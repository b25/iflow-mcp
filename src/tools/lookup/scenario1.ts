import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { registry } from "../registry.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  SCENARIO_1_PERSPECTIVES,
  SCENARIO_1_ENDPOINT_NOTES_RO,
} from "../../product-scenarios/scenariul-1.js";

/**
 * Executable wrapper for `.plans/Scenariul_1.txt`:
 * - playbook: structured spec (no iflow calls)
 * - analyze_all / analyze_perspective: delegates via registry (OAuth scopes enforced)
 */
export const scenariul1Tool: Tool = {
  name: "scenariul_1",
  description:
    "Scenario 1 — Unde pierdem bani? Playbook from .plans/Scenariul_1.txt, or run analyze_all / one perspective (1–8) via existing analyst tools.",
  inputSchema: z
    .object({
      action: z
        .enum(["playbook", "analyze_all", "analyze_perspective"])
        .optional()
        .default("playbook"),
      perspective: z.number().int().min(1).max(8).optional(),
      language: z.enum(["ro", "en"]).optional().default("ro"),
    })
    .superRefine((val, ctx) => {
      if (val.action === "analyze_perspective" && val.perspective === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "perspective is required (1–8) when action is analyze_perspective",
          path: ["perspective"],
        });
      }
    }),
  execute: async ({ action, perspective, language }): Promise<MCPToolResult> => {
    if (action === "playbook") {
      const intro =
        language === "en"
          ? "Scenario 1 playbook: 8 loss perspectives + endpoint design notes (source .plans/Scenariul_1.txt). Use action=analyze_all or analyze_perspective=1..8 to run MCP analyst tools (requires api-external + scopes)."
          : "Scenariul 1 — cele 8 perspective și notele de proiectare API sunt în structuredContent (sursă .plans/Scenariul_1.txt). Rulare: action=analyze_all sau analyze_perspective=1..8 (apeluri reale către iflow; verificați scope-uri).";

      return {
        content: [{ type: "text", text: intro }],
        structuredContent: {
          source_files: [
            ".plans/Scenariul_1.txt",
            ".plans/product-scenarios.md section C",
          ],
          perspectives: SCENARIO_1_PERSPECTIVES,
          endpoint_design_notes_ro: SCENARIO_1_ENDPOINT_NOTES_RO,
          analyze_tool_names_in_order: SCENARIO_1_PERSPECTIVES.map(
            (p) => p.mcpAnalyzeTool
          ),
        },
      };
    }

    if (action === "analyze_all") {
      return registry.executeTool("where_are_we_losing_money", { language });
    }

    const p = perspective!;
    const row = SCENARIO_1_PERSPECTIVES[p - 1];
    if (!row) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid perspective ${p}`);
    }
    return registry.executeTool(row.mcpAnalyzeTool, { language });
  },
};
