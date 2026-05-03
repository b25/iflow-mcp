import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const getStockTool: Tool = {
  name: "get_stock",
  description: "Get current stock levels for a product.",
  inputSchema: z.object({
    product_uuid: z.string().uuid(),
    warehouse_uuid: z.string().uuid().optional(),
  }),
  execute: async ({ product_uuid, warehouse_uuid }): Promise<MCPToolResult> => {
    // In a real scenario, this might be a filtered query or a specific stock endpoint
    const query = warehouse_uuid ? `?warehouse=${warehouse_uuid}` : "";
    const result = await iflowClient.fetch(`stocks-uuid/${product_uuid}${query}`, "GET");

    return {
      content: [
        {
          type: "text",
          text: `Current stock for ${product_uuid}: ${result.quantity} ${result.unit}.`,
        },
      ],
      structuredContent: result,
    };
  },
};
