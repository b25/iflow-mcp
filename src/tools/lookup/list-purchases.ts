import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDate = z.string().min(8);

export const listPurchasesTool: Tool = {
  name: "list_purchases",
  description:
    "List DocumentEntries (NIR / spend / imports). Filters: from/to (date), provider_id, document_type, entry_type (1=SPEND, 2=STOCK, 3=SPEND_NO_DOC, 4=IMPORT), min_amount, limit, offset.",
  inputSchema: z.object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    provider_id: z.number().int().positive().optional(),
    document_type: z.number().int().positive().optional(),
    entry_type: z.number().int().min(1).max(4).optional(),
    min_amount: z.number().nonnegative().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null) q[k] = v as string | number;
    }
    const result = await iflowClient.fetch<{ results?: unknown[]; count?: number }>(
      "list_purchases",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} purchase(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
