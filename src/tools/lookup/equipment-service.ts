import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

export const getEquipmentServiceTool: Tool = {
  name: "get_equipment_service",
  description:
    "Service fiche of an INTERNAL production equipment (the company's own " +
    "machine, from tbl_equipment) — NOT the client-owned Service equipment " +
    "(use list_client_service_equipment for that). Returns the equipment's " +
    "general service data (service company + contact persons), maintenance " +
    "schedule (mentenanta: date, frequency value+unit, alert flag) with " +
    "computed due maintenances (scadente: next_due date, days remaining, " +
    "depasita=overdue), intervention history (interventii, latest-first) with " +
    "the most recent surfaced as ultima_interventie, and recorded problems + " +
    "resolutions (probleme). Identify the equipment by id (numeric) or by " +
    "name / alias / inventory number / serial (case-insensitive). Multiple " +
    "name matches return multiple_equipment_matched with candidates; no match " +
    "returns equipment_not_found. Param: echipament (required, string or int).",
  inputSchema: z.object({
    echipament: z.union([z.string().min(1), z.number().int()]),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q: Record<string, string | number | boolean> = {
      echipament: args.echipament as string | number,
    };
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "get_equipment_service", "GET", undefined, { query: q }
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
    const name =
      typeof result.alias === "string" && result.alias
        ? result.alias
        : typeof result.nume === "string"
          ? result.nume
          : "";
    const interventii = Array.isArray(result.interventii)
      ? result.interventii.length
      : 0;
    const scadente = Array.isArray(result.scadente)
      ? result.scadente.length
      : 0;
    return {
      content: [
        {
          type: "text",
          text:
            `Equipment service fiche${name ? ` for ${name}` : ""}: ` +
            `${interventii} interventions, ${scadente} due maintenances.`,
        },
      ],
      structuredContent: result,
      isError: false,
    };
  },
};
