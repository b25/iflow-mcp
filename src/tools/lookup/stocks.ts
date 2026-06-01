import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const getStockTool: Tool = {
  name: "get_stock",
  description:
    "Stock levels for a product (query params; backend must expose via Api Point).",
  inputSchema: z.object({
    product_uuid: z.string().uuid(),
    warehouse_uuid: z.string().uuid().optional(),
  }),
  execute: async ({ product_uuid, warehouse_uuid }): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "get_stock",
      "GET",
      undefined,
      {
        query: {
          product_uuid,
          ...(warehouse_uuid ? { warehouse_uuid } : {}),
        },
      }
    );
    return {
      content: [
        {
          type: "text",
          text: `Stock for ${product_uuid}: ${String(result.quantity ?? result.qty ?? JSON.stringify(result))}.`,
        },
      ],
      structuredContent: result,
    };
  },
};
