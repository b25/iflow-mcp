import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const latestOfferForClientTool: Tool = {
  name: "latest_offer_for_client",
  description: "Get the most recent offer sent to a specific client.",
  inputSchema: z.object({
    client_uuid: z.string().uuid(),
  }),
  execute: async ({ client_uuid }): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch(`latest-offer-uuid?client=${client_uuid}`, "GET");
    return {
      content: [
        {
          type: "text",
          text: result.uuid 
            ? `Latest offer for client is ${result.number} from ${result.date}.`
            : "No offers found for this client.",
        },
      ],
      structuredContent: result,
    };
  },
};
