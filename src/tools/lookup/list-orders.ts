import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

export const listOrdersTool: Tool = {
  name: "list_orders",
  description:
    "Search/list orders with filters: finished, status (NEW/IN_PROCESS/FINISHED/OUT_OF_STOCK/CANCEL), client_id, flow_id, from/to (date_order), delivery_from/delivery_to, q, order_by, limit, offset. Example: 'last 20 unfinished orders' -> {finished:false, limit:20, order_by:'date_order_desc'}.",
  inputSchema: z.object({
    finished: z.boolean().optional(),
    status: z
      .enum(["NEW", "IN_PROCESS", "FINISHED", "OUT_OF_STOCK", "CANCEL"])
      .optional(),
    client_id: z.number().int().positive().optional(),
    flow_id: z.number().int().positive().optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    delivery_from: isoDateTime.optional(),
    delivery_to: isoDateTime.optional(),
    q: z.string().optional(),
    order_by: z
      .enum([
        "date_order_desc",
        "date_order_asc",
        "delivery_date_desc",
        "delivery_date_asc",
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
    const q: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<{ results?: unknown[]; count?: number }>(
      "list_orders",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} order(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
