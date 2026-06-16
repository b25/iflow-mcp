import { describe, it, expect, vi, afterEach } from "vitest";
import type { AppConfig } from "../src/iflow/parse-env.js";
import { IFlowClient } from "../src/iflow/client.js";
import { mcpAuthContext } from "../src/context/mcp-auth-context.js";
import { extractActorUserId } from "../src/transport/django-bff-jsonrpc.js";

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

describe("extractActorUserId", () => {
  it('parses a plain digit string', () => {
    expect(extractActorUserId("42")).toBe("42");
  });

  it('trims surrounding whitespace and parses', () => {
    expect(extractActorUserId(" 42 ")).toBe("42");
  });

  it('returns undefined for alphabetic string', () => {
    expect(extractActorUserId("abc")).toBeUndefined();
  });

  it('returns undefined for decimal fraction', () => {
    expect(extractActorUserId("4.2")).toBeUndefined();
  });

  it('returns undefined for negative number', () => {
    expect(extractActorUserId("-1")).toBeUndefined();
  });

  it('returns undefined for unicode superscript digit (U+00B2)', () => {
    expect(extractActorUserId("²")).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(extractActorUserId(undefined)).toBeUndefined();
  });

  it('returns undefined for array-valued header', () => {
    expect(extractActorUserId(["42", "43"])).toBeUndefined();
  });
});

describe("X-IFlow-Actor-User-Id forwarding", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("forwards X-IFlow-Actor-User-Id when actorUserId is set in auth context", async () => {
    const client = new IFlowClient(testCfg);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await mcpAuthContext.run({ scope: "read write", actorUserId: "42" }, () =>
      client.fetch("list_clients")
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-IFlow-Actor-User-Id": "42",
        }),
      })
    );
  });

  it("omits X-IFlow-Actor-User-Id when actorUserId is not set in auth context", async () => {
    const client = new IFlowClient(testCfg);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await mcpAuthContext.run({ scope: "read write" }, () =>
      client.fetch("list_clients")
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          "X-IFlow-Actor-User-Id": expect.anything(),
        }),
      })
    );
  });
});
