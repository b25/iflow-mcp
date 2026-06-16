/**
 * Keys that must appear in IFLOW_API_POINTS for the registered tool set.
 * (Orchestrator `where_are_we_losing_money` only calls other tools — no separate UUID.)
 */
export const REQUIRED_IFLOW_API_POINT_KEYS = [
  "list_clients",
  "get_client",
  "list_products",
  "get_product",
  "get_stock",
  "count_orders_in_progress",
  "list_orders_to_invoice",
  "oldest_unfinished_order",
  "create_order",
  "vat_estimate",
  "supplier_payments_due",
  "top_products_by_margin",
  "list_partners",
  "list_overdue_customers",
  "latest_offer_for_client",
  "lost_offers_breakdown",
  "top_agents",
  "procurement_today",
  "orders_by_stage",
  "order_delay_diagnosis",
  "list_work_flows",
  "list_flow_stages",
  "list_user_departments",
  "orders_flow_stage_report",
  "order_processing_history",
  "hours_worked_per_employee",
  "daily_activity_summary",
  "cashflow_summary",
  "list_cash_register",
  "list_bank_register",
  "analyze_execution_loss",
  "analyze_sales_funnel",
  "analyze_receivables_risk",
  "analyze_stock_health",
  "analyze_supplier_drift",
  "analyze_workflow_efficiency",
  "analyze_customer_health",
  "analyze_correction_costs",
  "diff_diagnose_metric",
  "diff_diagnose_events",
  // Phase 1.2 list/search endpoints
  "list_orders",
  "list_offers",
  "list_invoices",
  "list_receipts",
  "list_suppliers",
  "list_products_search",
  "list_clients_search",
  "list_purchases",
  "list_stock_movements",
  "list_activity",
  "list_notes",
  "list_comments",
  // Phase 1.3 meta / discovery
  "mcp_tool_catalog",
  "mcp_query_assist",
  // Phase 4 virtual-assistant flow
  "mcp_assistant_intro",
  "mcp_data_dictionary",
  "mcp_clarify",
  "mcp_plan",
  // Expansion analyze_* tools (ported to TS for Django<->TS registry parity)
  "analyze_cash_conversion_cycle",
  "analyze_cohort_retention",
  "analyze_customer_clv",
  "analyze_customer_credit_risk",
  "analyze_customer_profitability",
  "analyze_customer_rfm",
  "analyze_dead_stock",
  "analyze_inventory_abc",
  "analyze_inventory_optimization",
  "analyze_inventory_xyz",
  "analyze_margin_bridge",
  "analyze_payables",
  "analyze_receivables_aging",
  "analyze_revenue_concentration",
  // Board/health pass-through tools (admin-only, non-findings shape)
  "analyze_business_board",
  "analyze_business_health",
  "analyze_fraud_signals",
  "analyze_stock_risk_signals",
  "mcp_operational_risk_sweep",
  "mcp_alerts",
  "mcp_operational_risk_detail",
  // Phase 2 reports (registered by ./reports/index.ts)
  "report_sales",
  "report_profit",
  "report_total_sales",
  "report_quantity",
  "report_employee",
  "report_equipments_gantt",
  "report_stock_purchases",
  "report_dashboard_card",
  "mobile_dashboard",
  "accounting_partner_balance",
  "accounting_invoices_issued",
  "accounting_stock_balance",
  "accounting_intrastat",
  // document send/communication history
  "document_communications",
  // employee leave/absence
  "list_employee_leave",
  // client negotiated discounts / special prices
  "list_client_discounts",
  // service-section equipment per client (serviced machines + intervention history)
  "list_client_service_equipment",
  // service fiche of an internal production equipment (maintenance/interventions/problems)
  "get_equipment_service",
  // credit/sold limit history per client (block/unblock, auto + manual)
  "client_credit_limit_history",
  // offer version/revision history (author/status/total per version)
  "list_offer_versions",
  // client portal login account (email/username, last login, login history)
  "get_client_portal_account",
  // supplier purchase orders
  "list_supplier_orders",
  // recurring documents (recurrence configs on Orders)
  "list_recurring_documents",
  // delivery notes (avize de insotire a marfii)
  "list_delivery_notes",
  // production documents (bon de consum / nota de predare productie)
  "list_consumption_vouchers",
  "list_production_handovers",
  // e-Transport (RO e-Transport / cod UIT)
  "list_etransport",
  // courier shipments (AWB) - Fan Courier / GLS
  "list_shipments",
  // sales opportunities (Vanzari -> Oportunitati)
  "list_opportunities",
  // management objectives (Management Obiective)
  "list_objectives",
  // WhatsApp Business / Chat module
  "list_chat_conversations",
  "get_chat_conversation",
  "chat_response_time_report",
  "list_email_campaigns",
  "list_correspondence",
  "list_generated_documents",
  // Administrative documents (CloudFolder / CloudFile)
  "list_admin_folders",
  "list_admin_files",
  "download_admin_file",
  "list_email_flows",
  "get_email_flow",
  // Marketing forms (FormTemplate / FormSubmittedData)
  "list_forms",
  "get_form",
  "list_form_submissions",
  // Phase 3.3 writes (registered by ./writes/index.ts and ./writes/write-crud.ts)
  "update_order_status",
  "mark_order_finished",
  "mark_order_billed",
  "add_client_note",
  "add_offer_comment",
  "create_opportunity",
  "tag_entity",
  "create_task",
  "create_client",
  "create_product",
  "update_product",
  "create_administration",
] as const;

export type RequiredApiPointKey = (typeof REQUIRED_IFLOW_API_POINT_KEYS)[number];
