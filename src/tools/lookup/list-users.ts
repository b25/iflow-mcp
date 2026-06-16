import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listUsersTool: Tool = {
  name: "list_users",
  description:
    "List internal users (employees): user_id, nume (full name), username, " +
    "email, rol (owner/manager/agent/operator/client, derived from " +
    "permissions), nivel_acces (access level: Companie/Echipa/Personal), " +
    "departament (id+nume), activ and last_login. Defaults to internal users " +
    "(Admin + Employee); set include_external to also include Client portal " +
    "accounts (never Api system accounts). Filters: department_id, role, " +
    "active (bool), q (search over name/username/email), limit, offset. " +
    "Responds with {results, count, next_offset, filters}.",
  inputSchema: z.object({
    department_id: z.number().int().positive().optional(),
    role: z.string().optional(),
    active: z.boolean().optional(),
    q: z.string().optional(),
    include_external: z.boolean().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<{
      results?: unknown[];
      count?: number;
    }>("list_users", "GET", undefined, { query: q });
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} user(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
