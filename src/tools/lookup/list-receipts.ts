import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

export const listReceiptsTool: Tool = {
  name: "list_receipts",
  description:
    "List receipts (chitante de incasare = Receipt). Filters: client_id, " +
    "from/to (issue date), serie, status (activa|anulata), q (client name, " +
    "details, or numeric number), limit, offset. Sorted by issue date DESC. " +
    "Each row carries: id, serie, numar, data (ISO), client_id, client_nume, " +
    "suma (collected amount) + valuta, facturi (settled invoices: id+serie+" +
    "numar, [] if none), metoda ({code: numerar|bancar|other, label: RO} or " +
    "null), status (activa|anulata), utilizator_id + utilizator_nume (issuer). " +
    "meta.total_incasat sums collected amounts per currency across the full " +
    "filtered set (before pagination) — answers 'cat am incasat cu chitanta " +
    "luna asta'.",
  inputSchema: z.object({
    client_id: z.number().int().positive().optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    serie: z.string().optional(),
    status: z
      .string()
      .describe("Receipt status filter: activa or anulata.")
      .optional(),
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
      "list_receipts",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} receipt(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
