import { logger } from "../observability/logger.js";

// Atomic SETNX mock using memory (Redis recommended in prod)
// Map<string, number> mapping jti -> expiry timestamp
const usedElevatedTokens = new Map<string, number>();
let cleanupTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setTimeout(() => {
    const now = Date.now();
    let expiredCount = 0;
    for (const [jti, expiry] of usedElevatedTokens.entries()) {
      if (now > expiry) {
        usedElevatedTokens.delete(jti);
        expiredCount++;
      }
    }
    if (expiredCount > 0) {
      logger.debug(
        { expiredCount, remaining: usedElevatedTokens.size },
        "Elevated tokens cache cleanup"
      );
    }
    cleanupTimer = null;
    if (usedElevatedTokens.size > 0) {
      scheduleCleanup();
    }
  }, 30_000);
  cleanupTimer.unref(); // Ensure process can exit cleanly
}

export function consumeElevatedToken(jti: string): boolean {
  if (usedElevatedTokens.has(jti)) {
    return false;
  }
  usedElevatedTokens.set(jti, Date.now() + 120_000);
  scheduleCleanup();
  return true;
}

export function isElevatedScope(scope: string): boolean {
  return (
    scope.includes("tools:orders:write") ||
    scope.includes("tools:partners:write") ||
    scope.includes("tools:admin")
  );
}
