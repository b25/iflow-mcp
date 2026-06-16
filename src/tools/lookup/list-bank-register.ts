import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

export const listBankRegisterTool: Tool = {
  name: "list_bank_register",
  description:
    "List bank-register movement lines (registru de banca = PaymentReceipts " +
    "with to_bank=true): incasari/plati settled through a bank account. " +
    "Filters: from/to (movement date), cont (bank account id), operatie " +
    "(incasare|plata), partener (client/supplier id or name fragment), q " +
    "(description / partner name), limit, offset. Sorted by date ASC so the " +
    "running balance is meaningful. Each row carries: id, tip_registru (banca), " +
    "cont ({id, nume} — the bank account), data (ISO), operatie ({code: " +
    "incasare|plata|transfer, label: RO}), suma + valuta, incasare, plata, " +
    "partener ({tip: client|furnizor, id, nume} or null), document ({tip, id, " +
    "numar} linked invoice/purchase doc/supplier order/receipt, or null), " +
    "descriere, utilizator_id + utilizator_nume, sold_dupa_operatiune (running " +
    "balance after the line). meta.sold_la_zi is the current balance per " +
    "currency across the whole bank register / selected account; " +
    "meta.total_incasari / meta.total_plati are per-currency totals over the " +
    "filtered interval.",
  inputSchema: z.object({
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    cont: z
      .number()
      .int()
      .positive()
      .describe("Bank account id (AdminSettingsBankAccount).")
      .optional(),
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
      "list_bank_register",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} bank movement(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
