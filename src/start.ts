import { logger } from "./observability/logger.js";
import { registerAllTools } from "./tools/index.js";
import { runServer } from "./transport/index.js";
import { createConfiguredMcpServer } from "./mcp-server-factory.js";

const server = createConfiguredMcpServer();

async function main() {
  registerAllTools();
  await runServer(server);

  // Notify client connections to refresh their tool catalog after startup
  setTimeout(async () => {
    try {
      await server.notification({ method: "notifications/tools/list_changed" });
      logger.debug("Sent notifications/tools/list_changed to connected clients");
    } catch (err) {
      // Ignore errors if transport is not connected or doesn't support notifications
    }
  }, 1000).unref();
}

main().catch((error) => {
  logger.error(error, "Server failed to start");
  process.exit(1);
});
