import { afterEach, describe, expect, it, vi } from "vitest";
import { runReadinessChecks } from "../src/observability/readiness.js";

describe("runReadinessChecks", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ready when OAuth not configured (desktop / Phase A)", async () => {
    // Relies on test/setup-env.ts not setting IFLOW_OAUTH_*.
    const r = await runReadinessChecks();
    expect(r.ready).toBe(true);
    expect(r.checks.oauth).toBe("not_configured");
    expect(r.checks.config).toBe("ok");
    expect(r.checks.transport).toBe("stdio");
  });

  it("not ready for HTTP transport when OAuth is not configured", async () => {
    const r = await runReadinessChecks({ mcpTransport: "http" });
    expect(r.ready).toBe(false);
    expect(r.checks.oauth).toBe("required_for_http_transport");
    expect(r.checks.transport).toBe("http");
  });

  it("not ready when OAuth partially configured", async () => {
    const r = await runReadinessChecks({
      issuer: "https://issuer.example",
      jwksUrl: undefined,
      audience: "https://resource.example",
    });
    expect(r.ready).toBe(false);
    expect(r.checks.oauth).toBe("incomplete");
  });

  it("ready when JWKS returns valid document", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ keys: [{ kid: "a" }] })),
      })
    );
    const r = await runReadinessChecks({
      issuer: "https://issuer.example",
      jwksUrl: "https://issuer.example/.well-known/jwks.json",
      audience: "https://mcp.example/res",
    });
    expect(r.ready).toBe(true);
    expect(r.checks.jwks).toBe("ok");
  });

  it("not ready when JWKS HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
      })
    );
    const r = await runReadinessChecks({
      issuer: "https://issuer.example",
      jwksUrl: "https://issuer.example/.well-known/jwks.json",
      audience: "https://mcp.example/res",
    });
    expect(r.ready).toBe(false);
    expect(r.checks.jwks).toBe("http_502");
  });

  it("not ready when JWKS body has no keys array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("{}"),
      })
    );
    const r = await runReadinessChecks({
      issuer: "https://issuer.example",
      jwksUrl: "https://issuer.example/.well-known/jwks.json",
      audience: "https://mcp.example/res",
    });
    expect(r.ready).toBe(false);
    expect(r.checks.jwks).toBe("invalid_document");
  });
});
