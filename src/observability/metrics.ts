import { logger } from "./logger.js";

export const trackToolMetrics = async <T>(
  toolName: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.info(
      { tool: toolName, durationMs: Math.round(duration), status: "success" },
      "Tool execution completed"
    );
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(
      { tool: toolName, durationMs: Math.round(duration), status: "error", error },
      "Tool execution failed"
    );
    throw error;
  }
};
