/**
 * Phase 0 — the 35 frequent questions from `.plans/product-scenarios.md` section B1.
 * `mcpTool` is the planned registry name; `backendPlanStatus` mirrors the plan’s backend column.
 */
export type Phase0B1Row = {
  num: number;
  questionRo: string;
  mcpTool: string;
  backendPlanStatus: string;
};

export const PHASE_0_B1: Phase0B1Row[] = [
  {
    num: 1,
    questionRo: "Ce comenzi am de livrat azi?",
    mcpTool: "list_deliveries_today",
    backendPlanStatus: "api-external GET orders (K1.1)",
  },
  {
    num: 2,
    questionRo: "Cât am pe stoc la [produs X]?",
    mcpTool: "get_stock",
    backendPlanStatus: "exists",
  },
  {
    num: 3,
    questionRo: "Cine îmi mai datorează bani?",
    mcpTool: "list_overdue_customers",
    backendPlanStatus: "exists",
  },
  {
    num: 4,
    questionRo: "Câte comenzi am în lucru chiar acum?",
    mcpTool: "count_orders_in_progress",
    backendPlanStatus: "KPI exists",
  },
  {
    num: 5,
    questionRo: "Ce facturi trebuie să emit azi?",
    mcpTool: "list_orders_to_invoice",
    backendPlanStatus: "KPI exists",
  },
  {
    num: 6,
    questionRo: "Ce s-a întâmplat azi în firmă?",
    mcpTool: "daily_activity_summary",
    backendPlanStatus: "exists; K4.5",
  },
  {
    num: 7,
    questionRo: "Care e cea mai veche comandă neterminată?",
    mcpTool: "oldest_unfinished_order",
    backendPlanStatus: "trivial",
  },
  {
    num: 8,
    questionRo: "Să comand 500 sau 1000 buc din Y?",
    mcpTool: "procurement_recommendation",
    backendPlanStatus: "K5 borderline",
  },
  {
    num: 9,
    questionRo: "Mai trebuie să aduc ceva până vineri?",
    mcpTool: "procurement_gap_check",
    backendPlanStatus: "BoM join K5",
  },
  {
    num: 10,
    questionRo: "Să accept comanda asta de la clientul cu sold restant?",
    mcpTool: "customer_payment_risk",
    backendPlanStatus: "K5.3",
  },
  {
    num: 11,
    questionRo: "Cum stau cu banii luna asta?",
    mcpTool: "cashflow_summary",
    backendPlanStatus: "exists K4.5",
  },
  {
    num: 12,
    questionRo: "Cât am de plătit la furnizori săptămâna viitoare?",
    mcpTool: "supplier_payments_due",
    backendPlanStatus: "exists",
  },
  {
    num: 13,
    questionRo: "Care a fost profitul real pe comanda X?",
    mcpTool: "order_real_profit",
    backendPlanStatus: "K5.1",
  },
  {
    num: 14,
    questionRo: "Pe ce produse câștig cel mai mult?",
    mcpTool: "top_products_by_margin",
    backendPlanStatus: "KPI exists",
  },
  {
    num: 15,
    questionRo: "Care comenzi au pierdere?",
    mcpTool: "list_loss_orders",
    backendPlanStatus: "exists",
  },
  {
    num: 16,
    questionRo: "Cât TVA am de plătit luna asta?",
    mcpTool: "vat_estimate",
    backendPlanStatus: "KPI exists",
  },
  {
    num: 17,
    questionRo: "Care clienți încasez cel mai greu?",
    mcpTool: "slow_paying_customers",
    backendPlanStatus: "K4.3 aggregation",
  },
  {
    num: 18,
    questionRo: "Cine n-a mai comandat de mult?",
    mcpTool: "dormant_customers",
    backendPlanStatus: "K5.7",
  },
  {
    num: 19,
    questionRo: "Câte oferte am pierdut luna asta și de ce?",
    mcpTool: "lost_offers_breakdown",
    backendPlanStatus: "exists",
  },
  {
    num: 20,
    questionRo: "Cine e cel mai bun agent al meu?",
    mcpTool: "top_agents",
    backendPlanStatus: "KPI exists",
  },
  {
    num: 21,
    questionRo: "Ce ofertă am trimis ultima dată clientului X?",
    mcpTool: "latest_offer_for_client",
    backendPlanStatus: "exists",
  },
  {
    num: 22,
    questionRo: "Care clienți sunt în pericol să plece?",
    mcpTool: "customers_at_risk",
    backendPlanStatus: "K5.7",
  },
  {
    num: 23,
    questionRo: "Ce trebuie să comand de la furnizori azi?",
    mcpTool: "procurement_today",
    backendPlanStatus: "exists",
  },
  {
    num: 24,
    questionRo: "Ce stocuri sunt blocate fără mișcare?",
    mcpTool: "dead_stock",
    backendPlanStatus: "K5.4",
  },
  {
    num: 25,
    questionRo: "Care furnizor e cel mai scump pentru [produs Y]?",
    mcpTool: "supplier_price_compare",
    backendPlanStatus: "aggregation",
  },
  {
    num: 26,
    questionRo: "Ce material îmi trebuie pentru comenzile din săptămâna viitoare?",
    mcpTool: "material_requirements_planning",
    backendPlanStatus: "BoM join",
  },
  {
    num: 27,
    questionRo: "Cât valorează stocul meu acum?",
    mcpTool: "stock_total_value",
    backendPlanStatus: "column exists",
  },
  {
    num: 28,
    questionRo: "Diferențe la inventar pe ce produse am cel mai des?",
    mcpTool: "inventory_discrepancies",
    backendPlanStatus: "aggregation",
  },
  {
    num: 29,
    questionRo: "Unde stau comenzile mele acum?",
    mcpTool: "orders_by_stage",
    backendPlanStatus: "exists",
  },
  {
    num: 30,
    questionRo: "Ce etapă mă blochează cel mai des?",
    mcpTool: "workflow_bottleneck",
    backendPlanStatus: "K5.6",
  },
  {
    num: 31,
    questionRo: "Cât durează în medie o comandă similară?",
    mcpTool: "similar_order_duration",
    backendPlanStatus: "similarity",
  },
  {
    num: 32,
    questionRo: "Ce comenzi sunt gata de facturat?",
    mcpTool: "orders_ready_to_invoice",
    backendPlanStatus: "KPI exists",
  },
  {
    num: 33,
    questionRo: "De ce întârzie comanda X?",
    mcpTool: "order_delay_diagnosis",
    backendPlanStatus: "exists",
  },
  {
    num: 34,
    questionRo: "Cine e mai lent pe [etapa Z]?",
    mcpTool: "operator_speed_per_stage",
    backendPlanStatus: "K4.3 aggregation",
  },
  {
    num: 35,
    questionRo: "Câte ore a lucrat [Maria] luna asta?",
    mcpTool: "hours_worked_per_employee",
    backendPlanStatus: "widget exists",
  },
];
