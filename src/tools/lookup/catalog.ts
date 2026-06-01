import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const mcpToolCatalogTool: Tool = {
  name: "mcp_tool_catalog",
  description:
    "Return the broker-side catalog of MCP tools (key, label, category, parameters, requires_confirmation). Filter by category (lookup/list/report/analyst/meta/write/assistant/other) or text query.",
  inputSchema: z.object({
    category: z
      .enum([
        "lookup",
        "list",
        "report",
        "analyst",
        "meta",
        "write",
        "assistant",
        "other",
      ])
      .optional(),
    q: z.string().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {};
    if (args.category) q.category = args.category;
    if (args.q) q.q = args.q;
    const result = await iflowClient.fetch<{ results?: unknown[]; count?: number }>(
      "mcp_tool_catalog",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Catalog has ${result.count ?? result.results?.length ?? 0} tool(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
