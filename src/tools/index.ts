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
  dailyActivitySummaryTool,
  cashflowSummaryTool,
} from "./lookup/extensions.js";
import {
  hoursWorkedPerEmployeeTool,
  listFlowStagesTool,
  listUserDepartmentsTool,
  listWorkFlowsTool,
  orderProcessingHistoryTool,
  ordersFlowStageReportTool,
} from "./lookup/orders-workflow.js";
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
  analyzeCashConversionCycle,
  analyzeCohortRetention,
  analyzeCustomerClv,
  analyzeCustomerCreditRisk,
  analyzeCustomerProfitability,
  analyzeCustomerRfm,
  analyzeDeadStock,
  analyzeInventoryAbc,
  analyzeInventoryOptimization,
  analyzeInventoryXyz,
  analyzeMarginBridge,
  analyzePayables,
  analyzeReceivablesAging,
  analyzeRevenueConcentration,
} from "./analyst/perspectives.js";
import { analyzeBusinessBoard, analyzeBusinessHealth } from "./analyst/boards.js";
import {
  analyzeFraudSignalsTool,
  analyzeStockRiskSignalsTool,
  mcpOperationalRiskDetailTool,
  mcpOperationalRiskSweepTool,
  mcpAlertsTool,
} from "./analyst/operational-risk.js";
import { whereAreWeLosingMoneyTool } from "./analyst/orchestrator.js";
import { listOrdersTool } from "./lookup/list-orders.js";
import { listOffersTool } from "./lookup/list-offers.js";
import { listInvoicesTool } from "./lookup/list-invoices.js";
import { listSuppliersTool } from "./lookup/list-suppliers.js";
import { listProductsSearchTool } from "./lookup/list-products-search.js";
import { listClientsSearchTool } from "./lookup/list-clients-search.js";
import { documentCommunicationsTool } from "./lookup/document-communications.js";
import { listEmployeeLeaveTool } from "./lookup/employee-leave.js";
import { listClientDiscountsTool } from "./lookup/client-discounts.js";
import { listClientServiceEquipmentTool } from "./lookup/client-service-equipment.js";
import { clientCreditLimitHistoryTool } from "./lookup/client-credit-limit-history.js";
import { clientPortalAccountTool } from "./lookup/client-portal-account.js";
import { listSupplierOrdersTool } from "./lookup/supplier-orders.js";
import { listEmailCampaignsTool } from "./lookup/email-campaigns.js";
import { listEmailFlowsTool, getEmailFlowTool } from "./lookup/email-flows.js";
import {
  listFormsTool,
  getFormTool,
  listFormSubmissionsTool,
} from "./lookup/forms.js";
import { listPurchasesTool } from "./lookup/list-purchases.js";
import { listStockMovementsTool } from "./lookup/list-stock-movements.js";
import { listActivityTool } from "./lookup/list-activity.js";
import { listNotesTool } from "./lookup/list-notes.js";
import { listCommentsTool } from "./lookup/list-comments.js";
import { mcpToolCatalogTool } from "./lookup/catalog.js";
import { mcpQueryAssistTool } from "./lookup/query-assist.js";
import {
  reportSalesTool,
  reportProfitTool,
  reportTotalSalesTool,
  reportQuantityTool,
  reportEmployeeTool,
  reportEquipmentsGanttTool,
  reportStockPurchasesTool,
  reportDashboardCardTool,
  accountingPartnerBalanceTool,
  accountingInvoicesIssuedTool,
  accountingStockBalanceTool,
  accountingIntrastatTool,
} from "./reports/index.js";
import {
  updateOrderStatusTool,
  markOrderFinishedTool,
  markOrderBilledTool,
  addClientNoteTool,
  addOfferCommentTool,
  createOpportunityTool,
  tagEntityTool,
  createTaskTool,
} from "./writes/index.js";
import {
  createClientTool,
  createProductTool,
  updateProductTool,
  createAdministrationTool,
} from "./writes/write-crud.js";
import {
  mcpAssistantIntroTool,
  mcpDataDictionaryTool,
  mcpClarifyTool,
  mcpPlanTool,
} from "./assistant/index.js";
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
  registry.register(listWorkFlowsTool);
  registry.register(listFlowStagesTool);
  registry.register(listUserDepartmentsTool);
  registry.register(ordersFlowStageReportTool);
  registry.register(orderProcessingHistoryTool);
  registry.register(hoursWorkedPerEmployeeTool);
  registry.register(dailyActivitySummaryTool);
  registry.register(cashflowSummaryTool);
  registry.register(healthTool);
  registry.register(iflowPlaybookIndexTool);
  registry.register(productScenariosPhase0Tool);
  registry.register(scenariul1Tool);
  registry.register({ ...scenariul1Tool, name: "scenario_1" });
  registry.register(scenariul2Tool);
  registry.register({ ...scenariul2Tool, name: "scenario_2" });
  registry.register(diffDiagnoseTool);
  registry.register(analyzeExecutionLoss);
  registry.register(analyzeSalesFunnel);
  registry.register(analyzeReceivablesRisk);
  registry.register(analyzeStockHealth);
  registry.register(analyzeSupplierDrift);
  registry.register(analyzeWorkflowEfficiency);
  registry.register(analyzeCustomerHealth);
  registry.register(analyzeCorrectionCosts);
  registry.register(analyzeCashConversionCycle);
  registry.register(analyzeCohortRetention);
  registry.register(analyzeCustomerClv);
  registry.register(analyzeCustomerCreditRisk);
  registry.register(analyzeCustomerProfitability);
  registry.register(analyzeCustomerRfm);
  registry.register(analyzeDeadStock);
  registry.register(analyzeInventoryAbc);
  registry.register(analyzeInventoryOptimization);
  registry.register(analyzeInventoryXyz);
  registry.register(analyzeMarginBridge);
  registry.register(analyzePayables);
  registry.register(analyzeReceivablesAging);
  registry.register(analyzeRevenueConcentration);
  registry.register(analyzeBusinessBoard);
  registry.register(analyzeBusinessHealth);
  registry.register(analyzeFraudSignalsTool);
  registry.register(analyzeStockRiskSignalsTool);
  registry.register(mcpOperationalRiskSweepTool);
  registry.register(mcpAlertsTool);
  registry.register(mcpOperationalRiskDetailTool);
  registry.register(whereAreWeLosingMoneyTool);
  registry.register(listOrdersTool);
  registry.register(listOffersTool);
  registry.register(listInvoicesTool);
  registry.register(listSuppliersTool);
  registry.register(listProductsSearchTool);
  registry.register(listClientsSearchTool);
  registry.register(documentCommunicationsTool);
  registry.register(listEmployeeLeaveTool);
  registry.register(listClientDiscountsTool);
  registry.register(listClientServiceEquipmentTool);
  registry.register(clientCreditLimitHistoryTool);
  registry.register(clientPortalAccountTool);
  registry.register(listSupplierOrdersTool);
  registry.register(listEmailCampaignsTool);
  registry.register(listEmailFlowsTool);
  registry.register(getEmailFlowTool);
  registry.register(listFormsTool);
  registry.register(getFormTool);
  registry.register(listFormSubmissionsTool);
  registry.register(listPurchasesTool);
  registry.register(listStockMovementsTool);
  registry.register(listActivityTool);
  registry.register(listNotesTool);
  registry.register(listCommentsTool);
  registry.register(mcpToolCatalogTool);
  registry.register(mcpQueryAssistTool);
  registry.register(reportSalesTool);
  registry.register(reportProfitTool);
  registry.register(reportTotalSalesTool);
  registry.register(reportQuantityTool);
  registry.register(reportEmployeeTool);
  registry.register(reportEquipmentsGanttTool);
  registry.register(reportStockPurchasesTool);
  registry.register(reportDashboardCardTool);
  registry.register(accountingPartnerBalanceTool);
  registry.register(accountingInvoicesIssuedTool);
  registry.register(accountingStockBalanceTool);
  registry.register(accountingIntrastatTool);
  registry.register(updateOrderStatusTool);
  registry.register(markOrderFinishedTool);
  registry.register(markOrderBilledTool);
  registry.register(addClientNoteTool);
  registry.register(addOfferCommentTool);
  registry.register(createOpportunityTool);
  registry.register(tagEntityTool);
  registry.register(createTaskTool);
  registry.register(createClientTool);
  registry.register(createProductTool);
  registry.register(updateProductTool);
  registry.register(createAdministrationTool);
  registry.register(mcpAssistantIntroTool);
  registry.register(mcpDataDictionaryTool);
  registry.register(mcpClarifyTool);
  registry.register(mcpPlanTool);

  if (!config.IFLOW_MCP_INTEGRATION_UUID) {
    assertAllApiPointsConfigured(config.IFLOW_API_POINTS);
  }
}
