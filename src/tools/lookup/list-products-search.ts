import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listProductsSearchTool: Tool = {
  name: "list_products_search",
  description:
    "Search products with filters: q (name/code/alias), category_id, subcategory_id, provider_id, low_stock_only, is_super, limit, offset. For 'products below stock minim' pass low_stock_only=true. Pass is_super=true for only super (composite) products, false for only simple ones. Each row carries is_super_product; use get_product_composition to expand a super product's recipe.",
  inputSchema: z.object({
    q: z.string().optional(),
    category_id: z.number().int().positive().optional(),
    subcategory_id: z.number().int().positive().optional(),
    provider_id: z.number().int().positive().optional(),
    low_stock_only: z.boolean().optional(),
    is_super: z.boolean().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<{ results?: unknown[]; count?: number }>(
      "list_products_search",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} product(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
