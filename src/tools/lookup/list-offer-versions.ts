import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listOfferVersionsTool: Tool = {
  name: "list_offer_versions",
  description:
    "Version/revision history of an offer (the \"Revizii\" chain). Offers are " +
    "versioned in place: all revisions share the same series+number and carry an " +
    "incrementing version (1, 2, 3...); the original is version 1 and every later " +
    "revision points back at it. Returns the full chain oldest -> newest. Each " +
    "entry has version, is_current (the displayed revision), data (ISO), autor_id " +
    "+ autor_nume (the agent who made the revision, null-safe), status (machine " +
    "tag) + status_label (RO), status_date, valoare_totala + currency, is_accepted " +
    "(true on the version where acceptance happened) and a best-effort diferente " +
    "(added/removed/changed line items vs the previous version). Response meta: " +
    "offer_id, numar, series, client {id, nume}, versions_count and " +
    "accepted_version (the accepted revision number, or null). The offer param " +
    "accepts an offer id (int) or an offer number (string); unknown -> " +
    "offer_not_found.",
  inputSchema: z.object({
    offer: z.union([z.number().int().positive(), z.string().min(1)]),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {
      offer: args.offer as string | number,
    };
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_offer_versions", "GET", undefined, { query: q }
    );
    const err =
      result.error && typeof result.error === "object"
        ? (result.error as Record<string, unknown>)
        : null;
    if (err) {
      return {
        content: [
          { type: "text", text: `Failed: ${String(err.message ?? err.code)}.` },
        ],
        structuredContent: result,
        isError: true,
      };
    }
    const count =
      typeof result.versions_count === "number" ? result.versions_count : 0;
    return {
      content: [{ type: "text", text: `Offer versions: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
