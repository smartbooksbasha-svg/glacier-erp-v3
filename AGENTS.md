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
- PostgreSQL schema in `src/lib/schema.sql` EXECUTED successfully on 2026-11-25 via Supabase SQL Editor (`Success. No rows returned` = normal for DDL); final URL + publishable key pair verified (`/auth/v1/health` 200).
- Blockers for full cloud go-live: owner row, auditor approvals, v2 browser backup exports, owner/accountant sign-off, security review/restore drill.
- Supabase anon key public-by-design hai; Project URL ke saath Supabase Dashboard → Project Settings → API se milta hai. Service_role key frontend me kabhi na daalein.
- 2026-11-25 FINAL VERIFIED PROJECT: Shan ne naye email account ka hosted URL `https://dkezkckykridrvtjbhzb.supabase.co` diya (ref `dkezkckykridrvtjbhzb`). Pehle `yipxzbgqtyvfllrpqehs` (Masjid), `rxllxpfkufcldhurwcpv` (DNS fail), `ymyqpehekotofaacipzl` (key 401) wale URLs ab ignore. Store publishable key is URL par `/auth/v1/health` → 200 (GoTrue v2.198.0) — key↔project match ho gaya. Raw key repo/AGENTS/vault me kabhi nahi; service_role frontend me kabhi nahi.
- Publishable/anon key se DDL nahi chalti; schema execute ke liye SQL Editor / DB password / Management API token chahiye.
- 2026-11-25 schema DONE + VERIFIED: user ne SQL text (raw URL nahi) SQL Editor me paste karke Run kiya; output `Success. No rows returned`. REST check: core tables → 42501 (exists, anon grant nahi) ya 400 (select column nahi), ab koi PGRST205 nahi.
- 2026-11-25 user report: "ok setup complete" — Admin → Cloud setup me final URL + publishable key save ho gayi. Owner auth user + `app_users` owner row ka alag se confirm lena hai; confirm hone tak cloud write test / go-live claim nahi karna.
- 2026-11-25 health check fix: `runHealth()` pehle anon Supabase client se `app_users` select karta tha → schema ke baad bhi false CHECK (policies `authenticated` ke liye hain). Ab `/auth/v1/health` + `/rest/v1/app_users` fetch karta hai; 401/42501 ko "schema reachable, RLS active" mana jata hai. Cache `gws-v3-2`. Tests 27/27, build green, commit `6b39c09`, live index + new JS + sw verified.
- 2026-11-25 user request: "iska pura RDP PDF mein do" — matlab poora Glacier ERP v3 RDP/development record PDF banana hai (RDP v3 source + jo kuch ab tak implement/verify/schema/cloud setup hua wo sab). Purana `RDP-v3.0-source.pdf` sirf source RDP hai; naya doc complete current-state RDP hona chahiye.
- 2026-11-25 pitfall: user ne raw GitHub URL ko SQL Editor me paste kar diya → `ERROR: 42601: syntax error at or near "https"`. Hamesha batao: raw link browser me kholo, Andar ka SQL TEXT copy karo, phir SQL Editor me paste karo; URL khud kabhi paste mat karo.
- 2026-11-25 (second key check, ab resolved): do purane `sb_publishable_…` keys purane account/project ki thin aur 401 deti thin. Final `dkezkckykridrvtjbhzb` project ke saath stored key 200 deti hai; purane refs ab ignore.
- 2026-11-25 (account clarification): Shan ne bataya purana `smartbooksbasha` Supabase account ka free limit khatam ho gaya tha, isliye usne ek **naye email account** se Supabase banaya. 401 ka matlab hai ki bheji gayi keys usi purane account/project ki hain; Connect dialog kholne se pehle naye email account se login hona zaroori hai. Purana smartbooksbasha project ab Glacier ke liye use mat karna.
- Check `TASK.md` for exact done vs pending acceptance items.
