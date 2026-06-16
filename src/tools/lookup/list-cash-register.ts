import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

export const listCashRegisterTool: Tool = {
  name: "list_cash_register",
  description:
    "List cash-register movement lines (registru de casa = PaymentReceipts " +
    "with to_bank=false): incasari/plati handled in numerar. Filters: from/to " +
    "(movement date), operatie (incasare|plata), partener (client/supplier id " +
    "or name fragment), q (description / partner name), limit, offset. Sorted " +
    "by date ASC so the running balance is meaningful. Each row carries: id, " +
    "tip_registru (casa), cont ({id, nume} — the cash currency, id is null), " +
    "data (ISO), operatie ({code: incasare|plata|transfer, label: RO}), suma + " +
    "valuta, incasare, plata, partener ({tip: client|furnizor, id, nume} or " +
    "null), document ({tip, id, numar} linked invoice/purchase doc/supplier " +
    "order/receipt, or null), descriere, utilizator_id + utilizator_nume, " +
    "sold_dupa_operatiune (running balance after the line). meta.sold_la_zi is " +
    "the current balance per currency across the whole cash register; " +
    "meta.total_incasari / meta.total_plati are per-currency totals over the " +
    "filtered interval — answers 'care e soldul registrului de casa azi'.",
  inputSchema: z.object({
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    operatie: z
      .string()
      .describe("Operation filter: incasare or plata.")
      .optional(),
    partener: z
      .string()
      .describe("Client/supplier id or name fragment.")
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
      "list_cash_register",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} cash movement(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
