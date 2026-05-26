import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { config } from "../../iflow/config.js";

const isoDateTime = z.string().min(8);

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

function flatten(args: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined || v === null) continue;
    out[k] = v as string | number | boolean;
  }
  return out;
}

export const updateOrderStatusTool: Tool = {
  name: "update_order_status",
  description:
    "Change an order's status (NEW/IN_PROCESS/FINISHED/CANCEL/OUT_OF_STOCK). Audited via ReportsRecentActivity. Disabled when IFLOW_READ_ONLY=1. Requires confirmation.",
  inputSchema: z.object({
    order_id: z.number().int().positive(),
    status: z.enum(["NEW", "IN_PROCESS", "FINISHED", "OUT_OF_STOCK", "CANCEL"]),
    note: z.string().optional(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("update_order_status");
    const { confirm, ...rest } = args;
    const result = await iflowClient.fetch<{ ok?: boolean; error?: string }>(
      "update_order_status",
      "GET",
      undefined,
      {
        query: flatten(rest as Record<string, unknown>),
        confirmToken: confirm ? "mcp_confirm=1" : undefined,
      }
    );
    return {
      content: [
        {
          type: "text",
          text: result.ok
            ? `Status updated to ${args.status} for order ${args.order_id}.`
            : `Failed: ${result.error ?? "unknown"}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
      isError: result.ok === false,
    };
  },
};

export const markOrderFinishedTool: Tool = {
  name: "mark_order_finished",
  description:
    "Mark an order as FINISHED (sets finish_date). Audited. Disabled when IFLOW_READ_ONLY=1.",
  inputSchema: z.object({
    order_id: z.number().int().positive(),
    finish_date: isoDateTime.optional(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("mark_order_finished");
    const { confirm, ...rest } = args;
    const result = await iflowClient.fetch<{ ok?: boolean; error?: string }>(
      "mark_order_finished",
      "GET",
      undefined,
      {
        query: flatten(rest as Record<string, unknown>),
        confirmToken: confirm ? "mcp_confirm=1" : undefined,
      }
    );
    return {
      content: [
        {
          type: "text",
          text: result.ok
            ? `Order ${args.order_id} marked FINISHED.`
            : `Failed: ${result.error ?? "unknown"}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
      isError: result.ok === false,
    };
  },
};

export const markOrderBilledTool: Tool = {
  name: "mark_order_billed",
  description:
    "Set the billing status of an order (PENDING/PARTIAL/PAID). Audited. Disabled when IFLOW_READ_ONLY=1.",
  inputSchema: z.object({
    order_id: z.number().int().positive(),
    billing_status: z.enum(["PENDING", "PARTIAL", "PAID"]),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("mark_order_billed");
    const { confirm, ...rest } = args;
    const result = await iflowClient.fetch<{ ok?: boolean; error?: string }>(
      "mark_order_billed",
      "GET",
      undefined,
      {
        query: flatten(rest as Record<string, unknown>),
        confirmToken: confirm ? "mcp_confirm=1" : undefined,
      }
    );
    return {
      content: [
        {
          type: "text",
          text: result.ok
            ? `Order ${args.order_id} billing set to ${args.billing_status}.`
            : `Failed: ${result.error ?? "unknown"}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
      isError: result.ok === false,
    };
  },
};

export const addClientNoteTool: Tool = {
  name: "add_client_note",
  description:
    "Add a ClientNote (CRM activity). Disabled when IFLOW_READ_ONLY=1. Requires confirmation.",
  inputSchema: z.object({
    client_id: z.number().int().positive(),
    subject: z.string().min(1).max(512),
    text: z.string().optional(),
    note_type_id: z.number().int().positive().optional(),
    reminder_date: isoDateTime.optional(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("add_client_note");
    const { confirm, ...rest } = args;
    const result = await iflowClient.fetch<{ ok?: boolean; error?: string; note_id?: number }>(
      "add_client_note",
      "GET",
      undefined,
      {
        query: flatten(rest as Record<string, unknown>),
        confirmToken: confirm ? "mcp_confirm=1" : undefined,
      }
    );
    return {
      content: [
        {
          type: "text",
          text: result.ok
            ? `Client note added (id=${result.note_id ?? "?"}).`
            : `Failed: ${result.error ?? "unknown"}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
      isError: result.ok === false,
    };
  },
};

export const addOfferCommentTool: Tool = {
  name: "add_offer_comment",
  description:
    "Add an OfferComment (linked to an authenticated employee). Disabled when IFLOW_READ_ONLY=1.",
  inputSchema: z.object({
    offer_id: z.number().int().positive(),
    text: z.string().min(1),
    subject: z.string().optional(),
    comment_action_id: z.number().int().positive().optional(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("add_offer_comment");
    const { confirm, ...rest } = args;
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: string;
      comment_id?: number;
    }>("add_offer_comment", "GET", undefined, {
      query: flatten(rest as Record<string, unknown>),
      confirmToken: confirm ? "mcp_confirm=1" : undefined,
    });
    return {
      content: [
        {
          type: "text",
          text: result.ok
            ? `Offer comment added (id=${result.comment_id ?? "?"}).`
            : `Failed: ${result.error ?? "unknown"}.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
      isError: result.ok === false,
    };
  },
};
