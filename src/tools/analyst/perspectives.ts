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

// ---------------------------------------------------------------------------
// Expansion analyst tools (ported to TS for Django<->TS registry parity).
// All follow the standard findings/report perspective shape.
// ---------------------------------------------------------------------------

export const analyzeCashConversionCycle = createPerspectiveTool(
  "analyze_cash_conversion_cycle",
  "Cash conversion cycle (DIO+DSO-DPO): how long cash is tied up in operations.",
  "analyze_cash_conversion_cycle"
);

export const analyzeCohortRetention = createPerspectiveTool(
  "analyze_cohort_retention",
  "Customer retention by monthly cohorts (repeat orders at +1/+2/+3 months).",
  "analyze_cohort_retention"
);

export const analyzeCustomerClv = createPerspectiveTool(
  "analyze_customer_clv",
  "Estimated customer lifetime value (CLV) and active probability per customer (pragmatic estimate).",
  "analyze_customer_clv"
);

export const analyzeCustomerCreditRisk = createPerspectiveTool(
  "analyze_customer_credit_risk",
  "Behavioral credit-risk score per customer (balance age, overdue, blocking). Not Altman Z.",
  "analyze_customer_credit_risk"
);

export const analyzeCustomerProfitability = createPerspectiveTool(
  "analyze_customer_profitability",
  "Net profit per customer (margin minus cancellations and credit cost).",
  "analyze_customer_profitability"
);

export const analyzeCustomerRfm = createPerspectiveTool(
  "analyze_customer_rfm",
  "Customer segmentation by Recency/Frequency/Monetary (RFM).",
  "analyze_customer_rfm"
);

export const analyzeDeadStock = createPerspectiveTool(
  "analyze_dead_stock",
  "Dead stock with no movement and the capital it ties up.",
  "analyze_dead_stock"
);

export const analyzeInventoryAbc = createPerspectiveTool(
  "analyze_inventory_abc",
  "A/B/C product classification by revenue contribution (Pareto).",
  "analyze_inventory_abc"
);

export const analyzeInventoryOptimization = createPerspectiveTool(
  "analyze_inventory_optimization",
  "Recommended order quantity (EOQ) and reorder point with safety stock per product.",
  "analyze_inventory_optimization"
);

export const analyzeInventoryXyz = createPerspectiveTool(
  "analyze_inventory_xyz",
  "ABC (value) x XYZ (demand variability) inventory matrix.",
  "analyze_inventory_xyz"
);

export const analyzeMarginBridge = createPerspectiveTool(
  "analyze_margin_bridge",
  "Profit variance vs previous period decomposed into volume, price and cost effects.",
  "analyze_margin_bridge"
);

export const analyzePayables = createPerspectiveTool(
  "analyze_payables",
  "Supplier payment terms (DPO) and overdue payables.",
  "analyze_payables"
);

export const analyzeReceivablesAging = createPerspectiveTool(
  "analyze_receivables_aging",
  "Outstanding balance split into aging bands with DSO.",
  "analyze_receivables_aging"
);

export const analyzeRevenueConcentration = createPerspectiveTool(
  "analyze_revenue_concentration",
  "Revenue concentration across customers and products (HHI index).",
  "analyze_revenue_concentration"
);
