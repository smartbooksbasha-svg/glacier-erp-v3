-- Glacier Water Solutions ERP v3 — Supabase / PostgreSQL foundation
-- Run in Supabase SQL Editor. Safe to re-run (idempotent where possible).
-- Backend equivalent of the RDP Node+TS REST API: server-side auth, RLS, audit, constraints.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('owner','admin','accountant','sales','production','auditor');
exception when duplicate_object then null; end $$;

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null default '',
  phone text,
  role public.app_role not null default 'auditor',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_settings (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.company_settings(id,data) values ('default','{}'::jsonb) on conflict do nothing;

create table if not exists public.invoice_sequences (
  prefix text not null,
  financial_year text not null,
  next_number integer not null default 1,
  primary key (prefix, financial_year)
);

create table if not exists public.posting_refs (
  ref text primary key,
  created_at timestamptz not null default now(),
  created_by uuid
);

create or replace function public.gws_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$
  select role from public.app_users where id = auth.uid() and active limit 1;
$$;

create or replace function public.gws_can_write()
returns boolean
language sql stable
as $$
  select public.gws_role() in ('owner','admin','accountant','sales','production');
$$;

create or replace function public.gws_is_owner()
returns boolean
language sql stable
as $$
  select public.gws_role() = 'owner';
$$;

create or replace function public.gws_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.gws_audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs(data)
  values (jsonb_build_object(
    'at', now(),
    'actor', coalesce(auth.uid()::text, 'anon'),
    'action', tg_op,
    'entity', tg_table_name,
    'summary', case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end,
    'reason', case when tg_op = 'DELETE' then '' else coalesce(new.data->>'reason', '') end
  ));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create or replace function public.gws_next_invoice_no(p_prefix text, p_year text)
returns text language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.invoice_sequences(prefix, financial_year, next_number)
  values (p_prefix, p_year, 2)
  on conflict (prefix, financial_year)
  do update set next_number = public.invoice_sequences.next_number + 1
  returning next_number - 1 into n;
  return p_prefix || '/' || p_year || '/' || lpad(n::text, 5, '0');
end $$;

-- Domain tables use a typed core plus a jsonb payload; this keeps every RDP entity
-- authoritative in Postgres while allowing phased field additions without migrations.
do $$
declare t text;
declare tables text[] := array[
  'customers','suppliers','products','price_lists',
  'quotations','sales_orders','invoices','challans','sales_returns','receipts',
  'purchase_orders','goods_receipts','bills','purchase_returns','supplier_payments',
  'batches','stock_movements','stock_counts','stock_adjustments',
  'boms','production_plans','production_batches','consumptions','rejects',
  'qc_tests','qc_approvals','non_conformance',
  'dispatches','delivery_events','returnables',
  'accounts','cash_bank','expenses','journals','capital_drawings','fixed_assets','ledger_entries',
  'month_locks','attachments','import_jobs','audit_logs'
];
begin
  foreach t in array tables loop
    execute format('create table if not exists public.%I (
      id uuid primary key default gen_random_uuid(),
      data jsonb not null default ''{}''::jsonb,
      status text,
      business_date date,
      created_at timestamptz not null default now(),
      created_by uuid,
      updated_at timestamptz not null default now()
    )', t);
    execute format('create index if not exists %I on public.%I (business_date desc)', t || '_date_idx', t);
    execute format('create index if not exists %I on public.%I ((data->>''status''))', t || '_status_idx', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', 'gws_select_' || t, t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', 'gws_select_' || t, t);
    if t not in ('audit_logs','stock_movements','month_locks') then
      execute format('drop policy if exists %I on public.%I', 'gws_insert_' || t, t);
      execute format('create policy %I on public.%I for insert to authenticated with check (public.gws_can_write())', 'gws_insert_' || t, t);
      execute format('drop policy if exists %I on public.%I', 'gws_update_' || t, t);
      execute format('create policy %I on public.%I for update to authenticated using (public.gws_can_write()) with check (public.gws_can_write())', 'gws_update_' || t, t);
      execute format('drop policy if exists %I on public.%I', 'gws_delete_' || t, t);
      execute format('create policy %I on public.%I for delete to authenticated using (public.gws_is_owner())', 'gws_delete_' || t, t);
    end if;
    execute format('drop trigger if exists %I on public.%I', 'gws_touch_' || t, t);
    execute format('create trigger %I before update on public.%I for each row execute function public.gws_touch_updated_at()', 'gws_touch_' || t, t);
    if t not in ('audit_logs') then
      execute format('drop trigger if exists %I on public.%I', 'gws_audit_' || t, t);
      execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.gws_audit_trigger()', 'gws_audit_' || t, t);
    end if;
  end loop;
end $$;

-- Append-only audit log: everyone authenticated can append, only owner/auditor can read.
drop policy if exists gws_audit_insert on public.audit_logs;
create policy gws_audit_insert on public.audit_logs for insert to authenticated with check (auth.uid() is not null);
drop policy if exists gws_audit_read on public.audit_logs;
create policy gws_audit_read on public.audit_logs for select to authenticated using (public.gws_role() in ('owner','auditor'));

-- Immutable stock ledger: authorized users append; nobody edits or deletes.
drop policy if exists gws_stock_insert on public.stock_movements;
create policy gws_stock_insert on public.stock_movements for insert to authenticated with check (public.gws_can_write());

-- Month close is owner-only.
drop policy if exists gws_month_insert on public.month_locks;
create policy gws_month_insert on public.month_locks for insert to authenticated with check (public.gws_is_owner());
drop policy if exists gws_month_update on public.month_locks;
create policy gws_month_update on public.month_locks for update to authenticated using (public.gws_is_owner()) with check (public.gws_is_owner());

-- Identity and company settings are owner-only for writes.
alter table public.app_users enable row level security;
drop policy if exists gws_users_read on public.app_users;
create policy gws_users_read on public.app_users for select to authenticated using (public.gws_role() in ('owner','admin','accountant'));
drop policy if exists gws_users_write on public.app_users;
create policy gws_users_write on public.app_users for all to authenticated using (public.gws_is_owner()) with check (public.gws_is_owner());

alter table public.company_settings enable row level security;
drop policy if exists gws_company_read on public.company_settings;
create policy gws_company_read on public.company_settings for select to authenticated using (true);
drop policy if exists gws_company_write on public.company_settings;
create policy gws_company_write on public.company_settings for all to authenticated using (public.gws_is_owner()) with check (public.gws_is_owner());

alter table public.invoice_sequences enable row level security;
drop policy if exists gws_seq_read on public.invoice_sequences;
create policy gws_seq_read on public.invoice_sequences for select to authenticated using (public.gws_can_write());

alter table public.posting_refs enable row level security;
drop policy if exists gws_refs_read on public.posting_refs;
create policy gws_refs_read on public.posting_refs for select to authenticated using (public.gws_can_write());

-- Private object storage for invoices, QC reports and POD.
insert into storage.buckets(id,name,public) values ('documents','Glacier private documents',false)
on conflict (id) do update set public = false;
drop policy if exists gws_storage_read on storage.objects;
create policy gws_storage_read on storage.objects for select to authenticated using (bucket_id = 'documents');
drop policy if exists gws_storage_write on storage.objects;
create policy gws_storage_write on storage.objects for insert to authenticated with check (bucket_id = 'documents' and public.gws_can_write());

-- Owner bootstrap helper (run after the owner signs up in Supabase Auth):
-- insert into public.app_users(id,email,name,role) values ((select id from auth.users where email='smartbooksbasha@gmail.com'),'smartbooksbasha@gmail.com','Owner','owner');
