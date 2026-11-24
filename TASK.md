# GOAL
Build RDP v3.0 — a cloud-ready, mobile-first Glacier Water Solutions ERP website with shared data, 6 roles, server-side rules, full sales/purchase/inventory/production/QC/delivery/accounts/reports, migration path from v2, and deployable PWA.

PRD / plan source: `RDP-v3.0-source.pdf` (8 pages) and `/data/data/com.termux/files/usr/tmp/zyvo/drive2.txt` (extracted text).

## Phases
- [ ] 0. Discovery/protection
  - [x] 0.1 Read full RDP v3 text and save PDF into project.
  - [x] 0.2 Keep v2 live app as read-only archive; new v3 project folder created.
  - [ ] 0.3 Export/reconcile all v2 browser backups (in user's browsers; cannot be done from Termux).
  - [ ] 0.4 Collect auditor/owner approvals: GSTIN, address, state, HSN, rates, prices, opening balances.
  - [ ] 0.5 Choose/finalize cloud host credentials (Supabase or equivalent).
- [ ] 1. Cloud foundation
  - [ ] 1.1 React+TS+Vite PWA scaffold with responsive glacier design.
  - [ ] 1.2 Auth: cloud email/password + local demo owner setup, role claims, lockout.
  - [ ] 1.3 Data adapter: Supabase adapter + localStorage demo fallback.
  - [ ] 1.4 PostgreSQL schema: org, identity, masters, docs, stock, manufacturing, QC, delivery, accounts, governance.
  - [ ] 1.5 RLS policies + role gates + audit triggers.
  - [ ] 1.6 Backup/restore screens + JSON/CSV/XLS/PDF export pack.
- [ ] 2. Masters/billing
  - [ ] 2.1 Company/tax/invoice series setup.
  - [ ] 2.2 Products, units/conversions, price lists, customers, suppliers.
  - [ ] 2.3 Quotations → orders → invoices/challans → returns.
  - [ ] 2.4 Receipts, allocations, statements, A4/80mm print.
  - [ ] 2.5 Posting transaction: stock issue + customer receivable + audit + idempotency.
- [ ] 3. Purchase/inventory
  - [ ] 3.1 PO → GRN → bill; direct bill; purchase returns.
  - [ ] 3.2 Supplier payments, ledger, aging.
  - [ ] 3.3 Stock ledger, batches/expiry, counts/adjustments, FEFE/FEFO suggestion.
  - [ ] 3.4 Reorder alerts, valuation, negative-stock guard.
- [ ] 4. Production/QC
  - [ ] 4.1 BOM/recipe, production plans, batches, consumption, rejects, costing.
  - [ ] 4.2 QC tests, hold/release/reject, lab attachments, traceability.
- [ ] 5. Delivery/accounts
  - [ ] 5.1 Dispatch, driver/vehicle, POD, returnables, daily sheet.
  - [ ] 5.2 Cash/bank, expenses, journals, ledgers, capital/drawings, fixed assets.
  - [ ] 5.3 Reports: sales, purchase, stock, production, QC, delivery, GST working, P&L, balance sheet.
  - [ ] 5.4 Month lock/reopen with reason and audit.
- [ ] 6. Migration/launch
  - [ ] 6.1 Import v2 JSON/Excel backups into staging with mapping and rejected-row log.
  - [ ] 6.2 Reconcile counts/totals/balances; owner + accountant sign-off.
  - [ ] 6.3 Security review, restore drill, production deploy, training note.

## Key decisions
- New repo/folder `~/glacier-erp-v3`; v2 repo stays live as read-only archive at `https://smartbooksbasha-svg.github.io/glacier-water-solutions/`.
- Backend = Supabase (managed Postgres + Auth + RLS + Storage) as the documented equivalent of Node+TS REST API; no secrets in frontend.
- App must work in local demo mode before credentials are entered; cloud setup is entered in-app (URL + anon key only).
- Money = integer paise everywhere; display with Indian formatting.
- Stock = opening + posted inward − posted outward; never direct balance overwrite.

## NOW
Starting phase 1 foundation: scaffold React+TS+Vite PWA, schema, data layer, UI shell, module screens, tests, deploy.
