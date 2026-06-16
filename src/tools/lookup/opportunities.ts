import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listOpportunitiesTool: Tool = {
  name: "list_opportunities",
  description:
    "Sales opportunities ('Vanzari -> Oportunitati', Opportunity): title, client, " +
    "status (0 Noua,1 Oferta,2 Comanda,3 Expirata,4 Oferta Acceptata,5 Oferta " +
    "Refuzata), work flow, responsible agent, estimated value, currency, dates and " +
    "validity, plus source (formular if it came from a marketing form, else manual). " +
    "Ordered latest-first by creation date. Filters: status (machine value or RO " +
    "label like 'Noua'), from/to (creation date), client_id, flux_id, agent_id, q " +
    "(title search). meta.counts_by_status reports the count per status across the " +
    "full filtered set (e.g. how many 'Noua').",
  inputSchema: z.object({
    status: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    client_id: z.number().int().positive().optional(),
    flux_id: z.number().int().positive().optional(),
    agent_id: z.number().int().positive().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["status","from","to","client_id","flux_id","agent_id",
                     "q","limit","offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_opportunities", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Opportunities: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
