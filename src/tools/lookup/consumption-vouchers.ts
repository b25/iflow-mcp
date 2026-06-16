import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listConsumptionVouchersTool: Tool = {
  name: "list_consumption_vouchers",
  description:
    "Consumption vouchers ('Bonuri de consum', OrderTicket) - materials " +
    "consumed against an order, distinct from NIR (DocumentEntries) and stock " +
    "movements (StockHistory). Each row: numar, serie, data, comanda (linked " +
    "order id+number), gestiune (warehouse id+nume, derived from " +
    "product.administration), utilizator_id+utilizator_nume, valoare+currency, " +
    "status (1 Partial,2 Finalizat) + status_label, produse (consumed lines: " +
    "product_id, nume, cantitate, um). Ordered latest-first. Filter order=<order " +
    "number or id> to answer 'are comanda X bon de consum'. " +
    "Filters: from/to (date), order, product (consumed material id), " +
    "employee_id, q.",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    order: z.union([z.number().int(), z.string()]).optional(),
    product: z.number().int().positive().optional(),
    employee_id: z.number().int().positive().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["from","to","order","product","employee_id","q",
                     "limit","offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_consumption_vouchers", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Consumption vouchers (bonuri de consum): ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
