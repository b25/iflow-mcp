import * as jose from "jose";
import { logger } from "../observability/logger.js";

// In-memory LRU for replay protection
const jtiReplayCache = new Set<string>();

export async function verifyDPoP(
  proof: string,
  method: string,
  url: string,
  accessToken: string
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

    // Verify iat ± 60s
    const now = Math.floor(Date.now() / 1000);
    const iat = payload.iat as number;
    if (Math.abs(now - iat) > 60) throw new Error("DPoP proof expired or from the future");

    // Replay protection
    const jti = payload.jti as string;
    if (jtiReplayCache.has(jti)) throw new Error("DPoP jti replay");
    jtiReplayCache.add(jti);
    // Cleanup cache (simplistic)
    if (jtiReplayCache.size > 1000) jtiReplayCache.clear();

    // Verify thumbprint matches token cnf.jkt
    const thumbprint = await jose.calculateJwkThumbprint(protectedHeader.jwk as jose.JWK);
    
    // The caller must verify this matches the access token's cnf.jkt
    return thumbprint;
  } catch (error) {
    logger.warn({ error }, "DPoP verification failed");
    throw new Error("Invalid DPoP proof");
  }
}
