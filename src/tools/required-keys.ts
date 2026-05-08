import { REQUIRED_IFLOW_API_POINT_KEYS } from "./required-keys-list.js";

export { REQUIRED_IFLOW_API_POINT_KEYS } from "./required-keys-list.js";

export function assertAllApiPointsConfigured(points: Record<string, string>): void {
  const missing: string[] = [];
  for (const key of REQUIRED_IFLOW_API_POINT_KEYS) {
    const v = points[key];
    if (typeof v !== "string" || !v.length) missing.push(key);
  }
  if (missing.length) {
    throw new Error(
      `IFLOW_API_POINTS missing keys: ${missing.join(", ")}. See .env.example and .plans/phase-a-desktop-mcp.md.`
    );
  }
}
