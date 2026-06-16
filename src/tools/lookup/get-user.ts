import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const getUserTool: Tool = {
  name: "get_user",
  description:
    "Single internal user (employee) by user_id with full detail: nume, " +
    "username, email, rol (owner/manager/agent/operator/client), nivel_acces " +
    "(Companie/Echipa/Personal) + raw nivel_acces_cod, departament (id+nume), " +
    "functie (job title), company_admin, mobile_enabled, grupuri (Django " +
    "groups), telefon, activ and last_login. Filter: user_id (required). " +
    "Unknown id returns error code user_not_found.",
  inputSchema: z.object({
    user_id: z.number().int().positive(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "get_user", "GET", undefined, { query: { user_id: args.user_id } }
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
    const text = `User: ${String(result.nume ?? result.username ?? "")} (${String(
      result.rol ?? ""
    )}).`;
    return {
      content: [{ type: "text", text }],
      structuredContent: result,
      isError: false,
    };
  },
};
