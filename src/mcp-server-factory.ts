/**
 * Build a fresh MCP `Server` with tool handlers (one instance per SSE session).
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
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
      },
    }
  );

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

  return server;
}