import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

function simpleGetTool(name: string, description: string): Tool {
  return {
    name,
    description,
    inputSchema: z.object({}),
    execute: async (): Promise<MCPToolResult> => {
      const result = await iflowClient.fetch<Record<string, unknown>>(name, "GET");
      return {
        content: [{ type: "text", text: `${name} completed.` }],
        structuredContent: result,
      };
    },
  };
}

/** Q19 — group by motiv_refuz (backend must implement). */
export const lostOffersBreakdownTool = simpleGetTool(
  "lost_offers_breakdown",
  "Breakdown of lost offers (e.g. by motiv_refuz)."
);

export const topAgentsTool = simpleGetTool(
  "top_agents",
  "Top agents / employee performance snapshot."
);

export const procurementTodayTool = simpleGetTool(
  "procurement_today",
  "Procurement / reorder signals for today."
);

export const ordersByStageTool = simpleGetTool(
  "orders_by_stage",
  "Order counts by workflow stage."
);

export const orderDelayDiagnosisTool = simpleGetTool(
  "order_delay_diagnosis",
  "Order delay diagnosis / drill-down (dedicated Api Point)."
);

export const hoursWorkedPerEmployeeTool = simpleGetTool(
  "hours_worked_per_employee",
  "Hours worked per employee (widget data)."
);

export const dailyActivitySummaryTool = simpleGetTool(
  "daily_activity_summary",
  "Recent activity summary."
);

export const cashflowSummaryTool = simpleGetTool(
  "cashflow_summary",
  "Cashflow / executive financial summary."
);
