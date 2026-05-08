import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { fetchAllPages, PaginatedResponse } from "../../iflow/pagination.js";
import { config } from "../../iflow/config.js";

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
    "Find one client by id or uuid by scanning list_clients (up to IFLOW_MAX_PAGES_PER_CALL pages).",
  inputSchema: z.object({
    client_id: z.string().min(1),
  }),
  execute: async ({ client_id }): Promise<MCPToolResult> => {
    for (let page = 1; page <= config.IFLOW_MAX_PAGES_PER_CALL; page++) {
      const res = await iflowClient.fetch<PaginatedResponse<Record<string, unknown>>>(
        "list_clients",
        "GET",
        undefined,
        { query: { page, page_size: 100 } }
      );
      const row = res.results?.find(
        (r) =>
          String(r.id) === client_id ||
          String(r.uuid ?? "") === client_id ||
          String(r.pk ?? "") === client_id
      );
      if (row) {
        return {
          content: [{ type: "text", text: `Client ${client_id} found.` }],
          structuredContent: { data: row },
        };
      }
      if (!res.next) break;
    }
    return {
      content: [
        { type: "text", text: `Client ${client_id} not found in scanned pages.` },
      ],
      isError: true,
    };
  },
};
