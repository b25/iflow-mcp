import * as jose from "jose";
import { config } from "../iflow/config.js";
import { logger } from "../observability/logger.js";

let cachedJWKS: jose.JWTVerifyGetKey | null = null;
let lastFetch = 0;

export async function getJWKS(): Promise<jose.JWTVerifyGetKey> {
  const now = Date.now();
  // 24h hard TTL
  if (cachedJWKS && now - lastFetch < 24 * 60 * 60 * 1000) {
    return cachedJWKS;
  }

  try {
    logger.info("Fetching JWKS from iflow");
    cachedJWKS = jose.createRemoteJWKSet(new URL(config.IFLOW_OAUTH_JWKS_URL));
    lastFetch = now;
    return cachedJWKS;
  } catch (error) {
    logger.error(error, "Failed to fetch JWKS");
    throw new Error("Internal authentication error");
  }
}
