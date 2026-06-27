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

export const sendEmailCampaignTool: Tool = {
  name: "send_email_campaign",
  description:
    "Send an email campaign to ALL its recipients immediately. This is a " +
    "destructive, irreversible operation — once sent, emails cannot be recalled. " +
    "REQUIRES confirmation (pass confirm=true). Returns {ok, campaign_id, " +
    "recipient_count}. Disabled when IFLOW_READ_ONLY=1.",
  inputSchema: z.object({
    campaign_id: z.number().int().positive(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("send_email_campaign");
    const { confirm, ...rest } = args;
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: string;
      campaign_id?: number;
      recipient_count?: number;
    }>("send_email_campaign", "GET", undefined, {
      query: flatten(rest as Record<string, unknown>),
      confirmToken: confirm ? "mcp_confirm=1" : undefined,
    });
    return {
      content: [
        {
          type: "text",
          text: result.ok
            ? `Campaign ${result.campaign_id ?? args.campaign_id} sent to ${result.recipient_count ?? "?"} recipients.`
            : `Failed: ${result.error ?? "unknown"}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
      isError: result.ok === false,
    };
  },
};

export const scheduleEmailCampaignTool: Tool = {
  name: "schedule_email_campaign",
  description:
    "Schedule an email campaign to be sent at a future date/time. " +
    "Required: campaign_id, scheduled_date (ISO 8601 datetime). " +
    "REQUIRES confirmation (pass confirm=true). Returns {ok, campaign_id, " +
    "scheduled_date}. Disabled when IFLOW_READ_ONLY=1.",
  inputSchema: z.object({
    campaign_id: z.number().int().positive(),
    scheduled_date: z.string().min(10),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("schedule_email_campaign");
    const { confirm, ...rest } = args;
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: string;
      campaign_id?: number;
      scheduled_date?: string;
    }>("schedule_email_campaign", "GET", undefined, {
      query: flatten(rest as Record<string, unknown>),
      confirmToken: confirm ? "mcp_confirm=1" : undefined,
    });
    return {
      content: [
        {
          type: "text",
          text: result.ok
            ? `Campaign ${result.campaign_id ?? args.campaign_id} scheduled for ${result.scheduled_date ?? args.scheduled_date}.`
            : `Failed: ${result.error ?? "unknown"}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
      isError: result.ok === false,
    };
  },
};

export const sendCampaignTestTool: Tool = {
  name: "send_campaign_test",
  description:
    "Send a test email for a campaign to its configured seed_email address. " +
    "Safe to call without confirmation — does NOT send to real recipients. " +
    "Required: campaign_id. Returns {ok, sent_to}. Disabled when IFLOW_READ_ONLY=1.",
  inputSchema: z.object({
    campaign_id: z.number().int().positive(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("send_campaign_test");
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: string;
      sent_to?: string;
    }>("send_campaign_test", "GET", undefined, {
      query: flatten(args as Record<string, unknown>),
    });
    return {
      content: [
        {
          type: "text",
          text: result.ok
            ? `Test email for campaign ${args.campaign_id} sent to ${result.sent_to ?? "?"}.`
            : `Failed: ${result.error ?? "unknown"}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
      isError: result.ok === false,
    };
  },
};

export const stopEmailCampaignTool: Tool = {
  name: "stop_email_campaign",
  description:
    "Halt a currently running or scheduled email campaign send. " +
    "Safe to call without confirmation. Required: campaign_id. " +
    "Returns {ok, campaign_id, status}. Disabled when IFLOW_READ_ONLY=1.",
  inputSchema: z.object({
    campaign_id: z.number().int().positive(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("stop_email_campaign");
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: string;
      campaign_id?: number;
      status?: string;
    }>("stop_email_campaign", "GET", undefined, {
      query: flatten(args as Record<string, unknown>),
    });
    return {
      content: [
        {
          type: "text",
          text: result.ok
            ? `Campaign ${result.campaign_id ?? args.campaign_id} stopped (status: ${result.status ?? "?"}).`
            : `Failed: ${result.error ?? "unknown"}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
      isError: result.ok === false,
    };
  },
};
