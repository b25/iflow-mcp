import { parseEnv, type AppConfig } from "./parse-env.js";

export type { AppConfig };

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env
): { ok: true; data: AppConfig } | { ok: false; error: import("zod").ZodError } {
  return parseEnv(env);
}

const loaded = loadConfig();
if (!loaded.ok) {
  console.error("Invalid environment variables:", loaded.error.format());
  process.exit(1);
}

export const config = loaded.data;
