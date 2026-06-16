import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

export const listInvoicesTool: Tool = {
  name: "list_invoices",
  description:
    "List fiscal bills (FiscalBill). Filters: client_id, from/to (invoice_date), " +
    "unpaid_only, series, currency, efactura_status, q (title or numeric number), " +
    "limit, offset. Each row carries an efactura object with the e-Factura/SPV " +
    "(ANAF) state: status (tag), status_label (RO), data_trimitere_spv (ISO send " +
    "date, null), index_incarcare (ANAF upload index, null), id_descarcare (ANAF " +
    "download id, null), mesaj_respingere (rejection/error message, null). When an " +
    "invoice never went through SPV the status is NETRIMISA with null details. " +
    "efactura_status accepts a tag or its RO label and narrows by e-Factura state: " +
    "NETRIMISA (not sent), EROARE_VALIDARE, VALIDATA, VALIDARE_ESUATA, " +
    "EROARE_INCARCARE, IN_PROCESARE (sent, processing), RESPINSA (ANAF-rejected), " +
    "ACCEPTATA (accepted).",
  inputSchema: z.object({
    client_id: z.number().int().positive().optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    unpaid_only: z.boolean().optional(),
    series: z.string().optional(),
    currency: z.string().min(2).max(8).optional(),
    efactura_status: z
      .string()
      .describe(
        "Filter by e-Factura/SPV status. Tag or RO label: NETRIMISA, " +
          "EROARE_VALIDARE, VALIDATA, VALIDARE_ESUATA, EROARE_INCARCARE, " +
          "IN_PROCESARE, RESPINSA, ACCEPTATA."
      )
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
