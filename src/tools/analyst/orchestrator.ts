import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { 
  analyzeExecutionLoss,
  analyzeSalesFunnel,
  analyzeReceivablesRisk,
  analyzeStockHealth,
  analyzeSupplierDrift,
  analyzeWorkflowEfficiency,
  analyzeCustomerHealth,
  analyzeCorrectionCosts
} from "./perspectives.js";

export const whereAreWeLosingMoneyTool: Tool = {
  name: "where_are_we_losing_money",
  description: "Orchestrate all 8 analyst perspectives to find major financial leakages.",
  inputSchema: z.object({
    language: z.enum(["ro", "en"]).optional().default("ro"),
  }),
  execute: async ({ language }): Promise<MCPToolResult> => {
    const tools = [
      analyzeExecutionLoss,
      analyzeSalesFunnel,
      analyzeReceivablesRisk,
      analyzeStockHealth,
      analyzeSupplierDrift,
      analyzeWorkflowEfficiency,
      analyzeCustomerHealth,
      analyzeCorrectionCosts,
    ];

    const results = await Promise.all(
      tools.map((t) =>
        t.execute({ language }).catch((e: Error) => ({
          isError: true,
          content: [{ type: "text" as const, text: e.message }],
        }))
      )
    );

    const allFindings = results
      .filter((r) => !(r as { isError?: boolean }).isError && (r as { structuredContent?: unknown }).structuredContent)
      .flatMap(
        (r) =>
          ((r as { structuredContent?: { findings?: unknown[] } }).structuredContent?.findings ??
            []) as Array<{ severity?: string; evidence?: { n_observations?: number } }>
      );

    const severityMap = { high: 3, medium: 2, low: 1 };
    const bySeverity = (a: { severity?: string }, b: { severity?: string }) =>
      (severityMap[b.severity as keyof typeof severityMap] ?? 1) -
      (severityMap[a.severity as keyof typeof severityMap] ?? 1);

    const highSignal = allFindings.filter((f) => {
      const n = f.evidence?.n_observations;
      return typeof n !== "number" || n >= 10;
    });
    const pool = highSignal.length > 0 ? highSignal : allFindings;
    const topFindings = [...pool].sort(bySeverity).slice(0, 3);

    const summaryText =
      language === "en"
        ? `Aggregated ${allFindings.length} observations across 8 perspectives. Top 3 priorities (preferring n≥10) are in structuredContent.`
        : `Am agregat ${allFindings.length} observații din 8 perspective. Primele 3 priorități (preferință pentru n≥10): mai jos în structuredContent.`;

    return {
      content: [
        {
          type: "text",
          text: summaryText,
        },
      ],
      structuredContent: {
        total_issues: allFindings.length,
        top_priorities: topFindings,
      },
    };
  },
};
