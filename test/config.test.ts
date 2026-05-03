import { describe, it, expect, vi } from "vitest";

describe("Configuration", () => {
  it("should fail if IFLOW_BASE_URL is missing", async () => {
    // Reset env
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.IFLOW_BASE_URL;

    // We need to dynamic import because the config executes on load
    await expect(import("../src/iflow/config.js")).rejects.toThrow();

    process.env = originalEnv;
  });

  it("should parse IFLOW_ALLOWED_HOSTS correctly", async () => {
    process.env.IFLOW_BASE_URL = "https://erp.example.com";
    process.env.IFLOW_ALLOWED_HOSTS = "erp.example.com,api.example.com";
    process.env.IFLOW_API_BEARER = "test";
    process.env.IFLOW_API_POINTS = "{}";

    const { config } = await import("../src/iflow/config.js?test1");
    expect(config.IFLOW_ALLOWED_HOSTS).toEqual(["erp.example.com", "api.example.com"]);
  });
});
