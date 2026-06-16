import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listProductionHandoversTool: Tool = {
  name: "list_production_handovers",
  description:
    "Production handovers ('Note de predare productie', ReceiptNote) - finished " +
    "goods handed over against an order, distinct from NIR (DocumentEntries), " +
    "stock movements (StockHistory) and consumption vouchers (OrderTicket). Each " +
    "row: numar, serie, data, comanda (linked order id+number), produse (handed " +
    "lines: product_id, nume, cantitate, um), predat_de (handed-by/Predator " +
    "id+nume), primit_de (received-by/Primitor id+nume), status (1 Partial,2 " +
    "Finalizat) + status_label. Ordered latest-first. Filter order=<order number " +
    "or id> to answer 'are comanda X nota de predare'. " +
    "Filters: from/to (date), order, product, employee_id, status " +
    "(PARTIAL/COMPLETED), q.",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    order: z.union([z.number().int(), z.string()]).optional(),
    product: z.number().int().positive().optional(),
    employee_id: z.number().int().positive().optional(),
    status: z.union([z.number().int(), z.string()]).optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["from","to","order","product","employee_id","status","q",
                     "limit","offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_production_handovers", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Production handovers (note de predare): ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
