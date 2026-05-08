import { describe, it, expect } from "vitest";
import { assertAllApiPointsConfigured } from "../src/tools/required-keys.js";

describe("assertAllApiPointsConfigured", () => {
  it("passes when all keys present", () => {
    const points = JSON.parse(process.env.IFLOW_API_POINTS ?? "{}") as Record<string, string>;
    expect(() => assertAllApiPointsConfigured(points)).not.toThrow();
  });

  it("throws when a key is missing", () => {
    expect(() => assertAllApiPointsConfigured({ list_clients: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1" })).toThrow(
      /missing keys/i
    );
  });
});
