import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const getStockTool: Tool = {
  name: "get_stock",
  description:
    "Stock levels for a product, identified by product_uuid or product_id (query params; backend must expose via Api Point).",
  inputSchema: z
    .object({
      product_uuid: z.string().uuid().optional(),
      product_id: z.number().int().positive().optional(),
      warehouse_uuid: z.string().uuid().optional(),
    })
    .refine((data) => data.product_uuid != null || data.product_id != null, {
      message: "provide product_uuid or product_id",
    }),
  execute: async ({ product_uuid, product_id, warehouse_uuid }): Promise<MCPToolResult> => {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (product_uuid) query.product_uuid = product_uuid;
    if (product_id != null) query.product_id = product_id;
    if (warehouse_uuid) query.warehouse_uuid = warehouse_uuid;

    const result = await iflowClient.fetch<Record<string, unknown>>(
      "get_stock",
      "GET",
      undefined,
      { query }
    );
    return {
      content: [
        {
          type: "text",
          text: `Stock for ${product_uuid ?? product_id}: ${String(result.quantity ?? result.qty ?? JSON.stringify(result))}.`,
        },
      ],
      structuredContent: result,
      isError: result.error != null,
    };
  },
};
