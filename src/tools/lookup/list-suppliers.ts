import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const tagIds = z.union([z.array(z.number().int().positive()), z.string()]).optional();

export const listSuppliersTool: Tool = {
  name: "list_suppliers",
  description:
    "Search/list ProductProvider entries. Filters: q (name/code/tax_code), tag_ids, is_active (ignored — providers have no soft-delete flag), limit, offset.",
  inputSchema: z.object({
    q: z.string().optional(),
    tag_ids: tagIds,
    is_active: z.boolean().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    if (args.q) q.q = args.q;
    if (Array.isArray(args.tag_ids)) q.tag_ids = (args.tag_ids as number[]).join(",");
    else if (typeof args.tag_ids === "string") q.tag_ids = args.tag_ids;
    if (args.is_active != null) q.is_active = args.is_active;
    if (args.limit != null) q.limit = args.limit;
    if (args.offset != null) q.offset = args.offset;
    const result = await iflowClient.fetch<{ results?: unknown[]; count?: number }>(
      "list_suppliers",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} supplier(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
