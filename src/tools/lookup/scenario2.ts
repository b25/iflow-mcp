import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { registry } from "../registry.js";
import {
  SCENARIO_2_SOURCE_FILES,
  SCENARIO_2_FRAMEWORK_RO,
  SCENARIO_2_BASELINE_METHODS_RO,
  SCENARIO_2_BASELINE_TRANSPARENCY_RO,
  SCENARIO_2_MONITORING_GROUPS,
  SCENARIO_2_CAUSAL_CATEGORIES,
  SCENARIO_2_WORKED_EXAMPLE_RO,
  SCENARIO_2_IDEAL_NARRATIVE_RO,
  SCENARIO_2_QUALITY_CHALLENGES_RO,
  SCENARIO_2_ENDPOINT_NOTES_RO,
  SCENARIO_2_MCP_DIAGNOSE_TOOL,
} from "../../product-scenarios/scenariul-2.js";

/**
 * Executable wrapper for `.plans/Scenariul_2.txt` — comparative diagnostic.
 * - playbook: full spec (no iflow)
 * - diagnose: delegates to `diff_diagnose` (Api Points + scopes on inner tool)
 */
export const scenariul2Tool: Tool = {
  name: "scenariul_2",
  description:
    "Scenario 2 — De ce nu mai merge ca înainte? Playbook from .plans/Scenariul_2.txt, or action=diagnose to run diff_diagnose (metric + baseline yoy|median|trend).",
  inputSchema: z
    .object({
      action: z.enum(["playbook", "diagnose"]).optional().default("playbook"),
      metric: z.string().optional(),
      entity_id: z.string().optional(),
      interval: z.enum(["day", "week", "month"]).optional(),
      baseline: z.enum(["yoy", "median", "trend"]).optional(),
      language: z.enum(["ro", "en"]).optional().default("ro"),
    })
    .superRefine((val, ctx) => {
      if (val.action === "diagnose" && (!val.metric || val.metric.trim().length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "metric is required when action is diagnose",
          path: ["metric"],
        });
      }
    }),
  execute: async (args): Promise<MCPToolResult> => {
    const { action, language } = args;
    if (action === "playbook") {
      const intro =
        language === "en"
          ? "Scenario 2 playbook: comparative diagnostic (baseline + causal hypotheses + narrative). See structuredContent. Run action=diagnose with metric=... to call diff_diagnose."
          : "Scenariul 2 — diagnostic comparativ: baseline, ipoteze cauzale, narativ. Detalii în structuredContent. Rulare metrică: action=diagnose + metric=... (apel la diff_diagnose).";

      return {
        content: [{ type: "text", text: intro }],
        structuredContent: {
          source_files: SCENARIO_2_SOURCE_FILES,
          framework: SCENARIO_2_FRAMEWORK_RO,
          baseline_methods: SCENARIO_2_BASELINE_METHODS_RO,
          baseline_transparency: SCENARIO_2_BASELINE_TRANSPARENCY_RO,
          monitoring_dimensions: SCENARIO_2_MONITORING_GROUPS,
          causal_categories: SCENARIO_2_CAUSAL_CATEGORIES,
          worked_example: SCENARIO_2_WORKED_EXAMPLE_RO,
          ideal_narrative: SCENARIO_2_IDEAL_NARRATIVE_RO,
          quality_challenges: SCENARIO_2_QUALITY_CHALLENGES_RO,
          endpoint_design_notes_ro: SCENARIO_2_ENDPOINT_NOTES_RO,
          mcp_diagnose_tool: SCENARIO_2_MCP_DIAGNOSE_TOOL,
        },
      };
    }

    return registry.executeTool(SCENARIO_2_MCP_DIAGNOSE_TOOL, {
      metric: args.metric!,
      entity_id: args.entity_id,
      interval: args.interval ?? "week",
      baseline: args.baseline ?? "yoy",
      language,
    });
  },
};
