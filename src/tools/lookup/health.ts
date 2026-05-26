import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { config } from "../../iflow/config.js";

export const healthTool: Tool = {
  name: "health",
  description:
    "MCP health: transport mode (Django broker vs api-external), legacy IFLOW_API_POINTS keys, read-only flag. Does not expose secrets.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const keys = Object.keys(config.IFLOW_API_POINTS).sort();
    const transport = config.IFLOW_MCP_INTEGRATION_UUID ? "django_broker" : "api_external";
    const brokerHint = config.IFLOW_MCP_INTEGRATION_UUID
      ? ` broker_uuid_set=true`
      : "";
    return {
      content: [
        {
          type: "text",
          text: `OK. transport=${transport}.${brokerHint} ${keys.length} legacy Api Point key(s) in IFLOW_API_POINTS. read_only=${config.IFLOW_READ_ONLY}.`,
        },
      ],
      structuredContent: {
        status: "ok",
        transport,
        configured_api_point_keys: keys,
        read_only: config.IFLOW_READ_ONLY,
      },
    };
  },
};
