import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const isoDateTime = z.string().min(8);

export const listOrdersTool: Tool = {
  name: "list_orders",
  description:
    "Search/list orders with filters. Use this tool when user asks about orders, sales, or purchase history.\n" +
    "\n" +
    "DEFAULT RECOMMENDATIONS (use if user doesn't specify):\n" +
    "- For 'recent orders' or 'last N orders': finished=false, limit=20-50, order_by='date_order_desc'\n" +
    "- For 'finished orders this month': finished=true, from=2026-05-01T00:00:00, to=2026-05-31T23:59:59, limit=100\n" +
    "- For 'unpaid orders': finished=false, status='NEW', limit=50\n" +
    "- For 'delivered orders': finished=true, status='FINISHED', limit=100\n" +
    "\n" +
    "FILTERS: finished (true/false), status (NEW/IN_PROCESS/FINISHED/OUT_OF_STOCK/CANCEL), client_id, flow_id,\n" +
    "from/to (date_order), delivery_from/delivery_to (ISO datetime), q (search text),\n" +
    "order_by (date_order_desc, date_order_asc, delivery_date_desc, delivery_date_asc, id_desc, id_asc,\n" +
    "total_amount_desc, total_amount_asc), limit (1-500), offset.\n" +
    "\n" +
    "TIP: For interactive filter building, use 'build_orders_filter' tool instead.",
  inputSchema: z.object({
    finished: z.boolean().optional().describe("Filter by completion status (true/false)"),
    status: z
      .enum(["NEW", "IN_PROCESS", "FINISHED", "OUT_OF_STOCK", "CANCEL"])
      .optional()
      .describe("Filter by order status"),
    client_id: z.number().int().positive().optional().describe("Filter by client ID"),
    flow_id: z.number().int().positive().optional().describe("Filter by workflow ID"),
    from: isoDateTime.optional().describe("Start date filter (ISO 8601 datetime)"),
    to: isoDateTime.optional().describe("End date filter (ISO 8601 datetime)"),
    delivery_from: isoDateTime.optional().describe("Delivery start date filter"),
    delivery_to: isoDateTime.optional().describe("Delivery end date filter"),
    q: z.string().optional().describe("Full-text search query"),
    order_by: z
      .enum([
        "date_order_desc",
        "date_order_asc",
        "delivery_date_desc",
        "delivery_date_asc",
        "id_desc",
        "id_asc",
        "total_amount_desc",
        "total_amount_asc",
      ])
      .optional()
      .describe("Sort order for results"),
    limit: z.number().int().min(1).max(500).optional().describe("Maximum number of results (default: 20)"),
    offset: z.number().int().min(0).optional().describe("Number of results to skip (for pagination)"),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
    }
    const result = await iflowClient.fetch<{ results?: unknown[]; count?: number }>(
      "list_orders",
      "GET",
      undefined,
      { query: q }
    );
    return {
      content: [
        {
          type: "text",
          text: `Listed ${result.count ?? result.results?.length ?? 0} order(s).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const buildOrdersFilterTool: Tool = {
  name: "build_orders_filter",
  description:
    "Interactively build an order filter with guided questions. Use this when user wants to construct a complex filter " +
    "and needs help deciding what filters to apply. This tool asks step-by-step questions about the desired filter criteria.\n" +
    "\n" +
    "Use this tool when:\n" +
    "- User asks for 'orders' without specifying criteria\n" +
    "- User wants to filter by specific conditions but isn't sure what fields are available\n" +
    "- User needs help constructing the right combination of filters\n" +
    "\n" +
    "After building the filter, the tool returns a ready-to-use filter object with all parameters.",
  inputSchema: z.object({
    step: z
      .enum(["start", "finished", "status", "date_range", "client", "flow", "sort"])
      .describe(
        "Current step: start (initial prompt), finished (confirm completion status), status (order status), date_range (from/to dates)," +
          " client (client_id filter), flow (flow_id filter), sort (ordering preferences)"
      ),
    context: z
      .string()
      .optional()
      .describe(
        "Previous user input or filter criteria to build upon (for context-aware guidance)"
      ),
    current_filter: z
      .record(z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe("Filter values collected so far"),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const { step, context, current_filter } = args;

    const getPromptByStep = (currentStep: string): string => {
      switch (currentStep) {
        case "start":
          return (
            "Build Orders Filter - Step 1/6\n" +
            "\n" +
            "Tell me what type of orders you're looking for:\n" +
            "- All orders (no filter)\n" +
            "- Recent/unfinished orders\n" +
            "- Finished/completed orders\n" +
            "- Orders from a specific date range (e.g., 'this month', 'last week')\n" +
            "- Orders for a specific client\n" +
            "- Orders with a specific status\n" +
            "\n" +
            "Or describe your filter criteria in natural language."
          );

        case "finished":
          return (
            "Build Orders Filter - Step 2/6\n" +
            "\n" +
            "Are you looking for finished/completed orders or unfinished/in-progress orders?\n" +
            "\n" +
            "Options:\n" +
            "- finished=true (completed orders)\n" +
            "- finished=false (unfinished/in-progress orders)\n" +
            "- Skip (no filter on completion status)"
          );

        case "status":
          return (
            "Build Orders Filter - Step 3/6\n" +
            "\n" +
            "Do you want to filter by a specific order status?\n" +
            "\n" +
            "Available statuses: NEW, IN_PROCESS, FINISHED, OUT_OF_STOCK, CANCEL\n" +
            "Example: 'IN_PROCESS' for orders currently being processed"
          );

        case "date_range":
          return (
            "Build Orders Filter - Step 4/6\n" +
            "\n" +
            "Do you want to filter by date range?\n" +
            "\n" +
            "Options:\n" +
            "- this_month (2026-05-01 to 2026-05-31)\n" +
            "- last_month (2026-04-01 to 2026-04-30)\n" +
            "- this_week (monday to sunday)\n" +
            "- last_30_days\n" +
            "- Custom date range (specify from/to ISO datetime)"
          );

        case "client":
          return (
            "Build Orders Filter - Step 5/6\n" +
            "\n" +
            "Do you want to filter by a specific client?\n" +
            "\n" +
            "Provide the client_id number, or skip for all clients."
          );

        case "flow":
          return (
            "Build Orders Filter - Step 6/6\n" +
            "\n" +
            "Do you want to filter by a specific workflow (flow)?\n" +
            "\n" +
            "Provide the flow_id number, or skip for all workflows."
          );

        default:
          return "Please specify a valid step.";
      }
    };

    const getSummary = (filter: Record<string, unknown>): string => {
      const parts: string[] = [];
      if (filter.finished !== undefined) parts.push(`finished=${filter.finished}`);
      if (filter.status) parts.push(`status=${filter.status}`);
      if (filter.from) parts.push(`from=${filter.from}`);
      if (filter.to) parts.push(`to=${filter.to}`);
      if (filter.client_id !== undefined) parts.push(`client_id=${filter.client_id}`);
      if (filter.flow_id !== undefined) parts.push(`flow_id=${filter.flow_id}`);
      if (filter.order_by) parts.push(`order_by=${filter.order_by}`);
      if (filter.limit !== undefined) parts.push(`limit=${filter.limit}`);

      return parts.length > 0 ? parts.join(", ") : "no filters (all orders)";
    };

    const prevFilter = current_filter || {};
    let response: string;
    if (!step || step === "start") {
      response =
        getPromptByStep("start") +
        "\n\n" +
        "When you're ready, reply with your filter description or type 'skip' to see all orders.";
    } else if (step === "finished") {
      response =
        getPromptByStep("finished") +
        "\n\n" +
        (prevFilter.finished !== undefined
          ? `Current: finished=${prevFilter.finished}\n`
          : "") +
        "Type 'true', 'false', or 'skip'.";
    } else if (step === "status") {
      response =
        getPromptByStep("status") +
        "\n\n" +
        (prevFilter.status
          ? `Current: status=${prevFilter.status}\n`
          : "") +
        "Type a status value (NEW/IN_PROCESS/FINISHED/OUT_OF_STOCK/CANCEL) or 'skip'.";
    } else if (step === "date_range") {
      response =
        getPromptByStep("date_range") +
        "\n\n" +
        (prevFilter.from || prevFilter.to
          ? `Current: from=${prevFilter.from}, to=${prevFilter.to}\n`
          : "") +
        "Type a preset (this_month, last_month, this_week, last_30_days) or 'skip'.";
    } else if (step === "client") {
      response =
        getPromptByStep("client") +
        "\n\n" +
        (prevFilter.client_id !== undefined
          ? `Current: client_id=${prevFilter.client_id}\n`
          : "") +
        "Type a client ID number or 'skip'.";
    } else if (step === "flow") {
      response =
        getPromptByStep("flow") +
        "\n\n" +
        (prevFilter.flow_id !== undefined
          ? `Current: flow_id=${prevFilter.flow_id}\n`
          : "") +
        "Type a flow ID number or 'skip'.";
    } else {
      response = `Build filter at step '${step}'\nCurrent: ${getSummary(current_filter || {})}`;
    }

    return {
      content: [{ type: "text", text: response }],
      structuredContent: {
        step,
        current_filter: current_filter || {},
        summary: getSummary(current_filter || {}),
      },
    };
  },
};
