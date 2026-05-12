import { describe, it, expect } from "vitest";
import { redactIflowErrorBodyForLog } from "../src/iflow/redact-log.js";

describe("redactIflowErrorBodyForLog", () => {
  it("redacts confirm_token and pending_id inside details", () => {
    const body = {
      code: "confirmation_required",
      message: "Need approval",
      details: {
        pending_id: "uuid-p",
        confirm_token: "secret-ct",
        expires_at: "2099-01-01T00:00:00Z",
      },
    };
    const r = redactIflowErrorBodyForLog(body) as typeof body;
    expect(r.details.confirm_token).toBe("[REDACTED]");
    expect(r.details.pending_id).toBe("[REDACTED]");
    expect(r.details.expires_at).toBe("2099-01-01T00:00:00Z");
  });

  it("passes through primitives", () => {
    expect(redactIflowErrorBodyForLog(null)).toBe(null);
    expect(redactIflowErrorBodyForLog("x")).toBe("x");
  });
});
