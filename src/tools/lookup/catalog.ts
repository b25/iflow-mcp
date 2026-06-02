import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const mcpToolCatalogTool: Tool = {
  name: "mcp_tool_catalog",
  description:
    "Return the broker-side catalog of MCP tools (key, label, category, group, prerequisites, parameters). Filter by category (lookup/list/report/analyst/meta/write/assistant/other), group (UI label e.g. 'Write Actions'), or text query. Pass format='grouped' for the six UI groups with counts.",
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
    group: z.string().optional(),
    format: z.enum(["flat", "grouped"]).optional(),
    q: z.string().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {};
    if (args.category) q.category = args.category;
    if (args.group) q.group = args.group;
    if (args.format) q.format = args.format;
    if (args.q) q.q = args.q;
    const result = await iflowClient.fetch<{ results?: unknown[]; groups?: unknown[]; count?: number }>(
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
