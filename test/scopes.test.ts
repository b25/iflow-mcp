import { describe, it, expect } from "vitest";
import {
  tokenHasAllScopes,
  tokenAllowsTool,
  parseScopeString,
} from "../src/auth/scopes.js";
import { normalizeScopeClaim } from "../src/auth/jwt.js";

describe("tokenHasAllScopes", () => {
  it("matches when all required scopes are present", () => {
    expect(
      tokenHasAllScopes("tools:erp:read tools:orders:read", ["tools:erp:read"])
    ).toBe(true);
    expect(tokenHasAllScopes("tools:orders:write", ["tools:orders:write"])).toBe(true);
  });

  it("fails when a required scope is missing", () => {
    expect(tokenHasAllScopes("tools:erp:read", ["tools:orders:write"])).toBe(false);
  });

  it("treats empty required list as satisfied", () => {
    expect(tokenHasAllScopes("", [])).toBe(true);
  });
});

describe("tokenAllowsTool", () => {
  it("allows create_order with tools:orders:write", () => {
    expect(tokenAllowsTool("tools:orders:write", "create_order")).toBe(true);
  });

  it("allows create_order once with elevated scope and jti", () => {
    expect(
      tokenAllowsTool("tools:orders:write:elevated", "create_order", "jti-one")
    ).toBe(true);
    expect(
      tokenAllowsTool("tools:orders:write:elevated", "create_order", "jti-one")
    ).toBe(false);
  });

  it("allows create_order with both elevated and standard scope (jti not consumed if standard matches)", () => {
    expect(
      tokenAllowsTool(
        "tools:orders:write tools:orders:write:elevated",
        "create_order",
        "jti-reuse"
      )
    ).toBe(true);
    expect(
      tokenAllowsTool("tools:orders:write:elevated", "create_order", "jti-reuse")
    ).toBe(true);
    expect(
      tokenAllowsTool("tools:orders:write:elevated", "create_order", "jti-reuse")
    ).toBe(false);
  });

  it("rejects elevated without jti", () => {
    expect(tokenAllowsTool("tools:orders:write:elevated", "create_order")).toBe(false);
  });

  it("allows health regardless of scope string", () => {
    expect(tokenAllowsTool("", "health")).toBe(true);
  });
});

describe("parseScopeString", () => {
  it("splits on whitespace", () => {
    expect(parseScopeString("a b  c")).toEqual(new Set(["a", "b", "c"]));
  });
});

describe("normalizeScopeClaim", () => {
  it("normalizes scp array", () => {
    expect(normalizeScopeClaim({ scp: ["tools:erp:read", "tools:analytics:read"] })).toBe(
      "tools:erp:read tools:analytics:read"
    );
  });

  it("uses scope string when present", () => {
    expect(normalizeScopeClaim({ scope: "tools:erp:read" })).toBe("tools:erp:read");
  });
});
