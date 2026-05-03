import { z } from "zod";
import { Tool, MCPToolResult, AnalystResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

function createPerspectiveTool(name: string, description: string, endpoint: string): Tool {
  return {
    name,
    description,
    inputSchema: z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    }),
    execute: async ({ from, to }): Promise<MCPToolResult<AnalystResult>> => {
      const query = (from && to) ? `?from=${from}&to=${to}` : "";
      const data = await iflowClient.fetch(endpoint + query, "GET");

      return {
        content: [
          {
            type: "text",
            text: `Analysis of ${name.replace("analyze_", "").replace("_", " ")} completed.`,
          },
        ],
        structuredContent: data,
      };
    },
  };
}

export const analyzeExecutionLoss = createPerspectiveTool(
  "analyze_execution_loss",
  "Analyze losses in order execution (cost real vs estimated).",
  "analytics/orders/cost-deltas"
);

export const analyzeSalesFunnel = createPerspectiveTool(
  "analyze_sales_funnel",
  "Analyze sales funnel conversion rates.",
  "analytics/sales-funnel"
);

export const analyzeReceivablesRisk = createPerspectiveTool(
  "analyze_receivables_risk",
  "Analyze accounts receivable aging and payment risk.",
  "analytics/receivables-aging"
);

export const analyzeStockHealth = createPerspectiveTool(
  "analyze_stock_health",
  "Analyze dead-stock, ruptures, and over-stock.",
  "analytics/stock-health"
);

export const analyzeSupplierDrift = createPerspectiveTool(
  "analyze_supplier_drift",
  "Analyze supplier price drift over time.",
  "analytics/suppliers/price-drift"
);

export const analyzeWorkflowEfficiency = createPerspectiveTool(
  "analyze_workflow_efficiency",
  "Analyze workflow bottlenecks and stage durations.",
  "analytics/workflow/bottlenecks"
);

export const analyzeCustomerHealth = createPerspectiveTool(
  "analyze_customer_health",
  "Analyze customer churn signals.",
  "analytics/clients/churn-signals"
);

export const analyzeCorrectionCosts = createPerspectiveTool(
  "analyze_correction_costs",
  "Analyze costs from errors and corrections (stornos).",
  "analytics/corrections-cost"
);
