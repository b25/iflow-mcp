import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { config } from "../../iflow/config.js";

export const healthTool: Tool = {
  name: "health",
  description: "Check the health of the MCP server and list configured API points.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const apiPoints = Object.keys(config.IFLOW_API_POINTS);
    
    return {
      content: [
        {
          type: "text",
          text: `MCP Server is healthy. Configured API points: ${apiPoints.join(", ")}.`,
        },
      ],
      structuredContent: {
        status: "healthy",
        api_points: apiPoints,
        read_only: config.IFLOW_READ_ONLY,
        base_url: config.IFLOW_BASE_URL,
      },
    };
  },
};
