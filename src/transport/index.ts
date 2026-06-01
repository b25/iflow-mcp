import type { Server as HttpServer } from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { startRemoteServer, closeAllSessions } from "./streamable.js";
import { logger } from "../observability/logger.js";
import { createStdioTransport } from "./stdio.js";

const HTTP_SHUTDOWN_MS = 10_000;

function installHttpShutdown(httpServer: HttpServer): void {
  const onSignal = (signal: NodeJS.Signals) => {
    logger.info({ signal }, "Shutdown signal received, closing HTTP server");

    // Close all SSE sessions gracefully
    closeAllSessions().catch((err) => {
      logger.error(err, "Error closing SSE sessions during shutdown");
    });

    httpServer.close((err) => {
      if (err) {
        logger.error(err, "HTTP server close error");
        process.exit(1);
      }
      process.exit(0);
    });

    // Force close active connections after a brief delay to allow pending requests to drain
    setTimeout(() => {
      logger.warn("Forcing active HTTP connections shutdown");
      if (typeof httpServer.closeAllConnections === "function") {
        httpServer.closeAllConnections();
      }
    }, 2000).unref();

    setTimeout(() => {
      logger.error("Shutdown timeout, forcing exit");
      process.exit(1);
    }, HTTP_SHUTDOWN_MS).unref();
  };
  process.once("SIGTERM", () => onSignal("SIGTERM"));
  process.once("SIGINT", () => onSignal("SIGINT"));
}

export async function runServer(server: Server) {
  if (process.env.IFLOW_MCP_TRANSPORT === "http") {
    logger.info("Starting Remote MCP (HTTP) server");
    const httpServer = startRemoteServer();
    installHttpShutdown(httpServer);
  } else {
    logger.info("Starting Desktop MCP (stdio) server");
    const transport = createStdioTransport();
    await server.connect(transport);
  }
}
