import * as jose from "jose";
import { config } from "../iflow/config.js";
import { getJWKS } from "./jwks.js";
import { logger } from "../observability/logger.js";

export interface MCPTokenClaims extends jose.JWTPayload {
  scope: string;
  cnf?: {
    jkt: string;
  };
}

export async function verifyAccessToken(token: string): Promise<MCPTokenClaims> {
  try {
    const JWKS = await getJWKS();
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: config.IFLOW_OAUTH_ISSUER,
      audience: config.IFLOW_MCP_AUDIENCE,
    });

    return payload as MCPTokenClaims;
  } catch (error) {
    logger.warn({ error }, "JWT verification failed");
    throw new Error("Invalid access token");
  }
}
