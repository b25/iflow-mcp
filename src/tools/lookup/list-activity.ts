import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

export const listActivityTool: Tool = {
  name: "list_activity",
  description:
    "List ReportsRecentActivity rows. Filters: from/to (created), module (object_model), action_type, user_id (action_user_id), object_id, q (object_name), limit, offset, via_integration (true = only actions done via the Claude integration; false = only direct/UI actions).",
  inputSchema: z.object({
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    module: z.string().optional(),
    action_type: z.number().int().nonnegative().optional(),
    user_id: z.number().int().positive().optional(),
    object_id: z.number().int().positive().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
    via_integration: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    if (args.via_integration !== undefined) q.via_integration = args.via_integration;
    const result = await iflowClient.fetch<{ results?: unknown[]; count?: number }>(
      "list_activity",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} activity event(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
