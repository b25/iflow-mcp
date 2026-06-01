import { z } from "zod";
import { Tool, MCPToolResult, AnalystResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { applyAnalystHygiene, normalizeAnalystResult } from "./hygiene.js";

export const analyzeFraudSignalsTool: Tool = {
  name: "analyze_fraud_signals",
  description:
    "Heuristic fraud / internal-control signals: duplicate invoice clusters (client+day+total), storno volume, large unpaid invoices. Optional min_amount query (default 50000). Not legal proof of fraud.",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    language: z.enum(["ro", "en"]).optional().default("ro"),
    min_amount: z.string().optional(),
  }),
  execute: async ({
    from,
    to,
    language,
    min_amount,
  }): Promise<MCPToolResult<AnalystResult>> => {
    const query: Record<string, string> = {};
    if (from) query.from = from;
    if (to) query.to = to;
    if (language) query.language = language;
    if (min_amount) query.min_amount = min_amount;
    const data = await iflowClient.fetch<Partial<AnalystResult>>(
      "analyze_fraud_signals",
      "GET",
      undefined,
      {
        query: Object.keys(query).length ? query : undefined,
      }
    );
    const normalized = normalizeAnalystResult(data, "analyze_fraud_signals");
    return applyAnalystHygiene(normalized, { language });
  },
};

export const analyzeStockRiskSignalsTool: Tool = {
  name: "analyze_stock_risk_signals",
  description:
    "Stock risk snapshot: below minimum, negative on-hand, overstock (10x minimum heuristic). Mostly snapshot (not period-based).",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    language: z.enum(["ro", "en"]).optional().default("ro"),
  }),
  execute: async ({ from, to, language }): Promise<MCPToolResult<AnalystResult>> => {
    const query: Record<string, string> = {};
    if (from) query.from = from;
    if (to) query.to = to;
    if (language) query.language = language;
    const data = await iflowClient.fetch<Partial<AnalystResult>>(
      "analyze_stock_risk_signals",
      "GET",
      undefined,
      {
        query: Object.keys(query).length ? query : undefined,
      }
    );
    const normalized = normalizeAnalystResult(data, "analyze_stock_risk_signals");
    return applyAnalystHygiene(normalized, { language });
  },
};

export const mcpOperationalRiskSweepTool: Tool = {
  name: "mcp_operational_risk_sweep",
  description:
    "Aggregate operational-risk scan: sorted list of problem cards (counts + severity) with drill-down args for mcp_operational_risk_detail. Start here for overview, then drill each problem_id.",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    language: z.enum(["ro", "en"]).optional().default("ro"),
    min_amount: z.string().optional(),
  }),
  execute: async ({ from, to, language, min_amount }): Promise<MCPToolResult> => {
    const query: Record<string, string> = {};
    if (from) query.from = from;
    if (to) query.to = to;
    if (language) query.language = language;
    if (min_amount) query.min_amount = min_amount;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "mcp_operational_risk_sweep",
      "GET",
      undefined,
      { query: Object.keys(query).length ? query : undefined }
    );
    const n = Array.isArray(result.problems) ? result.problems.length : 0;
    return {
      content: [
        {
          type: "text",
          text: `Operational risk sweep: ${n} problem bucket(s). Use mcp_operational_risk_detail per problem_id.`,
        },
      ],
      structuredContent: result,
    };
  },
};

const problemIdEnum = z.enum([
  "duplicate_invoice_clusters",
  "storno_fiscal_bills",
  "large_unpaid_invoices",
  "stock_below_minimum",
  "stock_negative_on_hand",
  "stock_overstock_candidates",
  "orders_open_past_delivery",
  "clients_positive_balance",
  "offers_rejected_period",
  "fraud_signals",
  "stock_risk_signals",
]);

export const mcpOperationalRiskDetailTool: Tool = {
  name: "mcp_operational_risk_detail",
  description:
    "Drill-down rows for one problem_id from mcp_operational_risk_sweep. Use fraud_signals or stock_risk_signals for full embedded analyst payloads.",
  inputSchema: z.object({
    problem_id: problemIdEnum,
    from: z.string().optional(),
    to: z.string().optional(),
    limit: z.number().int().positive().max(200).optional(),
    language: z.enum(["ro", "en"]).optional().default("ro"),
    min_amount: z.string().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const query: Record<string, string> = {
      problem_id: args.problem_id,
      language: args.language ?? "ro",
    };
    if (args.from) query.from = args.from;
    if (args.to) query.to = args.to;
    if (args.limit != null) query.limit = String(args.limit);
    if (args.min_amount) query.min_amount = args.min_amount;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "mcp_operational_risk_detail",
      "GET",
      undefined,
      { query }
    );
    const ok = result.ok !== false;
    const rows = Array.isArray(result.rows) ? result.rows.length : 0;
    return {
      content: [
        {
          type: "text",
          text: ok
            ? `Detail for ${args.problem_id}: ${rows} row(s).`
            : `Detail failed: ${String(result.error ?? "error")}.`,
        },
      ],
      structuredContent: result,
      isError: !ok,
    };
  },
};
