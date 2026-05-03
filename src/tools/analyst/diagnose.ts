import { z } from "zod";
import { Tool, MCPToolResult, AnalystResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const diffDiagnoseTool: Tool = {
  name: "diff_diagnose",
  description: "Diagnose a metric deviation using time-series, baseline, and change logs.",
  inputSchema: z.object({
    metric: z.string(),
    entity_id: z.string().optional(),
    interval: z.enum(["day", "week", "month"]).default("week"),
    baseline: z.enum(["yoy", "median", "trend"]).default("yoy"),
  }),
  execute: async ({ metric, entity_id, interval, baseline }): Promise<MCPToolResult<AnalystResult>> => {
    // 1. Get metric + baseline (K4.1 + K4.6)
    const entityParam = entity_id ? `&entity=${entity_id}` : "";
    const metricData = await iflowClient.fetch(
      `analytics/metrics/${metric}?interval=${interval}&baseline=${baseline}${entityParam}`, 
      "GET"
    );

    // 2. If significant deviation, check change logs (K4.2)
    let causes: string[] = [];
    if (Math.abs(metricData.delta_percent) > 15) {
      const events = await iflowClient.fetch(
        `analytics/events?from=${metricData.period_start}&to=${metricData.period_end}`,
        "GET"
      );
      causes = events.results.map((e: any) => `${e.entity_type} changed: ${e.change_type}`);
    }

    const result: AnalystResult = {
      perspective: metric,
      findings: [{
        headline: `${metric} changed by ${metricData.delta_percent}% vs ${baseline}`,
        severity: Math.abs(metricData.delta_percent) > 30 ? "high" : "medium",
        evidence: {
          metric,
          current: metricData.current_value,
          baseline: metricData.baseline_value,
          delta_pct: metricData.delta_percent,
          n_observations: metricData.n_observations,
          period_label: metricData.period_label,
          comparison_period_label: metricData.comparison_period_label,
        },
        hypothesis: causes.length > 0 ? {
          causes: causes.slice(0, 3),
          confidence: "medium",
        } : undefined,
        drill_down_tools: ["analyze_workflow_efficiency"],
      }],
      suppressed_count: 0,
      baseline_method: baseline,
      methodology_notes: metricData.notes || [],
    };

    return {
      content: [
        {
          type: "text",
          text: `Analysis for ${metric}: ${result.findings[0].headline}.`,
        },
      ],
      structuredContent: result,
    };
  },
};
