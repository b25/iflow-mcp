import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const listEmployeeLeaveTool: Tool = {
  name: "list_employee_leave",
  description:
    "Employee leave/absence (concediu) on a date or interval: who is on leave, with " +
    "leave type (0=odihna,1=medical,2=fara plata), start/end dates, employee and department. " +
    "Answers e.g. 'who was on leave on 2026-06-12?'. Defaults to today if no date given.",
  inputSchema: z.object({
    date: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    employee_id: z.number().int().positive().optional(),
    department_id: z.number().int().positive().optional(),
    leave_type: z.number().int().min(0).max(2).optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {};
    if (args.date) q.date = args.date;
    if (args.from) q.from = args.from;
    if (args.to) q.to = args.to;
    if (args.employee_id != null) q.employee_id = args.employee_id;
    if (args.department_id != null) q.department_id = args.department_id;
    if (args.leave_type != null) q.leave_type = args.leave_type;
    if (args.limit != null) q.limit = args.limit;
    if (args.offset != null) q.offset = args.offset;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_employee_leave",
      "GET",
      undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Employee leave records: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};
