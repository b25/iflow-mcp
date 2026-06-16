import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listEmailCampaignsTool: Tool = {
  name: "list_email_campaigns",
  description:
    "Marketing email campaigns ('Campanii E-mail', Mailing): name, emails " +
    "sent count, start/final datetimes, status (machine + RO label), tab " +
    "state, and sender employee. Ordered latest-first so the most recent " +
    "campaign comes first ('last campaign'). Filters: from/to (campaign " +
    "date), state (se_trimite|noi|programate|trimise tab), status, q (name).",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    state: z.enum(["se_trimite", "noi", "programate", "trimise"]).optional(),
    status: z.number().int().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["from", "to", "state", "status", "q",
                     "limit", "offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_email_campaigns", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Email campaigns: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
