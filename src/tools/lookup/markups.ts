import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listMarkupsTool: Tool = {
  name: "list_markups",
  description:
    "List the markup ('adaos') rules available for product sale-price " +
    "construction. NOTE: markup is NOT modelled per category/subcategory in " +
    "this system; the rules are the distinct PriceAddition percentages that " +
    "products reference per business tier. Each row has nivel, id, nume, " +
    "adaos_procent and produse_count (how many products use that percent). " +
    "Filters: q (matches the percent text), limit, offset. Response: " +
    "{results, count, next_offset, filters, nivel_note}. See " +
    "get_product_pricing for the resulting sale price + margin of a product.",
  inputSchema: z.object({
    q: z.string().optional(),
    limit: z.number().int().positive().optional(),
    offset: z.number().int().nonnegative().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_markups", "GET", undefined, { query: q }
    );
    const count =
      typeof result.count === "number" ? (result.count as number) : 0;
    return {
      content: [{ type: "text", text: `Found ${count} markup rule(s).` }],
      structuredContent: result,
      isError: false,
    };
  },
};
