# Glacier Water Solutions ERP v3

## What
Cloud-ready responsive ERP for a packaged water manufacturer. Built from RDP v3.0 (8-page PDF in repo). Replaces the earlier static v2 PWA as the active target; v2 remains a read-only archive.

## Architecture
- React + TypeScript + Vite PWA, deployed to GitHub Pages via Actions.
- Supabase (managed PostgreSQL + Auth + RLS + Storage) is the documented backend equivalent to the RDP's Node+TS REST API; anon key is public-by-design, never a service key.
- Local-first demo fallback: if cloud config is absent, data is stored in browser localStorage with the same adapter API, so the app works before credentials.
- `src/lib/schema.sql` contains full tables, constraints, RLS policies, role checks and audit triggers.
- `src/lib/calc.ts` owns integer-paise GST math, case/bottle conversion and stock rules.
- `src/lib/printDocs.ts` renders A4 GST tax invoices and 80 mm thermal receipts from invoice rows + company config.
- `src/lib/upload.ts` compresses images and saves file fields locally with a private Storage path for later Supabase upload.
- `src/lib/fefo.ts` suggests earliest-expiry QC-released batches and calculates dispatch qty from cases + loose bottles.
- `src/lib/costing.ts` computes standard-vs-actual batch cost; only approved variances feed P&L / balance-sheet working papers.
- `src/lib/modules.ts` defines all ERP modules and field schemas; `ModulePage.tsx` renders generic list/form/post/cancel UI, file inputs, per-row invoice print buttons and FEFO dispatch suggestions.
- `src/pages/Admin.tsx` handles cloud setup, company/tax setup, users, audit, backups, approval register, reconciliation sign-off, health check and launch/training note.

## Commands
- `npm install` — install deps.
- `npm run build` — `tsc --noEmit && vite build` (must be green).
- `npm test` — vitest/jsdom smoke suite (must be green).
- Deploy: push to `main`; `.github/workflows/deploy.yml` builds and deploys to Pages.

## Decisions (dated)
- 2026-11-25: user ordered "ye RDP ka link bheja hai wo karo" — build RDP v3, not just save/read it.
- 2026-11-25: v2 static PWA stays live as archive; v3 gets a new repo/URL to avoid destructive overwrite.
- 2026-11-25: Supabase chosen as equivalent backend because no paid server/hosting credentials were supplied and Pages-only cannot satisfy shared cloud DB.

## State
- Foundation build complete and live in local demo mode at `https://smartbooksbasha-svg.github.io/glacier-erp-v3/`.
- 2026-11-25 follow-up: A4 GST invoice + 80 mm receipt and attachment upload added.
- 2026-11-25 "ji pendings sab kardu": FEFO + QC gate, costing + statements, approval/reconciliation/health UI and mobile quick-action bar added.
- `npm test`: 27/27 green. `npm run build`: green. Commit `56e80e9` pushed and live assets verified (`index-4mnuexMN.js`, `index-DZBmw4NL.css`).
- PostgreSQL schema is in `src/lib/schema.sql` but not executed; no Supabase credentials supplied.
- Blockers for full cloud go-live: Supabase URL + anon key (2026-11-25: Shan ne bataya anon key Khan ke paas hai), schema execution, owner row, auditor approvals, v2 browser backup exports, owner/accountant sign-off, security review/restore drill.
- Supabase anon key public-by-design hai; Project URL ke saath Supabase Dashboard → Project Settings → API se milta hai. Service_role key frontend me kabhi na daalein.
- 2026-11-25: Shan ne pehle Supabase ref `yipxzbgqtyvfllrpqehs` diya (Masjid Kidmat Records project, `public.app_users` collision risk). Baad me naya Glacier project ref `rxllxpfkufcldhurwcpv` diya → Project URL `https://rxllxpfkufcldhurwcpv.supabase.co`. Isi naye project ka use karna hai; purana ref use na karein. Anon/public key abhi Khan ke paas hai; service_role frontend me kabhi nahi.
- Check `TASK.md` for exact done vs pending acceptance items.
