import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { fetchAllPages } from "../../iflow/pagination.js";

export const listClientsTool: Tool = {
  name: "list_clients",
  description: "Get a list of all clients from iflow ERP.",
  inputSchema: z.object({
    all_pages: z.boolean().optional().default(false),
  }),
  execute: async ({ all_pages }): Promise<MCPToolResult> => {
    const fetchPage = async (page: number) => {
      // In a real scenario, the path UUID would be mapped from config.IFLOW_API_POINTS
      // For this task, we assume "clients" maps to a specific UUID
      return await iflowClient.fetch("clients-uuid", "GET");
    };

    const results = all_pages 
      ? await fetchAllPages(fetchPage)
      : (await fetchPage(1)).results;

    return {
      content: [
        {
          type: "text",
          text: `Found ${results.length} clients.`,
        },
      ],
      structuredContent: results,
    };
  },
};

export const getClientTool: Tool = {
  name: "get_client",
  description: "Get detailed information about a specific client.",
  inputSchema: z.object({
    uuid: z.string().uuid(),
  }),
  execute: async ({ uuid }): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch(uuid, "GET");

    return {
      content: [
        {
          type: "text",
          text: `Details for client ${result.name || uuid}.`,
        },
      ],
      structuredContent: result,
    };
  },
};
