import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listEtransportTool: Tool = {
  name: "list_etransport",
  description:
    "RO e-Transport declarations (cod UIT, ETransportData) - the ANAF " +
    "road-transport notifications. Each row: cod_uit, status (NETRIMISA/" +
    "IN_PROCESARE/VALIDATA/EROARE/PRIMITA + RO label), data_generarii " +
    "(transport date), valabilitate (UIT validity), comanda (linked order " +
    "id+number, when resolvable), aviz (delivery-note id+numar), client " +
    "(id+nume matched by CIF), transport (transportator, nr_inmatriculare, " +
    "plecare/sosire), mesaj_respingere (ANAF errors), autor. Ordered " +
    "latest-first. Filter order=<order number or id> to answer 'are comanda " +
    "X e-Transport / cod UIT'. Filters: from/to (generation date), status " +
    "(token or RO label), order, client_id, q (cod UIT/partner/plate).",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    status: z.string().optional(),
    order: z.union([z.number().int(), z.string()]).optional(),
    client_id: z.number().int().positive().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["from","to","status","order","client_id","q",
                     "limit","offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_etransport", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `e-Transport (cod UIT): ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
