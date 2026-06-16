# iFlows MCP / Claude Connector — E2E Test Plan & Report

**Date:** 2026-06-16
**Scope:** All 48 QA backlog items (Slack thread, 2026-06-15/16).
**Test surface:** Black-box through the `iflow-broker` MCP connector — a tester (or assistant
session) asks the iFlows assistant / Cowork a natural-language question, observes the tool call(s)
the model makes, and checks the answer against the platform UI. No source patching in this round.
**Deliverable:** This document. Each item has a runnable test card. The team reacts ✅ on the
original Slack message once its card passes.

---

## ⚠️ Verified code-state addendum (2026-06-16, post deep-research)

After this plan was first drafted, every item was deep-researched in source across both repos. The
**verified ground truth** and the **independently-executable task groups** now live in
`iflow-mcp/.plans/` (`README.md` has the corrected matrix + dependency graph). Key deltas to the
baselines below:

- **~38/48 items are DONE and real in code** (TS proxy → `iflow01 mcp_endpoints.py`). The widespread
  "missing tool" reports are a **stale broker deployment** → see `.plans/TG0`. Deploy first.
- **#37 (e-Factura/SPV) is NOT 🔴 — it is DONE** (`_efactura_payload`, 8-tag filter,
  `EFacturaBillsHistories`). The reporter's assumption was wrong.
- **#12** is DONE (get_stock accepts `product_id`, explicit error not `quantity:0`).
- **#36** is further along than memory said — "(Claude)" suffix + avatar badge are already
  server-rendered (`activity_journal.py`); only logo SVG assets need checking.
- **#6 is a code fix, not a "confirm"** — the TS schema `z.number().positive()` rejects 0
  (`write-crud.ts:116/186`); see `.plans/TG1`.
- **#8** contact fields are genuinely MISSING from serialization → `.plans/TG2`.
- **#9** naming → `.plans/TG3`; **#47** row-scope gap + role testing → `.plans/TG4`;
  **#7** new tool → `.plans/TG5`; minor polish → `.plans/TG6`.

Apply the per-card test corrections listed in `.plans/TG7` (e.g. #32 count-matches-UI, #12 explicit
error, #1 span tool types, #47 row-count equality). The cards below remain the execution script.

---

## 0. How to use this document

1. Work **track by track** (Section 3). Within a track, run cards top-to-bottom.
2. For each card: set up the **Preconditions**, run the **Steps**, compare to **Expected**, tick the
   **Pass criteria**, and write the outcome in **Result / Evidence**.
3. Update the **Status Matrix** (Section 2) and react ✅ on Slack only when *all* pass criteria pass.
4. If a card fails, capture the raw tool response (or the assistant's wrong answer) in
   **Result / Evidence** and open the per-item Slack thread.

### Critical environment note (read first)

There are **two layers** that can disagree, and most "missing tool" reports trace to layer 2:

- **Layer 1 — `iflow-mcp` source:** as of this scan, source registers tools for nearly every
  item 18–46 (`create_task`, `create_opportunity`, `tag_entity`, `client_credit_limit_history`,
  `get_client_portal_account`, `list_email_campaigns`, `list_email_flows`/`get_email_flow`,
  `list_forms`/`get_form`/`list_form_submissions`, `list_correspondence`,
  `list_admin_folders`/`list_admin_files`/`download_admin_file`, `list_generated_documents`,
  `get_equipment_service`, `list_chat_conversations`/`get_chat_conversation`/`chat_response_time_report`,
  `list_opportunities`, `list_offer_versions`, `list_delivery_notes`, `list_objectives`,
  `list_etransport`, `list_shipments`, `list_receipts`, `list_cash_register`/`list_bank_register`,
  `list_consumption_vouchers`/`list_production_handovers`, `list_recurring_documents`,
  `get_product_composition`, `get_product_pricing`, `list_markups`, `list_users`/`get_user`).
- **Layer 2 — the *deployed/connected* broker:** the live session exposes only the older subset and
  is missing most of the above. **A "tool not found" almost always means a stale deployment, not
  unwritten code.**

**Therefore every card's first pass criterion is the same gate:**
> **G0 — Exposure & liveness:** the tool is exposed by the *connected* broker, the call succeeds
> (no `Integration not found` / transport error), and it returns **real backend data**, not an
> empty/stub/zero response. If G0 fails because the tool is absent from the connected broker, mark
> the result **`BLOCKED — deploy`** (not "fail"), since the code exists in source.

---

## 1. Status legend

| Symbol | Baseline meaning (my read before testing) |
|---|---|
| ✅ | Shipped & verified previously → this round **re-confirms** end-to-end. |
| 🟢src | **Tool registered in `iflow-mcp` source**, but live exposure + real-data wiring **unverified** → test = confirm it's deployed and returns true data. |
| 🟡 | Partial — part of the fix shipped, part outstanding → test what exists, flag the gap. |
| 🔴 | **Genuinely not built** (no tool/field in source) → test = confirm absence + record acceptance criteria for when implemented. |
| 🛡️ | Cross-cutting policy/security → **negative/permission** testing. |

**Result column values to use:** `PASS` · `FAIL` · `PARTIAL` · `BLOCKED — deploy` · `N/A (not built)` · `BLOCKED — needs data`.

---

## 2. Status Matrix (the ✅ tracker)

| # | Title (RO, short) | Primary tool(s) | Baseline | Result | Notes |
|---|---|---|---|---|---|
| 1 | Acțiunile MCP de scriere → Jurnal de Activitate | (all write tools) → `list_activity` | ✅ | | per memory shipped 2026-06-16 |
| 2 | Sold restant nu e real | `get_client`/`list_overdue_customers` | ✅ | | sold_restant repointed to live AR |
| 3 | Nota MCP cu memento → câmp "Angajat" gol | `add_client_note` | ✅ | | + `notify_employee_ids` param |
| 4 | `create_order`: currency eliminat, vat default | `create_order` | ✅ | | currency removed; vat→product default |
| 5 | `create_order` vat: obligatoriu & respinge 19/21 | `create_order` | ✅ | | vat optional, valid set aligned |
| 6 | `create_product`: `price_acquisition` respinge 0 | `create_product` | 🟡 | | confirm 0 is accepted |
| 7 | Trimitere email către client din iFlows | `send_client_email` | 🔴 | | **not in source** |
| 8 | Date de contact client (email/telefon) lipsesc | `get_client`/`list_clients*` | 🟡 | | get_client "Integration not found" = deploy |
| 9 | Asistentul spune "iFlow" în loc de "iFlows" | (server/tool descriptions) | 🟡 | | naming audit across descriptions |
| 10 | Status trimitere/comunicare pe documente | `document_communications` | ✅ | | verify all 5 doc types |
| 11 | "Creat de" pe document (toate tipurile) | `list_invoices`/`list_offers`/`list_orders` | 🟡 | | created_by present on some, verify proforma/tipizate |
| 12 | Stoc: valori diferite + `get_stock` cu product_id | `get_stock`/`list_products_search` | ✅ | | two subparts |
| 13 | Prezență/concediu angajați | `list_employee_leave` | ✅ | | shipped 2026-06-16 |
| 14 | `country_code` greșit la furnizori | `list_suppliers` | ✅ | | country from FK |
| 15 | Comenzi furnizor neexpuse | `list_supplier_orders` | ✅ | | shipped 2026-06-16 |
| 16 | Reduceri/prețuri pe client | `list_client_discounts` | ✅ | | shipped 2026-06-16 |
| 17 | Echipamente Service pe client | `list_client_service_equipment` | 🟢src | | verify backend data |
| 18 | Flux Gmail: căutare client după email + creare oportunitate | `list_clients_search`(email) + `create_opportunity` | 🟢src/🟡 | | Gmail leg out of MCP scope |
| 19 | Istoric limite de sold client | `client_credit_limit_history` | 🟢src | | + write to activity journal |
| 20 | Etichetare entități (tag-uri) | `tag_entity` | 🟢src | | write action — confirm + smart create |
| 21 | Creare sarcină | `create_task` | 🟢src | | write action |
| 22 | Cont portal client | `get_client_portal_account` | 🟢src | | |
| 23 | Campanii email | `list_email_campaigns` | 🟢src | | |
| 24 | Fluxuri email (funnel) | `list_email_flows`/`get_email_flow` | 🟢src | | |
| 25 | Formulare marketing | `list_forms`/`get_form`/`list_form_submissions` | 🟢src | | |
| 26 | Registru corespondență | `list_correspondence` | 🟢src | | |
| 27 | Documente administrative (foldere/fișiere) | `list_admin_folders`/`list_admin_files`/`download_admin_file` | 🟢src | | incl. download |
| 28 | Documente tipizate (Generate) | `list_generated_documents` | 🟢src | | links to #10 |
| 29 | Service echipament intern | `get_equipment_service` | 🟢src | | |
| 30 | WhatsApp / Chat | `list_chat_conversations`/`get_chat_conversation`/`chat_response_time_report` | 🟢src | | |
| 31 | Listare oportunități | `list_opportunities` | 🟢src | | complements #18 |
| 32 | `list_offers`: creator + `status_tag=ACCEPTED`=0 | `list_offers` | 🟡 | | two subparts |
| 33 | Istoric versiuni ofertă | `list_offer_versions` | 🟢src | | |
| 34 | Avize de livrare | `list_delivery_notes` | 🟢src | | + flag pe comandă |
| 35 | Management obiective | `list_objectives` | 🟢src | | |
| 36 | Marcare vizuală acțiuni Claude (text + avatar) | (iflow01 frontend) | 🔴/🟡 | | backend `via_integration` shipped, **UI pending** |
| 37 | Stare e-Factura / SPV (ANAF) pe facturi | `list_invoices` (fields) | 🔴 | | **no field in source** |
| 38 | RO e-Transport (cod UIT) | `list_etransport` | 🟢src | | |
| 39 | Expedieri curier / AWB | `list_shipments` | 🟢src | | |
| 40 | Chitanțe | `list_receipts` | 🟢src | | |
| 41 | Registru de casă / bancă (linii) | `list_cash_register`/`list_bank_register` | 🟢src | | read-only (see #48) |
| 42 | Bonuri consum / note predare producție | `list_consumption_vouchers`/`list_production_handovers` | 🟢src | | |
| 43 | Comenzi/facturi recurente | `list_recurring_documents` | 🟢src | | |
| 44 | Compoziție super-produs | `get_product_composition` | 🟢src | | + flag în list_products_search |
| 45 | Structură preț / adaosuri | `get_product_pricing`/`list_markups` | 🟢src | | |
| 46 | Utilizatori & niveluri de acces | `list_users`/`get_user` | 🟢src | | |
| 47 | Drepturi de acces moștenite (RBAC) | (all tools, server-side) | 🛡️ | | negative testing |
| 48 | Interdicție acțiuni ireversibile/financiare | (absence of delete/storno/payment) | 🛡️ | | confirm absence |

---

## 3. Test cards

Card format: **Type · Baseline · Tool(s) · Preconditions · Steps (prompt → expected tool call →
expected answer) · Pass criteria · Edge/negative · Result/Evidence · Linked.**
Every card implicitly includes **G0** (Section 0) as its first pass criterion.

> **Reusable preconditions (real-ish dev data from the reports):**
> - `ARS` invoice **#249250**, contact **juliasisu@yahoo.com** (email sent 15 Jun 2026 23:20, created by Julia Sisu) — items 10, 11.
> - Client **ARCADIA SOLUTIONS SRL**, order **11228** (credit limit unblocked by Julia 16 Jun 2026 14:40) — items 19, 20, 31.
> - Product **"01.40.0062 Motor Cable" id 2799** (list says stock 0, get_stock says 3) — item 12.
> - Supplier **KAO Chimigraf id 160**, CIF **ESB66842618**, country Spain — item 14.
> - Supplier order **#347**, 08.06.2026, total **4.158,22 EUR**, status "Trimisă" — item 15.
> - Client **Paragon**, product **"NAZDAR 759 BLACK 5L"** — item 16.
> - Equipment **B107ADL** — item 29.
> - Offers **#25223 CARPAT FAUR**, **#26404 COMPU GRAFIX** (status "Acceptata") — item 32.
> - Order **967** (avize), order **#10153** (tipizate, Secțiune=Comandă) — items 34, 28.

---

### Track A — Write-action plumbing & attribution (1, 3, 4, 5, 6, 36)

#### Item 1 — MCP write actions must log to the Activity Journal
- **Type:** Bug-fix retest · **Baseline:** ✅ · **Tools:** any write tool → `list_activity`
- **Preconditions:** a test client you may safely annotate.
- **Steps:**
  1. Prompt: *"Adaugă o notă la clientul \<X\>: 'test jurnal MCP'."* → expect `add_client_note` call → confirmation.
  2. Prompt: *"Arată-mi ultimele activități pentru clientul \<X\>."* → expect `list_activity` → the note appears.
  3. Cross-check the same entry in the iFlows UI Activity Journal (Jurnal de Activitate).
- **Expected:** a `ReportsRecentActivity` row exists, **attributed to the connected user** (not a system/integration account), timestamped, same as a UI-made note.
- **Pass criteria:** ☐ G0 ☐ row created ☐ correct user attribution ☐ visible in UI journal ☐ also true for `create_order`, `update_order_status`, `mark_order_*`, `add_offer_comment` (spot-check ≥2 more write tools).
- **Edge:** verify `IFLOW_MCP_BFF_INTEGRATION_UUIDS` env is set for this env (in-app assistant attribution depends on it).
- **Result / Evidence:**
- **Linked:** 19 (credit-limit events must also journal), 36 (mark as Claude).

#### Item 3 — `add_client_note` reminder recipient ("Angajat")
- **Type:** Bug-fix retest · **Baseline:** ✅ · **Tool:** `add_client_note`
- **Steps:**
  1. Prompt: *"Creează o notă cu memento mâine la clientul \<X\>: 'sună clientul'."* (no recipient given) → expect `add_client_note` with `reminder_date` set.
  2. In UI, open the note → **"Angajat" must be auto-filled with the note's author** (connected user), never empty.
  3. Prompt with explicit recipient: *"...și trimite mementoul lui \<alt angajat\>."* → expect `notify_employee_ids` populated.
- **Pass criteria:** ☐ G0 ☐ default recipient = author when omitted ☐ `notify_employee_ids` honored when given ☐ reminder never recipient-less when `reminder_date` present.
- **Note:** recipient maps to `memento_employees` (M2M "Angajat"), not the author field.
- **Result / Evidence:**

#### Item 4 — `create_order`: currency removed, vat defaults
- **Type:** Bug-fix retest · **Baseline:** ✅ · **Tool:** `create_order`
- **Steps:**
  1. Inspect the `create_order` tool schema (via `mcp_data_dictionary` / tool catalog) → **`currency` must not exist as an input**.
  2. Prompt: *"Creează o comandă pentru clientul \<X\> cu produsul \<P\>, cantitate 2."* (no currency/vat) → succeeds; currency = system `INSTANCE_CURRENCY_CODE`; vat = product default.
- **Pass criteria:** ☐ G0 ☐ no `currency` input ☐ order created with system currency ☐ vat defaulted from product.
- **Result / Evidence:**

#### Item 5 — `create_order` vat optional & valid set
- **Type:** Bug-fix retest · **Baseline:** ✅ · **Tool:** `create_order`
- **Steps:**
  1. Prompt without vat → order created (vat = `product.vat_rate`).
  2. Prompt with explicit vat 19 and 21 → both accepted (no "Cota TVA nu este validă"). Accept fraction (0.19) and percent (19).
- **Pass criteria:** ☐ G0 ☐ vat omittable ☐ 19 & 21 accepted ☐ exemption sentinels (10..81) still handled.
- **Result / Evidence:** · **Linked:** 4.

#### Item 6 — `create_product` accepts `price_acquisition = 0`
- **Type:** Bug-fix retest · **Baseline:** 🟡 · **Tool:** `create_product`
- **Steps:**
  1. Prompt: *"Creează produsul de test 'QA cost zero' cu preț de achiziție 0 și preț de vânzare 100."* → expect `create_product` success.
- **Expected:** product created with `price_acquisition = 0` (no `too_small`/"must be greater than 0").
- **Pass criteria:** ☐ G0 ☐ 0 accepted ☐ negative still rejected.
- **Result / Evidence:**

#### Item 36 — Visual marking of Claude-made actions (text "(Claude)" + avatar badge)
- **Type:** UI / cross-cutting · **Baseline:** 🔴 UI pending (backend `via_integration` shipped) · **Surface:** iflow01 desktop frontend
- **Steps (UI, not connector):**
  1. Make a write via the connector (e.g. note), as user "Tudose Diana".
  2. In UI lists, the author text shows **"... de Tudose Diana (Claude)"** and the avatar carries a small round Claude badge (bottom-right), over initials and over photo alike.
  3. A manual action by the same user shows **no** marking.
- **Pass criteria:** ☐ "(Claude)" suffix everywhere author appears (orders, offers, invoices, avize, notes, documents) ☐ avatar badge present ☐ manual actions unmarked ☐ activity-journal filter for via_integration works.
- **Result / Evidence:** Backend flag exists (`ReportsRecentActivity.via_integration`, mig 0631); **the text-suffix + avatar-badge frontend work is the open part** — expect this card to remain ❌ until the desktop-frontend phase ships.
- **Linked:** 1.

---

### Track B — Data exposure on existing documents/lists (8, 10, 11, 12, 14, 22, 32, 37)

#### Item 8 — Client contact fields (email / phone / contact person)
- **Type:** Field exposure · **Baseline:** 🟡 · **Tools:** `get_client`, `list_clients_search`
- **Steps:**
  1. Prompt: *"Care e adresa de email și telefonul clientului \<X\>?"* → expect `get_client` (or `list_clients_search`) returning `email`, `phone`, `contact_person`.
- **Pass criteria:** ☐ G0 — **`get_client` must not return "Integration not found"** (deployment gate) ☐ email present ☐ phone present ☐ contact person present.
- **Result / Evidence:** Required precondition for items 7 & 18 (recipient auto-resolution).
- **Linked:** 7, 18.

#### Item 10 — Document communication/send status
- **Type:** New read · **Baseline:** ✅ · **Tool:** `document_communications`
- **Preconditions:** ARS invoice #249250 (email sent 15 Jun 2026 23:20 → juliasisu@yahoo.com).
- **Steps:**
  1. Prompt: *"A fost trimisă factura ARS #249250 clientului? Când și către cine?"* → expect `document_communications` (object_type=invoice).
  2. Repeat for one **offer**, one **order**, one **proforma**, one **printed/tipizat** document.
- **Expected:** per document: sent (y/n), date/time, recipient address, channel (email), sender/author.
- **Pass criteria:** ☐ G0 ☐ correct sent flag + datetime + recipient ☐ **uniform across all 5 doc types** (offer, order, invoice, proforma, printed_form).
- **Result / Evidence:** Channel is email; whatsapp is not per-document (see #30).
- **Linked:** 11, 28, 30.

#### Item 11 — "Created by" on the document itself (all types)
- **Type:** Field exposure · **Baseline:** 🟡 · **Tools:** `list_invoices`, `list_offers`, `list_orders` (+ proforma, tipizate)
- **Steps:**
  1. Prompt: *"Cine a creat factura ARS #249250 și când?"* → expect the answer to come from `list_invoices` fields (`created_by_name`, `created_at`), **not** a separate `list_activity` lookup.
  2. Repeat for an offer, an order, a proforma, a generated/tipizat document.
- **Pass criteria:** ☐ G0 ☐ `created_by`/`created_by_name` + `created_at` on invoice/offer/order ☐ **same fields on proforma & tipizate** (the likely gap) ☐ no journal round-trip needed.
- **Result / Evidence:** created_by confirmed on invoice/offer/order per prior work; proforma & tipizate are the parts to verify.
- **Linked:** 10, 28.

#### Item 12 — Stock consistency + `get_stock` by `product_id`
- **Type:** Bug-fix retest · **Baseline:** ✅ · **Tools:** `get_stock`, `list_products_search`
- **Preconditions:** product id 2799 ("01.40.0062 Motor Cable").
- **Steps:**
  1. Prompt: *"Ce stoc are produsul 01.40.0062 Motor Cable?"* → expect `get_stock` with `product_id` **accepted** (not `invalid product_uuid`).
  2. Compare `get_stock.quantity` vs `list_products_search.stock` for the same product → **must match**.
- **Pass criteria:** ☐ G0 ☐ `product_id` accepted by `get_stock` ☐ stock value identical across both tools ☐ **on bad/unknown id → explicit error, never `quantity: 0`**.
- **Edge:** call `get_stock` with a nonsense id → assert error object, no misleading zero.
- **Result / Evidence:**

#### Item 14 — Supplier `country_code` correct
- **Type:** Bug-fix retest · **Baseline:** ✅ · **Tool:** `list_suppliers`
- **Preconditions:** KAO Chimigraf id 160 (CIF ESB66842618 → Spain).
- **Steps:** Prompt: *"Din ce țară este furnizorul KAO Chimigraf?"* → expect `country_code` = `ES`/Spain (from FK, not "RO").
- **Pass criteria:** ☐ G0 ☐ country = Spain ☐ derived from supplier FK, not a stale literal.
- **Result / Evidence:**

#### Item 22 — Client portal account
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `get_client_portal_account`
- **Steps:** Prompt: *"Are clientul \<X\> cont de portal? Ce email are și când s-a conectat ultima dată?"* → expect `get_client_portal_account`.
- **Expected:** has-account (y/n), associated email/username, last login datetime, login history.
- **Pass criteria:** ☐ G0 ☐ has-account flag ☐ email/user ☐ last-login ☐ login history list.
- **Result / Evidence:**

#### Item 32 — `list_offers`: creator field + `status_tag=ACCEPTED` mapping
- **Type:** Bug-fix + field exposure · **Baseline:** 🟡 · **Tool:** `list_offers`
- **Preconditions:** offers #25223 (CARPAT FAUR), #26404 (COMPU GRAFIX), both status "Acceptata", June 2026.
- **Steps:**
  1. Prompt: *"Câte oferte acceptate a creat Romulus luna asta?"* → expect `list_offers` with `status_tag=ACCEPTED` + `employee_id` filter.
  2. (a) Assert each offer row carries **agent/creator id + name**, and `employee_id` filter actually narrows results.
  3. (b) Assert `status_tag=ACCEPTED` for June 2026 returns **>0** and includes #25223 & #26404 (currently returns 0).
- **Pass criteria:** ☐ G0 ☐ creator id+name on each offer ☐ `employee_id` filter works ☐ ACCEPTED maps to internal "Acceptata" ☐ valid status list (tag + RO label) exposed in `mcp_data_dictionary`.
- **Result / Evidence:** · **Linked:** 11, 33.

#### Item 37 — e-Factura / SPV (ANAF) status on invoices
- **Type:** Field exposure · **Baseline:** 🔴 (no field in source) · **Tool:** `list_invoices` (+ detail)
- **Steps:** Prompt: *"Factura #X a fost trimisă în SPV? A fost acceptată sau respinsă de ANAF?"* → today: not answerable.
- **Acceptance criteria for when built:** ☐ e-Factura status (netrimisă/în procesare/acceptată/respinsă) ☐ SPV send date ☐ ANAF upload index / download id ☐ rejection message/errors ☐ filters by e-Factura status + period.
- **Result / Evidence:** Confirm absence today; this card stays `N/A (not built)` until fields added. Distinct from #10 (generic send status).
- **Linked:** 10.

---

### Track C — New read endpoints over existing modules

*(2, 9, 13, 15, 16, 17, 18, 19, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34, 35, 38, 39, 40, 41, 42, 43, 44, 45, 46 — 29 cards)*

> For every 🟢src card below the test is the same shape — **prompt the assistant with the natural
> question, confirm the right tool fires, and verify the returned fields match the iFlows UI.** The
> per-card "Expected fields" list is the checklist. The dominant failure mode is `BLOCKED — deploy`
> (G0), so check that first.

#### Item 2 — "Sold restant" is real
- **Type:** Bug-fix retest · **Baseline:** ✅ · **Tools:** `get_client`, `list_overdue_customers`
- **Steps:** Prompt: *"Ce sold restant are clientul \<X\>?"* → cross-check against UI overdue total.
- **Expected:** value derived from **live FiscalBill OVERDUE** (`receivables.py`), not the frozen 2022 `Clienti.sold_restant` scalar.
- **Pass criteria:** ☐ G0 ☐ matches UI overdue ☐ AR/DSO totals use PENDING+PARTIAL+OVERDUE (not overdue-only) where relevant.
- **Result / Evidence:**

#### Item 9 — Assistant must say "iFlows", never "iFlow"
- **Type:** Naming/policy · **Baseline:** 🟡 · **Surface:** server name/description, tool descriptions, instructions/system text, returned strings
- **Steps:**
  1. Grep all connector-facing text (server name, connector title/description, every tool description, `mcp_assistant_intro`, playbook text) for the bare token "iFlow" not followed by "s".
  2. Ask the assistant: *"Cum se numește platforma?"* → must answer **iFlows**.
- **Pass criteria:** ☐ no "iFlow"-without-s in any connector-returned text ☐ assistant reproduces "iFlows".
- **Result / Evidence:**

#### Item 13 — Employee presence / leave
- **Type:** New read · **Baseline:** ✅ · **Tool:** `list_employee_leave`
- **Steps:** Prompt: *"Cine a fost în concediu pe 12 iunie 2026?"* → expect `list_employee_leave` filtered by date.
- **Expected fields:** employee, leave type, start/end, status; backed by `EventData`.
- **Pass criteria:** ☐ G0 ☐ correct people for the date ☐ leave type/range present.
- **Result / Evidence:**

#### Item 15 — Supplier orders (Comandă Furnizor)
- **Type:** New read · **Baseline:** ✅ · **Tool:** `list_supplier_orders`
- **Preconditions:** supplier order #347 (08.06.2026, 4.158,22 EUR, "Trimisă").
- **Steps:** Prompt: *"Care e ultima comandă furnizor și ce valoare are?"* → expect `list_supplier_orders` (not `list_purchases`).
- **Expected fields:** number, date, supplier, status, total, currency, delivery date, line items.
- **Pass criteria:** ☐ G0 ☐ returns #347 with correct total/status ☐ **not** confused with NIR/expense entries.
- **Result / Evidence:**

#### Item 16 — Per-client discounts/prices
- **Type:** New read · **Baseline:** ✅ · **Tool:** `list_client_discounts`
- **Preconditions:** client Paragon, product "NAZDAR 759 BLACK 5L".
- **Steps:** Prompt: *"Ce reducere are Paragon la NAZDAR 759 BLACK 5L?"* → expect `list_client_discounts`.
- **Expected fields:** per product/category discount %, resulting net price.
- **Pass criteria:** ☐ G0 ☐ correct discount/price for the pair.
- **Result / Evidence:**

#### Item 17 — Client service equipment
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `list_client_service_equipment(client_id)`
- **Steps:** Prompt: *"Ce echipamente în service are clientul \<X\>?"*
- **Expected fields:** equipment name/alias, serial/code, model/manufacturer, date added, (ideally) intervention history.
- **Pass criteria:** ☐ G0 ☐ list matches UI Service section ☐ key fields present.
- **Result / Evidence:**

#### Item 18 — Gmail RFQ flow enablers (client search by email + create opportunity)
- **Type:** New read + write · **Baseline:** 🟢src / 🟡 · **Tools:** `list_clients_search` (`email` param), `create_opportunity`
- **Steps:**
  1. Prompt: *"Găsește clientul cu emailul \<addr\>."* → expect `list_clients_search` with an `email` parameter that matches on contact email.
  2. Prompt: *"Creează o oportunitate pentru acel client cu textul ..."* → expect `create_opportunity` (with confirmation).
- **Pass criteria:** ☐ G0 ☐ `email` param exists & matches ☐ `create_opportunity` creates the record (per v3.1 spec) ☐ confirmation required before write.
- **Result / Evidence:** The Gmail-detection leg (Cowork) is outside the MCP connector — test only the two connector capabilities here.
- **Linked:** 8, 31.

#### Item 19 — Client credit-limit history
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `client_credit_limit_history(client_id)`
- **Preconditions:** ARCADIA SOLUTIONS SRL, order 11228 (unblocked by Julia 16 Jun 2026 14:40).
- **Steps:** Prompt: *"Cine a deblocat limita de sold a clientului ARCADIA pentru comanda 11228?"*
- **Expected fields:** event type (auto-block / temporary unblock / manual), description, datetime, acting employee, sold + set limit at the time.
- **Pass criteria:** ☐ G0 ☐ shows the temporary-unblock by Julia ☐ all fields ☐ **events also written to Activity Journal** (link #1).
- **Result / Evidence:** · **Linked:** 1.

#### Item 23 — Email campaigns
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `list_email_campaigns`
- **Steps:** Prompt: *"Când am trimis ultima campanie de email?"*
- **Expected fields:** name, emails sent, start (date+time), end (date+time), status ("Terminat cu Succes"/error), employee, tab/state (Se trimite/Noi/Programate/Trimise).
- **Pass criteria:** ☐ G0 ☐ period filter + sort by date ☐ correct "last campaign". **Do NOT expect open-rate.**
- **Result / Evidence:**

#### Item 24 — Email flows (funnels)
- **Type:** New read · **Baseline:** 🟢src · **Tools:** `list_email_flows`, `get_email_flow`
- **Steps:** Prompt: *"Câte fluxuri de email active am?"* then *"Detaliază fluxul \<X\>."*
- **Expected fields:** name, notes, active(y/n)+active counter, tags, client-status filter; templates list (order, template, interval days); rules (include contacts, exit condition e.g. "Prima Comandă", send hour).
- **Pass criteria:** ☐ G0 ☐ active counter ☐ template list ☐ rules ☐ filter by active/client-status. **No open-rate.**
- **Result / Evidence:**

#### Item 25 — Marketing forms
- **Type:** New read · **Baseline:** 🟢src · **Tools:** `list_forms`, `get_form`, `list_form_submissions`
- **Steps:** Prompts: *"Câte formulare active am? Câte completări a primit formularul \<X\>? Câte oportunități a generat?"*
- **Expected fields:** form (name, alias, slug/URL, active+counter, notify employees, embed link/code, redirect, enabled sections Client/Extra/Products, per-product workflow + opportunity validity + linked catalog products, defined fields type/options/default/required, config status green=generates-opportunity / orange=record-only); submissions (count + date each, created/linked client, generated opportunities, uploaded docs, answers per section).
- **Pass criteria:** ☐ G0 ☐ active counter ☐ submissions count + dates ☐ opportunities link ☐ filters active/period + sort.
- **Result / Evidence:**

#### Item 26 — Correspondence register
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `list_correspondence`
- **Steps:** Prompt: *"Care e ultimul nr. de ieșire din registrul de corespondență?"*
- **Expected fields:** registration number, type (Intrare/Ieșire), correspondent, date, content, updated (date+time), employee.
- **Pass criteria:** ☐ G0 ☐ filters period/type/employee ☐ desc sort ☐ "last number" per type answerable.
- **Result / Evidence:**

#### Item 27 — Administrative documents (folders/files/download)
- **Type:** New read + download · **Baseline:** 🟢src · **Tools:** `list_admin_folders`, `list_admin_files(folder)`, `download_admin_file`
- **Steps:** Prompts: *"Ce fișiere am în folderul \<X\>?"*, *"Descarcă catalogul Adline 2025."*
- **Expected fields:** folders (name, access level, created/modified dates, creator, tags); files (name, doc type+size, tags, creator, added/updated dates, employee, access level, download link/content; Activ/Arhivă tab); download returns the file by id.
- **Pass criteria:** ☐ G0 ☐ folder list ☐ file list w/ fields ☐ **download works** ☐ filters period/tags/access/creator/(doc type) + name search.
- **Result / Evidence:**

#### Item 28 — Generated/typed documents (Generate tab)
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `list_generated_documents` (+ detail)
- **Preconditions:** a document on order #10153 (Secțiune=Comandă).
- **Steps:** Prompt: *"S-a generat documentul \<X\> către clientul \<Y\>? E trimis? E semnat?"*
- **Expected fields:** date generated, title, client, section (Client/Comandă), document (order # when section=Comandă), updated (date+time), sent(y/n), signed(y/n), user; signed-detail (sign date, signer, email, generation date, sent by).
- **Pass criteria:** ☐ G0 ☐ sent/signed flags ☐ filters period/client/section/sent/signed + text search.
- **Result / Evidence:** · **Linked:** 10, 11.

#### Item 29 — Internal equipment service sheet
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `get_equipment_service(equipment)`
- **Preconditions:** equipment B107ADL.
- **Steps:** Prompt: *"Când a avut echipamentul B107ADL ultima intervenție? Ce mentenanțe are programate?"*
- **Expected sections:** Service general (company, contacts); Maintenance list (date, details, frequency value+unit, alert on/off — ITP/Vignetă/RCA/CASCO); Interventions list (date, details) + "last intervention" (or explicit "nicio intervenție"); Problems (problem, resolution).
- **Pass criteria:** ☐ G0 ☐ all 3 sections ☐ last-intervention logic ☐ due-maintenance flag (date+frequency+alert) ☐ empty → explicit "none".
- **Result / Evidence:**

#### Item 30 — WhatsApp / Chat
- **Type:** New read · **Baseline:** 🟢src · **Tools:** `list_chat_conversations`, `get_chat_conversation(id)`, `chat_response_time_report`
- **Steps:** Prompts: *"Câte conversații deschise am? Care e timpul mediu de răspuns? Care clienți așteaptă răspuns?"*
- **Expected:** conversations (client/contact, last message + timestamp, direction, status unread/awaiting, agent); conversation history (sender, text, timestamp, direction); metrics (avg response time per period/agent/client, conversation+message counts, no-reply rate).
- **Pass criteria:** ☐ G0 ☐ list ☐ history ☐ aggregate metrics.
- **Result / Evidence:**

#### Item 31 — Opportunities listing
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `list_opportunities`
- **Steps:** Prompt: *"Câte oportunități cu status Nouă am creat săptămâna asta, pe agent?"*
- **Expected fields:** number/id, title, client, status, workflow, agent/owner, estimated value, created date, last modified, validity, source (e.g. formular).
- **Pass criteria:** ☐ G0 ☐ filters status/period(created)/client/flow/agent ☐ per-status counter ☐ sort by created. (Distinct from `analyze_sales_funnel`, which is offer-based.)
- **Result / Evidence:** · **Linked:** 18, 25.

#### Item 33 — Offer version history
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `list_offer_versions(offer_id/number)`
- **Preconditions:** offer #25223.
- **Steps:** Prompt: *"Câte versiuni a avut oferta 25223 înainte să fie acceptată? Ce s-a modificat?"*
- **Expected fields per version:** version/revision number, date, author/agent, status at the time, total value, ideally diffs vs previous (products/prices); + version count + which version was accepted.
- **Pass criteria:** ☐ G0 ☐ version list ☐ count ☐ accepted-version marker.
- **Result / Evidence:** · **Linked:** 32.

#### Item 34 — Delivery notes (avize)
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `list_delivery_notes` (+ order flag)
- **Preconditions:** order 967.
- **Steps:** Prompt: *"S-a făcut aviz pentru comanda 967?"*
- **Expected fields:** number, series, date, client, linked order, status, value, invoiced-later(y/n), author; + an "are aviz (y/n)" flag on the order.
- **Pass criteria:** ☐ G0 ☐ aviz for 967 resolvable ☐ filters period/client/order/status ☐ order-level has-aviz flag.
- **Result / Evidence:**

#### Item 35 — Objectives management
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `list_objectives` (+ detail)
- **Steps:** Prompt: *"Câte obiective ratate avem în ultimele 3 luni? Câte active?"*
- **Expected fields:** name, type (Automatizat/Manual), status (Activ/În Așteptare/Ratat/Finalizat) + per-status counters, progress (done/target + %), responsible/assigned (individual/team), individual contributions (%), deadline + days-left, action history.
- **Pass criteria:** ☐ G0 ☐ status counters ☐ filters status/person/period(deadline)/search ☐ "last 3 months" answerable.
- **Result / Evidence:**

#### Item 38 — RO e-Transport (UIT)
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `list_etransport` (+ order/aviz flag)
- **Steps:** Prompt: *"Are comanda #X cod UIT generat? Care e statusul la ANAF?"*
- **Expected fields:** UIT code, status (generat/trimis/confirmat/respins/expirat), generation date + validity, linked order/aviz + client, transport data (carrier, plate, route), ANAF errors; + order/aviz-level "has e-Transport + UIT" flag.
- **Pass criteria:** ☐ G0 ☐ UIT + status ☐ filters period/status/order/client ☐ sort by generation date.
- **Result / Evidence:**

#### Item 39 — Courier shipments / AWB
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `list_shipments` (+ order flag)
- **Steps:** Prompt: *"Ce AWB are comanda #X? Care e statusul livrării?"*
- **Expected fields:** AWB number + courier, linked order/client + delivery address, status (generat/preluat/în tranzit/livrat/retur) + last-update, parcels/weight/COD, AWB date + transport cost, tracking link; + order-level "has AWB + number" flag.
- **Pass criteria:** ☐ G0 ☐ AWB + status ☐ filters period/status/courier/order/client ☐ sort + per-status counter.
- **Result / Evidence:**

#### Item 40 — Receipts (chitanțe)
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `list_receipts`
- **Steps:** Prompt: *"Ce chitanțe am emis luna asta și ce sumă am încasat?"*
- **Expected fields:** series + number, issue date, client, amount + currency, linked invoice(s), method (cash/card), issuing user.
- **Pass criteria:** ☐ G0 ☐ filters period/client/series/status ☐ interval total ☐ sort by date.
- **Result / Evidence:** *(Read-only — see #48; no receipt-creation tool.)*

#### Item 41 — Cash / bank register lines
- **Type:** New read · **Baseline:** 🟢src · **Tools:** `list_cash_register`, `list_bank_register`
- **Steps:** Prompt: *"Care e soldul registrului de casă azi? Ce încasări/plăți s-au înregistrat pe bancă?"*
- **Expected fields:** register type (Casă/Bancă) + account, date, op type (încasare/plată), amount + currency, partner + linked document, description, operating user, running balance.
- **Pass criteria:** ☐ G0 ☐ filters type/period/op-type/partner ☐ "sold la zi" per register ☐ interval totals. (Complements aggregate `cashflow_summary`.) **Read-only — no money-movement writes (#48).**
- **Result / Evidence:**

#### Item 42 — Consumption vouchers & production handovers
- **Type:** New read · **Baseline:** 🟢src · **Tools:** `list_consumption_vouchers`, `list_production_handovers`
- **Steps:** Prompt: *"Ce bonuri de consum s-au generat pe comanda #X? S-a făcut nota de predare?"*
- **Expected fields:** vouchers (number, date, order, materials+qty, warehouse, user, value); handovers (number, date, order, products+qty, handed-by/received-by, status); + order-level "has voucher / has handover" flags.
- **Pass criteria:** ☐ G0 ☐ both lists ☐ order-level flags ☐ filters period/order/product/user.
- **Result / Evidence:**

#### Item 43 — Recurring orders/invoices
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `list_recurring_documents`
- **Steps:** Prompt: *"Ce comenzi/facturi recurente am active? Când se generează următoarea?"*
- **Expected fields:** type (order/invoice), client, frequency + day/interval, next + last generation date, status (active/paused/ended) + validity, template/products + estimated value, already-generated documents.
- **Pass criteria:** ☐ G0 ☐ filters type/status/client/period(next) ☐ sort by next-generation.
- **Result / Evidence:**

#### Item 44 — Super-product composition
- **Type:** New read · **Baseline:** 🟢src · **Tool:** `get_product_composition(product_id)`
- **Steps:** Prompt: *"Din ce e format super-produsul \<X\>?"*
- **Expected fields:** is-super-product flag; component list (component product/material, qty per unit, UoM); per-component cost + total; nested levels if any; + an is-super flag in `list_products_search`.
- **Pass criteria:** ☐ G0 ☐ components + qty ☐ is-super flag in product search.
- **Result / Evidence:**

#### Item 45 — Price structure / markups
- **Type:** New read · **Baseline:** 🟢src · **Tools:** `get_product_pricing(product_id)`, `list_markups`
- **Steps:** Prompt: *"Cum s-a construit prețul produsului \<X\>? Ce adaos are pe categoria lui?"*
- **Expected fields:** acquisition price, markup (% and/or value) + source (category/subcategory vs product override), resulting sale price + margin, currency; `list_markups` = configured markup per category/subcategory.
- **Pass criteria:** ☐ G0 ☐ pricing breakdown ☐ category markup rules. (Distinct from #16 negotiated client discounts.)
- **Result / Evidence:**

#### Item 46 — Users & access levels
- **Type:** New read · **Baseline:** 🟢src · **Tools:** `list_users`, `get_user`
- **Steps:** Prompt: *"Ce nivel de acces are angajatul \<X\>?"*
- **Expected fields:** name, role, access level, department.
- **Pass criteria:** ☐ G0 ☐ role + access level + department per user.
- **Result / Evidence:** · **Linked:** 47.

---

### Track D — New write actions (7, 18-write, 20, 21)

#### Item 7 — Send email to client (`send_client_email`)
- **Type:** New write · **Baseline:** 🔴 (not in source) · **Tool:** `send_client_email`
- **Steps (acceptance for when built):** Prompt: *"Trimite un email clientului \<X\> să achite factura restantă."*
- **Acceptance criteria:** ☐ tool exists ☐ recipient auto-resolved from client profile (not asked manually) ☐ if multiple contacts → assistant asks which ☐ **confirmation required before send** ☐ appears in client history/notes as an "E-mail" action (same mechanism as manual UI send).
- **Result / Evidence:** Confirm absence today → `N/A (not built)`. Depends on #8 (contact fields).
- **Linked:** 8, 10.

#### Item 20 — Tag entities (`tag_entity`)
- **Type:** New write · **Baseline:** 🟢src · **Tool:** `tag_entity`
- **Steps:**
  1. Prompt: *"Marchează comanda 11228 ca urgent."* → if tag "urgent" exists → applies; if not → assistant asks to create, then on confirm creates + applies.
  2. Verify on Clienți / Comenzi / Oferte / Facturi (uniform).
- **Pass criteria:** ☐ G0 ☐ existing tag applied ☐ missing tag → ask-then-create (with confirmation) ☐ works across all 4 entity types ☐ multi-tag + tag removal supported.
- **Result / Evidence:**

#### Item 21 — Create task (`create_task`)
- **Type:** New write · **Baseline:** 🟢src · **Tool:** `create_task`
- **Steps:** Prompt: *"Creează o sarcină 'Sună clientul ARCADIA'."* → expect `create_task` with confirmation; flow only asked if >1 flow exists.
- **Pass criteria:** ☐ G0 ☐ Title required ☐ flow auto-picked when single, asked when multiple ☐ confirmation before write ☐ optional fields (description, assignee, order, privacy, priority, deadline, est. time, reminder, reminder employees, frequency, progress, tags, documents) only set when explicitly requested ☐ no non-title field forced.
- **Result / Evidence:**

*(Item 18 write-side `create_opportunity` is tested in its Track-C card above.)*

---

### Track E — Cross-cutting policy / security (9, 36, 47, 48)

*(Items 9 and 36 carry their cards in Tracks C and A respectively; 47 and 48 are pure policy.)*

#### Item 47 — RBAC: connector inherits the connected user's access level
- **Type:** Security (negative) · **Baseline:** 🛡️ · **Surface:** all tools, server-side enforcement
- **Preconditions:** two connector logins — a **limited** employee (e.g. demo_agent) and an admin.
- **Steps:**
  1. As the limited user, prompt for data **outside their UI access** (a restricted module/department/entity) → must get an explicit **"acces interzis"**, not data, not zero, not partial.
  2. As the limited user, attempt a write they lack the right for (e.g. create order without permission) → denied server-side.
  3. Repeat the same prompts as admin → succeeds, proving the gate is per-user, not global.
- **Pass criteria:** ☐ reads AND writes run in the connected user's context ☐ no-right → explicit denial (no leakage) ☐ enforcement is **server-side** (not prompt-level) ☐ admin-only tools (`analyze_business_board`/`analyze_business_health`) gated via `mcp_admin_gate`.
- **Result / Evidence:** RBAC capability model shipped previously; this card re-verifies leakage paths.
- **Linked:** 1, 46.

#### Item 48 — Block irreversible & financial actions on the connector
- **Type:** Security (absence) · **Baseline:** 🛡️ · **Surface:** entire tool catalog
- **Steps:**
  1. Enumerate the connected broker's full tool list (`mcp_tool_catalog`) → assert there is **no** delete, storno/cancel, payment, transfer, or cash/bank-write tool.
  2. Prompt explicitly: *"Șterge factura #X"* / *"Stornează comanda #Y"* / *"Înregistrează o plată de 1000 lei"* → assistant must have **no tool** to do it and refuse.
  3. Confirm `list_cash_register`/`list_bank_register`/`list_receipts` are read-only (no create/post variant).
- **Pass criteria:** ☐ no destructive/financial-write tool exposed ☐ blocked server-side regardless of user access level ☐ explicit prompts cannot execute ☐ holds even for admin.
- **Result / Evidence:** Source currently registers no such write tools — expect PASS; this card guards against regressions.
- **Linked:** 47.

---

## 4. Final report (fill after execution)

### 4.1 Summary counts
| Result | Count | Items |
|---|---|---|
| PASS | | |
| PARTIAL | | |
| FAIL | | |
| BLOCKED — deploy (in source, not on connected broker) | | |
| N/A (not built) | | |

### 4.2 Headline findings (pre-execution baseline)
1. **Deployment gap is the dominant risk.** Nearly all of items 17–46 already have tools in
   `iflow-mcp` source, but the connected broker exposes only the older subset. Expect a large
   `BLOCKED — deploy` bucket until the broker is redeployed. **Redeploying the connector is likely
   the single highest-leverage action** — it may flip ~25 items from "missing" to testable at once.
2. **Genuinely not built (need code):** #7 `send_client_email`, #37 e-Factura/SPV fields,
   #36 the Claude text+avatar marking in the iflow01 **frontend** (backend flag exists).
3. **Confirmed shipped → re-confirm only:** #1, 2, 3, 4, 5, 10, 12, 13, 14, 15, 16.
4. **Known partials to scrutinize:** #11 (proforma/tipizate created-by), #32 (offer creator +
   ACCEPTED mapping), #8 (`get_client` "Integration not found"), #6 (price 0).
5. **Policy items should pass by construction:** #47 (RBAC shipped), #48 (no destructive tools in
   source) — but both need explicit negative testing, not assumption.

### 4.3 Per-track sign-off
- Track A (write plumbing): ___ / 6  (items 1, 3, 4, 5, 6, 36)
- Track B (field exposure): ___ / 8  (items 8, 10, 11, 12, 14, 22, 32, 37)
- Track C (new reads): ___ / 29
- Track D (new writes): ___ / 4  (items 7, 20, 21; #18 `create_opportunity` scored under Track C)
- Track E (policy): ___ / 2  (items 47, 48; items 9 & 36 scored in Tracks C & A)

*(48 unique items total: A=6, B=8, C=29, D=3 home cards + #18 in C, E=2.)*

### 4.4 Open Slack threads
*(list item #s that failed, with the captured evidence)*
