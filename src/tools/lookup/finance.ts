import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

export const vatEstimateTool: Tool = {
  name: "vat_estimate",
  description:
    "Estimated VAT collected over a date window (default last 30 days). Optional administration_id filter.",
  inputSchema: z.object({
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    administration_id: z.number().int().positive().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {};
    if (args.from) q.from = args.from;
    if (args.to) q.to = args.to;
    if (args.administration_id != null) q.administration_id = args.administration_id;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "vat_estimate",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `VAT estimate: ${String(result.amount ?? result.vat ?? JSON.stringify(result))}.`,
        },
      ],
      structuredContent: result,
    };
  },
};

export const supplierPaymentsDueTool: Tool = {
  name: "supplier_payments_due",
  description:
    "Supplier payments due (grouped by provider). Optional filters: provider_id, min_amount, currency.",
  inputSchema: z.object({
    provider_id: z.number().int().positive().optional(),
    min_amount: z.number().nonnegative().optional(),
    currency: z.string().min(2).max(8).optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {};
    if (args.provider_id != null) q.provider_id = args.provider_id;
    if (args.min_amount != null) q.min_amount = args.min_amount;
    if (args.currency) q.currency = args.currency;
    if (args.limit != null) q.limit = args.limit;
    if (args.offset != null) q.offset = args.offset;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "supplier_payments_due",
      "GET",
      undefined,
      { query: q }
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
  description:
    "Top products by margin (limit, default 5). Optional from/to, category_id, provider_id, min_qty filters.",
  inputSchema: z.object({
    limit: z.number().int().positive().max(100).optional().default(5),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    category_id: z.number().int().positive().optional(),
    provider_id: z.number().int().positive().optional(),
    min_qty: z.number().nonnegative().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = { limit: args.limit ?? 5 };
    if (args.from) q.from = args.from;
    if (args.to) q.to = args.to;
    if (args.category_id != null) q.category_id = args.category_id;
    if (args.provider_id != null) q.provider_id = args.provider_id;
    if (args.min_qty != null) q.min_qty = args.min_qty;
    const result = await iflowClient.fetch<{ results?: unknown[] }>(
      "top_products_by_margin",
      "GET",
      undefined,
      { query: q }
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
