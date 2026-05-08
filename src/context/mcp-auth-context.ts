import { AsyncLocalStorage } from "node:async_hooks";

export type McpAuthStore = {
  /** Normalized space-separated OAuth scopes from the verified access token. */
  scope: string;
  /** JWT `jti` when present (single-use elevated scope consumption). */
  jti?: string;
  /** Correlates tool logs with HTTP `X-Request-Id` (remote transport only). */
  requestId?: string;
};

export const mcpAuthContext = new AsyncLocalStorage<McpAuthStore>();

export function getMcpAuth(): McpAuthStore | undefined {
  return mcpAuthContext.getStore();
}
