import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { fetchAllPages, PaginatedResponse } from "../../iflow/pagination.js";
import { config } from "../../iflow/config.js";

export const listProductsTool: Tool = {
  name: "list_products",
  description:
    "List products from iflow. Use all_pages=true to merge up to IFLOW_MAX_PAGES_PER_CALL pages.",
  inputSchema: z.object({
    all_pages: z.boolean().optional().default(false),
  }),
  execute: async ({ all_pages }): Promise<MCPToolResult> => {
    const fetchPage = (page: number) =>
      iflowClient.fetch<PaginatedResponse<Record<string, unknown>>>(
        "list_products",
        "GET",
        undefined,
        { query: { page, page_size: 100 } }
      );

    const first = await fetchPage(1);
    const rows = all_pages ? await fetchAllPages(fetchPage) : first.results;

    return {
      content: [{ type: "text", text: `Found ${rows.length} product(s).` }],
      structuredContent: { results: rows, count: rows.length },
    };
  },
};

export const getProductTool: Tool = {
  name: "get_product",
  description:
    "Find one product by uuid or id by scanning list_products (up to IFLOW_MAX_PAGES_PER_CALL pages).",
  inputSchema: z.object({
    product_id: z.string().min(1),
  }),
  execute: async ({ product_id }): Promise<MCPToolResult> => {
    for (let page = 1; page <= config.IFLOW_MAX_PAGES_PER_CALL; page++) {
      const res = await iflowClient.fetch<PaginatedResponse<Record<string, unknown>>>(
        "list_products",
        "GET",
        undefined,
        { query: { page, page_size: 100 } }
      );
      const row = res.results?.find(
        (r) =>
          String(r.id) === product_id ||
          String(r.uuid ?? "") === product_id ||
          String(r.pk ?? "") === product_id
      );
      if (row) {
        return {
          content: [{ type: "text", text: `Product ${product_id} found.` }],
          structuredContent: { data: row },
        };
      }
      if (!res.next) break;
    }
    return {
      content: [
        { type: "text", text: `Product ${product_id} not found in scanned pages.` },
      ],
      isError: true,
    };
  },
};
