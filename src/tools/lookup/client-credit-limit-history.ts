import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const clientCreditLimitHistoryTool: Tool = {
  name: "client_credit_limit_history",
  description:
    "Credit/sold limit history for a client (the \"Istoricul Limitelor\" tab): " +
    "the block/unblock and limit-config events recorded for the client. Each row " +
    "has event_type (machine code: auto_block / auto_unblock / manual_block / " +
    "manual_unblock / temp_unblock / limit_config_on / limit_config_off / " +
    "limit_edit), event_label (RO human label), description, created_at, " +
    "employee_id + employee_name (null for system auto events), the limit snapshot " +
    "at that moment (limit_set / overdue_payments_limit / total_balance_limit / " +
    "overdue_age_limit) and currency. The sold total at the moment is only present " +
    "as free text inside description (sold_total is null). Ordered latest-first. " +
    "Filters: client_id (required), limit, offset.",
  inputSchema: z.object({
    client_id: z.number().int().positive(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {
      client_id: args.client_id,
    };
    for (const k of ["limit", "offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "client_credit_limit_history", "GET", undefined, { query: q }
    );
    const err =
      result.error && typeof result.error === "object"
        ? (result.error as Record<string, unknown>)
        : null;
    if (err) {
      return {
        content: [
          { type: "text", text: `Failed: ${String(err.message ?? err.code)}.` },
        ],
        structuredContent: result,
        isError: true,
      };
    }
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Credit limit events: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
