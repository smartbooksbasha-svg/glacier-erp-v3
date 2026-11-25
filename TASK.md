# GOAL
Build RDP v3.0 — a cloud-ready, mobile-first Glacier Water Solutions ERP website with shared data, 6 roles, server-side rules, full sales/purchase/inventory/production/QC/delivery/accounts/reports, migration path from v2, and deployable PWA.

PRD / plan source: `RDP-v3.0-source.pdf` (8 pages) and `/data/data/com.termux/files/usr/tmp/zyvo/drive2.txt` (extracted text).

## Status legend
- `[x]` = code/asset implemented and verified in local demo mode.
- `[ ]` = needs external owner/auditor/cloud action or an acceptance test not yet possible from Termux.

## Phases
- [ ] 0. Discovery/protection
  - [x] 0.1 Read full RDP v3 text and save PDF into project.
  - [x] 0.2 Keep v2 live app as read-only archive; new v3 project folder created.
  - [ ] 0.3 Export/reconcile all v2 browser backups (in user's browsers; cannot be done from Termux).
  - [ ] 0.4 Collect auditor/owner approvals: GSTIN, address, state, HSN, rates, prices, opening balances.
  - [ ] 0.5 Choose/finalize cloud host credentials (Supabase or equivalent).
- [ ] 1. Cloud foundation (code done; cloud execution pending credentials)
  - [x] 1.1 React+TS+Vite PWA scaffold with responsive glacier design.
  - [x] 1.2 Auth: cloud email/password + local demo owner setup, role claims, 5-try/5-min lockout.
  - [x] 1.3 Data adapter: Supabase adapter + localStorage demo fallback.
  - [x] 1.4 PostgreSQL schema: org, identity, masters, docs, stock, manufacturing, QC, delivery, accounts, governance.
  - [x] 1.5 RLS policies + role gates + audit triggers in schema file.
  - [x] 1.6 Backup/restore screens + JSON/CSV/Excel/print export pack.
- [ ] 2. Masters/billing
  - [x] 2.1 Company/tax/invoice series setup UI and config storage.
  - [x] 2.2 Products, units/conversions, price lists, customers, suppliers.
  - [x] 2.3 Quotations → orders → invoices/challans → returns.
  - [x] 2.4 Receipts, statements and A4 print/PDF via browser dialog.
  - [x] 2.5 A4 GST tax invoice + 80 mm thermal receipt (per-row print buttons in Invoices).
  - [x] 2.6 Posting: stock issue + customer receivable + audit + idempotency reference.
- [ ] 3. Purchase/inventory
  - [x] 3.1 PO → GRN → bill; direct bill; purchase returns.
  - [x] 3.2 Supplier payments, ledger entries and register.
  - [x] 3.3 Stock ledger, batches/expiry, counts/adjustments, negative-stock guard.
  - [ ] 3.4 Automated FEFO dispatch suggestion and override-reason workflow.
  - [x] 3.5 Reorder alerts and stock valuation view.
- [ ] 4. Production/QC
  - [x] 4.1 BOM/recipe, production plans, batches, consumption, rejects registers.
  - [x] 4.2 QC tests, hold/release/reject and batch status update on approval.
  - [x] 4.3a Attachment-based lab reports, supplier bill scans, POD photos, expense proofs (local compressed demo + private Storage path).
  - [ ] 4.3b Full standard-vs-actual costing policy (still pending).
- [ ] 5. Delivery/accounts
  - [x] 5.1 Dispatch, driver/vehicle, POD, returnables registers.
  - [x] 5.2 Cash/bank, expenses, journals, ledgers, capital/drawings, fixed assets.
  - [x] 5.3 Reports: sales, purchase, stock, GST working registers + auditor Excel pack.
  - [ ] 5.4 Approved P&L and balance sheet (indicative only until opening balances are confirmed).
  - [x] 5.5 Month lock/reopen module with reason field.
- [ ] 6. Migration/launch
  - [x] 6.1 Import JSON backup into staging-style local adapter with rejected-row count.
  - [ ] 6.2 Reconcile v2 counts/totals/balances; owner + accountant sign-off.
  - [ ] 6.3 Security review, restore drill, cloud production deploy, training note.

## Key decisions
- New repo/folder `~/glacier-erp-v3`; v2 repo stays live as read-only archive at `https://smartbooksbasha-svg.github.io/glacier-water-solutions/`.
- Backend = Supabase (managed Postgres + Auth + RLS + Storage) as the documented equivalent of Node+TS REST API; no secrets in frontend.
- App works in local demo mode before credentials are entered; cloud setup is entered in-app (URL + anon key only).
- Money = integer paise everywhere; display with Indian formatting.
- Stock = opening + posted inward − posted outward; never direct balance overwrite.
- v3 live URL: `https://smartbooksbasha-svg.github.io/glacier-erp-v3/`.

## Verification record
- `npm test`: 22/22 green (calc, posting/reversal/idempotency, UI login/nav/roles, A4/80 mm invoice print, attachment fields + file input).
- `npm run build`: green, hashed chunks emitted.
- Live assets verified 200: `/`, `/index.html`, JS/CSS chunks, `/manifest.webmanifest`, `/sw.js`, `/fonts.css`, fonts, icons, `/RDP-v3.0-source.pdf`.
- PostgreSQL schema file is written but NOT executed (no Supabase credentials supplied).

## NOW
Invoice print (A4 GST + 80 mm) and attachment upload are implemented and verified locally. Waiting on external inputs for full go-live: Supabase URL + anon key, auditor approvals, v2 browser backup exports, owner/accountant reconciliation sign-off. Next code items: FEFO dispatch suggestion, full costing policy, mobile quick actions.
