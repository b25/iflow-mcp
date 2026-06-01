import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

const language = z.enum(["ro", "en"]).optional();

const TOPICS = [
  "orders",
  "offers",
  "clients",
  "products",
  "finance",
  "workflow",
  "diagnose",
] as const;

const ENTITIES = [
  "orders",
  "offers",
  "clients",
  "products",
  "invoices",
  "purchases",
  "activity",
] as const;

function asQuery(
  args: Record<string, unknown>
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object") out[k] = JSON.stringify(v);
    else out[k] = v as string | number | boolean;
  }
  return out;
}

export const mcpAssistantIntroTool: Tool = {
  name: "mcp_assistant_intro",
  description:
    "Start here. Returns an iFlow business overview, the main topics (orders/offers/clients/products/finance/workflow/diagnose), top user questions and the assistant flow (intro -> dictionary -> clarify -> plan). Call this first when the user asks 'what can you do?' or starts a new conversation.",
  inputSchema: z.object({
    topic: z.enum(TOPICS).optional(),
    language,
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{
      focus?: unknown[];
      top_questions?: string[];
      overview?: string;
    }>("mcp_assistant_intro", "GET", undefined, { query: asQuery(args) });
    const lines: string[] = [];
    if (result.overview) lines.push(result.overview);
    if (Array.isArray(result.top_questions)) {
      lines.push("Top user questions:");
      lines.push(...result.top_questions.map((q) => `  - ${q}`));
    }
    return {
      content: [{ type: "text", text: lines.join("\n") || "Assistant intro." }],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const mcpDataDictionaryTool: Tool = {
  name: "mcp_data_dictionary",
  description:
    "Describe iFlow data entities (fields, statuses, enums, related tools). Use to learn what fields exist before constructing filters. Pass `entity` for a single one or omit for all.",
  inputSchema: z.object({
    entity: z.enum(ENTITIES).optional(),
    language,
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{ count?: number; results?: unknown[] }>(
      "mcp_data_dictionary",
      "GET",
      undefined,
      { query: asQuery(args) }
    );
    return {
      content: [
        {
          type: "text",
          text: `Dictionary covers ${result.count ?? result.results?.length ?? 0} entity(ies).`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const mcpClarifyTool: Tool = {
  name: "mcp_clarify",
  description:
    "Ask clarifying questions for a fuzzy user objective in natural language. Returns structured questions {id, prompt, type, options, default} grouped by topic, plus candidate tools. After collecting answers, call mcp_plan.",
  inputSchema: z.object({
    objective: z.string().min(2),
    language,
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{
      clarifications?: Array<{ topic?: string; questions?: unknown[] }>;
      matched_topics?: string[];
    }>("mcp_clarify", "GET", undefined, { query: asQuery(args) });
    const topics = (result.matched_topics ?? []).join(", ") || "generic";
    const totalQ = (result.clarifications ?? []).reduce(
      (acc, c) => acc + (Array.isArray(c.questions) ? c.questions.length : 0),
      0
    );
    return {
      content: [
        {
          type: "text",
          text: `Matched topic(s): ${topics}. ${totalQ} clarifying question(s) to ask the user.`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};

export const mcpPlanTool: Tool = {
  name: "mcp_plan",
  description:
    "Return an executable plan (ordered list of tool calls with concrete args + rationale) for an objective. Pass `answers` (object keyed by clarification id) to refine the plan. Each step has {tool, args, why}; execute them sequentially.",
  inputSchema: z.object({
    objective: z.string().min(2),
    answers: z.record(z.unknown()).optional(),
    language,
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<{
      step_count?: number;
      steps?: Array<{ tool?: string; why?: string }>;
    }>("mcp_plan", "GET", undefined, { query: asQuery(args) });
    const summary = (result.steps ?? [])
      .map((s, i) => `${i + 1}. ${s.tool ?? "?"} — ${s.why ?? ""}`)
      .join("\n");
    return {
      content: [
        {
          type: "text",
          text: `Plan: ${result.step_count ?? 0} step(s).\n${summary}`,
        },
      ],
      structuredContent: result as Record<string, unknown>,
    };
  },
};
