import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { config } from "../../iflow/config.js";

export const createOrderTool: Tool = {
  name: "create_order",
  description:
    "Create an order in iflow (POST). Disabled when IFLOW_READ_ONLY=1. Sends Idempotency-Key header.",
  inputSchema: z.object({
    client_uuid: z.string().uuid(),
    items: z.array(
      z.object({
        product_uuid: z.string().uuid(),
        quantity: z.number().positive(),
        price: z.number().optional(),
      })
    ),
    idempotency_key: z.string().min(8),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) {
      return {
        content: [
          {
            type: "text",
            text: "Cannot create order: IFLOW_READ_ONLY=1.",
          },
        ],
        isError: true,
      };
    }

    const { idempotency_key, ...orderData } = args;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "create_order",
      "POST",
      orderData,
      { idempotencyKey: idempotency_key }
    );

    return {
      content: [
        {
          type: "text",
          text: `Order created: ${String(result.number ?? result.uuid ?? "ok")}.`,
        },
      ],
      structuredContent: result,
    };
  },
};
