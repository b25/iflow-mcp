import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { startRemoteServer } from "./streamable.js";
import { logger } from "../observability/logger.js";

export async function runServer(server: Server) {
  if (process.env.IFLOW_MCP_TRANSPORT === "http") {
    logger.info("Starting Remote MCP (HTTP) server");
    startRemoteServer(server);
  } else {
    logger.info("Starting Desktop MCP (stdio) server");
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}
