import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { logger } from "./observability/logger.js";
import { config } from "./iflow/config.js";
import { registry } from "./tools/registry.js";
import { trackToolMetrics } from "./observability/metrics.js";
import { registerAllTools } from "./tools/index.js";
import { runServer } from "./transport/index.js";

const server = new Server(
  {
    name: "iflow-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler for listing available tools.
 * In Phase A, we will register lookup tools here.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: registry.getAllTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as any,
    })),
  };
});

/**
 * Handler for tool calls.
 * In Phase A, we will route to specific lookup tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const result = await trackToolMetrics(name, () => registry.executeTool(name, args));
  return {
    content: result.content,
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
