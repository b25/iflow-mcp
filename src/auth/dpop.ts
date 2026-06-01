import * as jose from "jose";
import { logger } from "../observability/logger.js";

// In-memory LRU for replay protection
// Map<string, number> where key is jti and value is timestamp
const jtiReplayCache = new Map<string, number>();
const MAX_CACHE_SIZE = 1000;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

// Periodic cleanup of entries older than 2 minutes
setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;
  for (const [jti, timestamp] of jtiReplayCache.entries()) {
    if (now - timestamp > CACHE_TTL_MS) {
      jtiReplayCache.delete(jti);
      expiredCount++;
    } else {
      // Map entries are iterated in insertion order, so once we find a non-expired
      // entry, all remaining entries are also not expired yet
      break;
    }
  }
  if (expiredCount > 0) {
    logger.debug(
      { expiredCount, cacheSize: jtiReplayCache.size },
      "DPoP replay cache cleanup"
    );
  }
}, CACHE_TTL_MS).unref();

// LRU eviction when size exceeds MAX_CACHE_SIZE
function evictIfNeeded() {
  if (jtiReplayCache.size > MAX_CACHE_SIZE) {
    // Delete the oldest entry (first entry in insertion order)
    const firstKey = jtiReplayCache.keys().next().value;
    if (firstKey !== undefined) {
      jtiReplayCache.delete(firstKey);
    }
  }
}

export async function verifyDPoP(
  proof: string,
  method: string,
  url: string,
  _accessToken: string
): Promise<string> {
  try {
    const { payload, protectedHeader } = await jose.jwtVerify(proof, (header) => {
      // In DPoP, the public key is embedded in the header
      if (!header.jwk) throw new Error("Missing jwk in DPoP header");
      return jose.importJWK(header.jwk as jose.JWK, header.alg as string);
    });

    // Verify htm (method) and htu (url)
    if (payload.htm !== method) throw new Error("DPoP method mismatch");
    if (payload.htu !== url) throw new Error("DPoP url mismatch");

    // Verify iat ± 15s, logging warnings above ±5s for clock skew
    const now = Math.floor(Date.now() / 1000);
    const iat = payload.iat as number;
    const skew = Math.abs(now - iat);
    if (skew > 5 && skew <= 15) {
      logger.warn({ skew, now, iat }, "DPoP token clock skew warning");
    }
    if (skew > 15) {
      throw new Error(`DPoP proof expired or from the future (skew: ${skew}s)`);
    }

    // Replay protection
    const jti = payload.jti as string;
    if (jtiReplayCache.has(jti)) throw new Error("DPoP jti replay");
    jtiReplayCache.set(jti, Date.now());
    evictIfNeeded();

    // Verify thumbprint matches token cnf.jkt
    const thumbprint = await jose.calculateJwkThumbprint(protectedHeader.jwk as jose.JWK);

    // The caller must verify this matches the access token's cnf.jkt
    return thumbprint;
  } catch (error) {
    logger.warn({ error }, "DPoP verification failed");
    throw new Error("Invalid DPoP proof");
  }
}
