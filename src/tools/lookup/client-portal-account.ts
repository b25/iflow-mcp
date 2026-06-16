import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const clientPortalAccountTool: Tool = {
  name: "get_client_portal_account",
  description:
    "Client portal login account (the \"Cont\" tab on the client fiche). " +
    "Returns has_account (whether the client has a portal login), email + " +
    "username (the configured \"E-mail Utilizator\" and the value used at " +
    "login; null if no account), is_active, last_login (ISO datetime, null if " +
    "never), and logins (recent login history, latest-first, each with " +
    "datetime + ip) when include_logins is true (default, capped at 50). A " +
    "client that exists but has no portal account returns has_account=false " +
    "with nulls (not an error). Filters: client_id (required), include_logins.",
  inputSchema: z.object({
    client_id: z.number().int().positive(),
    include_logins: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {
      client_id: args.client_id,
    };
    const incl = (args as Record<string, unknown>).include_logins;
    if (incl !== undefined && incl !== null) q.include_logins = incl as boolean;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "get_client_portal_account", "GET", undefined, { query: q }
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
    const hasAccount = result.has_account === true;
    const text = hasAccount
      ? `Portal account: yes (${String(result.username ?? result.email ?? "")}).`
      : "Portal account: none.";
    return {
      content: [{ type: "text", text }],
      structuredContent: result,
      isError: false,
    };
  },
};
