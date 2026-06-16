import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listCorrespondenceTool: Tool = {
  name: "list_correspondence",
  description:
    "Correspondence register ('Registru Corespondenta', MailRegistry): " +
    "registration number, type (intrare|iesire, machine + RO label), " +
    "correspondent, date, content and the employee who registered it. " +
    "Ordered latest-first. meta.ultimul_numar gives the last registration " +
    "number per type across the full filtered set (answers 'care e ultimul " +
    "nr de iesire'). Filters: from/to (date range), tip (intrare|iesire), " +
    "employee_id, q (search in correspondent/content).",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    tip: z.enum(["intrare", "iesire"]).optional(),
    employee_id: z.number().int().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["from", "to", "tip", "employee_id", "q",
                     "limit", "offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_correspondence", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Correspondence entries: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
