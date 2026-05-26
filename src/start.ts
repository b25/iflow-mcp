import { logger } from "./observability/logger.js";
import { registerAllTools } from "./tools/index.js";
import { runServer } from "./transport/index.js";
import { createConfiguredMcpServer } from "./mcp-server-factory.js";

const server = createConfiguredMcpServer();

async function main() {
  registerAllTools();
  await runServer(server);
}

main().catch((error) => {
  logger.error(error, "Server failed to start");
  process.exit(1);
});
