import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDate = z.string().min(8);
const isoDateTime = z.string().min(8);
const tagIds = z.union([z.array(z.number().int().positive()), z.string()]).optional();

function flatten(args: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) out[k] = v.map(String).join(",");
    else out[k] = v as string | number | boolean;
  }
  return out;
}

async function runReport(
  key: string,
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  const result = await iflowClient.fetch<{ count?: number; results?: unknown[] }>(
    key,
    "GET",
    undefined,
    { query: flatten(args) }
  );
  const count =
    typeof result.count === "number"
      ? result.count
      : Array.isArray(result.results)
        ? result.results.length
        : 0;
  return {
    content: [{ type: "text", text: `${key}: ${count} row(s).` }],
    structuredContent: result as Record<string, unknown>,
  };
}

export const reportSalesTool: Tool = {
  name: "report_sales",
  description:
    "Detailed sales report by order item lines (mirrors /report/sales/). Filters: from/to, order_finished (finished|in_progress|late), client_id, product_id, category_id, flow_id, employee_id, stage_id, tag_ids, ignore_manufacture, q, limit, offset.",
  inputSchema: z.object({
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    order_finished: z.enum(["finished", "in_progress", "late"]).optional(),
    client_id: z.number().int().positive().optional(),
    product_id: z.number().int().positive().optional(),
    category_id: z.number().int().positive().optional(),
    flow_id: z.number().int().positive().optional(),
    employee_id: z.number().int().positive().optional(),
    stage_id: z.number().int().positive().optional(),
    tag_ids: tagIds,
    ignore_manufacture: z.boolean().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: (args) => runReport("report_sales", args as Record<string, unknown>),
};

export const reportProfitTool: Tool = {
  name: "report_profit",
  description:
    "Monthly profit aggregation for selected years (mirrors /report/profit/). Args: years (csv or array), ignore_manufacture.",
  inputSchema: z.object({
    years: z
      .union([z.array(z.number().int().min(2000).max(2100)), z.string()])
      .optional(),
    ignore_manufacture: z.boolean().optional(),
  }),
  execute: (args) => runReport("report_profit", args as Record<string, unknown>),
};

export const reportTotalSalesTool: Tool = {
  name: "report_total_sales",
  description:
    "Aggregated sales per client (mirrors /report/total_sales/). Filters: from/to, client_id (csv/array), flow_id, client_status (active|inactive|new), district, locality, limit, offset.",
  inputSchema: z.object({
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    client_id: z
      .union([z.array(z.number().int().positive()), z.string()])
      .optional(),
    flow_id: z.number().int().positive().optional(),
    client_status: z.enum(["active", "inactive", "new"]).optional(),
    district: z.string().optional(),
    locality: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: (args) => runReport("report_total_sales", args as Record<string, unknown>),
};

export const reportQuantityTool: Tool = {
  name: "report_quantity",
  description:
    "Quantities sold per product over a period (mirrors /report/quantity/). Filters: from/to, product_id, provider_id, category_id, subcategory_id, administration_id, limit, offset.",
  inputSchema: z.object({
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    product_id: z.number().int().positive().optional(),
    provider_id: z.number().int().positive().optional(),
    category_id: z.number().int().positive().optional(),
    subcategory_id: z.number().int().positive().optional(),
    administration_id: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: (args) => runReport("report_quantity", args as Record<string, unknown>),
};

export const reportEmployeeTool: Tool = {
  name: "report_employee",
  description:
    "Per-employee productivity (orders). Args: date (YYYY-MM-DD or YYYY-MM), type (daily|monthly), department_id, employee_id, action, client_id, flow_type (orders|tasks).",
  inputSchema: z.object({
    date: z.string().optional(),
    type: z.enum(["daily", "monthly"]).optional(),
    department_id: z.number().int().positive().optional(),
    employee_id: z.number().int().positive().optional(),
    action: z.string().optional(),
    client_id: z.number().int().positive().optional(),
    flow_type: z.enum(["orders", "tasks"]).optional(),
  }),
  execute: (args) => runReport("report_employee", args as Record<string, unknown>),
};

export const reportEquipmentsGanttTool: Tool = {
  name: "report_equipments_gantt",
  description:
    "Daily equipment Gantt snapshot (mirrors /report/equipments/). Args: date (YYYY-MM-DD).",
  inputSchema: z.object({
    date: z.string().optional(),
  }),
  execute: (args) =>
    runReport("report_equipments_gantt", args as Record<string, unknown>),
};

export const reportStockPurchasesTool: Tool = {
  name: "report_stock_purchases",
  description:
    "Stock purchases / DocumentEntries breakdown (mirrors /report/stock/). Filters: from/to, provider_id, document_type, entry_type, employee_id, tag_ids, product_id, administration_id, accounting_account, limit, offset.",
  inputSchema: z.object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    provider_id: z.number().int().positive().optional(),
    document_type: z.number().int().positive().optional(),
    entry_type: z.number().int().min(1).max(4).optional(),
    employee_id: z.number().int().positive().optional(),
    tag_ids: tagIds,
    product_id: z.number().int().positive().optional(),
    administration_id: z.number().int().positive().optional(),
    accounting_account: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: (args) =>
    runReport("report_stock_purchases", args as Record<string, unknown>),
};

export const reportDashboardCardTool: Tool = {
  name: "report_dashboard_card",
  description:
    "Single dashboard KPI card snapshot (mirrors /report/dashboard/data/). Cards: orders_in_progress, orders_to_invoice, oldest_unfinished_order, vat_estimate, cashflow, low_stock, top_agents, top_products_by_margin.",
  inputSchema: z.object({
    card: z.enum([
      "orders_in_progress",
      "orders_to_invoice",
      "oldest_unfinished_order",
      "vat_estimate",
      "cashflow",
      "low_stock",
      "top_agents",
      "top_products_by_margin",
    ]),
    daterange: z.string().optional(),
    previous_daterange: z.string().optional(),
    employee_id: z.number().int().positive().optional(),
  }),
  execute: (args) =>
    runReport("report_dashboard_card", args as Record<string, unknown>),
};

export const accountingPartnerBalanceTool: Tool = {
  name: "accounting_partner_balance",
  description:
    "Partner balance (client|provider) per month (mirrors /financial/partner-balance/). Args: year, month, type, currency.",
  inputSchema: z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    type: z.enum(["client", "provider"]).optional(),
    currency: z.string().min(2).max(8).optional(),
  }),
  execute: (args) =>
    runReport("accounting_partner_balance", args as Record<string, unknown>),
};

export const accountingInvoicesIssuedTool: Tool = {
  name: "accounting_invoices_issued",
  description:
    "Issued invoices summary per month (mirrors /financial/invoices/). Args: year, month, administration_id.",
  inputSchema: z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    administration_id: z.number().int().positive().optional(),
  }),
  execute: (args) =>
    runReport("accounting_invoices_issued", args as Record<string, unknown>),
};

export const accountingStockBalanceTool: Tool = {
  name: "accounting_stock_balance",
  description:
    "Stock balance per month (mirrors /financial/stock-balance/). Args: year, month, administration_id.",
  inputSchema: z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    administration_id: z.number().int().positive().optional(),
  }),
  execute: (args) =>
    runReport("accounting_stock_balance", args as Record<string, unknown>),
};

export const accountingIntrastatTool: Tool = {
  name: "accounting_intrastat",
  description:
    "Intrastat summary (imports / non-RO acquisitions) per month (mirrors /financial/intrastat/). Args: year, month.",
  inputSchema: z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
  }),
  execute: (args) =>
    runReport("accounting_intrastat", args as Record<string, unknown>),
};
