# Glacier Water Solutions ERP v3

## What
Cloud-ready responsive ERP for a packaged water manufacturer. Built from RDP v3.0 (8-page PDF in repo). Replaces the earlier static v2 PWA as the active target; v2 remains a read-only archive.

## Architecture
- React + TypeScript + Vite PWA, deployed to GitHub Pages via Actions.
- Supabase (managed PostgreSQL + Auth + RLS + Storage) is the documented backend equivalent to the RDP's Node+TS REST API; anon key is public-by-design, never a service key.
- Local-first demo fallback: if cloud config is absent, data is stored in browser localStorage with the same adapter API, so the app works before credentials.
- `src/lib/schema.sql` contains full tables, constraints, RLS policies, role checks and audit triggers.
- `src/lib/calc.ts` owns integer-paise GST math, case/bottle conversion and stock rules.
- `src/lib/modules.ts` defines all ERP modules and field schemas; `ModulePage.tsx` renders generic list/form/post/cancel UI for each module.
- `src/pages/Admin.tsx` handles cloud setup, company/tax setup, users, audit, backups and migration notes.

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
- Foundation build in progress. Check `TASK.md` for phase status.
- Blockers for full cloud go-live: Supabase URL + anon key, auditor approvals, v2 browser backup exports, owner/accountant sign-off.
