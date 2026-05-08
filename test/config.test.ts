import { describe, it, expect } from "vitest";
import { parseEnv } from "../src/iflow/parse-env.js";

describe("parseEnv", () => {
  it("fails when IFLOW_BASE_URL is missing", () => {
    const r = parseEnv({
      IFLOW_ALLOWED_HOSTS: "x.com",
      IFLOW_API_BEARER: "t",
      IFLOW_API_POINTS: "{}",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects non-https IFLOW_BASE_URL by default", () => {
    const r = parseEnv({
      IFLOW_BASE_URL: "http://evil.com",
      IFLOW_ALLOWED_HOSTS: "evil.com",
      IFLOW_API_BEARER: "t",
      IFLOW_API_POINTS: "{}",
    });
    expect(r.ok).toBe(false);
  });

  it("allows http IFLOW_BASE_URL when IFLOW_ALLOW_INSECURE_HTTP=1", () => {
    const r = parseEnv({
      IFLOW_BASE_URL: "http://127.0.0.1:8000",
      IFLOW_ALLOW_INSECURE_HTTP: "1",
      IFLOW_ALLOWED_HOSTS: "127.0.0.1",
      IFLOW_API_BEARER: "t",
      IFLOW_API_POINTS: "{}",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.IFLOW_ALLOW_INSECURE_HTTP).toBe(true);
  });

  it("parses IFLOW_ALLOWED_HOSTS list", () => {
    const r = parseEnv({
      IFLOW_BASE_URL: "https://erp.example.com",
      IFLOW_ALLOWED_HOSTS: "erp.example.com, api.example.com ",
      IFLOW_API_BEARER: "t",
      IFLOW_API_POINTS: "{}",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.IFLOW_ALLOWED_HOSTS).toEqual(["erp.example.com", "api.example.com"]);
    }
  });

  it("defaults IFLOW_READ_ONLY to false", () => {
    const r = parseEnv({
      IFLOW_BASE_URL: "https://erp.example.com",
      IFLOW_ALLOWED_HOSTS: "erp.example.com",
      IFLOW_API_BEARER: "t",
      IFLOW_API_POINTS: "{}",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.IFLOW_READ_ONLY).toBe(false);
  });

  it("defaults IFLOW_READ_ONLY to true when IFLOW_MCP_TRANSPORT is http", () => {
    const r = parseEnv({
      IFLOW_BASE_URL: "https://erp.example.com",
      IFLOW_ALLOWED_HOSTS: "erp.example.com",
      IFLOW_API_BEARER: "t",
      IFLOW_API_POINTS: "{}",
      IFLOW_MCP_TRANSPORT: "http",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.IFLOW_READ_ONLY).toBe(true);
  });

  it("honors IFLOW_READ_ONLY=0 when IFLOW_MCP_TRANSPORT is http", () => {
    const r = parseEnv({
      IFLOW_BASE_URL: "https://erp.example.com",
      IFLOW_ALLOWED_HOSTS: "erp.example.com",
      IFLOW_API_BEARER: "t",
      IFLOW_API_POINTS: "{}",
      IFLOW_MCP_TRANSPORT: "http",
      IFLOW_READ_ONLY: "0",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.IFLOW_READ_ONLY).toBe(false);
  });

  it("defaults IFLOW_HTTP_BIND_HOST to loopback", () => {
    const r = parseEnv({
      IFLOW_BASE_URL: "https://erp.example.com",
      IFLOW_ALLOWED_HOSTS: "erp.example.com",
      IFLOW_API_BEARER: "t",
      IFLOW_API_POINTS: "{}",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.IFLOW_HTTP_BIND_HOST).toBe("127.0.0.1");
  });
});
