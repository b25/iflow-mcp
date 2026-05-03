import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const vatEstimateTool: Tool = {
  name: "vat_estimate",
  description: "Get the estimated VAT for the current period.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch("vat-estimate-uuid", "GET");
    return {
      content: [
        {
          type: "text",
          text: `Estimated VAT: ${result.amount} ${result.currency}.`,
        },
      ],
      structuredContent: result,
    };
  },
};

export const supplierPaymentsDueTool: Tool = {
  name: "supplier_payments_due",
  description: "Get total amount of payments due to suppliers.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch("supplier-payments-due-uuid", "GET");
    return {
      content: [
        {
          type: "text",
          text: `Total supplier payments due: ${result.total_amount} ${result.currency}.`,
        },
      ],
      structuredContent: result,
    };
  },
};

export const topProductsByMarginTool: Tool = {
  name: "top_products_by_margin",
  description: "List the top products by profit margin.",
  inputSchema: z.object({
    limit: z.number().optional().default(5),
  }),
  execute: async ({ limit }): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch(`top-margin-products-uuid?limit=${limit}`, "GET");
    return {
      content: [
        {
          type: "text",
          text: `Top ${result.results?.length || 0} products by margin.`,
        },
      ],
      structuredContent: result,
    };
  },
};
