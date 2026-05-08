import { z } from "zod";
import { Tool, MCPToolResult, AnalystResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { applyAnalystHygiene } from "./hygiene.js";

interface MetricDrillResponse {
  delta_percent?: number;
  period_start?: string;
  period_end?: string;
  current_value?: number;
  baseline_value?: number;
  n_observations?: number;
  period_label?: string;
  comparison_period_label?: string;
  notes?: string[];
}

interface EventsResponse {
  results?: Array<{ entity_type?: string; change_type?: string }>;
}

export const diffDiagnoseTool: Tool = {
  name: "diff_diagnose",
  description:
    "Diagnose metric deviation vs baseline (requires diff_diagnose_metric + diff_diagnose_events Api Points).",
  inputSchema: z.object({
    metric: z.string(),
    entity_id: z.string().optional(),
    interval: z.enum(["day", "week", "month"]).default("week"),
    baseline: z.enum(["yoy", "median", "trend"]).default("yoy"),
    language: z.enum(["ro", "en"]).optional().default("ro"),
  }),
  execute: async ({
    metric,
    entity_id,
    interval,
    baseline,
    language,
  }): Promise<MCPToolResult<AnalystResult>> => {
    const metricData = await iflowClient.fetch<MetricDrillResponse>(
      "diff_diagnose_metric",
      "GET",
      undefined,
      {
        query: {
          metric,
          interval,
          baseline,
          ...(entity_id ? { entity_id } : {}),
        },
      }
    );

    const delta = metricData.delta_percent ?? 0;
    let causes: string[] = [];
    if (Math.abs(delta) > 15) {
      const events = await iflowClient.fetch<EventsResponse>("diff_diagnose_events", "GET", undefined, {
        query: {
          from: metricData.period_start ?? "",
          to: metricData.period_end ?? "",
        },
      });
      causes =
        events.results?.map(
          (e) => `${e.entity_type ?? "?"} changed: ${e.change_type ?? "?"}`
        ) ?? [];
    }

    const result: AnalystResult = {
      perspective: metric,
      findings: [
        {
          headline: `${metric} changed by ${delta}% vs ${baseline}`,
          severity: Math.abs(delta) > 30 ? "high" : "medium",
          evidence: {
            metric,
            current: metricData.current_value ?? 0,
            baseline: metricData.baseline_value ?? 0,
            delta_pct: delta,
            n_observations: metricData.n_observations ?? 0,
            period_label: metricData.period_label ?? "",
            comparison_period_label: metricData.comparison_period_label ?? "",
          },
          hypothesis:
            causes.length > 0
              ? {
                  causes: causes.slice(0, 3),
                  confidence: "medium",
                }
              : undefined,
          drill_down_tools: ["analyze_workflow_efficiency"],
        },
      ],
      suppressed_count: 0,
      baseline_method: baseline,
      methodology_notes: metricData.notes ?? [],
    };

    return applyAnalystHygiene(result, { language });
  },
};
