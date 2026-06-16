import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listSupplierOrdersTool: Tool = {
  name: "list_supplier_orders",
  description:
    "Supplier purchase orders ('Comanda Furnizor') with product lines: number, date, " +
    "supplier, status (0 Noua,1 Livrata,2 In lucru,3 Incarcata,4 Trimisa,5 Anulata,6 " +
    "Intarziata,7 Partial), total, currency, delivery date, and line items. Ordered " +
    "latest-first. Filters: provider_id, status, from/to (order date), product_id, q.",
  inputSchema: z.object({
    provider_id: z.number().int().positive().optional(),
    status: z.number().int().min(0).max(7).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    product_id: z.number().int().positive().optional(),
    q: z.string().optional(),
    delivery_from: z.string().optional(),
    delivery_to: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["provider_id","status","from","to","product_id","q",
                     "delivery_from","delivery_to","limit","offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_supplier_orders", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Supplier orders: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
