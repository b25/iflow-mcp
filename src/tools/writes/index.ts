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
    "Add a ClientNote (CRM activity). Disabled when IFLOW_READ_ONLY=1. Requires confirmation. Optional notify_employee_ids = employee ids to receive the reminder; defaults to the note author so a reminder always has a recipient.",
  inputSchema: z.object({
    client_id: z.number().int().positive(),
    subject: z.string().min(1).max(512),
    text: z.string().optional(),
    note_type_id: z.number().int().positive().optional(),
    reminder_date: isoDateTime.optional(),
    notify_employee_ids: z.array(z.number().int().positive()).optional(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("add_client_note");
    const { confirm, notify_employee_ids, ...rest } = args;
    const query = flatten(rest as Record<string, unknown>);
    if (Array.isArray(notify_employee_ids) && notify_employee_ids.length > 0) {
      query.notify_employee_ids = (notify_employee_ids as number[]).join(",");
    }
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: string;
      note_id?: number;
    }>("add_client_note", "GET", undefined, {
      query,
      confirmToken: confirm ? "mcp_confirm=1" : undefined,
    });
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

const opportunityLine = z
  .object({
    produs_id: z.number().int().positive(),
    latime: z.number().optional(),
    lungime: z.number().optional(),
    bucati: z.number().optional(),
    cantitate: z.number().optional(),
    pret_unitar_fara_tva: z.number().optional(),
  })
  .passthrough();

const opportunityAttachment = z
  .object({
    nume_fisier: z.string().min(1),
    mime_type: z.string().optional(),
    continut_base64: z.string().optional(),
    url: z.string().optional(),
  })
  .passthrough();

export const createOpportunityTool: Tool = {
  name: "create_opportunity",
  description:
    "Create a new opportunity (persisted as an Offer/Oferta), aligned to the " +
    "'Oportunitate Noua' form. Ideal for turning an email into an offer. " +
    "Required: client_id (resolve via list_clients_search by email/name), titlu, " +
    "linii (>=1 item, each with produs_id). Optional: flux_id (default workflow), " +
    "external_ref (idempotency key; a repeat returns the existing opportunity with " +
    "already_existed=true), data (default today), valabilitate (default data+30d), " +
    "valuta (default instance currency), cota_tva (fraction 0.21 or percent 21; " +
    "default firm VAT), specificatii (email body, saved verbatim), persoana_contact " +
    "(contact person id or name), etichete (existing OfferTag ids/names), atasamente " +
    "(each nume_fisier + continut_base64 or url; upload failure does not roll back). " +
    "Per-line numerics omitted default to 1 ('de revizuit'). Disabled when " +
    "IFLOW_READ_ONLY=1. Requires confirmation.",
  inputSchema: z.object({
    client_id: z.number().int().positive(),
    titlu: z.string().min(1),
    linii: z.array(opportunityLine).min(1),
    flux_id: z.number().int().positive().optional(),
    external_ref: z.string().optional(),
    data: z.string().optional(),
    valabilitate: z.string().optional(),
    valuta: z.string().optional(),
    cota_tva: z.number().optional(),
    specificatii: z.string().optional(),
    persoana_contact: z.union([z.number().int().positive(), z.string()]).optional(),
    etichete: z.array(z.union([z.number().int().positive(), z.string()])).optional(),
    atasamente: z.array(opportunityAttachment).optional(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("create_opportunity");
    const {
      confirm,
      linii,
      etichete,
      atasamente,
      persoana_contact,
      ...rest
    } = args;
    const query = flatten(rest as Record<string, unknown>);
    query.linii = JSON.stringify(linii);
    if (etichete !== undefined) query.etichete = JSON.stringify(etichete);
    if (atasamente !== undefined) query.atasamente = JSON.stringify(atasamente);
    if (persoana_contact != null) {
      query.persoana_contact = persoana_contact as string | number;
    }
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: { code?: string; message?: string };
      opportunity_id?: number;
      already_existed?: boolean;
    }>("create_opportunity", "GET", undefined, {
      query,
      confirmToken: confirm ? "mcp_confirm=1" : undefined,
    });
    const errored = result.ok === false || result.error != null;
    let text: string;
    if (errored) {
      const err = result.error;
      text = `Failed: ${err?.message ?? err?.code ?? "unknown"}.`;
    } else if (result.already_existed) {
      text = `Opportunity already exists (id=${result.opportunity_id ?? "?"}).`;
    } else {
      text = `Opportunity created (id=${result.opportunity_id ?? "?"}).`;
    }
    return {
      content: [{ type: "text", text }],
      structuredContent: result as Record<string, unknown>,
      isError: errored,
    };
  },
};

export const tagEntityTool: Tool = {
  name: "tag_entity",
  description:
    "Add or remove tags on a CRM entity: client (Clienti), order (Orders), " +
    "offer (Offer) or invoice (FiscalBill). Resolve entity_id via the matching " +
    "listing first; never invent it. tags is a list of tag ids or names (each " +
    "resolved by id first, else by case-insensitive trimmed name). action is " +
    "'add' (default) or 'remove'. add is idempotent (already-attached tags are " +
    "skipped). For unknown tag NAMES on add: with create_missing=false (default) " +
    "they are returned in tags_missing (NOT created) — ask the user, then re-call " +
    "with create_missing=true to create (default color) and attach them. remove " +
    "detaches resolved/attached tags (tags_removed); names not found or not " +
    "attached are returned in tags_not_found (not an error). The add path is " +
    "journaled by the existing tag signal; removes write their own audit row. " +
    "Disabled when IFLOW_READ_ONLY=1. Requires confirmation.",
  inputSchema: z.object({
    entity_type: z.enum(["client", "order", "offer", "invoice"]),
    entity_id: z.number().int().positive(),
    tags: z
      .array(z.union([z.number().int().positive(), z.string().min(1)]))
      .min(1),
    action: z.enum(["add", "remove"]).optional(),
    create_missing: z.boolean().optional(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("tag_entity");
    const { confirm, tags, create_missing, ...rest } = args;
    const query = flatten(rest as Record<string, unknown>);
    query.tags = JSON.stringify(tags);
    if (create_missing !== undefined) {
      query.create_missing = create_missing ? "true" : "false";
    }
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: { code?: string; message?: string };
      action?: string;
      tags_attached?: unknown[];
      tags_created?: unknown[];
      tags_missing?: unknown[];
      tags_removed?: unknown[];
      tags_not_found?: unknown[];
    }>("tag_entity", "GET", undefined, {
      query,
      confirmToken: confirm ? "mcp_confirm=1" : undefined,
    });
    const errored = result.ok === false || result.error != null;
    let text: string;
    if (errored) {
      const err = result.error;
      text = `Failed: ${err?.message ?? err?.code ?? "unknown"}.`;
    } else if (result.action === "remove") {
      const removed = (result.tags_removed ?? []).length;
      const nf = (result.tags_not_found ?? []).length;
      text =
        `Removed ${removed} tag(s) from ${args.entity_type} ${args.entity_id}` +
        (nf ? `; ${nf} not found/attached.` : ".");
    } else {
      const attached = (result.tags_attached ?? []).length;
      const created = (result.tags_created ?? []).length;
      const missing = (result.tags_missing ?? []).length;
      text =
        `Tagged ${args.entity_type} ${args.entity_id}: ${attached} added` +
        (created ? `, ${created} created` : "") +
        (missing
          ? `; ${missing} missing (re-call with create_missing=true to create).`
          : ".");
    }
    return {
      content: [{ type: "text", text }],
      structuredContent: result as Record<string, unknown>,
      isError: errored,
    };
  },
};
