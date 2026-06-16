import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listEmailFlowsTool: Tool = {
  name: "list_email_flows",
  description:
    "Marketing email funnels ('Fluxuri de E-mail', EmailFlow): the marketing " +
    "drip funnels, NOT the production order workflows behind list_work_flows. " +
    "Each row has flow_id, nume, note, activ, etichete (tag names) and " +
    "status_client. The filters block also returns active_count (total active " +
    "flows regardless of paging) so you can answer 'how many active email " +
    "flows'. Use get_email_flow for the template steps + rules. Filters: " +
    "active (bool), status_client (0=Prospect|1=Activ|2=Inactiv), q (name).",
  inputSchema: z.object({
    active: z.boolean().optional(),
    status_client: z.number().int().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const k of ["active", "status_client", "q",
                     "limit", "offset"] as const) {
      const v = (args as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_email_flows", "GET", undefined,
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
          text: `Email flows: ${count} (active: ${activeCount}).`,
        },
      ],
      structuredContent: result,
      isError: false,
    };
  },
};

export const getEmailFlowTool: Tool = {
  name: "get_email_flow",
  description:
    "A single marketing email funnel ('Flux de E-mail', EmailFlow) by " +
    "flow_id. Returns the list-row fields plus sabloane (the email template " +
    "steps, ordered by Ordine/position, each with ordine, sablon_id, " +
    "sablon_nume and interval_zile = days before sending relative to the " +
    "previous step) and reguli (include_contactele, scoate_client_din_flux = " +
    "the exit condition label, ora_de_trimis = send time). Unknown id returns " +
    "an error (flow_not_found). Required: flow_id.",
  inputSchema: z.object({
    flow_id: z.number().int().positive(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {
      flow_id: args.flow_id,
    };
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "get_email_flow", "GET", undefined, { query: q }
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
    const steps = Array.isArray(result.sabloane) ? result.sabloane.length : 0;
    return {
      content: [
        {
          type: "text",
          text: `Email flow: ${String(result.nume ?? "")} ` +
            `(${steps} template steps).`,
        },
      ],
      structuredContent: result,
      isError: false,
    };
  },
};
