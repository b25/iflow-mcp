import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

function mergeQuery(args: Record<string, unknown>): Record<string, string | number | boolean> {
  const q: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) q[k] = (v as unknown[]).join(",");
    else q[k] = v as string | number | boolean;
  }
  return q;
}

export const lostOffersBreakdownTool: Tool = {
  name: "lost_offers_breakdown",
  description:
    "Breakdown of lost offers grouped by motiv_refuz. Optional filters: from/to (on start_date), client_id.",
  inputSchema: z.object({
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    client_id: z.number().int().positive().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{ results?: unknown[] }>(
      "lost_offers_breakdown",
      "GET",
      undefined,
      { query: mergeQuery(args) }
    );
    return {
      content: [{ type: "text", text: `Lost offers reasons: ${result.results?.length ?? 0}.` }],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const topAgentsTool: Tool = {
  name: "top_agents",
  description: "Top agents by order count (default 20). Optional filters: from/to, flow_id.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(200).optional(),
    flow_id: z.number().int().positive().optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{ results?: unknown[] }>(
      "top_agents",
      "GET",
      undefined,
      { query: mergeQuery(args) }
    );
    return {
      content: [{ type: "text", text: `Top agents: ${result.results?.length ?? 0}.` }],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const procurementTodayTool: Tool = {
  name: "procurement_today",
  description:
    "Procurement / reorder signals. Optional filters: category_id, provider_id, limit, offset.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
    category_id: z.number().int().positive().optional(),
    provider_id: z.number().int().positive().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{ results?: unknown[]; count?: number }>(
      "procurement_today",
      "GET",
      undefined,
      { query: mergeQuery(args) }
    );
    return {
      content: [
        {
          type: "text",
          text: `Products below stock minim: ${result.count ?? result.results?.length ?? 0}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const ordersByStageTool: Tool = {
  name: "orders_by_stage",
  description:
    "Order counts by workflow stage (status). Optional filters: flow_id, from/to, include_finished.",
  inputSchema: z.object({
    flow_id: z.number().int().positive().optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    include_finished: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{ results?: unknown[] }>(
      "orders_by_stage",
      "GET",
      undefined,
      { query: mergeQuery(args) }
    );
    return {
      content: [{ type: "text", text: `Stages with orders: ${result.results?.length ?? 0}.` }],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const orderDelayDiagnosisTool: Tool = {
  name: "order_delay_diagnosis",
  description:
    "Late open orders, listed with details. Optional filters: flow_id, client_id, limit.",
  inputSchema: z.object({
    flow_id: z.number().int().positive().optional(),
    client_id: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(500).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{
      late_open_orders?: number;
      results?: unknown[];
    }>("order_delay_diagnosis", "GET", undefined, { query: mergeQuery(args) });
    return {
      content: [
        {
          type: "text",
          text: `Late open orders: ${result.late_open_orders ?? result.results?.length ?? 0}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const dailyActivitySummaryTool: Tool = {
  name: "daily_activity_summary",
  description:
    "Recent activity summary. Optional filters: period_days (1-90), action_type, module.",
  inputSchema: z.object({
    period_days: z.number().int().min(1).max(90).optional(),
    action_type: z.number().int().nonnegative().optional(),
    module: z.string().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{ total_events?: number }>(
      "daily_activity_summary",
      "GET",
      undefined,
      { query: mergeQuery(args) }
    );
    return {
      content: [
        { type: "text", text: `Activity events: ${String(result.total_events ?? 0)}.` },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const cashflowSummaryTool: Tool = {
  name: "cashflow_summary",
  description: "Cashflow summary. Optional filters: from/to, currency.",
  inputSchema: z.object({
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    currency: z.string().min(2).max(8).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{
      invoiced_total?: number;
      document_entries_total?: number;
      currency?: string;
    }>("cashflow_summary", "GET", undefined, { query: mergeQuery(args) });
    return {
      content: [
        {
          type: "text",
          text: `Invoiced ${result.invoiced_total ?? 0} vs spent ${result.document_entries_total ?? 0} ${result.currency ?? ""}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
