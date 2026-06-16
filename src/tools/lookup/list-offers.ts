import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

export const listOffersTool: Tool = {
  name: "list_offers",
  description:
    "Search/list offers with filters: client_id, employee_id (offer agent/owner), " +
    "department_id, status_id or status_tag (one of ACTIVE/ACCEPTED/REJECTED/EXPIRED/" +
    "OUT_OF_STOCK/ORDER/MORE_DETAILS/NEGOTIATION/POSTPONED), from/to (start_date), q, " +
    "order_by, limit, offset. Each row exposes agent_id/agent_nume (the offer's agent) " +
    "and a canonical status_tag.",
  inputSchema: z.object({
    client_id: z.number().int().positive().optional(),
    employee_id: z.number().int().positive().optional(),
    department_id: z.number().int().positive().optional(),
    status_id: z.number().int().positive().optional(),
    status_tag: z.string().optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    q: z.string().optional(),
    order_by: z
      .enum(["id_desc", "id_asc", "date_order_desc", "date_order_asc"])
      .optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null) q[k] = v as string | number;
    }
    const result = await iflowClient.fetch<{ results?: unknown[]; count?: number }>(
      "list_offers",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} offer(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
