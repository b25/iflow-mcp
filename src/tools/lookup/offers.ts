import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const latestOfferForClientTool: Tool = {
  name: "latest_offer_for_client",
  description: "Latest offer for a client (client_uuid query; dedicated Api Point).",
  inputSchema: z.object({
    client_uuid: z.string().uuid(),
  }),
  execute: async ({ client_uuid }): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "latest_offer_for_client",
      "GET",
      undefined,
      { query: { client_uuid } }
    );
    return {
      content: [
        {
          type: "text",
          text: result.uuid
            ? `Latest offer ${String(result.number ?? "")} from ${String(result.date ?? "")}.`
            : "No offer found for this client.",
        },
      ],
      structuredContent: result,
    };
  },
};
