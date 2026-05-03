import { config } from "./config.js";
import { logger } from "../observability/logger.js";

export class IFlowClient {
  private baseUrl: string;
  private allowedHosts: string[];
  private bearer: string;

  constructor() {
    this.baseUrl = config.IFLOW_BASE_URL.endsWith("/")
      ? config.IFLOW_BASE_URL.slice(0, -1)
      : config.IFLOW_BASE_URL;
    this.allowedHosts = config.IFLOW_ALLOWED_HOSTS;
    this.bearer = config.IFLOW_API_BEARER;
  }

  private isAllowedHost(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return this.allowedHosts.includes(parsedUrl.hostname);
    } catch {
      return false;
    }
  }

  async fetch(pathUuid: string, method: "GET" | "POST" = "GET", body?: any) {
    const url = `${this.baseUrl}/api-external/v1/${pathUuid}/`;
    
    if (!this.isAllowedHost(url)) {
      throw new Error(`Forbidden host: ${new URL(url).hostname}`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.IFLOW_REQUEST_TIMEOUT_MS);

    try {
      logger.debug({ method, url }, "Fetching from iflow");
      
      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${this.bearer}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        redirect: "manual",
      });

      if (response.status === 301 || response.status === 302) {
        const location = response.headers.get("location");
        if (location && !this.isAllowedHost(location)) {
          throw new Error(`Forbidden redirect host: ${new URL(location).hostname}`);
        }
        // In Phase A we don't follow redirects automatically for safety
        throw new Error(`Unexpected redirect to ${location}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error({ status: response.status, errorData }, "iflow API error");
        throw new Error(`iflow API error: ${response.status} ${JSON.stringify(errorData)}`);
      }

      // Check response size
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > config.IFLOW_MAX_RESPONSE_BYTES) {
        throw new Error("Response too large");
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const iflowClient = new IFlowClient();
