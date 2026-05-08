/**
 * Required OAuth scopes per [`architecture.md`](../../.plans/architecture.md) §C2 (`tools:<resource>:<action>`).
 * - `null` — any valid access token (e.g. `health`).
 * - string[] — token must include every scope listed.
 */
export function requiredScopesForTool(toolName: string): string[] | null {
  if (
    toolName === "health" ||
    toolName === "iflow_playbook_index" ||
    toolName === "product_scenarios_phase0" ||
    toolName === "scenariul_1" ||
    toolName === "scenariul_2"
  ) {
    return null;
  }
  if (toolName === "create_order") {
    return ["tools:orders:write"];
  }
  if (
    toolName === "where_are_we_losing_money" ||
    toolName === "diff_diagnose" ||
    toolName.startsWith("analyze_")
  ) {
    return ["tools:analytics:read"];
  }
  return ["tools:erp:read"];
}
