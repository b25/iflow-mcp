import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const getProductPricingTool: Tool = {
  name: "get_product_pricing",
  description:
    "Sale-price construction for one product (purchase -> markup/adaos -> " +
    "sale + margin). Resolve a product by product_id or cod (code). Returns " +
    "pret_achizitie (purchase cost) + valuta, adaos {procent, valoare, " +
    "sursa}, pret_vanzare (resulting sale price) and marja {valoare, " +
    "procent}, using the large business tier as the headline; all three " +
    "business tiers are also under tiers. pret_vanzare_calculat=true means " +
    "the sale price was computed (base cost * (1 + adaos/100)) rather than " +
    "read from a stored value. Markup is NOT modelled per category/" +
    "subcategory; it is a per-product PriceAddition percent, so adaos.sursa " +
    "is 'product_override' when set (null when the product has no markup). " +
    "This is the base price via markup, distinct from per-client negotiated " +
    "discounts (list_client_discounts). An unknown product_id/cod returns " +
    "error.code 'product_not_found'.",
  inputSchema: z.object({
    product_id: z.number().int().positive().optional(),
    cod: z.string().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "get_product_pricing", "GET", undefined, { query: q }
    );
    const err =
      result.error && typeof result.error === "object"
        ? (result.error as Record<string, unknown>)
        : null;
    if (err) {
      return {
        content: [
          { type: "text", text: `Failed: ${String(err.message ?? err.code)}.` },
        ],
        structuredContent: result,
        isError: true,
      };
    }
    const nume = result.nume ?? "";
    const sale = result.pret_vanzare;
    const text =
      sale !== null && sale !== undefined
        ? `Sale price for ${String(nume)}: ${String(sale)} ${String(
            result.valuta ?? ""
          )}.`
        : `Pricing for ${String(nume)} (sale price not available).`;
    return {
      content: [{ type: "text", text }],
      structuredContent: result,
      isError: false,
    };
  },
};
