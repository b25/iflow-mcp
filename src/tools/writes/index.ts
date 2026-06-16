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

export const sendClientEmailTool: Tool = {
  name: "send_client_email",
  description:
    "Send an email to a client using the SAME mechanism as the manual UI " +
    "'send email to client' action: it records an EmailTracking row and a " +
    "client 'E-mail' activity (visible in document_communications / the " +
    "client history), and is journaled to the acting user. It does NOT " +
    "hand-roll SMTP. Required: client_id (resolve via list_clients_search; " +
    "never invent it), subject, body. The recipient is auto-resolved from the " +
    "client profile (contact_email + ClientiContactPerson). When the client " +
    "has MORE THAN ONE email address and you did not pick one, the call fails " +
    "with error 'recipients_ambiguous' and a recipients_ambiguous list " +
    "(contact_id, email, name) — ASK the user which address, then re-call with " +
    "contact_id or recipient_email; never guess. recipient_email must be one " +
    "of the client's known addresses. ALWAYS confirm before sending. Disabled " +
    "when IFLOW_READ_ONLY=1. Requires confirmation.",
  inputSchema: z.object({
    client_id: z.number().int().positive(),
    subject: z.string().min(1).max(512),
    body: z.string().min(1),
    contact_id: z.number().int().positive().optional(),
    recipient_email: z.string().email().optional(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("send_client_email");
    const { confirm, ...rest } = args;
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: string;
      message?: string;
      recipients?: string[];
      sent_at?: string;
      recipients_ambiguous?: Array<{
        contact_id?: number | null;
        email?: string;
        name?: string;
      }>;
    }>("send_client_email", "GET", undefined, {
      query: flatten(rest as Record<string, unknown>),
      confirmToken: confirm ? "mcp_confirm=1" : undefined,
    });
    const errored = result.ok === false;
    let text: string;
    if (!errored) {
      const to = (result.recipients ?? []).join(", ");
      text = `Email sent to ${to || "client"} (client ${args.client_id}).`;
    } else if (result.error === "recipients_ambiguous") {
      const list = (result.recipients_ambiguous ?? [])
        .map(
          (c) =>
            `${c.email ?? "?"}${c.name ? ` (${c.name})` : ""}` +
            (c.contact_id != null ? ` [contact_id=${c.contact_id}]` : "")
        )
        .join(", ");
      text =
        `Multiple email addresses on file; ask which one and re-call with ` +
        `contact_id or recipient_email. Candidates: ${list}.`;
    } else {
      text = `Failed: ${result.message ?? result.error ?? "unknown"}.`;
    }
    return {
      content: [{ type: "text", text }],
      structuredContent: result as Record<string, unknown>,
      isError: errored,
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
    "Create a new opportunity in Vanzari -> Oportunitati (a real Opportunity, " +
    "status Noua; it appears in list_opportunities), aligned to the " +
    "'Oportunitate Noua' form. Ideal for turning an email into an opportunity. " +
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

const taskAttachment = z
  .object({
    nume_fisier: z.string().min(1),
    mime_type: z.string().optional(),
    continut_base64: z.string().optional(),
    url: z.string().optional(),
  })
  .passthrough();

export const createTaskTool: Tool = {
  name: "create_task",
  description:
    "Create a task (sarcina) inside a task-flow, aligned to the desktop " +
    "'Creeaza o sarcina' form. Required: titlu. flux_id is required ONLY when " +
    "several active task-flows exist; with exactly one active flow it is " +
    "auto-selected silently. If multiple exist and flux_id is omitted the call " +
    "returns a flux_required error listing available_flows (id + name) — ask " +
    "the user, then re-call with a real flux_id. Optional (set only when " +
    "provided; no invented defaults): descriere, responsabil (assignee id or " +
    "name, resolved to an active employee), comanda (order id, validated), " +
    "confidentialitate (privat|public), prioritate (scazut|mediu|ridicat|" +
    "critic), termen_limita (date or datetime), timp_estimat (minutes), memento " +
    "(datetime), memento_angajati (employee ids/names), frecventa (fara|zilnic|" +
    "saptamanal|lunar|trimestrial|semestrial|anual), progres (0..100), etichete " +
    "(existing TasksTag ids/names; unmatched returned in tags_missing, NOT " +
    "created), documente (each nume_fisier + continut_base64 or url; upload " +
    "failure does not roll back). Disabled when IFLOW_READ_ONLY=1. Requires " +
    "confirmation.",
  inputSchema: z.object({
    titlu: z.string().min(1),
    flux_id: z.number().int().positive().optional(),
    descriere: z.string().optional(),
    responsabil: z.union([z.number().int().positive(), z.string()]).optional(),
    comanda: z.number().int().positive().optional(),
    confidentialitate: z.enum(["privat", "public"]).optional(),
    prioritate: z.enum(["scazut", "mediu", "ridicat", "critic"]).optional(),
    termen_limita: z.string().optional(),
    timp_estimat: z.number().int().nonnegative().optional(),
    memento: z.string().optional(),
    memento_angajati: z
      .array(z.union([z.number().int().positive(), z.string()]))
      .optional(),
    frecventa: z
      .enum([
        "fara",
        "zilnic",
        "saptamanal",
        "lunar",
        "trimestrial",
        "semestrial",
        "anual",
      ])
      .optional(),
    progres: z.number().int().min(0).max(100).optional(),
    etichete: z
      .array(z.union([z.number().int().positive(), z.string()]))
      .optional(),
    documente: z.array(taskAttachment).optional(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("create_task");
    const {
      confirm,
      responsabil,
      memento_angajati,
      etichete,
      documente,
      ...rest
    } = args;
    const query = flatten(rest as Record<string, unknown>);
    if (responsabil != null) {
      query.responsabil = responsabil as string | number;
    }
    if (memento_angajati !== undefined) {
      query.memento_angajati = JSON.stringify(memento_angajati);
    }
    if (etichete !== undefined) query.etichete = JSON.stringify(etichete);
    if (documente !== undefined) query.documente = JSON.stringify(documente);
    const result = await iflowClient.fetch<{
      ok?: boolean;
      error?: { code?: string; message?: string; available_flows?: unknown[] };
      task_id?: number;
      flux_id?: number;
      flux_name?: string;
      tags_missing?: unknown[];
    }>("create_task", "GET", undefined, {
      query,
      confirmToken: confirm ? "mcp_confirm=1" : undefined,
    });
    const errored = result.ok === false || result.error != null;
    let text: string;
    if (errored) {
      const err = result.error;
      if (err?.code === "flux_required") {
        const flows = (err.available_flows ?? []) as Array<{
          id?: number;
          name?: string;
        }>;
        const list = flows
          .map((f) => `${f.id}: ${f.name ?? ""}`)
          .join(", ");
        text =
          `Multiple task-flows exist; pass flux_id. Available: ${list}.`;
      } else {
        text = `Failed: ${err?.message ?? err?.code ?? "unknown"}.`;
      }
    } else {
      const missing = (result.tags_missing ?? []).length;
      text =
        `Task created (id=${result.task_id ?? "?"}) in flow ` +
        `${result.flux_name ?? result.flux_id ?? "?"}` +
        (missing ? `; ${missing} tag(s) missing.` : ".");
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
