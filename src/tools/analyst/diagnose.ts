import { z } from "zod";
import { Tool, MCPToolResult, AnalystResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { applyAnalystHygiene } from "./hygiene.js";

interface MetricTopDriver {
  dimension?: string;
  id?: number;
  name?: string;
  current?: number;
  baseline?: number;
  delta?: number;
}

interface MetricDrillResponse {
  metric?: string;
  interval?: string;
  baseline?: string;
  entity_id?: number | null;
  delta_percent?: number;
  period_start?: string;
  period_end?: string;
  current_value?: number;
  baseline_value?: number;
  n_observations?: number;
  period_label?: string;
  comparison_period_label?: string;
  top_drivers?: MetricTopDriver[];
  notes?: string[];
}

interface EventsResponse {
  results?: Array<{ entity_type?: string; change_type?: string }>;
}

const SUPPORTED_METRICS = [
  "orders",
  "revenue",
  "gross_profit",
  "offers_won",
  "late_orders",
] as const;

export const diffDiagnoseTool: Tool = {
  name: "diff_diagnose",
  description:
    "Diagnose metric deviation vs baseline. Whitelisted metrics: orders, revenue, gross_profit, offers_won, late_orders. Honors interval (day/week/month/quarter), baseline (prev_period/yoy), entity_id. Shows top_drivers.",
  inputSchema: z.object({
    metric: z.enum(SUPPORTED_METRICS).default("orders"),
    entity_id: z.number().int().positive().optional(),
    interval: z.enum(["day", "week", "month", "quarter"]).default("week"),
    baseline: z.enum(["prev_period", "yoy"]).default("prev_period"),
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
          ...(entity_id != null ? { entity_id } : {}),
        },
      }
    );

    const delta = metricData.delta_percent ?? 0;
    const drivers = metricData.top_drivers ?? [];
    let causes: string[] = drivers.slice(0, 5).map((d) => {
      const id = d.id != null ? ` (#${d.id})` : "";
      return `${d.name ?? d.dimension ?? "?"}${id}: ${d.delta ?? 0}`;
    });

    if (Math.abs(delta) > 15 && causes.length === 0) {
      const events = await iflowClient.fetch<EventsResponse>(
        "diff_diagnose_events",
        "GET",
        undefined,
        {
          query: {
            from: metricData.period_start ?? "",
            to: metricData.period_end ?? "",
          },
        }
      );
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
                  causes: causes.slice(0, 5),
                  confidence: "medium",
                }
              : undefined,
          drill_down_tools: ["analyze_workflow_efficiency", "list_orders"],
        },
      ],
      suppressed_count: 0,
      baseline_method: baseline,
      methodology_notes: metricData.notes ?? [],
    };

    return applyAnalystHygiene(result, { language });
  },
};
