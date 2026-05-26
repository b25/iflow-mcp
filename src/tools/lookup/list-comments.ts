import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

export const listCommentsTool: Tool = {
  name: "list_comments",
  description:
    "List comments on opportunities (kind=opportunity, default) or offers (kind=offer). Filters: from/to (date), client_id, user_id, comment_action (action_type_id), q, limit, offset.",
  inputSchema: z.object({
    kind: z.enum(["opportunity", "offer"]).optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    client_id: z.number().int().positive().optional(),
    user_id: z.number().int().positive().optional(),
    comment_action: z.number().int().positive().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null) q[k] = v as string | number;
    }
    const result = await iflowClient.fetch<{ results?: unknown[]; count?: number }>(
      "list_comments",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} comment(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
