import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listObjectivesTool: Tool = {
  name: "list_objectives",
  description:
    "Management objectives ('Management Obiective', Objective): denumire, tip " +
    "(automatizat/manual), status (activ, in_asteptare, ratat, finalizat), progres " +
    "(realizat/tinta/procent), responsabil, scop (individual/echipa), data limita " +
    "(termen) and zile_ramase (negative if past), plus contributii per user. " +
    "Ordered by data limita (end_date) descending. Filters: status (token like " +
    "'ratat' or RO label like 'In Asteptare'), responsabil (assigned employee id), " +
    "from/to (on data limita, e.g. last 3 months), q (name search). " +
    "meta.counts_by_status reports the count per derived status across the full " +
    "filtered set (e.g. how many 'ratat' in the last 3 months). The action history " +
    "(istoric_actiuni) is heavy and only returned when include_detail is truthy or " +
    "a single objective_id is given.",
  inputSchema: z.object({
    status: z.string().optional(),
    responsabil: z.number().int().positive().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    q: z.string().optional(),
    objective_id: z.number().int().positive().optional(),
    include_detail: z.boolean().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["status","responsabil","from","to","q","objective_id",
                     "include_detail","limit","offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_objectives", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Objectives: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
