import { config } from "./config.js";

/** RFC 4122 variant + version 4 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Resolve a logical Api Point key from IFLOW_API_POINTS to the path UUID
 * used in /api-external/v1/<uuid>/.
 */
export function resolveApiPoint(
  key: string,
  points: Record<string, string> = config.IFLOW_API_POINTS
): string {
  const v = points[key];
  if (typeof v !== "string" || !v.length) {
    throw new Error(
      `Missing IFLOW_API_POINTS["${key}"]. Add this key to your IFLOW_API_POINTS JSON (see .env.example).`
    );
  }
  if (!UUID_RE.test(v)) {
    throw new Error(
      `IFLOW_API_POINTS["${key}"] must be a UUID (api-external path), got: "${v.slice(0, 36)}…"`
    );
  }
  return v;
}
