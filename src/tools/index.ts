import { registry } from "./registry.js";
import { listClientsTool, getClientTool } from "./lookup/clients.js";
import { listProductsTool, getProductTool } from "./lookup/products.js";
import { getStockTool } from "./lookup/stocks.js";
import { 
  countOrdersInProgressTool, 
  listOrdersToInvoiceTool, 
  oldestUnfinishedOrderTool 
} from "./lookup/orders.js";
import { 
  vatEstimateTool, 
  supplierPaymentsDueTool, 
  topProductsByMarginTool 
} from "./lookup/finance.js";
import { 
  listPartnersTool, 
  listOverdueCustomersTool 
} from "./lookup/partners.js";
import { latestOfferForClientTool } from "./lookup/offers.js";
import { createOrderTool } from "./lookup/write.js";
import { healthTool } from "./lookup/health.js";
import { diffDiagnoseTool } from "./analyst/diagnose.js";
import { 
  analyzeExecutionLoss,
  analyzeSalesFunnel,
  analyzeReceivablesRisk,
  analyzeStockHealth,
  analyzeSupplierDrift,
  analyzeWorkflowEfficiency,
  analyzeCustomerHealth,
  analyzeCorrectionCosts
} from "./analyst/perspectives.js";
import { whereAreWeLosingMoneyTool } from "./analyst/orchestrator.js";

export function registerAllTools() {
  // Clients
  registry.register(listClientsTool);
  registry.register(getClientTool);
  
  // Products
  registry.register(listProductsTool);
  registry.register(getProductTool);
  
  // Stocks
  registry.register(getStockTool);
  
  // Orders
  registry.register(countOrdersInProgressTool);
  registry.register(listOrdersToInvoiceTool);
  registry.register(oldestUnfinishedOrderTool);
  registry.register(createOrderTool);
  
  // Finance
  registry.register(vatEstimateTool);
  registry.register(supplierPaymentsDueTool);
  registry.register(topProductsByMarginTool);
  
  // Partners
  registry.register(listPartnersTool);
  registry.register(listOverdueCustomersTool);
  
  // Offers
  registry.register(latestOfferForClientTool);

  // System
  registry.register(healthTool);

  // Analyst Tier
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
}
