import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const tagIds = z.union([z.array(z.number().int().positive()), z.string()]).optional();

function tagIdsToParam(value: number[] | string | undefined): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value.join(",");
  return value;
}

export const listPartnersTool: Tool = {
  name: "list_partners",
  description:
    "List partners (clients + providers). Filters: type (client/provider/both), q, tag_ids, is_active, limit, offset.",
  inputSchema: z.object({
    type: z.enum(["client", "provider", "supplier", "both"]).optional(),
    q: z.string().optional(),
    tag_ids: tagIds,
    is_active: z.boolean().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    if (args.type) q.type = args.type;
    if (args.q) q.q = args.q;
    const tags = tagIdsToParam(args.tag_ids as number[] | string | undefined);
    if (tags) q.tag_ids = tags;
    if (args.is_active != null) q.is_active = args.is_active;
    if (args.limit != null) q.limit = args.limit;
    if (args.offset != null) q.offset = args.offset;
    const result = await iflowClient.fetch<{ results?: unknown[] }>(
      "list_partners",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Found ${result.results?.length ?? 0} partner(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const listOverdueCustomersTool: Tool = {
  name: "list_overdue_customers",
  description:
    "Customers with overdue balances. Filters: limit, offset, min_sold, tag_ids.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
    min_sold: z.number().nonnegative().optional(),
    tag_ids: tagIds,
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {};
    if (args.limit != null) q.limit = args.limit;
    if (args.offset != null) q.offset = args.offset;
    if (args.min_sold != null) q.min_sold = args.min_sold;
    const tags = tagIdsToParam(args.tag_ids as number[] | string | undefined);
    if (tags) q.tag_ids = tags;
    const result = await iflowClient.fetch<{ results?: unknown[] }>(
      "list_overdue_customers",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Found ${result.results?.length ?? 0} overdue customer(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
