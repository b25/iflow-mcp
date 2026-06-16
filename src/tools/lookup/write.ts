import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { config } from "../../iflow/config.js";

const orderProductItem = z
  .object({
    id: z.number().int().positive().optional(),
    code: z.string().optional(),
    quantity: z.number().int().positive(),
    vat: z.number().optional(),
    price_per_piece: z.number().optional(),
    administration: z.number().int().positive().optional(),
    description: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .passthrough();

export const createOrderTool: Tool = {
  name: "create_order",
  description:
    "Create a STANDARD order (POST-equivalent; requires confirmation). " +
    "client = object (name; tax_code to target/upsert an existing client). " +
    "products = array of items (id or code, quantity; optional vat [omit to use the product's " +
    "default rate], price_per_piece). Currency is fixed by the system (do NOT send it). " +
    "date_order = YYYY-MM-DD. Disabled when IFLOW_READ_ONLY=1.",
  inputSchema: z.object({
    client: z.object({ name: z.string().min(1) }).passthrough(),
    products: z.array(orderProductItem).min(1),
    date_order: z.string().min(1),
    shipping_cost: z.number().optional(),
    order_details: z.string().optional(),
    coupons: z.array(z.unknown()).optional(),
    files: z.array(z.unknown()).optional(),
    confirm: z.boolean().optional(),
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

    const {
      confirm,
      client,
      products,
      coupons,
      files,
      date_order,
      shipping_cost,
      order_details,
    } = args;
    const query: Record<string, string | number | boolean> = {
      client: JSON.stringify(client),
      products: JSON.stringify(products),
      date_order,
    };
    if (coupons !== undefined) query.coupons = JSON.stringify(coupons);
    if (files !== undefined) query.files = JSON.stringify(files);
    if (shipping_cost != null) query.shipping_cost = shipping_cost;
    if (order_details) query.order_details = order_details;

    const result = await iflowClient.fetch<Record<string, unknown>>(
      "create_order",
      "GET",
      undefined,
      { query, confirmToken: confirm ? "mcp_confirm=1" : undefined }
    );

    return {
      content: [
        {
          type: "text",
          text:
            result.ok === false
              ? `Failed: ${String(result.error ?? "unknown")}.`
              : `Order created: ${String(
                  result.order_number ?? result.order_id ?? "ok"
                )}.`,
        },
      ],
      structuredContent: result,
      isError: result.ok === false,
    };
  },
};
