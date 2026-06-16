import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listFormsTool: Tool = {
  name: "list_forms",
  description:
    "Marketing forms ('Formulare', FormTemplate): the public lead/intake " +
    "forms. Each row has form_id, nume, alias (display title), custom_url/" +
    "slug, activ, submissions_count, config_status (green = generates an " +
    "opportunity / orange = record-only) with a config_status_label, " +
    "data_crearii and ultima_completare (last submission date, null if none). " +
    "The filters block also returns active_count (total active forms " +
    "regardless of paging) so you can answer 'how many active forms'. Use " +
    "get_form for the full config and list_form_submissions for the entries. " +
    "Filters: active (bool), q (name/alias).",
  inputSchema: z.object({
    active: z.boolean().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["active", "q", "limit", "offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_forms", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    const filters =
      result.filters && typeof result.filters === "object"
        ? (result.filters as Record<string, unknown>)
        : {};
    const activeCount =
      typeof filters.active_count === "number" ? filters.active_count : 0;
    return {
      content: [
        {
          type: "text",
          text: `Forms: ${count} (active: ${activeCount}).`,
        },
      ],
      structuredContent: result,
      isError: false,
    };
  },
};

export const getFormTool: Tool = {
  name: "get_form",
  description:
    "A single marketing form ('Formular', FormTemplate) by form_id. Returns " +
    "the list-row fields plus notificare (notified employees), embed (public " +
    "link + iframe embed_code), auto_redirect (url + flag), sectiuni " +
    "(client_info / extra_fields / products booleans), produse_config (when " +
    "Products is on: flux_de_lucru, valabilitate_oportunitate, produse) and " +
    "campuri (the defined custom fields, each with nume, tip = Text|Numar|" +
    "Select|Data, optiuni for Select, valoare_implicita and obligatoriu). " +
    "Unknown id returns an error (form_not_found). Required: form_id.",
  inputSchema: z.object({
    form_id: z.number().int().positive(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {
      form_id: args.form_id,
    };
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "get_form", "GET", undefined, { query: q }
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
    const fields = Array.isArray(result.campuri) ? result.campuri.length : 0;
    return {
      content: [
        {
          type: "text",
          text: `Form: ${String(result.alias ?? result.nume ?? "")} ` +
            `(${fields} fields).`,
        },
      ],
      structuredContent: result,
      isError: false,
    };
  },
};

export const listFormSubmissionsTool: Tool = {
  name: "list_form_submissions",
  description:
    "Submissions of one marketing form ('Completari Formular', " +
    "FormSubmittedData) by form_id. Each row has submission_id, data, client " +
    "(id+nume, with creat_ca_prospect flagging a client created as Prospect on " +
    "submit), oportunitati (the generated opportunity/order ids + links), " +
    "documente (uploaded files) and raspunsuri (answers grouped by " +
    "client_info / extra_fields / products). Sorted newest first. Unknown id " +
    "returns an error (form_not_found). Required: form_id. Optional filters: " +
    "from / to (submission date).",
  inputSchema: z.object({
    form_id: z.number().int().positive(),
    from: z.string().optional(),
    to: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {
      form_id: args.form_id,
    };
    for (const k of ["from", "to", "limit", "offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_form_submissions", "GET", undefined, { query: q }
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
      content: [
        {
          type: "text",
          text: `Form submissions: ${count}.`,
        },
      ],
      structuredContent: result,
      isError: false,
    };
  },
};
