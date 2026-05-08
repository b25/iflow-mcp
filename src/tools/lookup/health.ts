import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { config } from "../../iflow/config.js";

export const healthTool: Tool = {
  name: "health",
  description:
    "MCP health: configured Api Point keys and read-only flag. Does not expose secrets or UUIDs.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const keys = Object.keys(config.IFLOW_API_POINTS).sort();
    return {
      content: [
        {
          type: "text",
          text: `OK. ${keys.length} Api Point key(s) configured. read_only=${config.IFLOW_READ_ONLY}.`,
        },
      ],
      structuredContent: {
        status: "ok",
        configured_api_point_keys: keys,
        read_only: config.IFLOW_READ_ONLY,
      },
    };
  },
};
