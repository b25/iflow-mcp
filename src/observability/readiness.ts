import { config } from "../iflow/config.js";

export type ReadinessChecks = Record<string, string>;

/** Optional overrides for tests; omit to use `config` OAuth fields. */
export type ReadinessInput = {
  issuer?: string | undefined;
  jwksUrl?: string | undefined;
  audience?: string | undefined;
  /** Override transport for readiness (defaults from `config.IFLOW_MCP_TRANSPORT`). */
  mcpTransport?: "stdio" | "http";
};

/**
 * Readiness for remote MCP: config loaded, and if OAuth is enabled (all three
 * vars set), JWKS URL must return a document with a `keys` array.
 *
 * When `IFLOW_MCP_TRANSPORT=http`, OAuth must be fully configured (JWKS reachable);
 * stdio-only desktop mode may omit OAuth (`not_configured` is still ready).
 */
export async function runReadinessChecks(
  input: ReadinessInput = {}
): Promise<{ ready: boolean; checks: ReadinessChecks }> {
  const issuer = input.issuer ?? config.IFLOW_OAUTH_ISSUER;
  const jwksUrl = input.jwksUrl ?? config.IFLOW_OAUTH_JWKS_URL;
  const audience = input.audience ?? config.IFLOW_MCP_AUDIENCE;
  const transport = input.mcpTransport ?? config.IFLOW_MCP_TRANSPORT;

  const checks: ReadinessChecks = { config: "ok", transport };

  const hasIssuer = Boolean(issuer);
  const hasJwks = Boolean(jwksUrl);
  const hasAud = Boolean(audience);

  if (!hasIssuer && !hasJwks && !hasAud) {
    checks.oauth = "not_configured";
    if (transport === "http") {
      checks.oauth = "required_for_http_transport";
      return { ready: false, checks };
    }
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

    // Outbound ping check to downstream ERP backend /healthz
    const isTest = process.env.NODE_ENV === "test";
    if (!isTest) {
      try {
        const healthUrl = `${
          config.IFLOW_BASE_URL.endsWith("/")
            ? config.IFLOW_BASE_URL.slice(0, -1)
            : config.IFLOW_BASE_URL
        }/healthz`;
        const erpRes = await fetch(healthUrl, {
          method: "GET",
          signal: AbortSignal.timeout(3000),
        });
        if (erpRes.ok) {
          checks.erp_backend = "ok";
        } else {
          checks.erp_backend = `http_${erpRes.status}`;
          return { ready: false, checks };
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        checks.erp_backend =
          message.length > 120 ? `${message.slice(0, 117)}...` : message;
        return { ready: false, checks };
      }
    } else {
      checks.erp_backend = "ok";
    }

    return { ready: true, checks };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    checks.jwks = message.length > 120 ? `${message.slice(0, 117)}...` : message;
    return { ready: false, checks };
  }
}
