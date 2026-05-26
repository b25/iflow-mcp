import { registry } from "./registry.js";
import { listClientsTool, getClientTool } from "./lookup/clients.js";
import { listProductsTool, getProductTool } from "./lookup/products.js";
import { getStockTool } from "./lookup/stocks.js";
import {
  countOrdersInProgressTool,
  listOrdersToInvoiceTool,
  oldestUnfinishedOrderTool,
} from "./lookup/orders.js";
import {
  vatEstimateTool,
  supplierPaymentsDueTool,
  topProductsByMarginTool,
} from "./lookup/finance.js";
import { listPartnersTool, listOverdueCustomersTool } from "./lookup/partners.js";
import { latestOfferForClientTool } from "./lookup/offers.js";
import { createOrderTool } from "./lookup/write.js";
import { healthTool } from "./lookup/health.js";
import { iflowPlaybookIndexTool } from "./lookup/playbook-index.js";
import { productScenariosPhase0Tool } from "./lookup/scenario-coverage.js";
import { scenariul1Tool } from "./lookup/scenario1.js";
import { scenariul2Tool } from "./lookup/scenario2.js";
import {
  lostOffersBreakdownTool,
  topAgentsTool,
  procurementTodayTool,
  ordersByStageTool,
  orderDelayDiagnosisTool,
  hoursWorkedPerEmployeeTool,
  dailyActivitySummaryTool,
  cashflowSummaryTool,
} from "./lookup/extensions.js";
import { diffDiagnoseTool } from "./analyst/diagnose.js";
import {
  analyzeExecutionLoss,
  analyzeSalesFunnel,
  analyzeReceivablesRisk,
  analyzeStockHealth,
  analyzeSupplierDrift,
  analyzeWorkflowEfficiency,
  analyzeCustomerHealth,
  analyzeCorrectionCosts,
} from "./analyst/perspectives.js";
import { whereAreWeLosingMoneyTool } from "./analyst/orchestrator.js";
import { assertAllApiPointsConfigured } from "./required-keys.js";
import { config } from "../iflow/config.js";

export function registerAllTools() {
  registry.register(listClientsTool);
  registry.register(getClientTool);
  registry.register(listProductsTool);
  registry.register(getProductTool);
  registry.register(getStockTool);
  registry.register(countOrdersInProgressTool);
  registry.register(listOrdersToInvoiceTool);
  registry.register(oldestUnfinishedOrderTool);
  registry.register(createOrderTool);
  registry.register(vatEstimateTool);
  registry.register(supplierPaymentsDueTool);
  registry.register(topProductsByMarginTool);
  registry.register(listPartnersTool);
  registry.register(listOverdueCustomersTool);
  registry.register(latestOfferForClientTool);
  registry.register(lostOffersBreakdownTool);
  registry.register(topAgentsTool);
  registry.register(procurementTodayTool);
  registry.register(ordersByStageTool);
  registry.register(orderDelayDiagnosisTool);
  registry.register(hoursWorkedPerEmployeeTool);
  registry.register(dailyActivitySummaryTool);
  registry.register(cashflowSummaryTool);
  registry.register(healthTool);
  registry.register(iflowPlaybookIndexTool);
  registry.register(productScenariosPhase0Tool);
  registry.register(scenariul1Tool);
  registry.register(scenariul2Tool);
  registry.register(diffDiagnoseTool);
  registry.register(analyzeExecutionLoss);
  registry.register(analyzeSalesFunnel);
  registry.register(analyzeReceivablesRisk);
  registry.register(analyzeStockHealth);
  registry.register(analyzeSupplierDrift);
  registry.register(analyzeWorkflowEfficiency);
  registry.register(analyzeCustomerHealth);
  registry.register(analyzeCorrectionCosts);
  registry.register(whereAreWeLosingMoneyTool);

  if (!config.IFLOW_MCP_INTEGRATION_UUID) {
    assertAllApiPointsConfigured(config.IFLOW_API_POINTS);
  }
}
