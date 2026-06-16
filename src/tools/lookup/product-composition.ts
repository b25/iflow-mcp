import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const getProductCompositionTool: Tool = {
  name: "get_product_composition",
  description:
    "Recipe / bill-of-materials of a super (composite) product. Resolve a " +
    "product by product_id or cod (code). Returns is_super_product plus " +
    "componente: each component product_id, nume, cod, cantitate (qty per " +
    "unit), um, pret_unitar (unit cost), cost_linie (line cost), and " +
    "is_super_product (true if that component is itself a super product). " +
    "Also cost_total + valuta when all component costs are on file. A normal " +
    "product returns is_super_product=false with an empty componente list " +
    "(not an error); an unknown product_id/cod returns error.code " +
    "'product_not_found'. Components are expanded one level deep (depth 1).",
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
      "get_product_composition", "GET", undefined, { query: q }
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
    const isSuper = result.is_super_product === true;
    const componente = Array.isArray(result.componente)
      ? (result.componente as unknown[])
      : [];
    const text = isSuper
      ? `Super product with ${componente.length} component(s).`
      : "Not a super product.";
    return {
      content: [{ type: "text", text }],
      structuredContent: result,
      isError: false,
    };
  },
};
