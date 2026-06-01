import { z } from "zod";

export interface MCPToolResult<T = any> {
  content: {
    type: "text";
    text: string;
  }[];
  structuredContent?: T;
  isError?: boolean;
}

export interface AnalystFinding {
  headline: string;
  severity: "low" | "medium" | "high";
  evidence: {
    metric: string;
    current: number;
    baseline: number;
    delta_pct: number;
    n_observations: number;
    period_label: string;
    comparison_period_label: string;
  };
  hypothesis?: {
    causes: string[];
    confidence: "low" | "medium" | "high";
  };
  drill_down_tools?: string[];
}

export interface AnalystResult {
  perspective: string;
  findings: AnalystFinding[];
  suppressed_count: number;
  baseline_method: string;
  methodology_notes: string[];
  /** Optional tabular payload (e.g. analyze_correction_costs). */
  report?: Record<string, unknown>;
}

export interface Tool<TIn = any, TOut = any> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TIn>;
  execute: (args: TIn) => Promise<MCPToolResult<TOut>>;
}
