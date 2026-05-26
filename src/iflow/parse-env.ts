import { z } from "zod";

/** Phase B: remote HTTP defaults to read-only unless IFLOW_READ_ONLY is set explicitly. */
export function applyTransportDefaults(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = { ...env };
  if (out.IFLOW_MCP_TRANSPORT === "http" && out.IFLOW_READ_ONLY === undefined) {
    out.IFLOW_READ_ONLY = "1";
  }
  // Django broker (`GET /v1/<integration_uuid>/<endpoint>/`) does not use IFLOW_API_POINTS; allow empty map.
  const uuidRaw = (out.IFLOW_MCP_INTEGRATION_UUID ?? "").trim();
  const pointsRaw = (out.IFLOW_API_POINTS ?? "").trim();
  if (uuidRaw && !pointsRaw) {
    out.IFLOW_API_POINTS = "{}";
  }
  return out;
}

const configSchema = z
  .object({
    IFLOW_BASE_URL: z.string().url(),
    /** Dev only: set to `1` to allow `http://` IFLOW_BASE_URL (e.g. local Django). Production should use HTTPS. */
    IFLOW_ALLOW_INSECURE_HTTP: z
      .enum(["0", "1"])
      .optional()
      .default("0")
      .transform((s) => s === "1"),
    IFLOW_ALLOWED_HOSTS: z
      .string()
      .min(1)
      .transform((s) =>
        s
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean)
      ),
    IFLOW_API_BEARER: z.string().min(1),
    IFLOW_API_POINTS: z
      .string()
      .min(1)
      .transform((s) => JSON.parse(s) as Record<string, string>),
    IFLOW_READ_ONLY: z
      .enum(["0", "1"])
      .optional()
      .default("0")
      .transform((s) => s === "1"),
    IFLOW_REQUEST_TIMEOUT_MS: z
      .string()
      .optional()
      .transform((s) => parseInt(s || "20000", 10)),
    IFLOW_MAX_RESPONSE_BYTES: z
      .string()
      .optional()
      .transform((s) => parseInt(s || "10485760", 10)),
    IFLOW_MAX_PAGES_PER_CALL: z
      .string()
      .optional()
      .transform((s) => parseInt(s || "5", 10)),
    IFLOW_LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace"])
      .optional()
      .default("info"),
    IFLOW_OAUTH_ISSUER: z.string().url().optional(),
    IFLOW_OAUTH_JWKS_URL: z.string().url().optional(),
    IFLOW_MCP_AUDIENCE: z.string().url().optional(),
    IFLOW_BFF_ONLY: z
      .enum(["0", "1"])
      .optional()
      .default("0")
      .transform((s) => s === "1"),
    IFLOW_BFF_SHARED_SECRET: z.string().optional(),
    IFLOW_DPOP_REPLAY_CACHE: z.enum(["redis", "memory"]).optional().default("memory"),
    /** Listen address for IFLOW_MCP_TRANSPORT=http. Use 0.0.0.0 in Docker; default 127.0.0.1 for local safety. */
    IFLOW_HTTP_BIND_HOST: z.string().min(1).optional().default("127.0.0.1"),
    /**
     * When set, HTTP calls use the Django MCP broker:
     * `{IFLOW_BASE_URL}/v1/<uuid>/<logical_endpoint>/` with `IFLOW_API_BEARER`
     * (opaque token from `/integrations/mcp/settings/`). Omit for legacy
     * `/api-external/v1/<IFLOW_API_POINTS[key]>/`.
     */
    IFLOW_MCP_INTEGRATION_UUID: z.preprocess(
      (v) => {
        if (v === undefined || v === null) return undefined;
        const s = String(v).trim();
        return s.length ? s : undefined;
      },
      z.string().uuid().optional()
    ),
  })
  .refine(
    (data) => data.IFLOW_ALLOW_INSECURE_HTTP || data.IFLOW_BASE_URL.startsWith("https://"),
    {
      message:
        "IFLOW_BASE_URL must use https:// (set IFLOW_ALLOW_INSECURE_HTTP=1 only for trusted local dev)",
      path: ["IFLOW_BASE_URL"],
    }
  );

export type AppConfig = z.infer<typeof configSchema>;

export function parseEnv(
  env: NodeJS.ProcessEnv
): { ok: true; data: AppConfig } | { ok: false; error: z.ZodError } {
  const result = configSchema.safeParse(applyTransportDefaults(env));
  if (!result.success) return { ok: false, error: result.error };
  return { ok: true, data: result.data };
}
