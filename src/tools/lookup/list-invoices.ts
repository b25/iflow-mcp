import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

export const listInvoicesTool: Tool = {
  name: "list_invoices",
  description:
    "List fiscal bills (FiscalBill). Filters: client_id, from/to (invoice_date), unpaid_only, series, currency, q (title or numeric number), limit, offset.",
  inputSchema: z.object({
    client_id: z.number().int().positive().optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    unpaid_only: z.boolean().optional(),
    series: z.string().optional(),
    currency: z.string().min(2).max(8).optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<{ results?: unknown[]; count?: number }>(
      "list_invoices",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} invoice(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
