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
    toolName === "scenariul_2" ||
    toolName === "scenario_1" ||
    toolName === "scenario_2"
  ) {
    return null;
  }
  if (toolName === "create_order") {
    return ["tools:orders:write"];
  }
  if (
    toolName === "update_order_status" ||
    toolName === "mark_order_finished" ||
    toolName === "mark_order_billed"
  ) {
    return ["tools:orders:write"];
  }
  if (toolName === "add_client_note") {
    return ["tools:clients:write"];
  }
  if (toolName === "add_offer_comment" || toolName === "create_opportunity") {
    return ["tools:offers:write"];
  }
  if (toolName === "create_task") {
    return ["tools:tasks:write"];
  }
  // tag_entity spans clients/orders/offers/invoices, so it sits behind a
  // generic write scope rather than any single per-resource write scope.
  if (toolName === "tag_entity") {
    return ["tools:write"];
  }
  // Analytics / financial / accounting READ tools.
  // Mirrors the Django `myintranet/site/api/mobile/rbac.py` TOOL_RULES capability
  // gating intent (margin/financials/team-sensitive reports + accounting) at the
  // coarser external OAuth layer: these stay behind analytics:read rather than
  // falling through to the broad tools:erp:read default.
  if (
    toolName === "where_are_we_losing_money" ||
    toolName === "diff_diagnose" ||
    toolName.startsWith("analyze_") ||
    // margin / sales / dashboard reports
    toolName === "report_profit" ||
    toolName === "report_sales" ||
    toolName === "report_total_sales" ||
    toolName === "report_dashboard_card" ||
    toolName === "report_quantity" ||
    toolName === "top_products_by_margin" ||
    // team-performance reports
    toolName === "top_agents" ||
    toolName === "hours_worked_per_employee" ||
    toolName === "report_employee" ||
    // accounting / financials
    toolName === "accounting_intrastat" ||
    toolName === "accounting_invoices_issued" ||
    toolName === "accounting_partner_balance" ||
    toolName === "accounting_stock_balance" ||
    toolName === "cashflow_summary" ||
    toolName === "supplier_payments_due" ||
    toolName === "vat_estimate"
  ) {
    return ["tools:analytics:read"];
  }
  return ["tools:erp:read"];
}
