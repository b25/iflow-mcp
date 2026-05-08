import * as jose from "jose";
import { config } from "../iflow/config.js";
import { getJWKS } from "./jwks.js";
import { logger } from "../observability/logger.js";

export interface MCPTokenClaims extends jose.JWTPayload {
  /** Space-separated scopes (normalized from `scope` and/or `scp`). */
  scope: string;
  cnf?: {
    jkt: string;
  };
}

export function normalizeScopeClaim(payload: jose.JWTPayload): string {
  const raw = payload.scope ?? payload.scp;
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string" && x.length > 0).join(" ");
  }
  if (typeof raw === "string") {
    return raw;
  }
  return "";
}

export async function verifyAccessToken(token: string): Promise<MCPTokenClaims> {
  try {
    if (!config.IFLOW_OAUTH_ISSUER || !config.IFLOW_MCP_AUDIENCE) {
      throw new Error(
        "IFLOW_OAUTH_ISSUER and IFLOW_MCP_AUDIENCE must be set for JWT verification"
      );
    }
    const JWKS = await getJWKS();
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: config.IFLOW_OAUTH_ISSUER,
      audience: config.IFLOW_MCP_AUDIENCE,
    });

    return {
      ...payload,
      scope: normalizeScopeClaim(payload),
    } as MCPTokenClaims;
  } catch (error) {
    logger.warn({ error }, "JWT verification failed");
    throw new Error("Invalid access token");
  }
}
