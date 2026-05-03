import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { config } from "../../iflow/config.js";

export const createOrderTool: Tool = {
  name: "create_order",
  description: "Create a new order in iflow ERP. Requires read-only mode to be disabled.",
  inputSchema: z.object({
    client_uuid: z.string().uuid(),
    items: z.array(z.object({
      product_uuid: z.string().uuid(),
      quantity: z.number().positive(),
      price: z.number().optional(),
    })),
    idempotency_key: z.string(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Cannot create order because server is in READ-ONLY mode.",
          },
        ],
        isError: true,
      };
    }

    const { idempotency_key, ...orderData } = args;

    // We assume there's a generic orders endpoint for POST
    const result = await iflowClient.fetch("orders-uuid", "POST", orderData);

    return {
      content: [
        {
          type: "text",
          text: `Order ${result.number || result.uuid} created successfully.`,
        },
      ],
      structuredContent: result,
    };
  },
};
