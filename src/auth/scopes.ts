import { consumeElevatedToken } from "./elevated.js";
import { requiredScopesForTool } from "../tools/tool-scopes.js";

/** Space-separated OAuth scopes from the access token. */
export function parseScopeString(tokenScope: string): Set<string> {
  return new Set(
    tokenScope
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export function tokenHasAllScopes(tokenScope: string, required: string[]): boolean {
  if (required.length === 0) return true;
  const granted = parseScopeString(tokenScope);
  return required.every((r) => granted.has(r));
}

/**
 * Scope gate for a tool, including `create_order` via `tools:orders:write` or
 * single-use `tools:orders:write:elevated` + JWT `jti` (consumed once).
 */
export function tokenAllowsTool(
  tokenScope: string,
  toolName: string,
  jti?: string
): boolean {
  if (requiredScopesForTool(toolName) === null) {
    return true;
  }

  if (toolName === "create_order") {
    const granted = parseScopeString(tokenScope);
    if (granted.has("tools:orders:write")) {
      return true;
    }
    if (
      granted.has("tools:orders:write:elevated") &&
      typeof jti === "string" &&
      jti.length > 0
    ) {
      return consumeElevatedToken(jti);
    }
    return false;
  }

  const needed = requiredScopesForTool(toolName)!;
  return tokenHasAllScopes(tokenScope, needed);
}
