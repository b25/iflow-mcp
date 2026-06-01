import { describe, it, expect, vi, afterEach } from "vitest";
import type { AppConfig } from "../src/iflow/parse-env.js";
import { IFlowClient } from "../src/iflow/client.js";
import { mcpAuthContext } from "../src/context/mcp-auth-context.js";

const testCfg: AppConfig = {
  IFLOW_BASE_URL: "https://ok.example.com",
  IFLOW_ALLOW_INSECURE_HTTP: false,
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
  IFLOW_HTTP_BIND_HOST: "127.0.0.1",
  IFLOW_MCP_TRANSPORT: "stdio",
  IFLOW_MCP_INTEGRATION_UUID: undefined,
};

describe("OpenTelemetry Tracing Propagation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("propagates traceparent and tracestate headers to outbound iflow request if they exist in mcpAuthContext", async () => {
    const client = new IFlowClient(testCfg);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const mockTraceparent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
    const mockTracestate = "rojo=00f067aa0ba902b7,congo=t61rcWkgMzE";

    await mcpAuthContext.run(
      {
        scope: "read write",
        requestId: "req-123-abc",
        traceparent: mockTraceparent,
        tracestate: mockTracestate,
      },
      async () => {
        await client.fetch("list_clients");
      }
    );

    expect(fetch).toHaveBeenCalledWith(
      "https://ok.example.com/api-external/v1/00000000-0000-4000-8000-000000000000/",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-bearer-token",
          "X-Request-Id": "req-123-abc",
          traceparent: mockTraceparent,
          tracestate: mockTracestate,
        }),
      })
    );
  });
});
