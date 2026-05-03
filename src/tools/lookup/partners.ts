import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listPartnersTool: Tool = {
  name: "list_partners",
  description: "Get a list of all partners (suppliers/clients).",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch("partners-uuid", "GET");
    return {
      content: [
        {
          type: "text",
          text: `Found ${result.results?.length || 0} partners.`,
        },
      ],
      structuredContent: result,
    };
  },
};

export const listOverdueCustomersTool: Tool = {
  name: "list_overdue_customers",
  description: "List customers with overdue payments.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch("overdue-customers-uuid", "GET");
    return {
      content: [
        {
          type: "text",
          text: `Found ${result.results?.length || 0} customers with overdue payments.`,
        },
      ],
      structuredContent: result,
    };
  },
};
