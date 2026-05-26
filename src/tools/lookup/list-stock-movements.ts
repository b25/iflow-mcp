import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

export const listStockMovementsTool: Tool = {
  name: "list_stock_movements",
  description:
    "List StockHistory movements. Filters: product_id, from/to (date), administration_id, movement_type (StockDocumentType id), limit, offset.",
  inputSchema: z.object({
    product_id: z.number().int().positive().optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    administration_id: z.number().int().positive().optional(),
    movement_type: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null) q[k] = v as string | number;
    }
    const result = await iflowClient.fetch<{ results?: unknown[]; count?: number }>(
      "list_stock_movements",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} stock movement(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
