import { z } from "zod";
import { Tool, MCPToolResult, AnalystResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { applyAnalystHygiene, normalizeAnalystResult } from "./hygiene.js";

function createPerspectiveTool(
  name: string,
  description: string,
  apiPointKey: string
): Tool {
  return {
    name,
    description,
    inputSchema: z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      language: z.enum(["ro", "en"]).optional().default("ro"),
    }),
    execute: async ({ from, to, language }): Promise<MCPToolResult<AnalystResult>> => {
      const query: Record<string, string> = {};
      if (from) query.from = from;
      if (to) query.to = to;
      if (language) query.language = language;
      const data = await iflowClient.fetch<Partial<AnalystResult>>(
        apiPointKey,
        "GET",
        undefined,
        {
          query: Object.keys(query).length ? query : undefined,
        }
      );
      const normalized = normalizeAnalystResult(data, apiPointKey);
      return applyAnalystHygiene(normalized, { language });
    },
  };
}

export const analyzeExecutionLoss = createPerspectiveTool(
  "analyze_execution_loss",
  "Analyze losses in order execution (cost real vs estimated).",
  "analyze_execution_loss"
);

export const analyzeSalesFunnel = createPerspectiveTool(
  "analyze_sales_funnel",
  "Analyze sales funnel conversion rates.",
  "analyze_sales_funnel"
);

export const analyzeReceivablesRisk = createPerspectiveTool(
  "analyze_receivables_risk",
  "Analyze accounts receivable aging and payment risk.",
  "analyze_receivables_risk"
);

export const analyzeStockHealth = createPerspectiveTool(
  "analyze_stock_health",
  "Analyze dead-stock, ruptures, and over-stock.",
  "analyze_stock_health"
);

export const analyzeSupplierDrift = createPerspectiveTool(
  "analyze_supplier_drift",
  "Analyze supplier price drift over time.",
  "analyze_supplier_drift"
);

export const analyzeWorkflowEfficiency = createPerspectiveTool(
  "analyze_workflow_efficiency",
  "Analyze workflow bottlenecks and stage durations.",
  "analyze_workflow_efficiency"
);

export const analyzeCustomerHealth = createPerspectiveTool(
  "analyze_customer_health",
  "Analyze customer churn signals.",
  "analyze_customer_health"
);

export const analyzeCorrectionCosts = createPerspectiveTool(
  "analyze_correction_costs",
  "Analyze costs from errors and corrections. Returns findings plus structuredContent.report (summary + top orders/clients/storno tables).",
  "analyze_correction_costs"
);
