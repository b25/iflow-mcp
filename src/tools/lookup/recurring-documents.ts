import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDate = z.string().min(8);

export const listRecurringDocumentsTool: Tool = {
  name: "list_recurring_documents",
  description:
    "List recurrence configurations (recurring orders / subscriptions, " +
    "'comenzi recurente' / 'abonamente'): order templates that the cron clones " +
    "periodically. Each row: tip (order if it only generates orders, invoice if " +
    "it also auto-generates an invoice), client_id+client_nume, frecventa " +
    "(1 Zilnic,6 Saptamanal,2 Lunar,4 Trimestrial,5 Semestrial,3 Anual) + " +
    "frecventa_label (RO) + interval/ziua, urmatoarea_generare and " +
    "ultima_generare (ISO date, null), status (activa/pauza/incheiata) + " +
    "status_label (RO), valabilitate {start, end, repetari_ramase}, produse " +
    "(template lines [{product_id, nume, cantitate}]), valoare_estimata + " +
    "currency, genereaza_factura, and documente_generate {count, recente}. " +
    "Filters: tip (order|invoice), status (activa|pauza|incheiata), client_id, " +
    "from/to (on urmatoarea_generare, answers 'ce se genereaza in perioada " +
    "urmatoare'), q (title/client/order number), limit, offset. Sorted by " +
    "next-generation date ascending (soonest first).",
  inputSchema: z.object({
    tip: z.enum(["order", "invoice"]).optional(),
    status: z.enum(["activa", "pauza", "incheiata"]).optional(),
    client_id: z.number().int().positive().optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
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
      "list_recurring_documents",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${
            result.count ?? result.results?.length ?? 0
          } recurring document config(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
