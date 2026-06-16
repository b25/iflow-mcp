import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listChatConversationsTool: Tool = {
  name: "list_chat_conversations",
  description:
    "WhatsApp Business / Chat conversations, latest-message first. Each row: " +
    "conversation_id, client (id+name) or contact name/phone, last message text + " +
    "timestamp + direction (in|out), derived status (necitit | asteapta_raspuns | " +
    "in_lucru), agent (from latest outbound message's sender) and unread count. " +
    "Filters: status (unread|awaiting_reply|all), agent_id, client_id, q (contact " +
    "search), from/to (last-message date), limit/offset.",
  inputSchema: z.object({
    status: z.enum(["unread", "awaiting_reply", "all"]).optional(),
    agent_id: z.number().int().positive().optional(),
    client_id: z.number().int().positive().optional(),
    q: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["status", "agent_id", "client_id", "q", "from", "to",
                     "limit", "offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_chat_conversations", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Chat conversations: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};

export const getChatConversationTool: Tool = {
  name: "get_chat_conversation",
  description:
    "One WhatsApp / Chat conversation by conversation_id: header (client/contact, " +
    "agent, status, unread count) plus its messages in chronological order " +
    "(message_id, expeditor/sender, text, timestamp, directie in|out). Optional " +
    "limit/offset paginate over the messages. Unknown id -> conversation_not_found.",
  inputSchema: z.object({
    conversation_id: z.number().int().positive(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["conversation_id", "limit", "offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "get_chat_conversation", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Conversation messages: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};

export const chatResponseTimeReportTool: Tool = {
  name: "chat_response_time_report",
  description:
    "WhatsApp / Chat response-time report. timp_mediu_raspuns_secunde is the mean " +
    "elapsed seconds between a customer's (inbound) message and the next agent " +
    "(outbound) reply within a conversation; consecutive inbound messages before a " +
    "reply count as one waiting block anchored at the first. Also returns " +
    "numar_conversatii, numar_mesaje, rata_fara_raspuns (share of waiting blocks " +
    "with no reply), and breakdowns by agent and by client. Filters: from/to " +
    "(period), agent_id, client_id.",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    agent_id: z.number().int().positive().optional(),
    client_id: z.number().int().positive().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["from", "to", "agent_id", "client_id"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "chat_response_time_report", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const avg = result.timp_mediu_raspuns_secunde;
    const avgText = typeof avg === "number" ? `${avg}s` : "n/a";
    return {
      content: [{ type: "text", text: `Avg chat response time: ${avgText}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
