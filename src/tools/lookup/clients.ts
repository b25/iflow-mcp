import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { fetchAllPages, PaginatedResponse } from "../../iflow/pagination.js";

export const listClientsTool: Tool = {
  name: "list_clients",
  description:
    "List clients from iflow (paginated). Use all_pages=true to merge up to IFLOW_MAX_PAGES_PER_CALL pages.",
  inputSchema: z.object({
    all_pages: z.boolean().optional().default(false),
  }),
  execute: async ({ all_pages }): Promise<MCPToolResult> => {
    const fetchPage = (page: number) =>
      iflowClient.fetch<PaginatedResponse<Record<string, unknown>>>(
        "list_clients",
        "GET",
        undefined,
        { query: { page, page_size: 100 } }
      );

    const first = await fetchPage(1);
    const rows = all_pages ? await fetchAllPages(fetchPage) : first.results;

    return {
      content: [{ type: "text", text: `Found ${rows.length} client(s).` }],
      structuredContent: { results: rows, count: rows.length },
    };
  },
};

export const getClientTool: Tool = {
  name: "get_client",
  description:
    "Full detail for a single client by client_id: identity (code, name, alias, " +
    "tax_code, client_type), address (district, locality, street, zip_code, " +
    "country, website), status, sold_restant (from live receivables) and the " +
    "contact block — contact_email, phone, and contact_persons [{nume, email, " +
    "phone}]. Unknown id -> client_not_found. Resolve the client name to an id " +
    "first via list_clients_search.",
  inputSchema: z.object({
    client_id: z.union([z.number().int().positive(), z.string().min(1)]),
  }),
  execute: async ({ client_id }): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "get_client",
      "GET",
      undefined,
      { query: { client_id } }
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
    return {
      content: [
        { type: "text", text: `Client ${String(result.name ?? client_id)} found.` },
      ],
      structuredContent: { data: result },
      isError: false,
    };
  },
};
