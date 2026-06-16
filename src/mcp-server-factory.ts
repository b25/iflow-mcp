import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { registry } from "./tools/registry.js";
import { trackToolMetrics } from "./observability/metrics.js";
import { toolInputToJsonSchema } from "./tools/tool-input-json-schema.js";
import { readPackageJson } from "./meta.js";

function structuredToRecord(data: unknown): Record<string, unknown> | undefined {
  if (data === undefined) return undefined;
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return { value: data as unknown };
}

export function createConfiguredMcpServer(): Server {
  const pkg = readPackageJson();

  const server = new Server(
    {
      name: pkg.name,
      version: pkg.version,
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {
          subscribe: false,
          listChanged: true,
        },
      },
    }
  );

  // --- Tools Handlers ---
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: registry.getAllTools().map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: toolInputToJsonSchema(tool.inputSchema),
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const result = await trackToolMetrics(name, () => registry.executeTool(name, args));
    const structuredContent = structuredToRecord(result.structuredContent);
    return {
      content: result.content,
      ...(structuredContent ? { structuredContent } : {}),
      isError: result.isError,
    };
  });

  // --- Prompts Handlers ---
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: "new-order",
          description: "Guided order creation for a client",
          arguments: [
            {
              name: "clientName",
              description: "Name of the client to look up",
              required: true,
            },
          ],
        },
        {
          name: "daily-report",
          description: "Daily activity and sales summary",
          arguments: [
            {
              name: "date",
              description: "Date for the report (YYYY-MM-DD), default is today",
              required: false,
            },
          ],
        },
        {
          name: "find-problems",
          description: "Identify operational and financial leakage points",
          arguments: [],
        },
        {
          name: "iflows",
          description: "Grouped iFlows tool overview + guided next step",
          arguments: [
            {
              name: "language",
              description: "ro or en (default ro)",
              required: false,
            },
          ],
        },
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === "new-order") {
      const clientName = args?.clientName ?? "";
      return {
        description: "Guided order creation for a client",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `I want to create a new order for client: ${clientName}. Please look up the client using list_clients, then check stock for products they want using get_stock, and guide me through create_order.`,
            },
          },
        ],
      };
    }
    if (name === "daily-report") {
      const date = args?.date ?? new Date().toISOString().split("T")[0];
      return {
        description: "Daily activity and sales summary",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Generate the daily activity summary and sales report for date: ${date}. Please use daily_activity_summary and report_sales tools.`,
            },
          },
        ],
      };
    }
    if (name === "find-problems") {
      return {
        description: "Identify operational and financial leakage points",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "Analyze the ERP data to identify where we are losing money or experiencing bottlenecks. Please use where_are_we_losing_money and order_delay_diagnosis tools to perform a deep operation assessment.",
            },
          },
        ],
      };
    }
    if (name === "iflows") {
      const lang = args?.language ?? "ro";
      return {
        description: "Grouped iFlow tool overview + guided next step",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Call mcp_tool_catalog with format='grouped' and language='${lang}'. Present the six groups (Business Operations, Partners & Communications, Analytics & Reports, Analysis & Diagnostics, Meta & Discovery, Write Actions) with their counts and a one-line description each. Then ask what the user wants to do. For any write (add_client_note, add_offer_comment, update_order_status, mark_order_finished, mark_order_billed), first run the tool's prerequisite discovery (list/search) to resolve ids — never invent ids.`,
            },
          },
        ],
      };
    }
    throw new Error(`Prompt not found: ${name}`);
  });

  // --- Resources Handlers ---
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "iflow://clients/info",
          name: "Clients Directory Overview",
          mimeType: "text/plain",
          description: "Summary and diagnostic of the Clients directory",
        },
        {
          uri: "iflow://products/info",
          name: "Products Directory Overview",
          mimeType: "text/plain",
          description: "Summary and diagnostic of the Products directory",
        },
      ],
    };
  });

  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [
        {
          uriTemplate: "iflow://clients/{uuid}",
          name: "Client Details Resource",
          description: "Read details of a client by their UUID",
        },
        {
          uriTemplate: "iflow://products/{uuid}",
          name: "Product Details Resource",
          description: "Read details of a product by their UUID",
        },
        {
          uriTemplate: "iflow://orders/{uuid}",
          name: "Order Details Resource",
          description: "Read details of an order by their UUID",
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    let parsed: URL;
    try {
      parsed = new URL(uri);
    } catch {
      throw new Error(`Invalid URI: ${uri}`);
    }

    if (parsed.protocol !== "iflow:") {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }

    if (uri === "iflow://clients/info") {
      const result = await registry.executeTool("list_clients", { all_pages: false });
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: result.content.map((c) => c.text).join("\n"),
          },
        ],
      };
    }

    if (uri === "iflow://products/info") {
      const result = await registry.executeTool("list_products", { all_pages: false });
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: result.content.map((c) => c.text).join("\n"),
          },
        ],
      };
    }

    const host = parsed.host;
    const uuid = parsed.pathname.replace(/^\//, "");

    if (host === "clients") {
      const result = await registry.executeTool("get_client", { client_id: uuid });
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(result.structuredContent ?? result.content, null, 2),
          },
        ],
      };
    }

    if (host === "products") {
      const result = await registry.executeTool("get_product", { product_id: uuid });
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(result.structuredContent ?? result.content, null, 2),
          },
        ],
      };
    }

    if (host === "orders") {
      const result = await registry.executeTool("list_orders", { q: uuid, limit: 1 });
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(result.structuredContent ?? result.content, null, 2),
          },
        ],
      };
    }

    throw new Error(`Resource not found: ${uri}`);
  });

  return server;
}
