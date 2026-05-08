import * as jose from "jose";
import { config } from "../iflow/config.js";
import { logger } from "../observability/logger.js";

let cachedJWKS: jose.JWTVerifyGetKey | null = null;
let lastFetch = 0;

export async function getJWKS(): Promise<jose.JWTVerifyGetKey> {
  const jwksUrl = config.IFLOW_OAUTH_JWKS_URL;
  if (!jwksUrl) {
    throw new Error(
      "IFLOW_OAUTH_JWKS_URL is not set; JWT verification (Phase C / remote MCP) is disabled"
    );
  }

  const now = Date.now();
  if (cachedJWKS && now - lastFetch < 24 * 60 * 60 * 1000) {
    return cachedJWKS;
  }

  try {
    logger.info({ jwksUrl }, "Fetching JWKS from iflow");
    cachedJWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
    lastFetch = now;
    return cachedJWKS;
  } catch (error) {
    logger.error(error, "Failed to fetch JWKS");
    throw new Error("Internal authentication error");
  }
}
