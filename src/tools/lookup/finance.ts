import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const vatEstimateTool: Tool = {
  name: "vat_estimate",
  description: "Estimated VAT for the current period (dedicated Api Point).",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>("vat_estimate", "GET");
    return {
      content: [
        {
          type: "text",
          text: `VAT estimate: ${String(result.amount ?? result.total ?? JSON.stringify(result))}.`,
        },
      ],
      structuredContent: result,
    };
  },
};

export const supplierPaymentsDueTool: Tool = {
  name: "supplier_payments_due",
  description: "Supplier payments due (dedicated Api Point).",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "supplier_payments_due",
      "GET"
    );
    return {
      content: [
        {
          type: "text",
          text: `Supplier payments due: ${String(result.total_amount ?? result.total ?? "")} ${String(result.currency ?? "")}.`,
        },
      ],
      structuredContent: result,
    };
  },
};

export const topProductsByMarginTool: Tool = {
  name: "top_products_by_margin",
  description: "Top products by margin (limit, default 5).",
  inputSchema: z.object({
    limit: z.number().int().positive().max(100).optional().default(5),
  }),
  execute: async ({ limit }): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{ results?: unknown[] }>(
      "top_products_by_margin",
      "GET",
      undefined,
      { query: { limit } }
    );
    return {
      content: [
        {
          type: "text",
          text: `Top ${result.results?.length ?? 0} products by margin.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
