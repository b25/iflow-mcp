import { describe, it, expect } from "vitest";
import { parseConfirmArgs } from "../src/cli/confirm.js";

describe("parseConfirmArgs", () => {
  it("parses --key and --token", () => {
    expect(parseConfirmArgs(["--key", "list_clients", "--token", "abc-123"])).toEqual({
      key: "list_clients",
      token: "abc-123",
    });
  });

  it("accepts reversed flag order", () => {
    expect(parseConfirmArgs(["--token", "t", "--key", "vat_estimate"])).toEqual({
      key: "vat_estimate",
      token: "t",
    });
  });

  it("throws when missing token", () => {
    expect(() => parseConfirmArgs(["--key", "x"])).toThrow(/Usage:/);
  });
});
