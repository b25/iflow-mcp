import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const countOrdersInProgressTool: Tool = {
  name: "count_orders_in_progress",
  description: "Count orders currently in progress (KPI / dedicated Api Point).",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "count_orders_in_progress",
      "GET"
    );
    const count = typeof result.count === "number" ? result.count : result.results;
    return {
      content: [
        {
          type: "text",
          text: `Orders in progress: ${String(count ?? JSON.stringify(result))}.`,
        },
      ],
      structuredContent: result,
    };
  },
};

export const listOrdersToInvoiceTool: Tool = {
  name: "list_orders_to_invoice",
  description: "List orders ready to invoice (dedicated Api Point).",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{
      results?: unknown[];
      count?: number;
    }>("list_orders_to_invoice", "GET");
    const n = result.results?.length ?? result.count ?? 0;
    return {
      content: [{ type: "text", text: `Found ${n} order(s) to invoice.` }],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const oldestUnfinishedOrderTool: Tool = {
  name: "oldest_unfinished_order",
  description: "Get the oldest unfinished order (dedicated Api Point).",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "oldest_unfinished_order",
      "GET"
    );
    const num = result.number ?? result.id ?? "";
    return {
      content: [
        {
          type: "text",
          text: result.uuid
            ? `Oldest unfinished order: ${String(num)}.`
            : "No unfinished orders found.",
        },
      ],
      structuredContent: result,
    };
  },
};
