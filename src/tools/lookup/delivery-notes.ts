import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listDeliveryNotesTool: Tool = {
  name: "list_delivery_notes",
  description:
    "Delivery notes ('Avize de insotire a marfii', DeliveryNote) - distinct from " +
    "invoices (FiscalBill) and stock entries (NIR). Each row: numar, serie, data, " +
    "client (id+nume), comanda (linked order id+number), status (1 Nefacturat,2 " +
    "Facturat,3 Aviz Retur,4 Restant,5 Anulata), valoare+currency, facturat_ulterior " +
    "(whether later invoiced), autor, produse (line count). Ordered latest-first. " +
    "Filter order=<order number or id> to answer 's-a facut aviz pentru comanda X'. " +
    "Filters: from/to (delivery date), client_id, order, status, q.",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    client_id: z.number().int().positive().optional(),
    order: z.union([z.number().int(), z.string()]).optional(),
    status: z.number().int().min(1).max(5).optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["from","to","client_id","order","status","q",
                     "limit","offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_delivery_notes", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Delivery notes (avize): ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
