import { z } from "zod";
import type { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listWorkFlowsTool: Tool = {
  name: "list_work_flows",
  description:
    "List work flows (FlowSettings) with ids — use flow_id in orders_flow_stage_report and list_flow_stages.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>("list_work_flows", "GET");
    return {
      content: [{ type: "text", text: "list_work_flows completed." }],
      structuredContent: result,
    };
  },
};

export const listFlowStagesTool: Tool = {
  name: "list_flow_stages",
  description:
    "List stages (StageItem) for a flow — stage ids match department_type on OrderItemHistory / filters in orders_flow_stage_report.",
  inputSchema: z.object({
    flow_id: z.number().int().positive(),
  }),
  execute: async ({ flow_id }): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>("list_flow_stages", "GET", undefined, {
      query: { flow_id },
    });
    return {
      content: [{ type: "text", text: "list_flow_stages completed." }],
      structuredContent: result,
    };
  },
};

export const listUserDepartmentsTool: Tool = {
  name: "list_user_departments",
  description: "List user departments (UserDepartment) — use ids as department_id in orders_flow_stage_report.",
  inputSchema: z.object({}),
  execute: async (): Promise<MCPToolResult> => {
    const result = await iflowClient.fetch<Record<string, unknown>>("list_user_departments", "GET");
    return {
      content: [{ type: "text", text: "list_user_departments completed." }],
      structuredContent: result,
    };
  },
};

export const ordersFlowStageReportTool: Tool = {
  name: "orders_flow_stage_report",
  description:
    "Orders finished in a calendar month on a given flow, optional stage and employee-department filters, with total_amount and paired worked time at that stage (OrderItemHistory intervals).",
  inputSchema: z.object({
    flow_id: z.number().int().positive(),
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    stage_id: z.number().int().positive().optional(),
    department_id: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(500).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {
      flow_id: args.flow_id,
      year: args.year,
      month: args.month,
    };
    if (args.stage_id != null) q.stage_id = args.stage_id;
    if (args.department_id != null) q.department_id = args.department_id;
    if (args.limit != null) q.limit = args.limit;
    const result = await iflowClient.fetch<Record<string, unknown>>("orders_flow_stage_report", "GET", undefined, {
      query: q,
    });
    return {
      content: [{ type: "text", text: "orders_flow_stage_report completed." }],
      structuredContent: result,
    };
  },
};

export const orderProcessingHistoryTool: Tool = {
  name: "order_processing_history",
  description:
    "Per-order processing history: OrderItemHistory rows with stage, employee, action type, and paired worked_seconds_interval when available.",
  inputSchema: z.object({
    order_id: z.number().int().positive(),
    limit: z.number().int().min(1).max(1000).optional(),
  }),
  execute: async ({ order_id, limit }): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = { order_id };
    if (limit != null) q.limit = limit;
    const result = await iflowClient.fetch<Record<string, unknown>>("order_processing_history", "GET", undefined, {
      query: q,
    });
    return {
      content: [{ type: "text", text: "order_processing_history completed." }],
      structuredContent: result,
    };
  },
};

export const hoursWorkedPerEmployeeTool: Tool = {
  name: "hours_worked_per_employee",
  description:
    "Hours worked per employee from paired OrderItemHistory intervals; pass year+month or ISO from/to (default last 30 days).",
  inputSchema: z.object({
    year: z.number().int().min(2000).max(2100).optional(),
    month: z.number().int().min(1).max(12).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number> = {};
    if (args.year != null && args.month != null) {
      q.year = args.year;
      q.month = args.month;
    }
    if (args.from) q.from = args.from;
    if (args.to) q.to = args.to;
    const result = await iflowClient.fetch<Record<string, unknown>>("hours_worked_per_employee", "GET", undefined, {
      query: q,
    });
    return {
      content: [{ type: "text", text: "hours_worked_per_employee completed." }],
      structuredContent: result,
    };
  },
};
