import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listShipmentsTool: Tool = {
  name: "list_shipments",
  description:
    "Courier shipments (AWB) across Fan Courier and GLS deliveries. Each row: " +
    "awb (number), curier (FAN Courier/GLS), comanda (linked order id+number, " +
    "or null), client (id+nume), adresa_livrare, status (coarse tag GENERAT/" +
    "PRELUAT/IN_TRANZIT/LIVRAT/RETUR/ANULAT/NECUNOSCUT + RO label), " +
    "data_ultimei_actualizari, nr_colete, greutate, ramburs (COD value+" +
    "currency, or null), data_generarii, cost_transport (value+currency, or " +
    "null), tracking_url, autor. Ordered latest-first. meta.counts_by_status " +
    "gives per-status counts across the full filtered set (e.g. how many 'In " +
    "tranzit'). Filter order=<order number or id> to answer 'are comanda X " +
    "AWB / expeditie'. Filters: from/to (AWB generation date), status (tag, " +
    "RO label or Fan code e.g. S2), courier (FAN/GLS), order, client_id, q " +
    "(awb/recipient/order number).",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    status: z.string().optional(),
    courier: z.string().optional(),
    order: z.union([z.number().int(), z.string()]).optional(),
    client_id: z.number().int().positive().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["from","to","status","courier","order","client_id","q",
                     "limit","offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_shipments", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Courier shipments (AWB): ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
