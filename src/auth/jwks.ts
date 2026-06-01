import * as jose from "jose";
import { config } from "../iflow/config.js";
import { logger } from "../observability/logger.js";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cachedJWKS: jose.JWTVerifyGetKey | null = null;
let lastFetch = 0;

export function validateOAuthUrl(url: string, label: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`${label} must use HTTPS`);
  }
  const ip = parsed.hostname.replace(/^[[\]]/g, "");

  // Bypass private IP validation in tests or when explicitly configured
  const isTest = process.env.NODE_ENV === "test";
  const allowPrivate = process.env.IFLOW_ALLOW_PRIVATE_JWKS === "1";
  if (isTest || allowPrivate) {
    return;
  }

  if (
    /^127\.|^10\.|^172\.(1[6-9]|2\d|3[01])\.|^192\.168\.|^169\.254\.|^\[::\]|^::1$|^localhost$/.test(
      ip
    )
  ) {
    throw new Error(`${label} points to a private/loopback IP: ${parsed.hostname}`);
  }
}

export async function getJWKS(): Promise<jose.JWTVerifyGetKey> {
  const jwksUrl = config.IFLOW_OAUTH_JWKS_URL;
  if (!jwksUrl) {
    throw new Error(
      "IFLOW_OAUTH_JWKS_URL is not set; JWT verification (Phase C / remote MCP) is disabled"
    );
  }

  validateOAuthUrl(jwksUrl, "IFLOW_OAUTH_JWKS_URL");

  const now = Date.now();

  // Stale-while-revalidate: if expired, return the stale cached client to avoid blocking the request,
  // but instantiate the new client synchronously for subsequent requests (stale-while-revalidate).
  if (cachedJWKS && now - lastFetch >= CACHE_TTL_MS) {
    logger.info({ jwksUrl }, "JWKS expired, rotating client synchronously");
    const fresh = jose.createRemoteJWKSet(new URL(jwksUrl));
    const stale = cachedJWKS;
    cachedJWKS = fresh;
    lastFetch = now;
    return stale;
  }

  if (cachedJWKS) {
    return cachedJWKS;
  }

  try {
    logger.info({ jwksUrl }, "Fetching JWKS from iflow (initial construction)");
    cachedJWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
    lastFetch = now;
    return cachedJWKS;
  } catch (error) {
    logger.error(error, "Failed to fetch JWKS");
    throw new Error("Internal authentication error");
  }
}
