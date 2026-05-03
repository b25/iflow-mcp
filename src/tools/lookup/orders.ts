import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const countOrdersInProgressTool: Tool = {
  name: "count_orders_in_progress",
  description: "Count how many orders are currently in progress.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch("orders-count-in-progress-uuid", "GET");
    return {
      content: [
        {
          type: "text",
          text: `There are ${result.count} orders in progress.`,
        },
      ],
      structuredContent: result,
    };
  },
};

export const listOrdersToInvoiceTool: Tool = {
  name: "list_orders_to_invoice",
  description: "Get a list of completed orders that haven't been invoiced yet.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch("orders-to-invoice-uuid", "GET");
    return {
      content: [
        {
          type: "text",
          text: `Found ${result.results?.length || 0} orders to invoice.`,
        },
      ],
      structuredContent: result,
    };
  },
};

export const oldestUnfinishedOrderTool: Tool = {
  name: "oldest_unfinished_order",
  description: "Get the oldest order that is still in progress.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch("oldest-unfinished-order-uuid", "GET");
    return {
      content: [
        {
          type: "text",
          text: result.uuid 
            ? `Oldest unfinished order is ${result.number} from ${result.date}.`
            : "No unfinished orders found.",
        },
      ],
      structuredContent: result,
    };
  },
};
