import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listClientDiscountsTool: Tool = {
  name: "list_client_discounts",
  description:
    "A client's negotiated discounts / special prices (per product, subcategory, " +
    "category, or client level): discount type (percentage/fixed/final price), value, " +
    "currency. Pass product_id to also resolve the BEST applicable discount + indicative " +
    "net price for that product (e.g. 'what discount does Paragon have on NAZDAR 759 BLACK 5L?').",
  inputSchema: z.object({
    client_id: z.number().int().positive(),
    product_id: z.number().int().positive().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = { client_id: args.client_id };
    if (args.product_id != null) q.product_id = args.product_id;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_client_discounts", "GET", undefined, { query: q }
    );
    const ok = result.ok !== false;
    const n = typeof result.rules_count === "number" ? result.rules_count : 0;
    return {
      content: [{ type: "text", text: ok ? `Client discount rules: ${n}.`
        : `Failed: ${String(result.error ?? "unknown")}.` }],
      structuredContent: result,
      isError: result.ok === false,
    };
  },
};
