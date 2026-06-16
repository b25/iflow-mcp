import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const documentCommunicationsTool: Tool = {
  name: "document_communications",
  description:
    "Communication/send history for a document (offer, order, invoice, proforma, printed_form): " +
    "whether sent, date/time, recipient email, channel, sender, plus the document author. " +
    "Identify the document by doc_id, or by series+number (offer/invoice/proforma) or number (order).",
  inputSchema: z.object({
    doc_type: z.enum(["offer", "order", "invoice", "proforma", "printed_form"]),
    doc_id: z.number().int().positive().optional(),
    series: z.string().optional(),
    number: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(500).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = { doc_type: args.doc_type };
    if (args.doc_id != null) q.doc_id = args.doc_id;
    if (args.series) q.series = args.series;
    if (args.number != null) q.number = args.number;
    if (args.limit != null) q.limit = args.limit;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "document_communications",
      "GET",
      undefined,
      { query: q }
    );
    const sent = result.ok === true && result.sent === true;
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [
        {
          type: "text",
          text:
            result.ok === false
              ? `Failed: ${String(result.error ?? "unknown")}.`
              : `${sent ? `Sent (${count} communication(s)).` : "Not sent."}`,
        },
      ],
      structuredContent: result,
      isError: result.ok === false,
    };
  },
};
