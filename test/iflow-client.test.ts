import { describe, it, expect, vi, afterEach } from "vitest";
import type { AppConfig } from "../src/iflow/parse-env.js";
import { IFlowClient } from "../src/iflow/client.js";

const testCfg: AppConfig = {
  IFLOW_BASE_URL: "https://ok.example.com",
  IFLOW_ALLOWED_HOSTS: ["ok.example.com"],
  IFLOW_API_BEARER: "test-bearer-token",
  IFLOW_API_POINTS: {
    list_clients: "00000000-0000-4000-8000-000000000000",
  },
  IFLOW_READ_ONLY: false,
  IFLOW_REQUEST_TIMEOUT_MS: 5000,
  IFLOW_MAX_RESPONSE_BYTES: 65536,
  IFLOW_MAX_PAGES_PER_CALL: 5,
  IFLOW_LOG_LEVEL: "info",
  IFLOW_OAUTH_ISSUER: undefined,
  IFLOW_OAUTH_JWKS_URL: undefined,
  IFLOW_MCP_AUDIENCE: undefined,
  IFLOW_BFF_ONLY: false,
  IFLOW_BFF_SHARED_SECRET: undefined,
  IFLOW_DPOP_REPLAY_CACHE: "memory",
};

describe("IFlowClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects when request URL host is not allowlisted", async () => {
    const client = new IFlowClient({
      ...testCfg,
      IFLOW_BASE_URL: "https://evil.example.com",
      IFLOW_ALLOWED_HOSTS: ["ok.example.com"],
    });
    await expect(client.fetch("list_clients")).rejects.toThrow(/Forbidden host/);
  });

  it("rejects redirect to non-allowlisted host", async () => {
    const client = new IFlowClient(testCfg);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 302,
          headers: { Location: "https://evil.example.com/next" },
        })
      )
    );
    await expect(client.fetch("list_clients")).rejects.toThrow(/Forbidden redirect host/);
  });

  it("sends Authorization, Idempotency-Key on POST, and parses JSON body", async () => {
    const client = new IFlowClient(testCfg);
    const payload = { count: 2, results: [] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const out = await client.fetch(
      "list_clients",
      "POST",
      { x: 1 },
      { idempotencyKey: "idem-key-123" }
    );
    expect(out).toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      "https://ok.example.com/api-external/v1/00000000-0000-4000-8000-000000000000/",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-bearer-token",
          "Idempotency-Key": "idem-key-123",
          "Content-Type": "application/json",
        }),
      })
    );
  });
});
