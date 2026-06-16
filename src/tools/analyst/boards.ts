import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

/**
 * Pass-through tools for analyze_business_board and analyze_business_health.
 *
 * These two endpoints return shapes that are fundamentally different from the
 * standard AnalystResult (findings/report) used by all other analyze_* tools:
 *   - board  → {board, label, range, sections[]}
 *   - health → {health: {overall, label, headline, dimensions[], ...}}
 *
 * Routing them through createPerspectiveTool / normalizeAnalystResult would
 * mangle the payload (findings array would be empty, the real data discarded).
 * Instead, these tools fetch and return the raw backend response unchanged.
 */

type BoardKey = "finance" | "customers" | "profitability" | "operations" | "fraude";
type RangeKey = "7d" | "1m" | "3m" | "6m" | "1y";

interface BoardResponse {
  board: string;
  label: string;
  range: Record<string, unknown>;
  sections: unknown[];
}

interface HealthResponse {
  health: Record<string, unknown>;
}

export const analyzeBusinessBoard: Tool = {
  name: "analyze_business_board",
  description:
    "Business analysis board: charts with conclusions (finance/clients/profitability/operations/fraud) over a period. Admin only.",
  inputSchema: z.object({
    board: z
      .enum(["finance", "customers", "profitability", "operations", "fraude"] as [BoardKey, ...BoardKey[]])
      .optional(),
    range: z
      .enum(["7d", "1m", "3m", "6m", "1y"] as [RangeKey, ...RangeKey[]])
      .optional(),
  }),
  execute: async ({ board, range }): Promise<MCPToolResult<BoardResponse>> => {
    const query: Record<string, string> = {};
    if (board) query.board = board;
    if (range) query.range = range;
    const data = await iflowClient.fetch<BoardResponse>(
      "analyze_business_board",
      "GET",
      undefined,
      { query: Object.keys(query).length ? query : undefined }
    );
    return {
      content: [
        {
          type: "text",
          text: `Board "${data.board ?? board ?? "finance"}" (${data.label ?? range ?? "7d"}): ${Array.isArray(data.sections) ? data.sections.length : 0} section(s). See structuredContent for charts and conclusions.`,
        },
      ],
      structuredContent: data,
      isError: false,
    };
  },
};

export const analyzeBusinessHealth: Tool = {
  name: "analyze_business_health",
  description:
    "Global business health score (dimensions, strengths, risks, actions) aggregated from all boards. Admin only.",
  inputSchema: z.object({
    range: z
      .enum(["7d", "1m", "3m", "6m", "1y"] as [RangeKey, ...RangeKey[]])
      .optional(),
  }),
  execute: async ({ range }): Promise<MCPToolResult<HealthResponse>> => {
    const query: Record<string, string> = {};
    if (range) query.range = range;
    const data = await iflowClient.fetch<HealthResponse>(
      "analyze_business_health",
      "GET",
      undefined,
      { query: Object.keys(query).length ? query : undefined }
    );
    const h = data.health ?? {};
    const overall = (h as Record<string, unknown>).overall;
    const headline = (h as Record<string, unknown>).headline;
    return {
      content: [
        {
          type: "text",
          text: `Business health score: ${overall ?? "N/A"}. ${headline ?? ""} See structuredContent.health for full breakdown.`,
        },
      ],
      structuredContent: data,
      isError: false,
    };
  },
};
