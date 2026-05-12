/**
 * Strip secrets from api-external error bodies before logging (confirm tokens, etc.).
 */
export function redactIflowErrorBodyForLog(body: unknown): unknown {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }
  const o = body as Record<string, unknown>;
  const out: Record<string, unknown> = { ...o };
  if (o.details && typeof o.details === "object" && !Array.isArray(o.details)) {
    const d = { ...(o.details as Record<string, unknown>) };
    if ("confirm_token" in d) d.confirm_token = "[REDACTED]";
    if ("pending_id" in d) d.pending_id = "[REDACTED]";
    out.details = d;
  }
  return out;
}
