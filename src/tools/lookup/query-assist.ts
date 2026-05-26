import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const mcpQueryAssistTool: Tool = {
  name: "mcp_query_assist",
  description:
    "Given a natural-language objective in Romanian or English, recommend MCP tool(s) with suggested arguments. Useful as a router before picking a tool.",
  inputSchema: z.object({
    objective: z.string().min(2),
    limit: z.number().int().min(1).max(20).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = { objective: args.objective };
    if (args.limit != null) q.limit = args.limit;
    const result = await iflowClient.fetch<{ recommendations?: unknown[] }>(
      "mcp_query_assist",
      "GET",
      undefined,
      { query: q }
    );
    const recs = result.recommendations ?? [];
    return {
      content: [
        {
          type: "text",
          text: `Found ${recs.length} recommendation(s) for objective.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
