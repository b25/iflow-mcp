import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listPartnersTool: Tool = {
  name: "list_partners",
  description: "List partners (suppliers / clients) from iflow.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{ results?: unknown[] }>("list_partners", "GET");
    return {
      content: [
        {
          type: "text",
          text: `Found ${result.results?.length ?? 0} partner(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const listOverdueCustomersTool: Tool = {
  name: "list_overdue_customers",
  description: "Customers with overdue balances (dedicated Api Point).",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{ results?: unknown[] }>(
      "list_overdue_customers",
      "GET"
    );
    return {
      content: [
        {
          type: "text",
          text: `Found ${result.results?.length ?? 0} overdue customer(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
