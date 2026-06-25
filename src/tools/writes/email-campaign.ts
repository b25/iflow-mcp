import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { config } from "../../iflow/config.js";

function readOnlyError(action: string): MCPToolResult {
  return {
    content: [
      {
        type: "text",
        text: `Refused: ${action} is a write operation but IFLOW_READ_ONLY=1.`,
      },
    ],
    isError: true,
  };
}

function flatten(
  args: Record<string, unknown>
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined || v === null) continue;
    out[k] = v as string | number | boolean;
  }
  return out;
}

export const createEmailCampaignTool: Tool = {
  name: "create_email_campaign",
  description:
    "Create a new marketing email campaign (Campanie E-mail). Required: name. " +
    "Optional targeting filters: caen_include/caen_exclude (comma-joined CAEN codes), " +
    "tags (comma-joined tag names), district_include/district_exclude, locality, " +
    "sub_client_type, client_type, client_status, order_start_date/order_end_date " +
    "(ISO dates), include_contacts (bool). Campaign content: subject, from_name, " +
    "from_email, body (HTML). Scheduling: scheduled (bool), scheduled_date (ISO). " +
    "Creation/scheduling NEVER sends — sending is a separate confirmed action. " +
    "Disabled when IFLOW_READ_ONLY=1.",
  inputSchema: z.object({
    name: z.string().min(1),
    note: z.string().optional(),
    subject: z.string().optional(),
    from_name: z.string().optional(),
    from_email: z.string().optional(),
    body: z.string().optional(),
    scheduled: z.boolean().optional(),
    scheduled_date: z.string().optional(),
    caen_include: z.array(z.string()).optional(),
    caen_exclude: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    district_include: z.array(z.string()).optional(),
    district_exclude: z.array(z.string()).optional(),
    locality: z.string().optional(),
    sub_client_type: z.union([z.string(), z.number()]).optional(),
    client_type: z.number().optional(),
    client_status: z.number().optional(),
    order_start_date: z.string().optional(),
    order_end_date: z.string().optional(),
    include_contacts: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("create_email_campaign");
    const {
      caen_include,
      caen_exclude,
      tags,
      district_include,
      district_exclude,
      ...rest
    } = args;
    const query = flatten(rest as Record<string, unknown>);
    if (Array.isArray(caen_include) && caen_include.length > 0) {
      query.caen_include = caen_include.join(",");
    }
    if (Array.isArray(caen_exclude) && caen_exclude.length > 0) {
      query.caen_exclude = caen_exclude.join(",");
    }
    if (Array.isArray(tags) && tags.length > 0) {
      query.tags = tags.join(",");
    }
    if (Array.isArray(district_include) && district_include.length > 0) {
      query.district_include = district_include.join(",");
    }
    if (Array.isArray(district_exclude) && district_exclude.length > 0) {
      query.district_exclude = district_exclude.join(",");
    }
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: string;
      campaign_id?: number;
      recipient_count?: number;
      unresolved?: unknown;
    }>("create_email_campaign", "GET", undefined, { query });
    return {
      content: [
        {
          type: "text",
          text: result.ok
            ? `Email campaign created (id=${result.campaign_id ?? "?"}, recipients=${result.recipient_count ?? "?"}).`
            : `Failed: ${result.error ?? "unknown"}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
      isError: result.ok === false,
    };
  },
};

export const setCampaignHtmlTool: Tool = {
  name: "set_campaign_html",
  description:
    "Set or replace the HTML body of an existing email campaign. " +
    "Required: campaign_id, body (HTML string). Does NOT send — " +
    "sending is a separate confirmed action. Disabled when IFLOW_READ_ONLY=1.",
  inputSchema: z.object({
    campaign_id: z.number().int().positive(),
    body: z.string().min(1),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("set_campaign_html");
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: string;
    }>("set_campaign_html", "GET", undefined, {
      query: flatten(args as Record<string, unknown>),
    });
    return {
      content: [
        {
          type: "text",
          text: result.ok
            ? `Campaign ${args.campaign_id} HTML body updated.`
            : `Failed: ${result.error ?? "unknown"}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
      isError: result.ok === false,
    };
  },
};

export const uploadCampaignAssetTool: Tool = {
  name: "upload_campaign_asset",
  description:
    "Upload an image asset for use in email campaign HTML (inline or as header). " +
    "Required: image_base64 (base64-encoded image content). Optional: filename, mime " +
    "(e.g. image/png). Returns {ok, url} where url is the absolute CDN/media URL to " +
    "embed in campaign HTML. Disabled when IFLOW_READ_ONLY=1.",
  inputSchema: z.object({
    image_base64: z.string().min(1),
    filename: z.string().optional(),
    mime: z.string().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("upload_campaign_asset");
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: string;
      url?: string;
    }>("upload_campaign_asset", "GET", undefined, {
      query: flatten(args as Record<string, unknown>),
    });
    return {
      content: [
        {
          type: "text",
          text: result.ok
            ? `Asset uploaded: ${result.url ?? "?"}.`
            : `Failed: ${result.error ?? "unknown"}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
      isError: result.ok === false,
    };
  },
};

export const getEmailCampaignTool: Tool = {
  name: "get_email_campaign",
  description:
    "Fetch full details of a single email campaign by id: name, subject, from_name, " +
    "from_email, body (HTML), status, scheduled_date, recipient_count, sent_count, " +
    "created_at, and targeting filters.",
  inputSchema: z.object({
    campaign_id: z.number().int().positive(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "get_email_campaign",
      "GET",
      undefined,
      { query: { campaign_id: args.campaign_id } }
    );
    const ok = result.ok !== false && !result.error;
    return {
      content: [
        {
          type: "text",
          text: ok
            ? `Campaign ${args.campaign_id}: ${result.name ?? "?"}.`
            : `Failed: ${String(result.error ?? "unknown")}.`,
        },
      ],
      structuredContent: result,
      isError: !ok,
    };
  },
};
