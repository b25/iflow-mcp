import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listGeneratedDocumentsTool: Tool = {
  name: "list_generated_documents",
  description:
    "Generated typed documents (Documente -> Tipizate, 'Generate' tab, " +
    "PrintedFormGenerator): title, client, section (client|comanda|...), the " +
    "associated order number when sectiune=comanda (e.g. '#10153'), " +
    "generation date, sent (trimis) and signed (semnat) flags, the updated " +
    "datetime and the generating user. Signed rows include a 'semnatura' " +
    "detail block (data_semnarii, semnatar, email, data_generarii, " +
    "trimis_de). Ordered latest-first by generation date. Filters: from/to " +
    "(generation date), client_id, sectiune (client|comanda), trimis (bool), " +
    "semnat (bool), q (search in title).",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    client_id: z.number().int().optional(),
    sectiune: z.enum(["client", "comanda"]).optional(),
    trimis: z.boolean().optional(),
    semnat: z.boolean().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["from", "to", "client_id", "sectiune", "trimis",
                     "semnat", "q", "limit", "offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_generated_documents", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Generated documents: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
