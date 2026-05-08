import { describe, it, expect } from "vitest";
import { resolveApiPoint } from "../src/iflow/resolve.js";

describe("resolveApiPoint", () => {
  it("returns UUID for configured key", () => {
    const u = resolveApiPoint("list_clients");
    expect(u).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("throws for unknown key", () => {
    expect(() => resolveApiPoint("not_a_real_tool_key")).toThrow(/Missing IFLOW_API_POINTS/);
  });
});
