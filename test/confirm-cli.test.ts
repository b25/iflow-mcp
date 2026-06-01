import { describe, it, expect } from "vitest";
import { parseConfirmArgs } from "../src/cli/confirm.js";

describe("parseConfirmArgs", () => {
  it("parses --key and --token", () => {
    expect(
      parseConfirmArgs(["--key", "list_clients", "--token", "abc-1234567890123"])
    ).toEqual({
      key: "list_clients",
      token: "abc-1234567890123",
    });
  });

  it("accepts reversed flag order", () => {
    expect(
      parseConfirmArgs(["--token", "reversed-order-token-OK1", "--key", "vat_estimate"])
    ).toEqual({
      key: "vat_estimate",
      token: "reversed-order-token-OK1",
    });
  });

  it("throws when missing key", () => {
    expect(() => parseConfirmArgs(["--token", "x"])).toThrow(/key/i);
  });

  it("throws when missing token and no IFLOW_CONFIRM_TOKEN", () => {
    expect(() => parseConfirmArgs(["--key", "x"])).toThrow(/token/i);
  });

  it("uses IFLOW_CONFIRM_TOKEN environment variable", () => {
    process.env.IFLOW_CONFIRM_TOKEN = "env-token-123456789";
    try {
      expect(parseConfirmArgs(["--key", "x"])).toEqual({
        key: "x",
        token: "env-token-123456789",
      });
    } finally {
      delete process.env.IFLOW_CONFIRM_TOKEN;
    }
  });

  it("CLI --token overrides IFLOW_CONFIRM_TOKEN", () => {
    process.env.IFLOW_CONFIRM_TOKEN = "env-token-123456789";
    try {
      expect(parseConfirmArgs(["--key", "x", "--token", "cli-token-678901234"])).toEqual({
        key: "x",
        token: "cli-token-678901234",
      });
    } finally {
      delete process.env.IFLOW_CONFIRM_TOKEN;
    }
  });

  it("validates token format (UUID v4)", () => {
    expect(() => parseConfirmArgs(["--key", "x", "--token", "short"])).toThrow(
      /invalid token format/i
    );
  });

  it("accepts valid UUID v4 token", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(parseConfirmArgs(["--key", "x", "--token", uuid])).toEqual({
      key: "x",
      token: uuid,
    });
  });
});
