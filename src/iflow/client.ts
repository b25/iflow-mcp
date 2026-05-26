import type { AppConfig } from "./parse-env.js";
import { config } from "./config.js";
import { logger } from "../observability/logger.js";
import { resolveApiPoint } from "./resolve.js";
import { redactIflowErrorBodyForLog } from "./redact-log.js";

export type IFlowFetchOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  idempotencyKey?: string;
  /** PromoArt two-phase: repeat GET with `X-MCP-Confirm-Token` (or query `mcp_confirm` — prefer header). */
  confirmToken?: string;
};

/** Non-2xx response from iflow api-external (optional K1.3 `{ code, message, details }` body). */
export class IFlowHttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "IFlowHttpError";
    this.status = status;
    this.body = body;
  }
}

async function readBodyWithCap(
  response: Response,
  maxBytes: number
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    const t = await response.text();
    if (t.length > maxBytes) throw new Error("Response body exceeds size cap");
    return t;
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      reader.cancel().catch(() => {});
      throw new Error("Response body exceeds IFLOW_MAX_RESPONSE_BYTES");
    }
    chunks.push(value);
  }
  const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  return buf.toString("utf8");
}

export class IFlowClient {
  private readonly cfg: AppConfig;
  private baseUrl: string;
  private allowedHosts: string[];
  private bearer: string;

  constructor(cfg: AppConfig = config) {
    this.cfg = cfg;
    this.baseUrl = cfg.IFLOW_BASE_URL.endsWith("/")
      ? cfg.IFLOW_BASE_URL.slice(0, -1)
      : cfg.IFLOW_BASE_URL;
    this.allowedHosts = cfg.IFLOW_ALLOWED_HOSTS;
    this.bearer = cfg.IFLOW_API_BEARER;
  }

  private isAllowedHost(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return this.allowedHosts.includes(parsedUrl.hostname);
    } catch {
      return false;
    }
  }

  /**
   * @param apiPointKey — key in IFLOW_API_POINTS (not the raw UUID)
   */
  async fetch<T = unknown>(
    apiPointKey: string,
    method: "GET" | "POST" = "GET",
    body?: unknown,
    options?: IFlowFetchOptions
  ): Promise<T> {
    const brokerUuid = this.cfg.IFLOW_MCP_INTEGRATION_UUID;
    const url = brokerUuid
      ? new URL(`${this.baseUrl}/v1/${brokerUuid}/${apiPointKey}/`)
      : new URL(
          `${this.baseUrl}/api-external/v1/${resolveApiPoint(apiPointKey, this.cfg.IFLOW_API_POINTS)}/`
        );
    if (options?.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }

    if (!this.isAllowedHost(url.toString())) {
      throw new Error(`Forbidden host: ${url.hostname}`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.cfg.IFLOW_REQUEST_TIMEOUT_MS
    );

    try {
      logger.debug({ method, url: url.toString() }, "iflow fetch");

      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.bearer}`,
        Accept: "application/json",
      };
      if (options?.confirmToken) {
        headers["X-MCP-Confirm-Token"] = options.confirmToken;
      }
      if (method === "POST") {
        headers["Content-Type"] = "application/json";
        if (options?.idempotencyKey) {
          headers["Idempotency-Key"] = options.idempotencyKey;
        }
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        redirect: "manual",
      });

      if (
        response.status === 301 ||
        response.status === 302 ||
        response.status === 307 ||
        response.status === 308
      ) {
        const location = response.headers.get("location");
        if (location) {
          if (!this.isAllowedHost(location)) {
            throw new Error(
              `Forbidden redirect host: ${new URL(location, url).hostname}`
            );
          }
        }
        throw new Error(
          `Unexpected redirect (status ${response.status}) to ${location || "?"}`
        );
      }

      if (!response.ok) {
        const errText = await readBodyWithCap(
          response,
          Math.min(this.cfg.IFLOW_MAX_RESPONSE_BYTES, 1_048_576)
        );
        let parsed: unknown = errText;
        try {
          parsed = JSON.parse(errText);
        } catch {
          /* keep text */
        }
        logger.error(
          { status: response.status, errorData: redactIflowErrorBodyForLog(parsed) },
          "iflow API error"
        );
        const msgFromBody =
          parsed &&
          typeof parsed === "object" &&
          "message" in parsed &&
          typeof (parsed as { message: unknown }).message === "string"
            ? (parsed as { message: string }).message
            : errText;
        throw new IFlowHttpError(
          `iflow API error: ${response.status} ${msgFromBody}`,
          response.status,
          parsed
        );
      }

      const cl = response.headers.get("content-length");
      if (cl && parseInt(cl, 10) > this.cfg.IFLOW_MAX_RESPONSE_BYTES) {
        throw new Error("Response too large (Content-Length)");
      }

      const text = await readBodyWithCap(response, this.cfg.IFLOW_MAX_RESPONSE_BYTES);
      if (!text.length) return {} as T;
      return JSON.parse(text) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const iflowClient = new IFlowClient();
