/**
 * CLI: repeat GET /api-external/v1/<uuid>/ with X-MCP-Confirm-Token after a
 * confirmation_required response (PromoArt two-phase contract).
 */
import { applyTransportDefaults, parseEnv } from "../iflow/parse-env.js";
import { resolveApiPoint } from "../iflow/resolve.js";

/** @returns UUID v4 regex pattern */
function isValidTokenFormat(token: string): boolean {
  // PromoArt tokens are typically UUIDs or similar hex strings
  const uuidv4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidv4Pattern.test(token) || token.length >= 16;
}

export function parseConfirmArgs(argv: string[]): { key: string; token: string } {
  let key = "";
  let token = "";

  // Check environment variable first for token (security: avoid CLI argument exposure)
  const envToken = process.env.IFLOW_CONFIRM_TOKEN?.trim();
  if (envToken) {
    token = envToken;
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--key" && argv[i + 1]) {
      key = argv[++i];
      continue;
    }
    if (a === "--token" && argv[i + 1]) {
      token = argv[++i];
      continue;
    }
  }
  if (!key.trim()) {
    throw new Error(
      "Usage: iflow-mcp confirm --key <IFLOW_API_POINTS logical key> [--token <confirm_token>] or set IFLOW_CONFIRM_TOKEN"
    );
  }
  if (!token.trim()) {
    throw new Error(
      "Token required: use --token <confirm_token> or set IFLOW_CONFIRM_TOKEN environment variable"
    );
  }
  if (!isValidTokenFormat(token)) {
    throw new Error(
      "Invalid token format: expected UUID v4 or hex string (min 16 chars)"
    );
  }
  return { key: key.trim(), token: token.trim() };
}

function isAllowedHost(allowed: string[], targetUrl: string): boolean {
  try {
    const u = new URL(targetUrl);
    return allowed.includes(u.hostname);
  } catch {
    return false;
  }
}

/** @returns process exit code (0 = success). */
export async function runConfirmCli(argv: string[]): Promise<number> {
  const { key, token } = parseConfirmArgs(argv);
  const parsed = parseEnv(applyTransportDefaults(process.env));
  if (!parsed.ok) {
    console.error("Invalid environment:", parsed.error.format());
    return 1;
  }
  const cfg = parsed.data;
  let pathUuid: string;
  try {
    pathUuid = resolveApiPoint(key, cfg.IFLOW_API_POINTS);
  } catch (e) {
    console.error(String(e instanceof Error ? e.message : e));
    return 1;
  }

  const base = cfg.IFLOW_BASE_URL.endsWith("/")
    ? cfg.IFLOW_BASE_URL.slice(0, -1)
    : cfg.IFLOW_BASE_URL;
  const rawPrefix = cfg.IFLOW_ENDPOINT_PATH_PREFIX ?? "/api-external/v1/";
  const prefix = rawPrefix.endsWith("/") ? rawPrefix : `${rawPrefix}/`;
  const cleanPrefix = prefix.startsWith("/") ? prefix.slice(1) : prefix;
  const url = new URL(`${base}/${cleanPrefix}${pathUuid}/`);
  if (!isAllowedHost(cfg.IFLOW_ALLOWED_HOSTS, url.toString())) {
    console.error(`Forbidden host: ${url.hostname}`);
    return 1;
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${cfg.IFLOW_API_BEARER}`,
      Accept: "application/json",
      "X-MCP-Confirm-Token": token,
    },
    redirect: "manual",
  });

  const text = await res.text();
  if (!res.ok) {
    let parsedBody: unknown = text;
    try {
      parsedBody = JSON.parse(text);
    } catch {
      /* keep text */
    }
    console.error(`HTTP ${res.status}:`, JSON.stringify(parsedBody, null, 2));
    return 1;
  }

  try {
    const json = JSON.parse(text);
    console.log(JSON.stringify(json, null, 2));
  } catch {
    console.log(text);
  }
  return 0;
}
