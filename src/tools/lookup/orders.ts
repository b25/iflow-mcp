import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z
  .string()
  .min(8)
  .describe("ISO 8601 datetime (e.g. 2026-01-01T00:00:00).");

export const countOrdersInProgressTool: Tool = {
  name: "count_orders_in_progress",
  description:
    "Count orders currently in progress (KPI). Optional filters: flow_id, client_id, from/to on date_order.",
  inputSchema: z.object({
    flow_id: z.number().int().positive().optional(),
    client_id: z.number().int().positive().optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {};
    if (args.flow_id != null) q.flow_id = args.flow_id;
    if (args.client_id != null) q.client_id = args.client_id;
    if (args.from) q.from = args.from;
    if (args.to) q.to = args.to;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "count_orders_in_progress",
      "GET",
      undefined,
      { query: q }
    );
    const count = typeof result.count === "number" ? result.count : result.results;
    return {
      content: [
        {
          type: "text",
          text: `Orders in progress: ${String(count ?? JSON.stringify(result))}.`,
        },
      ],
      structuredContent: result,
    };
  },
};

export const listOrdersToInvoiceTool: Tool = {
  name: "list_orders_to_invoice",
  description:
    "List orders ready to invoice. Optional filters: client_id, from/to on date_order, order_by, limit, offset.",
  inputSchema: z.object({
    client_id: z.number().int().positive().optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    order_by: z
      .enum([
        "date_order_desc",
        "date_order_asc",
        "id_desc",
        "id_asc",
        "total_amount_desc",
        "total_amount_asc",
      ])
      .optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {};
    if (args.client_id != null) q.client_id = args.client_id;
    if (args.from) q.from = args.from;
    if (args.to) q.to = args.to;
    if (args.order_by) q.order_by = args.order_by;
    if (args.limit != null) q.limit = args.limit;
    if (args.offset != null) q.offset = args.offset;
    const result = await iflowClient.fetch<{
      results?: unknown[];
      count?: number;
    }>("list_orders_to_invoice", "GET", undefined, { query: q });
    const n = result.results?.length ?? result.count ?? 0;
    return {
      content: [{ type: "text", text: `Found ${n} order(s) to invoice.` }],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const oldestUnfinishedOrderTool: Tool = {
  name: "oldest_unfinished_order",
  description: "Get the oldest unfinished order (dedicated Api Point).",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "oldest_unfinished_order",
      "GET"
    );
    const num = result.number ?? result.id ?? "";
    return {
      content: [
        {
          type: "text",
          text: result.uuid
            ? `Oldest unfinished order: ${String(num)}.`
            : "No unfinished orders found.",
        },
      ],
      structuredContent: result,
    };
  },
};
