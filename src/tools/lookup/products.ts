import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { fetchAllPages } from "../../iflow/pagination.js";

export const listProductsTool: Tool = {
  name: "list_products",
  description: "Get a list of all products from iflow ERP.",
  inputSchema: z.object({
    all_pages: z.boolean().optional().default(false),
  }),
  execute: async ({ all_pages }): Promise<MCPToolResult> => {
    const fetchPage = async (page: number) => {
      return await iflowClient.fetch("products-uuid", "GET");
    };

    const results = all_pages 
      ? await fetchAllPages(fetchPage)
      : (await fetchPage(1)).results;

    return {
      content: [
        {
          type: "text",
          text: `Found ${results.length} products.`,
        },
      ],
      structuredContent: results,
    };
  },
};

export const getProductTool: Tool = {
  name: "get_product",
  description: "Get detailed information about a specific product.",
  inputSchema: z.object({
    uuid: z.string().uuid(),
  }),
  execute: async ({ uuid }): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch(uuid, "GET");

    return {
      content: [
        {
          type: "text",
          text: `Details for product ${result.name || uuid}.`,
        },
      ],
      structuredContent: result,
    };
  },
};
