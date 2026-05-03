import { logger } from "../observability/logger.js";

// Atomic SETNX mock using memory (Redis recommended in prod)
const usedElevatedTokens = new Set<string>();

export function consumeElevatedToken(jti: string): boolean {
  if (usedElevatedTokens.has(jti)) {
    return false;
  }
  usedElevatedTokens.add(jti);
  // Cleanup tokens after 2 mins (simplistic)
  setTimeout(() => usedElevatedTokens.delete(jti), 120000);
  return true;
}

export function isElevatedScope(scope: string): boolean {
  return scope.includes("tools:orders:write") || 
         scope.includes("tools:partners:write") ||
         scope.includes("tools:admin");
}
