import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { logger } from "./observability/logger.js";
import { registry } from "./tools/registry.js";
import { trackToolMetrics } from "./observability/metrics.js";
import { registerAllTools } from "./tools/index.js";
import { runServer } from "./transport/index.js";
import { toolInputToJsonSchema } from "./tools/tool-input-json-schema.js";
import { readPackageJson } from "./meta.js";

function structuredToRecord(data: unknown): Record<string, unknown> | undefined {
  if (data === undefined) return undefined;
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return { value: data as unknown };
}

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

async function main() {
  registerAllTools();
  await runServer(server);
}

main().catch((error) => {
  logger.error(error, "Server failed to start");
  process.exit(1);
});
