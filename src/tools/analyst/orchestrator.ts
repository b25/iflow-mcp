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
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    // Call all in parallel (simulated orchestration)
    const tools = [
      analyzeExecutionLoss,
      analyzeSalesFunnel,
      analyzeReceivablesRisk,
      analyzeStockHealth,
      analyzeSupplierDrift,
      analyzeWorkflowEfficiency,
      analyzeCustomerHealth,
      analyzeCorrectionCosts
    ];

    const results = await Promise.all(
      tools.map(t => t.execute({}).catch(e => ({ isError: true, content: [{ type: "text", text: e.message }] })))
    );

    // Rank by severity if available in structuredContent
    const allFindings = results
      .filter(r => !(r as any).isError && (r as any).structuredContent)
      .flatMap(r => ((r as any).structuredContent as any).findings || []);

    const topFindings = allFindings
      .sort((a, b) => {
        const severityMap = { high: 3, medium: 2, low: 1 };
        return severityMap[b.severity as keyof typeof severityMap] - severityMap[a.severity as keyof typeof severityMap];
      })
      .slice(0, 3);

    return {
      content: [
        {
          type: "text",
          text: `Found ${allFindings.length} issues across 8 perspectives. Top 3 prioritized below.`,
        },
      ],
      structuredContent: {
        total_issues: allFindings.length,
        top_priorities: topFindings,
      },
    };
  },
};
