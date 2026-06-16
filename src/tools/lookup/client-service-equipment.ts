import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listClientServiceEquipmentTool: Tool = {
  name: "list_client_service_equipment",
  description:
    "Service-section equipment registered for a client (the client-owned " +
    "machines the company services, from tbl_service): equipment id, name/alias, " +
    "serial, model, manufacturer, template, date added, plus the template-defined " +
    "dynamic fields. Pass include_history=true to also get each equipment's " +
    "intervention history (latest-first). Ordered latest-first. " +
    "Filters: client_id (required), include_history, limit, offset.",
  inputSchema: z.object({
    client_id: z.number().int().positive(),
    include_history: z.boolean().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {
      client_id: args.client_id,
    };
    for (const k of ["include_history", "limit", "offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_client_service_equipment", "GET", undefined, { query: q }
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
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Service equipment: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
