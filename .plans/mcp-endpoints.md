# iFlow MCP Endpoints Documentation

This document provides a comprehensive overview of all available MCP tools in the iflow-mcp project.

## Overview

- **Total Tools**: 81
- **Categories**: Lookup, Writes, Analyst, Reports, Assistant

---

## Table of Contents

1. [Lookup Tools](#lookup-tools) (40 tools)
2. [Write Tools](#write-tools) (6 tools)
3. [Analyst Tools](#analyst-tools) (12 tools)
4. [Report Tools](#report-tools) (12 tools)
5. [Assistant Tools](#assistant-tools) (4 tools)

---

## Lookup Tools

Lookup tools read data from the iFlow system without modifying it.

### Clients & Products

#### `list_clients`
List clients from iflow (paginated).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| all_pages | boolean | No | `false` | Merge up to IFLOW_MAX_PAGES_PER_CALL pages |

**Example:**
```json
{
  "tool": "list_clients",
  "args": {
    "all_pages": true
  }
}
```

#### `get_client`
Find one client by id or uuid.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_id | string (min 1) | Yes | Client identifier (id, uuid, or pk) |

#### `list_products`
List products from iflow.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| all_pages | boolean | No | `false` | Merge up to IFLOW_MAX_PAGES_PER_CALL pages |

#### `get_product`
Find one product by uuid or id.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| product_id | string (min 1) | Yes | Product identifier |

#### `get_stock`
Stock levels for a product.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| product_uuid | string (uuid) | Yes | Product UUID |
| warehouse_uuid | string (uuid) | No | Warehouse UUID |

---

### Orders

#### `count_orders_in_progress`
Count orders currently in progress (KPI).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| flow_id | number (positive) | No | Filter by workflow ID |
| client_id | number (positive) | No | Filter by client ID |
| from | string (min 8 chars, ISO datetime) | No | Start date filter (e.g., `2026-05-01T00:00:00`) |
| to | string (min 8 chars, ISO datetime) | No | End date filter |

#### `list_orders_to_invoice`
List orders ready to invoice.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client_id | number (positive) | No | - |
| from | string | No | Start date filter |
| to | string | No | End date filter |
| order_by | enum | No | - | One of: `date_order_desc`, `date_order_asc`, `id_desc`, `id_asc`, `total_amount_desc`, `total_amount_asc` |
| limit | number (1-500) | No | - |
| offset | number (≥0) | No | - |

#### `oldest_unfinished_order`
Get the oldest unfinished order.

*No parameters required.*

#### `list_orders`
Search/list orders with filters.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| finished | boolean | No | - | Filter by completion status (true/false) |
| status | enum | No | - | One of: `NEW`, `IN_PROCESS`, `FINISHED`, `OUT_OF_STOCK`, `CANCEL` |
| client_id | number (positive) | No | - |
| flow_id | number (positive) | No | - |
| from | string (ISO datetime) | No | date_order filter |
| to | string (ISO datetime) | No | date_order filter |
| delivery_from | string (ISO datetime) | No | Delivery start date |
| delivery_to | string (ISO datetime) | No | Delivery end date |
| q | string | No | - | Full-text search query |
| order_by | enum | No | - | One of: `date_order_desc`, `date_order_asc`, `delivery_date_desc`, `delivery_date_asc`, `id_desc`, `id_asc`, `total_amount_desc`, `total_amount_asc` |
| limit | number (1-500) | No | 20 | Maximum results |
| offset | number (≥0) | No | - | Pagination offset |

**DEFAULT RECOMMENDATIONS:**
- For 'recent orders': `finished=false`, `limit=20-50`, `order_by='date_order_desc'`
- For 'finished orders this month': `finished=true`, `from=2026-05-01T00:00:00`, `to=2026-05-31T23:59:59`, `limit=100`
- For 'unpaid orders': `finished=false`, `status='NEW'`, `limit=50`
- For 'delivered orders': `finished=true`, `status='FINISHED'`, `limit=100`

#### `build_orders_filter`
Interactively build an order filter with guided questions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| step | enum | Yes | One of: `start`, `finished`, `status`, `date_range`, `client`, `flow`, `sort` |
| context | string | No | Previous user input or filter criteria |
| current_filter | object | No | Filter values collected so far |

---

### Finance

#### `vat_estimate`
Estimated VAT collected over a date window (default last 30 days).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| from | string (ISO datetime) | No | Start date |
| to | string (ISO datetime) | No | End date |
| administration_id | number (positive) | No | Filter by administration |

#### `supplier_payments_due`
Supplier payments due (grouped by provider).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| provider_id | number (positive) | No | - |
| min_amount | number (nonnegative) | No | - |
| currency | string (2-8 chars) | No | - |
| limit | number (1-500) | No | - |
| offset | number (≥0) | No | - |

#### `top_products_by_margin`
Top products by margin.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | number (1-100) | No | `5` | Number of results |
| from | string (ISO datetime) | No | - |
| to | string (ISO datetime) | No | - |
| category_id | number (positive) | No | - |
| provider_id | number (positive) | No | - |
| min_qty | number (nonnegative) | No | - |

---

### Partners

#### `list_partners`
List partners (clients + providers).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| type | enum | No | - | One of: `client`, `provider`, `supplier`, `both` |
| q | string | No | - | Search query |
| tag_ids | array or string | No | - | Comma-separated tag IDs (e.g., `"1,2,3"` or `[1,2,3]`) |
| is_active | boolean | No | - |
| limit | number (1-500) | No | - |
| offset | number (≥0) | No | - |

#### `list_overdue_customers`
Customers with overdue balances.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | number (1-500) | No | - |
| offset | number (≥0) | No | - |
| min_sold | number (nonnegative) | No | - |
| tag_ids | array or string | No | - |

#### `latest_offer_for_client`
Latest offer for a client.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_uuid | string (uuid) | Yes | Client UUID |

---

### Extended Lookup (Extensions)

#### `lost_offers_breakdown`
Breakdown of lost offers grouped by motiv_refuz.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| client_id | number (positive) | No |

#### `top_agents`
Top agents by order count.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | number (1-200) | No | - |
| flow_id | number (positive) | No |
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |

#### `procurement_today`
Procurement / reorder signals.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | number (1-500) | No | - |
| offset | number (≥0) | No | - |
| category_id | number (positive) | No |
| provider_id | number (positive) | No |

#### `orders_by_stage`
Order counts by workflow stage.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| flow_id | number (positive) | No |
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| include_finished | boolean | No |

#### `order_delay_diagnosis`
Late open orders, listed with details.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| flow_id | number (positive) | No |
| client_id | number (positive) | No |
| limit | number (1-500) | No | - |

#### `daily_activity_summary`
Recent activity summary.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| period_days | number (1-90) | No |
| action_type | number (nonnegative) | No |
| module | string | No |

#### `cashflow_summary`
Cashflow summary.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| currency | string (2-8 chars) | No |

---

### Order Workflow

#### `list_work_flows`
List work flows (FlowSettings) with ids.

*No parameters required.*

#### `list_flow_stages`
List stages (StageItem) for a flow.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| flow_id | number (positive) | Yes | Flow ID |

#### `list_user_departments`
List user departments.

*No parameters required.*

#### `orders_flow_stage_report`
Orders finished in a calendar month on a given flow.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| flow_id | number (positive) | Yes |
| year | number (2000-2100) | Yes |
| month | number (1-12) | Yes |
| stage_id | number (positive) | No |
| department_id | number (positive) | No |
| limit | number (1-500) | No |

#### `order_processing_history`
Per-order processing history.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| order_id | number (positive) | Yes |
| limit | number (1-1000) | No |

#### `hours_worked_per_employee`
Hours worked per employee from paired OrderItemHistory intervals.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | number (2000-2100) | No | Must be paired with month |
| month | number (1-12) | No | Must be paired with year |
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |

---

### Search Tools

#### `list_clients_search`
Search clients with filters.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | No | - | Name, alias, code, or CIF |
| tag_ids | array or string | No | Comma-separated or array |
| client_type_id | number (nonnegative) | No |
| district | string | No |
| locality | string | No |
| is_active | boolean | No |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

#### `list_products_search`
Search products with filters.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | No | - | Name, code, or alias |
| category_id | number (positive) | No |
| subcategory_id | number (positive) | No |
| provider_id | number (positive) | No |
| low_stock_only | boolean | No | Filter products below stock minim |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

#### `list_suppliers`
Search ProductProvider entries.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | No | - | Name, code, or tax_code |
| tag_ids | array or string | No | Comma-separated or array |
| is_active | boolean | No | (ignored - providers have no soft-delete) |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

#### `list_purchases`
List DocumentEntries (NIR / spend / imports).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO date) | No |
| to | string (ISO date) | No |
| provider_id | number (positive) | No |
| document_type | number (positive) | No |
| entry_type | number (1-4) | No | 1=SPEND, 2=STOCK, 3=SPEND_NO_DOC, 4=IMPORT |
| min_amount | number (nonnegative) | No |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

#### `list_stock_movements`
List StockHistory movements.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| product_id | number (positive) | No |
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| administration_id | number (positive) | No |
| movement_type | number (positive) | No | StockDocumentType id |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

#### `list_offers`
Search/list offers.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client_id | number (positive) | No |
| status_id | number (positive) | No |
| status_tag | string | No | e.g., `ACCEPTED`, `REJECTED` |
| from | string (ISO datetime) | No | start_date filter |
| to | string (ISO datetime) | No | start_date filter |
| q | string | No |
| order_by | enum | No | `id_desc`, `id_asc`, `date_order_desc`, `date_order_asc` |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

#### `list_invoices`
List fiscal bills.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client_id | number (positive) | No |
| from | string (ISO datetime) | No | invoice_date filter |
| to | string (ISO datetime) | No | invoice_date filter |
| unpaid_only | boolean | No |
| series | string | No |
| currency | string (2-8 chars) | No |
| q | string | No | title or numeric number |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

---

### Activity & Notes

#### `list_activity`
List ReportsRecentActivity rows.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| module | string | No | object_model |
| action_type | number (nonnegative) | No |
| user_id | number (positive) | No | action_user_id |
| object_id | number (positive) | No |
| q | string | No | object_name |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

#### `list_notes`
List ClientNote rows.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| client_id | number (positive) | No |
| user_id | number (positive) | No | employee_id |
| note_action | number (positive) | No | note_type_id |
| q | string | No |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

#### `list_comments`
List comments on opportunities or offers.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| kind | enum | No | - | One of: `opportunity`, `offer` |
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| client_id | number (positive) | No |
| user_id | number (positive) | No |
| comment_action | number (positive) | No | action_type_id |
| q | string | No |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

---

### System Tools

#### `health`
MCP health: transport mode (Django broker vs api-external), legacy IFLOW_API_POINTS keys, read-only flag.

*No parameters required.*

Returns:
- `status`: "ok"
- `transport`: "django_broker" or "api_external"
- `configured_api_point_keys`: list of configured keys
- `read_only`: boolean

#### `iflow_playbook_index`
List scenario and planning tools documentation index.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| language | enum | No | ro | One of: `ro`, `en` |

#### `mcp_tool_catalog`
Return the broker-side catalog of MCP tools.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| category | enum | No | - | One of: `lookup`, `list`, `report`, `analyst`, `meta`, `write`, `assistant`, `other` |
| q | string | No | - |

#### `mcp_query_assist`
Recommend MCP tool(s) with suggested arguments for a natural-language objective.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| objective | string (min 2) | Yes |
| limit | number (1-20) | No |

#### `product_scenarios_phase0`
Report which of the 35 frequent questions have a matching MCP tool registered.

*No parameters required.*

#### `scenariul_1`
Scenario 1 playbook: Unde pierdem bani?

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| action | enum | No | playbook | One of: `playbook`, `analyze_all`, `analyze_perspective` |
| perspective | number (1-8) | No | - | Required when action=analyze_perspective |
| language | enum | No | ro | One of: `ro`, `en` |

#### `scenariul_2`
Scenario 2 playbook: De ce nu mai merge ca înainte?

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| action | enum | No | playbook | One of: `playbook`, `diagnose` |
| metric | string | No | - | Required when action=diagnose |
| entity_id | string | No |
| interval | enum | No | week | One of: `day`, `week`, `month` |
| baseline | enum | No | yoy | One of: `yoy`, `median`, `trend` |
| language | enum | No | ro | One of: `ro`, `en` |

---

## Write Tools

Tools that modify data in the iFlow system (require confirmation).

### Order Writes

#### `create_order`
Create an order in iflow (POST). Disabled when IFLOW_READ_ONLY=1.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_uuid | string (uuid) | Yes |
| items | array | Yes | Array of `{product_uuid, quantity, price}` |
| idempotency_key | string (min 8) | Yes |

**Example:**
```json
{
  "tool": "create_order",
  "args": {
    "client_uuid": "abc-123-xyz",
    "items": [
      {"product_uuid": "prod-456", "quantity": 10, "price": 99.99}
    ],
    "idempotency_key": "order-create-key-001"
  }
}
```

#### `update_order_status`
Change an order's status. Disabled when IFLOW_READ_ONLY=1.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| order_id | number (positive) | Yes |
| status | enum | Yes | One of: `NEW`, `IN_PROCESS`, `FINISHED`, `OUT_OF_STOCK`, `CANCEL` |
| note | string | No |
| confirm | boolean | No | Required for write operations |

#### `mark_order_finished`
Mark an order as FINISHED. Disabled when IFLOW_READ_ONLY=1.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| order_id | number (positive) | Yes |
| finish_date | string (ISO datetime) | No |
| confirm | boolean | No |

#### `mark_order_billed`
Set the billing status of an order. Disabled when IFLOW_READ_ONLY=1.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| order_id | number (positive) | Yes |
| billing_status | enum | Yes | One of: `PENDING`, `PARTIAL`, `PAID` |
| confirm | boolean | No |

### Client Writes

#### `add_client_note`
Add a ClientNote (CRM activity). Disabled when IFLOW_READ_ONLY=1.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client_id | number (positive) | Yes |
| subject | string (1-512 chars) | Yes |
| text | string | No |
| note_type_id | number (positive) | No |
| reminder_date | string (ISO datetime) | No |
| confirm | boolean | No |

#### `add_offer_comment`
Add an OfferComment. Disabled when IFLOW_READ_ONLY=1.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| offer_id | number (positive) | Yes |
| text | string (min 1) | Yes |
| subject | string | No |
| comment_action_id | number (positive) | No |
| confirm | boolean | No |

### CRUD Tools

#### `create_client`
Create a new client. Disabled when IFLOW_READ_ONLY=1.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string (min 1) | Yes |
| alias | string | No |
| tax_code | string | No |
| vat_payer | number (0-1) | No |
| reg_no | string | No |
| country | string | No |
| district_new | string | No |
| locality | string | No |
| street | string | No |
| street_no | string | No |
| zip_code | string | No |
| bank | string | No |
| bank_account | string | No |
| website | string | No |
| payment_deadline | number (≥0) | No |
| mobile_new | string | No |
| contact_phone | string | No |
| contact_email | string | No |
| contacts | array | No | Array of `{name, surname, role, phone, mobile, email}` |
| delivery_addresses | array | No | Array of address objects |
| confirm | boolean | No |

#### `create_product`
Create a new product. Disabled when IFLOW_READ_ONLY=1.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string (min 1) | Yes |
| alias | string | No |
| category | string (min 1) | Yes |
| subcategory | string (min 1) | Yes |
| temp_tags | string | No |
| provider | string (min 1) | Yes |
| code | string | No |
| code_cpv | string | No |
| administration | string | No |
| show_to_customer | string | No |
| recommended_product | string | No |
| product_currency | string (min 3) | Yes |
| um | string (min 1) | Yes |
| price_acquisition | number (positive) | Yes |
| acquisition_cost_source | string (min 1) | Yes |
| large_business_addition | number (nonnegative) | Yes |
| medium_business_addition | number (nonnegative) | Yes |
| small_business_addition | number (nonnegative) | Yes |
| price_fixed | number | No |
| dynamic_price | string | No |
| vat_rate | number (nonnegative) | No |
| stock_unlimited | string | No |
| dimension_um | string (min 1) | Yes |
| stock | number | No |
| entry_average_unit_price | number | No |
| stock_minim | number | No |
| stock_maxim | number | No |
| code_nc | string | No |
| accounting_account | number | No |
| dimension_height | number | No |
| dimension_width | number | No |
| display_um | string | No |
| temp_equipments | string | No |
| exclude_from_workflow | string | No |
| description | string | No |
| product_weight | number | No |
| confirm | boolean | No |

#### `update_product`
Update an existing product. Disabled when IFLOW_READ_ONLY=1.

*Same schema as create_product.*

#### `create_administration`
Create a new administration. Disabled when IFLOW_READ_ONLY=1.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string (min 1) | Yes |
| confirm | boolean | No |

---

## Analyst Tools

Advanced data analysis and diagnostics.

### Diagnostics

#### `diff_diagnose`
Diagnose metric deviation vs baseline. Whitelisted metrics: orders, revenue, gross_profit, offers_won, late_orders.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| metric | enum | No | `orders` | One of: orders, revenue, gross_profit, offers_won, late_orders |
| entity_id | number (positive) | No |
| interval | enum | No | `week` | One of: day, week, month, quarter |
| baseline | enum | No | `prev_period` | One of: prev_period, yoy |
| language | enum | No | `ro` | One of: ro, en |

#### `analyze_fraud_signals`
Heuristic fraud / internal-control signals. Not legal proof of fraud.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| language | enum | No | `ro` | One of: ro, en |
| min_amount | string | No | default 50000 |

#### `analyze_stock_risk_signals`
Stock risk snapshot: below minimum, negative on-hand, overstock (10x minimum heuristic).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| language | enum | No | `ro` | One of: ro, en |

#### `mcp_operational_risk_sweep`
Aggregate operational-risk scan. Start here for overview.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| language | enum | No | `ro` | One of: ro, en |
| min_amount | string | No |

#### `mcp_operational_risk_detail`
Drill-down rows for one problem_id from mcp_operational_risk_sweep.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| problem_id | enum | Yes | See list below |
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| limit | number (1-200) | No |
| language | enum | No | `ro` | One of: ro, en |
| min_amount | string | No |

**Valid problem_id values:**
- `duplicate_invoice_clusters`
- `storno_fiscal_bills`
- `large_unpaid_invoices`
- `stock_below_minimum`
- `stock_negative_on_hand`
- `stock_overstock_candidates`
- `orders_open_past_delivery`
- `clients_positive_balance`
- `offers_rejected_period`
- `fraud_signals`
- `stock_risk_signals`

### Financial Perspectives

#### `analyze_execution_loss`
Analyze losses in order execution (cost real vs estimated).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| language | enum | No | `ro` | One of: ro, en |

#### `analyze_sales_funnel`
Analyze sales funnel conversion rates.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| language | enum | No | `ro` | One of: ro, en |

#### `analyze_receivables_risk`
Analyze accounts receivable aging and payment risk.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| language | enum | No | `ro` | One of: ro, en |

#### `analyze_stock_health`
Analyze dead-stock, ruptures, and over-stock.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| language | enum | No | `ro` | One of: ro, en |

#### `analyze_supplier_drift`
Analyze supplier price drift over time.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| language | enum | No | `ro` | One of: ro, en |

#### `analyze_workflow_efficiency`
Analyze workflow bottlenecks and stage durations.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| language | enum | No | `ro` | One of: ro, en |

#### `analyze_customer_health`
Analyze customer churn signals.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| language | enum | No | `ro` | One of: ro, en |

#### `analyze_correction_costs`
Analyze costs from errors and corrections.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| language | enum | No | `ro` | One of: ro, en |

#### `where_are_we_losing_money`
Orchestrate all 8 analyst perspectives to find major financial leakages.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| language | enum | No | `ro` | One of: ro, en |

---

## Report Tools

Static and dynamic reports from iFlow.

### Sales Reports

#### `report_sales`
Detailed sales report by order item lines (mirrors /report/sales/).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| order_finished | enum | No | One of: finished, in_progress, late |
| client_id | number (positive) | No |
| product_id | number (positive) | No |
| category_id | number (positive) | No |
| flow_id | number (positive) | No |
| employee_id | number (positive) | No |
| stage_id | number (positive) | No |
| tag_ids | array or string | No | Comma-separated or array |
| ignore_manufacture | boolean | No |
| q | string | No |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

#### `report_profit`
Monthly profit aggregation for selected years (mirrors /report/profit/).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| years | array or string | No | CSV or array of years (2000-2100) |
| ignore_manufacture | boolean | No |

#### `report_total_sales`
Aggregated sales per client (mirrors /report/total_sales/).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| client_id | array or number | No | CSV or single client ID |
| flow_id | number (positive) | No |
| client_status | enum | No | One of: active, inactive, new |
| district | string | No |
| locality | string | No |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

#### `report_quantity`
Quantities sold per product over a period (mirrors /report/quantity/).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO datetime) | No |
| to | string (ISO datetime) | No |
| product_id | number (positive) | No |
| provider_id | number (positive) | No |
| category_id | number (positive) | No |
| subcategory_id | number (positive) | No |
| administration_id | number (positive) | No |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

### Employee Reports

#### `report_employee`
Per-employee productivity (mirrors /report/employee/).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| date | string | No | YYYY-MM-DD or YYYY-MM |
| type | enum | No | One of: daily, monthly |
| department_id | number (positive) | No |
| employee_id | number (positive) | No |
| action | string | No |
| client_id | number (positive) | No |
| flow_type | enum | No | One of: orders, tasks |

#### `report_equipments_gantt`
Daily equipment Gantt snapshot (mirrors /report/equipments/).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| date | string | No | YYYY-MM-DD |

### Stock Reports

#### `report_stock_purchases`
Stock purchases / DocumentEntries breakdown (mirrors /report/stock/).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| from | string (ISO date) | No |
| to | string (ISO date) | No |
| provider_id | number (positive) | No |
| document_type | number (positive) | No |
| entry_type | number (1-4) | No |
| employee_id | number (positive) | No |
| tag_ids | array or string | No | Comma-separated or array |
| product_id | number (positive) | No |
| administration_id | number (positive) | No |
| accounting_account | number (positive) | No |
| limit | number (1-500) | No |
| offset | number (≥0) | No |

#### `report_dashboard_card`
Single dashboard KPI card snapshot (mirrors /report/dashboard/data/).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| card | enum | Yes | One of: orders_in_progress, orders_to_invoice, oldest_unfinished_order, vat_estimate, cashflow, low_stock, top_agents, top_products_by_margin |
| daterange | string | No |
| previous_daterange | string | No |
| employee_id | number (positive) | No |

### Accounting Reports

#### `accounting_partner_balance`
Partner balance (client|provider) per month (mirrors /financial/partner-balance/).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| year | number (2000-2100) | Yes |
| month | number (1-12) | Yes |
| type | enum | No | One of: client, provider |
| currency | string (2-8 chars) | No |

#### `accounting_invoices_issued`
Issued invoices summary per month (mirrors /financial/invoices/).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| year | number (2000-2100) | Yes |
| month | number (1-12) | Yes |
| administration_id | number (positive) | No |

#### `accounting_stock_balance`
Stock balance per month (mirrors /financial/stock-balance/).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| year | number (2000-2100) | Yes |
| month | number (1-12) | Yes |
| administration_id | number (positive) | No |

#### `accounting_intrastat`
Intrastat summary (imports / non-RO acquisitions) per month (mirrors /financial/intrastat/).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| year | number (2000-2100) | Yes |
| month | number (1-12) | Yes |

---

## Assistant Tools

Meta-tools for agent assistance and system management.

#### `mcp_assistant_intro`
Start here. Returns an iFlow business overview, main topics, top questions, and assistant flow.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| topic | enum | No | - | One of: orders, offers, clients, products, finance, workflow, diagnose |
| language | enum | No | - | One of: ro, en |

#### `mcp_data_dictionary`
Describe iFlow data entities (fields, statuses, enums, related tools).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| entity | enum | No | - | One of: orders, offers, clients, products, invoices, purchases, activity |
| language | enum | No | - | One of: ro, en |

#### `mcp_clarify`
Ask clarifying questions for a fuzzy user objective. Returns structured questions and candidate tools.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| objective | string (min 2) | Yes |
| language | enum | No | - | One of: ro, en |

#### `mcp_plan`
Return an executable plan (ordered list of tool calls with rationale) for an objective.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| objective | string (min 2) | Yes |
| answers | object | No | Keyed by clarification id |
| language | enum | No | - | One of: ro, en |

---

## Usage Examples

### Query Orders for a Date Range
```json
{
  "tool": "list_orders",
  "args": {
    "finished": true,
    "from": "2026-05-01T00:00:00",
    "to": "2026-05-31T23:59:59",
    "limit": 100,
    "order_by": "date_order_desc"
  }
}
```

### Count Orders In Progress (Last 7 Days)
```json
{
  "tool": "count_orders_in_progress",
  "args": {
    "from": "2026-05-24T00:00:00",
    "to": "2026-05-31T23:59:59"
  }
}
```

### Top Products by Margin
```json
{
  "tool": "top_products_by_margin",
  "args": {
    "limit": 10,
    "from": "2026-04-01T00:00:00",
    "to": "2026-05-31T23:59:59"
  }
}
```

### Diagnose Metric Deviation
```json
{
  "tool": "diff_diagnose",
  "args": {
    "metric": "revenue",
    "interval": "month",
    "baseline": "yoy",
    "language": "en"
  }
}
```

### Create Order with Idempotency
```json
{
  "tool": "create_order",
  "args": {
    "client_uuid": "abc-123-xyz",
    "items": [
      {"product_uuid": "prod-456", "quantity": 10, "price": 99.99}
    ],
    "idempotency_key": "order-create-key-001"
  }
}
```

---

## Tool Categories Summary

| Category | Count | Description |
|----------|-------|-------------|
| Lookup | 40 | Read-only data queries |
| Write | 6 | Data modification (require confirmation) |
| Analyst | 12 | Advanced analytics & diagnostics |
| Reports | 12 | Pre-built & dynamic reports |
| Assistant | 4 | Agent assistance tools |
| **Total** | **74** | All available MCP tools |

---

## Default Recommendations

### For Recent Orders
```json
{
  "finished": false,
  "limit": 20,
  "order_by": "date_order_desc"
}
```

### For This Month's Orders
```json
{
  "from": "2026-05-01T00:00:00",
  "to": "2026-05-31T23:59:59",
  "limit": 100
}
```

### For Last Month's Orders
```json
{
  "from": "2026-04-01T00:00:00",
  "to": "2026-04-30T23:59:59",
  "limit": 100
}
```

### For Financial Analysis
```json
{
  "tool": "where_are_we_losing_money",
  "args": {
    "language": "en"
  }
}
```

### For Operational Risk Overview
```json
{
  "tool": "mcp_operational_risk_sweep",
  "args": {
    "language": "en"
  }
}
```

---

## Notes for AI Models

### Tool Defaults Summary
- Pagination: Most list tools default to limit=20 when not specified
- Date ranges: Many tools support `from` and `to` parameters with ISO datetime format (YYYY-MM-DDTHH:MM:SS)
- Language: Analyst and assistant tools default to Romanian (ro) when language parameter is omitted
- Read-only mode: Write operations are disabled when IFLOW_READ_ONLY=1

### Common Patterns
- All list/search tools support `limit` and `offset` for pagination
- Tag filters often accept both array (JSON) and comma-separated string formats
- Date range filters typically use `from` and `to` with ISO 8601 datetime format
- Analyst tools return structured findings with severity levels (low, medium, high)

### Error Handling
- Write operations return `isError: true` on failure
- Read-only mode returns explicit refusal messages
- Missing required parameters typically result in validation errors

### Structured Content
Most tools return both human-readable text and structured content (`structuredContent`) suitable for programmatic use. Analyst tools return standardized result formats with findings, evidence, and hypothesis information.

---

*Generated from iflow-mcp project documentation*
