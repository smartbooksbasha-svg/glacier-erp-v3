# Glacier Water Solutions ERP v3.0 - Full RDP and Build Record

**Project:** Glacier Water Solutions - packaged drinking water manufacturer, sole proprietorship.
**Document:** Full Requirements and Development Plan, combining the supplied RDP v3.0 with the implemented build record.
**Date:** 25 November 2026.
**Status:** Cloud-backed ERP built and running in demo mode; Supabase schema executed; cloud setup reported complete; owner row, approvals and migration sign-off still pending.
**Prepared for:** Owner, accountant, GST auditor and developer.

## 1. Executive summary

Glacier Water Solutions ERP v3.0 is a responsive, cloud-backed workplace for daily water factory operations. It combines simple My BillBook style billing with traceable inventory, production, quality, delivery and accounts.

The owner supplied an 8 page RDP v3.0 and asked for the complete website to be built. The earlier RDP v2.0 described a static local-first PWA on GitHub Pages. V2 remains live as a read-only archive. V3 uses a new repository and a new live URL so the archive is not overwritten.

The current build is a React, TypeScript and Vite PWA with a managed Supabase backend. Supabase provides the shared PostgreSQL database, authentication, row level security and private file storage that the RDP asked for in a Node and TypeScript REST API. The app also runs in local demo mode before cloud credentials are entered.

Cloud status as of this document: the final project URL is verified, the publishable key matches the project, the full SQL schema has been executed, and the owner reported that Admin to Cloud setup is complete. The remaining work is to confirm the owner authentication user and owner row, collect auditor approvals, reconcile v2 browser backups, complete security and restore tests, and hand over training.

## 2. Source RDP baseline and project decision

This plan is based on the supplied 17 page RDP v2.0, the owner decisions in v3.0, and the implementation completed on 25 November 2026.

### 2.1 Decisions carried into v3

- Database: cloud-hosted shared database.
- Platform: responsive website for mobile and desktop.
- Scope: complete water manufacturing ERP plus My BillBook style billing.
- Business structure: sole proprietorship.
- Document date: 25 November 2026.

### 2.2 V2 baseline

- V2 was a static local-first PWA on GitHub Pages with records in browser localStorage, JSON backup and PDF, Excel and CSV exports.
- V2 reported 77 jsdom assertions and live asset checks. Those checks do not prove shared cloud storage, production security, GST compliance or successful data recovery.
- Migration must preserve every existing browser or device data set. Do not clear browser storage, uninstall the PWA or overwrite old data before export and reconciliation.
- GSTIN, registered address, state, HSN, tax rates, prices and opening balances remain pending auditor and owner approval.

### 2.3 Implemented answer to the RDP

- New repository: `smartbooksbasha-svg/glacier-erp-v3`.
- Live app: https://smartbooksbasha-svg.github.io/glacier-erp-v3/
- V2 archive: https://smartbooksbasha-svg.github.io/glacier-water-solutions/
- Backend: Supabase managed PostgreSQL, Auth, RLS and Storage.
- Frontend: React, TypeScript, Vite PWA.
- Cloud project: `https://dkezkckykridrvtjbhzb.supabase.co`, project ref `dkezkckykridrvtjbhzb`.
- The publishable key is public by design and is stored outside the repository. No service role or secret key is used in the frontend.

## 3. Scope, goals and exclusions

### 3.1 Goals

- One shared source of truth across authorized devices and users.
- Accurate bottle and case stock from a movement ledger, not manually edited balances.
- Production batch tracking, raw material usage, rejects, expiry and quality release.
- Customer and supplier balances, cash, bank, expenses, capital, drawings and financial reports.
- Auditor-ready exports with clear status and approval history.

### 3.2 Not in initial launch

- Native mobile app.
- Payment gateway.
- Automatic bank feeds.
- Direct GST portal filing.
- E-invoice and e-waybill APIs.
- Multi-company SaaS.
- Advanced route optimization.

## 4. Users and permissions

Permissions are enforced by the backend for every view, create, edit, approve, post, cancel and export action. Hiding a menu item is not security.

| Role | Access | Restrictions |
| --- | --- | --- |
| Owner or Super Admin | All modules, settings, users, approvals, month close and reopen, backups and audit | All actions logged, no silent deletion |
| Admin or Operations | Sales, purchase, inventory, production, QC, delivery, expenses and operational reports | No owner or security administration |
| Accountant | Invoices, receipts, payments, ledgers, GST working reports, reconciliation and exports | No user administration unless explicitly granted |
| Sales Staff | Customer lookup, quotations, orders, sales entry and permitted collections | No cost, profit, capital or full accounts by default |
| Production Staff | Production batches, material use, QC and assigned stock tasks | No sales pricing or financial ledgers by default |
| Read-only Auditor | View approved registers, ledgers, attachments and exports | Cannot create, edit, post, cancel or restore |

The implemented app uses these six roles: owner, admin, accountant, sales, production and auditor. The owner email is fixed as `smartbooksbasha@gmail.com`.

## 5. Navigation and UI

| Navigation | Screens |
| --- | --- |
| Overview | Dashboard, alerts, tasks, daily closing |
| Sales | Invoices, quotations, sales orders, challans, returns, receipts, statements |
| Purchase | Purchase orders, goods receipt, bills, purchase returns, supplier payments |
| Inventory | Finished goods, raw materials, stock ledger, counts, adjustments, batches, expiry |
| Manufacturing | Production plan, BOM or recipe, batches, consumption, rejects, costing |
| Quality | Water tests, QC approvals, non-conformance, batch hold and release |
| Delivery | Dispatch, driver and vehicle, delivery status, proof of delivery, returnables |
| Accounts | Cash, bank, expenses, journals, ledgers, capital, drawings, fixed assets |
| Reports | Sales, purchase, stock, production, QC, delivery, GST working, P and L, balance sheet |
| Administration | Users, roles, company, tax setup, invoice templates, audit, backup |

UI requirements:

- Mobile-first responsive layout, usable at 360 to 375 px widths without page-level horizontal overflow.
- Desktop sidebar and mobile drawer or bottom quick actions.
- Search, filters and keyboard-friendly invoice entry.
- Large touch targets, visible focus states, clear error messages and confirmation before posting.
- Status labels: Draft, Pending Approval, Posted, Part-paid, Paid, Cancelled, Returned and Held.

Implemented UI notes:

- Glacier cool slate and cyan design, Space Grotesk and Work Sans, inline Lucide style SVG icons.
- Desktop sidebar, mobile drawer and a role-aware mobile quick action bar.
- Module screens are generated from the shared module registry so all groups are reachable and consistent.

## 6. Masters and product rules

| Product | Default pack | Stock base |
| --- | --- | --- |
| 300 ml PET | 30 bottles per case | Bottle and case |
| 500 ml PET | 24 bottles per case | Bottle and case |
| 1000 ml PET | 24 bottles per case | Bottle and case |

- Product master supports finished goods, raw materials, packaging, consumables, services and non-stock items.
- Units and conversions are configurable and versioned. Case quantity converts exactly to bottles and displays cases plus loose bottles.
- MRP, sale price, purchase price, HSN and GST rate are not hard-coded. They must be maintained with effective dates and approval status.
- Retail, wholesale, distributor and customer-specific price lists with controlled discounts are part of the target design.

Implemented status:

- Default conversion rules are in the calculation layer.
- Configurable price lists and effective-dated price approval remain a future refinement; current company tax and price settings are in Administration.

## 7. Sales, billing and customer management

- Quotation to sales order to invoice or challan workflow, converting documents without retyping items.
- Invoice fields: unique series and number, date, customer, billing and shipping address, GSTIN if applicable, place of supply, item, HSN, unit, quantity, rate, discount, taxable value, tax breakup, freight, charges, round-off and grand total.
- Payment modes: cash, UPI, bank, cheque, credit and split payments. Part payment, due dates and receipt allocation.
- Draft invoices do not affect stock or accounts. Posting atomically creates stock issue and customer receivable or payment entries.
- Print A4 invoice and 80 mm thermal receipt, plus PDF download, share and invoice history.
- Sales returns, credit notes, customer statements, outstanding aging, overdue reminders and customer rate history.
- Invoice number is never reused after cancellation. Cancellation creates a reversal and reason; posted records are not silently deleted.

Implemented status:

- Sales modules: customers, quotations, sales orders, challans, invoices, receipts, returns and credit notes.
- Integer paise GST math computes taxable value, CGST and SGST or IGST, freight, round-off and grand total.
- Posting uses stock issues, ledger entries, posting references and reversals.
- A4 GST tax invoice and 80 mm thermal receipt print are implemented in `src/lib/printDocs.ts`.

## 8. Purchase and supplier management

- Purchase order to goods receipt to supplier bill. Direct bill entry is allowed for small purchases.
- Capture supplier bill number and date, GSTIN, items, unit, quantity, rate, discount, freight, tax and total.
- Track partial receipts and prevent duplicate stock posting when PO, GRN and bill are linked.
- Attach supplier invoice scans or PDFs, maintain supplier ledger, due dates, payment allocation and aging.
- Purchase return or debit note records returned quantity, reason, supplier credit and stock reversal.

Implemented status:

- Purchase modules: suppliers, purchase orders, GRN, bills, payments, returns and debit notes.
- Attachment fields are ready for bill scans and private Storage paths.
- PO does not receive stock and GRN does not post accounts by themselves; stock posting happens through defined movements.

## 9. Inventory and stock control

- Separate finished goods, raw materials, packaging, damaged, expired, QC held stock and optional locations.
- Immutable stock ledger movements: opening, purchase receipt, production receipt, sale issue, material use, return, transfer, damage, expiry and adjustment.
- Current stock is opening plus posted inward movements minus posted outward movements. No direct balance overwrite.
- Physical stock count workflow: count sheet, variance, reason, approval and adjustment.
- Batch-wise stock with manufacturing and expiry dates, QC status, reorder alerts, stock valuation and stock aging.
- FEFO dispatch suggestion for expiry controlled stock. Override requires reason and permission.
- Negative stock is blocked by default. Controlled exception is only by authorized owner with audit trail.

Example conversion:

| Product | Cases | Loose bottles | Total bottles |
| --- | --- | --- | --- |
| 300 ml | 100 | 15 | 3015 |
| 500 ml | 80 | 10 | 1930 |
| 1000 ml | 50 | 12 | 1212 |

Implemented status:

- Stock is derived from posted movements in `src/lib/store.ts`.
- `src/lib/fefo.ts` suggests earliest-expiry QC released batches and calculates dispatch quantity from cases plus loose bottles.
- Dispatch errors are explicit: select a batch, only QC released batches can be dispatched, and non-FEFO-first override needs a reason.

## 10. Manufacturing and production

- Production plan by date, shift, product and target output.
- Batch record includes batch number, line or shift, operator, start and end time, good output, rejected output, rework and notes.
- BOM defines expected bottles, caps, labels, cartons and other material per case or unit.
- Record actual consumption, variance, wastage and reason. Compare standard versus actual.
- Posting a batch debits raw materials and credits good finished goods. Rejected output is segregated and not saleable until disposition.
- Prevent duplicate posting. Posted batch edits require reversal and repost with approval.
- Dashboard: planned versus actual output, yield, rejection, material variance and output by size or shift.
- Costing distinguishes direct material, labour, electricity and utilities, rent and overhead. Estimated and actual costs are clearly labelled. Accountant approves costing policy.

Implemented status:

- Manufacturing modules: BOM, plans, batches, consumption, outputs, rejects and costing.
- `src/lib/costing.ts` computes standard and actual cost and produces P and L and balance sheet working papers.
- Variances feed totals only after approval; before that they are working papers.

## 11. Quality control and batch traceability

- Batch-wise test record: sample ID, date and time, parameter, measured value, unit, specification, result, tester and reviewer.
- Configurable quality parameters may include TDS, pH and other tests required by the approved quality plan. These alone do not establish regulatory compliance.
- Batch statuses: Awaiting QC, Released, On Hold and Rejected. Only released batches may be dispatched if company policy requires.
- Attach lab reports, record equipment calibration or service, non-conformance and corrective action.
- Trace dispatched stock back to production batch and raw material lots where available.
- Required tests, limits, licences and label declarations must be confirmed by the appropriate compliance professional.

Implemented status:

- Quality modules: tests, results, approvals, non-conformance and corrective actions.
- QC approval is a hard release gate; FEFO dispatch will not select a batch that is not released.
- Attachment fields support lab reports with compressed local demo files and private Storage paths for cloud.

## 12. Delivery and distribution

- Create dispatch from order, invoice or challan. Reserve stock and prevent dispatch above available quantity.
- Record delivery date and address, cases and loose bottles, driver, vehicle, route, delivery status and charges.
- Statuses: Pending, Packed, Dispatched, Delivered, Part-delivered, Failed and Returned.
- Capture proof of delivery by signature, photo or file, plus collection and delivery expenses.
- If reusable crates or empty bottles are used, maintain customer-wise issued, returned and deposit balances.
- Daily delivery sheet and route, driver or salesperson-wise sales and collection reports.

Implemented status:

- Delivery modules: dispatches, drivers, vehicles, delivery events, POD and returnables.
- POD attachment field is implemented.
- Dispatch posting checks stock, batch, QC status and FEFO override reason.

## 13. Accounts and financial controls

- Customer and supplier sub-ledgers linked to invoices, credit or debit notes, receipts and payments.
- Cash book, bank book, transfers, deposits, withdrawals, opening and closing balances and bank reconciliation by CSV statement import.
- Expense vouchers with category, payee, date, mode, tax fields where relevant and proof attachment.
- Proprietor capital, additional capital and drawings are separate from business expenses.
- Fixed asset register with machinery or equipment, purchase date, cost, evidence, location, useful life, depreciation policy and disposal.
- Journal vouchers with debit and credit validation, narration, reference and approval.
- Trial balance, P and L, balance sheet and management cash summary depend on correct opening balances and accounting setup.
- Month close locks postings. Authorized reopen requires reason and audit entry.

Implemented status:

- Accounts modules: cash, bank, expenses, journals, ledgers, capital, drawings, assets and depreciation.
- Month lock is implemented with owner-only controls.
- Financial statements are working papers until opening balances and auditor setup are approved.

## 14. GST and auditor handover

- Company GSTIN, legal name, address, state, place of supply, HSN or SAC and tax rates are configurable master data.
- Support CGST and SGST or IGST according to auditor-approved place-of-supply rules. Support tax-inclusive and tax-exclusive pricing.
- Maintain sales, purchase, credit and debit note registers, tax summaries and input-tax working records.
- Capture supplier GSTIN, invoice data and ITC eligibility or reconciliation status for accountant review. Never assume all purchase tax is eligible ITC.
- Auditor export pack: sales, purchases, expenses, HSN summary, tax summary, ledgers and attachment index.
- Optional GSTR-2B import and matching workflow with matched, unmatched and review-needed status.
- No claim of GST portal filing, e-invoice or e-waybill unless separately integrated, tested and approved.

Important note: GST rates, HSN, ITC eligibility, registration particulars, invoice format and statutory applicability must be approved by the company GST auditor. Reports are working papers, not tax advice.

Implemented status:

- Tax math handles inclusive and exclusive prices, CGST and SGST versus IGST, round-off and reversals.
- Reports and auditor export pack are implemented.
- GSTIN, address, HSN and rates are still unapproved; the app must visibly mark these as pending until sign-off.

## 15. Reports and dashboard

| Area | Reports |
| --- | --- |
| Sales | Daily and monthly, item, customer and salesperson-wise, returns, invoice register, payment modes |
| Purchase | Supplier, item and tax-wise, pending PO and GRN, purchase returns |
| Inventory | Current stock, movement ledger, valuation, batch and expiry, damage, reorder, count variance |
| Production | Daily and shift output, batch register, yield, rejects, consumption and variance |
| Quality | Test register, batch release or hold or reject, exceptions, corrective actions |
| Delivery | Dispatch, pending delivery, route and driver, POD, returns and crate balances |
| Accounts | Cash and bank, receipts and payments, aging, expenses, journals, trial balance, P and L, balance sheet |
| GST working | Registers, tax summary, HSN, credit and debit notes, 2B matching |
| Management | Product margin, month comparison, outstanding, cash position and operational KPIs |

Common requirements: date filters, search, sorting and drill-down to source transaction. PDF, XLSX and CSV exports must match on-screen totals. The dashboard is permission-aware; staff must not see cost or profit figures without permission.

Implemented status: register reports, GST working, stock, costing and financial statements are in `src/pages/Reports.tsx`; JSON, CSV, Excel XML pack and print export are implemented.

## 16. Technical architecture

| Layer | Target requirement | Implemented response |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, responsive PWA, accessible UI | React, TypeScript, Vite PWA with glacier design and role-aware shell |
| Backend | Node and TypeScript REST API or documented equivalent | Supabase managed Postgres, Auth, RLS and Storage |
| Database | Managed cloud PostgreSQL with constraints, indexes, migrations and transactions | `src/lib/schema.sql` with tables, enums, constraints, triggers and RLS |
| Authentication | Server-managed sessions or secure tokens, strong hashing | Supabase Auth, local demo fallback, lockout after failed attempts |
| Files | Private object storage with permission-checked access | Private Storage path plus compressed local demo files |
| Hosting | HTTPS frontend and backend, staging and production | GitHub Pages frontend; cloud backend on Supabase |
| Backup | Automated encrypted database backups, retention and restore drills | Supabase backups plus app JSON, CSV, Excel and auditor pack exports; restore drill pending |
| Monitoring | Error logs, health checks and database monitoring | App health check and Supabase project logs; production monitoring pending |

Rules:

- Browser is a client only. Server validates totals, tax, stock, balances, permissions and audit writes.
- Invoice posting and stock or account entries use a database transaction. All succeed or all roll back.
- Idempotency and unique posting references prevent duplicate submissions on weak mobile networks.
- Secrets and database credentials must never be placed in frontend code or public repositories.
- Timestamps are stored consistently and displayed in India local time, Asia and Kolkata.

Honest limitation: the deployed frontend is static GitHub Pages, so browser-side calculation exists for demo mode. The RDP wants server-side calculation as the production authority. Supabase RLS and constraints are in place; full server-side business-rule functions are a production hardening item.

## 17. Core database entities

| Domain | Indicative entities |
| --- | --- |
| Organization | company, financial year, locations, settings, invoice sequences |
| Identity | users, roles, permissions, user roles, sessions, login events |
| Masters | products, units, conversions, price lists, customers, suppliers, expense categories, tax codes |
| Sales | quotations, orders, invoices, lines, receipts, allocations, returns, credit notes |
| Purchase | purchase orders, goods receipts, bills, lines, supplier payments, returns, debit notes |
| Inventory | locations, openings, stock movements, counts, adjustments, batches, lots |
| Manufacturing | BOMs, BOM lines, plans, batches, consumptions, outputs, scrap |
| Quality | QC tests, results, approvals, non-conformance, corrective actions, attachments |
| Delivery | dispatches, dispatch lines, delivery events, vehicles, drivers, POD, returnables |
| Accounting | accounts, journals, journal lines, cash and bank, reconciliations, fixed assets, depreciation |
| Governance | audit logs, attachments, month locks, backup logs, import jobs, export jobs |

Every transaction needs a stable ID, business date, timestamps, creator, status, reference and audit trail. Use foreign keys and unique constraints for invoice numbers and posting references.

## 18. Security, privacy and resilience

- HTTPS, secure cookies, CSRF protection where applicable, rate limits and login throttling.
- Argon2id or bcrypt with suitable parameters. Never store plaintext passwords.
- Server-side authorization on every API endpoint, least-privilege roles and access review.
- Append-only audit log for normal users: actor, action, record, time, before and after summary and reason.
- Encrypt backups and private attachments. Define retention and restricted download access.
- Daily backup and periodic restore test. Document recovery point and time objectives.
- Poor network handling must not display unconfirmed drafts as posted. Retries must not duplicate entries.
- Document privacy, retention, offboarding and incident response.

Implemented status:

- Supabase RLS policies are role-aware.
- Login lockout is implemented.
- Publishing and audit logs are implemented.
- Restore drill, production monitoring and formal incident response are pending.

## 19. Migration from RDP v2

- Export JSON backup from every browser or device containing business records. Export Excel and CSV registers too.
- Keep original exports read-only in at least two separate locations. Do not clear browser data or uninstall the old PWA before validation.
- Use staging. Inspect schema version, duplicate IDs, missing fields, dates and invoice number conflicts.
- Import masters first, then opening balances and historical transactions in controlled sequence.
- Reconcile invoice counts and totals, purchase totals, customer and supplier balances, stock by SKU, cash and bank against source exports.
- Import opening stock as dated movements. Avoid double-counting with historical transactions.
- Record source device, export time, import batch, rejected rows and mapping decisions.
- Owner and accountant sign migration reconciliation before cutover. Keep the old local build as a read-only archive.

V2 explicitly states that data is per browser and JSON backup is the portable copy. A live GitHub Pages URL or successful asset check does not mean data is stored in a shared cloud database.

## 20. Delivery phases and release gates

| Phase | Deliverables | Exit gate |
| --- | --- | --- |
| 0 Discovery and protection | Inspect code and data, export backups, confirm rules and auditor setup | Scope approved and backups verified |
| 1 Cloud foundation | Cloud DB, API, auth, roles, audit, migrations, backup and restore | Two devices share test data and restore works |
| 2 Masters and billing | Company and masters, price lists, quotations, orders, invoices, receipts, print | Invoice and payment tests reconcile |
| 3 Purchase and inventory | PO, GRN, bills, returns, ledger, counts, batches and alerts | Stock reconciles for all tested movements |
| 4 Production and QC | BOM, batches, consumption, rejects, QC release and traceability | Input and output and batch traceability pass |
| 5 Delivery and accounts | Dispatch, POD, returnables, expenses, cash, bank, journals, assets, reports | Ledgers and month close reconcile |
| 6 Migration and launch | Import, reconciliation, training, security review, production deployment | Owner and accountant sign-off and restore test |

Current phase: foundation and implementation complete in demo mode. Phase 0 backup protection and Phase 1 cloud foundation are partly done. Full release gates remain pending because migration, two-device test, restore drill and approvals are not complete.

## 21. Testing and acceptance checklist

- Create an invoice on one device and see the same posted record on another authorized device.
- Concurrent invoice creation cannot duplicate invoice numbers or oversell stock.
- Auditor-approved test cases verify discount, tax inclusive and exclusive, CGST and SGST, IGST, round-off, split payments and returns.
- Case and bottle conversion is exact and handles loose bottles without silent rounding.
- Opening plus posted inward minus posted outward equals closing stock by SKU, location and batch.
- Production consumption, good output, rejects and batch status reconcile.
- Cancellation and returns reverse balances correctly and preserve original history.
- Customer and supplier ledgers reconcile to control accounts. Cash and bank opening plus movements equals closing.
- Staff cannot access restricted cost, profit or settings endpoints by direct API request.
- Network retries do not double-post. Failed database transactions roll back.
- Backup restores into clean staging and record counts and totals are checked.
- PDF, XLSX and CSV totals match filtered screen results. A4 and 80 mm print tested.
- Core screens work at 375 px mobile width.

Current automated evidence:

- V2: 77 jsdom assertions green.
- V3: 27 vitest and jsdom assertions green in six suites.
- Build: `tsc --noEmit` and `vite build` green.
- Live asset checks: index, CSS, JS chunks, manifest, icons and service worker returned 200.
- These tests do not replace cloud acceptance, migration sign-off or auditor approval.

## 22. Operational controls

- Define maker and approver for invoices, purchases, stock adjustments, journals and month close.
- Daily close: cash count, collections, delivery returns, stock exceptions and pending orders.
- Weekly review: overdue receivables, supplier dues, low stock, expiry and production variance.
- Month end: bank and cash reconciliation, customer and supplier ledgers, stock, GST working and journals.
- Manual adjustment needs reason and reference. High-value adjustment requires approval.
- Train users on demo data before production access.

## 23. Go-live information required

| Input | Owner and accountant to provide |
| --- | --- |
| Company identity | Exact legal name, registered address, state, GSTIN, contacts and logo |
| GST setup | Approved HSN or SAC, rates, tax rules, invoice series and statutory format |
| Opening balances | Stock by SKU and batch, raw materials, customer and supplier balances, cash, bank, capital and assets |
| Commercial setup | Prices, customer rates, discounts, payment terms and credit limits |
| Manufacturing | BOM or standard consumption, shifts, reject reasons, material units and overhead policy |
| Quality | Required tests, ranges, release authority, record retention and applicable compliance |
| Users | Names, roles, permissions and recovery contacts |
| Hosting | Cloud provider, budget, data region, backup retention and support contact |

None of these are approved in this document. They must be supplied and signed before production reliance.

## 24. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Loss of v2 local data | Export and validate all browser backups, retain a read-only archive |
| Incorrect GST setup | Auditor approval and settings visibly marked unapproved until sign-off |
| Duplicate or partial posting | Database transactions, unique references and idempotency |
| Poor connectivity | Draft-safe UI and server-confirmed posting |
| Unauthorized access | Server-side permissions, secure sessions and audit alerts |
| Wrong opening balances | Signed opening balance sheet and reconciliation before launch |
| Backup failure | Automated backup plus restore drills |

## 25. Developer handover

- Complete source code, repository access, setup instructions and deployment guide.
- Database schema, migrations, seed or demo data and API documentation.
- Staging and production configuration with secrets managed outside source code.
- Role matrix, audit specification, backup and restore runbook and incident procedure.
- Automated tests for billing, tax calculations, stock, production, permissions and migration.
- A4 and 80 mm invoice templates, report templates and PDF, XLSX and CSV exports.
- Migration scripts and reconciliation report from v2.
- Owner, admin and accountant user guides, training and support plan.
- Known limitations, third-party dependencies, maintenance and support ownership.

## 26. Implemented build record

### 26.1 Repositories and deployment

- V3 repository: `https://github.com/smartbooksbasha-svg/glacier-erp-v3`.
- V3 live app: https://smartbooksbasha-svg.github.io/glacier-erp-v3/
- V2 archive repository: `https://github.com/smartbooksbasha-svg/glacier-water-solutions`.
- V2 live archive: https://smartbooksbasha-svg.github.io/glacier-water-solutions/
- Deployment: GitHub Actions workflow to Pages, using `npm ci`, build and Pages artifact upload.
- Vite base path is relative so the app works under the repository subpath.
- V3 service worker cache is `gws-v3-2`.

### 26.2 Foundation

- React, TypeScript and Vite project with PWA manifest, icons, self-hosted fonts and offline service worker.
- Six roles and a permission-aware shell.
- More than 40 ERP modules driven by a shared registry in `src/lib/modules.ts`.
- Generic module list, form, post, cancel, delete and export UI in `src/pages/ModulePage.tsx`.
- Admin screen for cloud setup, company and tax setup, users, audit, backups, approvals, reconciliation, health check and launch note.
- Local-first demo fallback with the same adapter API as the Supabase adapter.

### 26.3 Money and stock rules

- All money is stored as integer paise. Display uses Indian formatting.
- GST math computes inclusive and exclusive taxes, CGST and SGST or IGST, freight, round-off and grand total.
- Stock is never stored as a directly edited balance. Current stock is opening plus posted inward movements minus posted outward movements.
- Posting and cancellation use stock movements, ledger entries, posting references and reversal records.
- Negative stock is blocked on dispatch.
- Case and bottle conversion uses exact integers: 300 ml is 30 bottles per case, 500 ml and 1000 ml are 24 bottles per case.

### 26.4 FEFO, QC and costing

- `src/lib/fefo.ts` suggests the earliest-expiry QC released batch.
- Dispatch must select a batch. Only released batches can post. Non-FEFO-first choice needs an override reason.
- `src/lib/costing.ts` computes standard and actual cost, variance and working P and L and balance sheet statements.
- Costs and statements are marked as working papers until approvals are complete.

### 26.5 Print and attachments

- `src/lib/printDocs.ts` renders A4 GST tax invoice and 80 mm thermal receipt from invoice rows and company config.
- `src/lib/upload.ts` compresses images to 1280 px JPEG at quality 0.72, enforces a 1.5 MB cap, and writes file name and private Storage path fields.
- Attachment fields exist for supplier bills, QC lab reports, delivery POD and expense proof.

### 26.6 Cloud setup and verification

- Final Supabase URL: `https://dkezkckykridrvtjbhzb.supabase.co`.
- Project ref: `dkezkckykridrvtjbhzb`.
- Health verification: `GET /auth/v1/health` returned 200 with the stored publishable key.
- Full SQL schema was executed in Supabase SQL Editor. The editor returned `Success. No rows returned`, which is normal for DDL.
- REST verification after execution: core tables returned 42501 or 400 rather than 404, which means they exist and anon access is correctly restricted by grants or column selection.
- The owner reported Admin to Cloud setup complete.
- The app health check was fixed so anon 401 or 42501 from `app_users` is shown as schema reachable with RLS active, not as a failure.
- Raw publishable key is kept in a private credentials file with restricted permissions and is never written to the repository or this document.

### 26.7 Verification evidence

- V3 tests: 27 passed in 6 files.
- Build: TypeScript check and Vite build green.
- Latest production JS: `assets/index-CZ6TTNj4.js`.
- Latest production CSS: `assets/index-DZBmw4NL.css`.
- Service worker cache: `gws-v3-2`.
- Live check: index, CSS, JS chunks and service worker returned 200 after deployment.

### 26.8 Commit record

- `0319a82` Build Glacier ERP v3 foundation from RDP.
- `e4a1750` Record v3 verification and pending gates.
- `4024819` Add GST invoice print and attachment uploads.
- `56e80e9` Complete remaining ERP pendings.
- `bd703ae` Record v3 pending-item verification.
- `92b936a` Verify final Supabase project and key.
- `6b39c09` Fix cloud health check and bump cache.

## 27. Current blockers and next actions

### 27.1 Blockers

- Owner authentication user and `app_users` owner row are not yet confirmed.
- GSTIN, legal address, state, HSN, rates, prices, MRP and opening balances are not approved.
- V2 browser backups are not yet exported and reconciled into v3.
- Two-device cloud test is not complete.
- Restore drill, security review and production monitoring are not complete.
- Training and production cutover are not complete.

### 27.2 Immediate next actions

- Confirm the owner user exists in Supabase Auth and that `public.app_users` has an owner row for `smartbooksbasha@gmail.com`.
- Run the app health check and confirm Cloud config, Supabase API and PostgreSQL schema show PASS.
- Collect owner and auditor approvals for all go-live inputs.
- Export v2 JSON, Excel and CSV backups from every device and keep two read-only copies.
- Import masters, opening balances and historical transactions into staging.
- Reconcile counts and totals with owner and accountant sign-off.
- Run security review, restore drill, two-device test and training.
- Only then perform production cutover.

## 28. Final product definition and approvals

Glacier Water Solutions ERP v3.0 is a cloud-backed, secure, multi-user, responsive water manufacturing management system. It combines My BillBook style billing simplicity with traceable production, QC, stock, delivery and accounting.

No live migration or statutory reliance should begin until reconciliation, security testing, backup restoration and auditor approvals are complete.

| Approval | Name or signature | Date |
| --- | --- | --- |
| Owner or Proprietor | Pending | Pending |
| Accountant or GST Auditor | Pending | Pending |
| Developer or Technical Lead | Pending | Pending |

Document basis: supplied RDP v3.0, supplied RDP v2.0, owner decisions, implemented code, verification records and cloud setup record dated 25 November 2026.
