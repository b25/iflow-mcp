import { describe, it, expect } from "vitest";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { mapIFlowError } from "../src/iflow/errors.js";
import { IFlowHttpError } from "../src/iflow/client.js";

describe("mapIFlowError", () => {
  it("maps IFlowHttpError with K1.3-style NOT_FOUND body", () => {
    const err = new IFlowHttpError("wrapped", 404, {
      code: "NOT_FOUND",
      message: "Api point missing",
    });
    const m = mapIFlowError(err);
    expect(m).toBeInstanceOf(McpError);
    expect(m.code).toBe(ErrorCode.InvalidRequest);
    expect(String(m.message)).toContain("Api point missing");
  });

  it("maps IFlowHttpError 400 without code to InvalidRequest", () => {
    const err = new IFlowHttpError("bad", 400, { success: false });
    const m = mapIFlowError(err);
    expect(m.code).toBe(ErrorCode.InvalidRequest);
  });

  it("maps IFlowHttpError 500 to InternalError", () => {
    const err = new IFlowHttpError("srv", 500, {});
    const m = mapIFlowError(err);
    expect(m.code).toBe(ErrorCode.InternalError);
  });

  it("maps AbortError to timeout message", () => {
    const e = new Error("aborted");
    e.name = "AbortError";
    const m = mapIFlowError(e);
    expect(String(m.message)).toMatch(/timeout/i);
  });

  it("maps confirmation_required to InvalidRequest with CLI hint", () => {
    const err = new IFlowHttpError("wrapped", 403, {
      code: "confirmation_required",
      message: "Operator approval required",
      details: { confirm_token: "x", pending_id: "y" },
    });
    const m = mapIFlowError(err);
    expect(m.code).toBe(ErrorCode.InvalidRequest);
    expect(String(m.message)).toContain("Operator approval");
    expect(String(m.message)).toContain("iflows-mcp confirm");
  });

  it("maps invalid_mcp_confirm_token to InvalidRequest", () => {
    const err = new IFlowHttpError("x", 403, {
      code: "invalid_mcp_confirm_token",
      message: "Token invalid",
    });
    const m = mapIFlowError(err);
    expect(m.code).toBe(ErrorCode.InvalidRequest);
    expect(String(m.message)).toContain("Token invalid");
  });
});
