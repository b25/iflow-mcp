import { z } from "zod";

const configSchema = z.object({
  IFLOW_BASE_URL: z.string().url(),
  IFLOW_ALLOWED_HOSTS: z.string().transform((s) => s.split(",")),
  IFLOW_API_BEARER: z.string(),
  IFLOW_API_POINTS: z.string().transform((s) => JSON.parse(s) as Record<string, string>),
  IFLOW_READ_ONLY: z.string().optional().transform((s) => s === "1").default("1"),
  IFLOW_REQUEST_TIMEOUT_MS: z.string().optional().transform((s) => parseInt(s || "20000", 10)).default("20000"),
  IFLOW_MAX_RESPONSE_BYTES: z.string().optional().transform((s) => parseInt(s || "10485760", 10)).default("10485760"),
  IFLOW_MAX_PAGES_PER_CALL: z.string().optional().transform((s) => parseInt(s || "5", 10)).default("5"),
  IFLOW_LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  IFLOW_OAUTH_ISSUER: z.string().url().optional(),
  IFLOW_OAUTH_JWKS_URL: z.string().url().optional().default("https://iflow.example/o/jwks/"),
  IFLOW_MCP_AUDIENCE: z.string().url().optional(),
  IFLOW_BFF_ONLY: z.string().optional().transform((s) => s === "1").default("0"),
  IFLOW_BFF_SHARED_SECRET: z.string().optional(),
  IFLOW_DPOP_REPLAY_CACHE: z.enum(["redis", "memory"]).default("memory"),
});

const result = configSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:", result.error.format());
  process.exit(1);
}

export const config = result.data;
