import { config } from "../iflow/config.js";

export type ReadinessChecks = Record<string, string>;

/** Optional overrides for tests; omit to use `config` OAuth fields. */
export type OAuthConfigInput = {
  issuer?: string | undefined;
  jwksUrl?: string | undefined;
  audience?: string | undefined;
};

/**
 * Readiness for remote MCP: config loaded, and if OAuth is enabled (all three
 * vars set), JWKS URL must return a document with a `keys` array.
 */
export async function runReadinessChecks(
  oauthInput: OAuthConfigInput = {}
): Promise<{ ready: boolean; checks: ReadinessChecks }> {
  const issuer = oauthInput.issuer ?? config.IFLOW_OAUTH_ISSUER;
  const jwksUrl = oauthInput.jwksUrl ?? config.IFLOW_OAUTH_JWKS_URL;
  const audience = oauthInput.audience ?? config.IFLOW_MCP_AUDIENCE;

  const checks: ReadinessChecks = { config: "ok" };

  const hasIssuer = Boolean(issuer);
  const hasJwks = Boolean(jwksUrl);
  const hasAud = Boolean(audience);

  if (!hasIssuer && !hasJwks && !hasAud) {
    checks.oauth = "not_configured";
    return { ready: true, checks };
  }

  if (!hasIssuer || !hasJwks || !hasAud) {
    checks.oauth = "incomplete";
    return { ready: false, checks };
  }

  try {
    const res = await fetch(jwksUrl!, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      checks.jwks = `http_${res.status}`;
      return { ready: false, checks };
    }
    const text = await res.text();
    const data = JSON.parse(text) as { keys?: unknown };
    if (!data.keys || !Array.isArray(data.keys)) {
      checks.jwks = "invalid_document";
      return { ready: false, checks };
    }
    checks.jwks = "ok";
    return { ready: true, checks };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    checks.jwks = message.length > 120 ? `${message.slice(0, 117)}...` : message;
    return { ready: false, checks };
  }
}
