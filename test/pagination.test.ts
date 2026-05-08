import { describe, it, expect } from "vitest";
import { fetchAllPages, PaginatedResponse } from "../src/iflow/pagination.js";

describe("fetchAllPages", () => {
  it("respects maxPages even when next is always set", async () => {
    let calls = 0;
    const fetchPage = async (page: number): Promise<PaginatedResponse<string>> => {
      calls++;
      return {
        count: 100,
        next: "https://example.com/?page=2",
        previous: null,
        results: [`p${page}-a`, `p${page}-b`],
      };
    };

    const all = await fetchAllPages(fetchPage, 3);
    expect(calls).toBe(3);
    expect(all).toEqual(["p1-a", "p1-b", "p2-a", "p2-b", "p3-a", "p3-b"]);
  });

  it("stops early when next is null", async () => {
    let calls = 0;
    const fetchPage = async (page: number): Promise<PaginatedResponse<number>> => {
      calls++;
      return {
        count: 2,
        next: page >= 2 ? null : "?page=2",
        previous: null,
        results: [page],
      };
    };
    const all = await fetchAllPages(fetchPage, 10);
    expect(calls).toBe(2);
    expect(all).toEqual([1, 2]);
  });
});
