import { logger } from "./logger.js";
import { getMcpAuth } from "../context/mcp-auth-context.js";

function logFields(toolName: string, durationMs: number, status: string) {
  const auth = getMcpAuth();
  return {
    tool: toolName,
    durationMs: Math.round(durationMs),
    status,
    ...(auth?.requestId ? { requestId: auth.requestId } : {}),
  };
}

export const trackToolMetrics = async <T>(
  toolName: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.info(logFields(toolName, duration, "success"), "Tool execution completed");
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(
      { ...logFields(toolName, duration, "error"), error },
      "Tool execution failed"
    );
    throw error;
  }
};
