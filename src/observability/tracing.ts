import { NodeSDK } from "@opentelemetry/sdk-node";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { logger } from "./logger.js";

if (process.env.IFLOW_OTEL_ENABLED === "1") {
  logger.info("Initializing OpenTelemetry SDK...");
  const sdk = new NodeSDK({
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
  });

  try {
    sdk.start();
    logger.info("OpenTelemetry SDK initialized successfully");
  } catch (error) {
    logger.error(error, "Failed to start OpenTelemetry SDK");
  }

  // Hook into process exit to shutdown cleanly if this module is imported
  const gracefulShutdown = () => {
    sdk
      .shutdown()
      .then(() => logger.info("OpenTelemetry SDK shut down successfully"))
      .catch((err) => logger.error(err, "Error shutting down OpenTelemetry SDK"));
  };
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
}
