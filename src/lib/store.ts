import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getCloudConfig, seedDone, markSeedDone } from './config';
import { MODULES } from './modules';
import { assertStockAvailable, bottlesFromCases, calcTotals, stockFromMovements } from './calc';
import { dispatchQty, pickFefo } from './fefo';
import type { LineItem, Row } from './types';

const PREFIX = 'gws3_data_';
let cachedClient: SupabaseClient | null | undefined;

export function uid(prefix = 'id'): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function supabaseClient(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;
  const cfg = getCloudConfig();
  if (!cfg.url || !cfg.anonKey) {
    cachedClient = null;
    return null;
  }
  try {
    cachedClient = createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  } catch {
    cachedClient = null;
  }
  return cachedClient;
}

export function resetSupabaseClient(): void {
  cachedClient = undefined;
}

function localRows(table: string): Row[] {
  try {
    const raw = localStorage.getItem(PREFIX + table);
    return raw ? JSON.parse(raw) as Row[] : [];
  } catch {
    return [];
  }
}

function writeLocalRows(table: string, rows: Row[]): void {
  try { localStorage.setItem(PREFIX + table, JSON.stringify(rows)); } catch { /* storage unavailable */ }
}

export async function listRows(table: string): Promise<Row[]> {
  const client = supabaseClient();
  if (client) {
    const { data, error } = await client.from(table).select('*').order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Row[];
  }
  return localRows(table).slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export async function saveRow(table: string, input: Partial<Row> & Record<string, unknown>): Promise<Row> {
  const now = new Date().toISOString();
  const row: Row = {
    ...input,
    id: String(input.id || uid(table.slice(0, 3))),
    createdAt: String(input.createdAt || now),
    updatedAt: now
  } as Row;
  const client = supabaseClient();
  if (client) {
    const { data, error } = await client.from(table).upsert(row).select().single();
    if (error) throw new Error(error.message);
    return data as Row;
  }
  const rows = localRows(table);
  const index = rows.findIndex((r) => r.id === row.id);
  if (index >= 0) rows[index] = row;
  else rows.unshift(row);
  writeLocalRows(table, rows);
  return row;
}

export async function deleteRow(table: string, id: string, actor = 'system', reason = 'User deleted record'): Promise<void> {
  const client = supabaseClient();
  if (client) {
    const { error } = await client.from(table).delete().eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    writeLocalRows(table, localRows(table).filter((r) => r.id !== id));
  }
  await audit(actor, 'delete', table, `Deleted ${id}`, reason);
}

export async function saveMany(table: string, rows: Row[]): Promise<void> {
  for (const row of rows) await saveRow(table, row);
}

export async function audit(actor: string, action: string, entity: string, summary: string, reason = ''): Promise<void> {
  await saveRow('audit_logs', {
    at: new Date().toISOString(),
    actor,
    action,
    entity,
    summary,
    reason
  });
}

export async function exportAll(): Promise<Record<string, Row[]>> {
  const out: Record<string, Row[]> = {};
  for (const module of MODULES) out[module.key] = await listRows(module.key);
  return out;
}

export async function importAll(data: Record<string, Row[]>): Promise<{ imported: number; rejected: number }> {
  let imported = 0;
  let rejected = 0;
  for (const module of MODULES) {
    const rows = Array.isArray(data[module.key]) ? data[module.key] : [];
    for (const row of rows) {
      try {
        if (!row || typeof row !== 'object' || !row.id) throw new Error('Invalid row');
        await saveRow(module.key, row);
        imported += 1;
      } catch {
        rejected += 1;
      }
    }
  }
  return { imported, rejected };
}

export async function seedDemoData(): Promise<void> {
  if (seedDone()) return;
  const products = await listRows('products');
  if (products.length === 0) {
    await saveMany('products', [
      { id: 'prod_300', name: '300 ml PET', sku: 'W300', type: 'Finished goods', unit: 'Bottle', perCase: 30, hsn: 'PENDING', gstRate: 0, mrpPaise: 2000, salePaise: 1500, purchasePaise: 900, reorderLevel: 300 },
      { id: 'prod_500', name: '500 ml PET', sku: 'W500', type: 'Finished goods', unit: 'Bottle', perCase: 24, hsn: 'PENDING', gstRate: 0, mrpPaise: 3000, salePaise: 2000, purchasePaise: 1200, reorderLevel: 240 },
      { id: 'prod_1000', name: '1000 ml PET', sku: 'W1000', type: 'Finished goods', unit: 'Bottle', perCase: 24, hsn: 'PENDING', gstRate: 0, mrpPaise: 5000, salePaise: 3500, purchasePaise: 2200, reorderLevel: 120 }
    ] as Row[]);
  }
  const movements = await listRows('stock_movements');
  if (movements.length === 0) {
    await saveMany('stock_movements', [
      { date: new Date().toISOString().slice(0, 10), productId: 'prod_300', direction: 'in', qty: bottlesFromCases(100, 15, 30), reason: 'Opening stock (demo)', posted: true, status: 'Posted' },
      { date: new Date().toISOString().slice(0, 10), productId: 'prod_500', direction: 'in', qty: bottlesFromCases(80, 10, 24), reason: 'Opening stock (demo)', posted: true, status: 'Posted' },
      { date: new Date().toISOString().slice(0, 10), productId: 'prod_1000', direction: 'in', qty: bottlesFromCases(50, 12, 24), reason: 'Opening stock (demo)', posted: true, status: 'Posted' }
    ] as unknown as Row[]);
  }
  markSeedDone();
}

export async function stockByProduct(): Promise<Record<string, number>> {
  return stockFromMovements((await listRows('stock_movements')) as unknown as Array<{ productId: string; direction: 'in' | 'out'; qty: number; posted?: boolean }>);
}

function lineFromRow(row: Row): LineItem {
  return {
    productId: String(row.productId || 'unknown'),
    description: String(row.description || row.item || 'Item'),
    hsn: String(row.hsn || ''),
    qty: Number(row.qty || 1),
    ratePaise: Math.round(Number(row.ratePaise || 0)),
    discountPaise: Math.round(Number(row.discountPaise || 0)),
    gstRate: Number(row.gstRate || 0)
  };
}

function postingRef(table: string, id: string): string {
  return `${table}:${id}`;
}

async function alreadyPosted(_table: string, ref: string): Promise<boolean> {
  const movements = await listRows('stock_movements');
  return movements.some((m) => m.postingRef === ref);
}

export async function postDocument(table: string, row: Row, actor: string): Promise<Row> {
  if (row.postedAt) throw new Error('This document is already posted.');
  const ref = postingRef(table, String(row.id));
  if (await alreadyPosted(table, ref)) throw new Error('Duplicate posting blocked by idempotency reference.');

  const now = new Date().toISOString();
  const lines = [lineFromRow(row)];
  const interState = String(row.placeOfSupply || '') !== 'Same State';
  const totals = calcTotals(lines, interState, Math.round(Number(row.freightPaise || 0)));
  const updates: Partial<Row> = {
    status: 'Posted',
    postedAt: now,
    postedBy: actor,
    postingRef: ref,
    taxablePaise: totals.taxablePaise,
    cgstPaise: totals.cgstPaise,
    sgstPaise: totals.sgstPaise,
    igstPaise: totals.igstPaise,
    grandPaise: totals.grandPaise
  };

  const productId = String(row.productId || 'unknown');
  let batchNo = '';
  let qty = Math.trunc(Number(row.qty || 0));
  if (table === 'dispatches') {
    const products = await listRows('products');
    const product = products.find((p) => String(p.id) === productId);
    qty = dispatchQty(row, product).qty;
    batchNo = String(row.batchNo || '');
    if (!batchNo) throw new Error('Select a batch before posting a dispatch.');
    const batches = await listRows('batches');
    const batch = batches.find((b) => String(b.batchNo || '') === batchNo);
    if (!batch) throw new Error('Selected batch does not exist.');
    if (String(batch.qcStatus || '') !== 'Released') throw new Error('Only QC-released batches can be dispatched.');
    const suggestion = pickFefo(batches, await listRows('stock_movements'), productId, qty);
    if (suggestion && batchNo !== suggestion.batchNo && !String(row.overrideReason || '').trim()) {
      throw new Error(`Batch ${batchNo} is not FEFO-first. Suggested: ${suggestion.batchNo}. Add an override reason.`);
    }
  }
  const stock = await stockByProduct();
  const stockActions: Array<{ direction: 'in' | 'out'; qty: number; reason: string; batchNo?: string }> = [];
  const ledgerActions: Array<{ debitPaise: number; creditPaise: number; partyId: string; partyType: string; reference: string }> = [];

  if (['invoices', 'challans', 'dispatches'].includes(table)) {
    if (qty > 0) {
      assertStockAvailable(stock[productId] || 0, qty);
      stockActions.push({ direction: 'out', qty, reason: `${table} posting`, batchNo: table === 'dispatches' ? batchNo : undefined });
    }
  }
  if (['goods_receipts', 'bills', 'sales_returns'].includes(table)) {
    if (qty > 0) stockActions.push({ direction: 'in', qty, reason: `${table} posting` });
  }
  if (table === 'purchase_returns') {
    if (qty > 0) {
      assertStockAvailable(stock[productId] || 0, qty);
      stockActions.push({ direction: 'out', qty, reason: 'Purchase return' });
    }
  }
  if (table === 'production_batches') {
    const good = Math.trunc(Number(row.goodOutput || 0));
    const rejected = Math.trunc(Number(row.rejectedOutput || 0));
    if (good > 0) stockActions.push({ direction: 'in', qty: good, reason: 'Production good output' });
    if (rejected > 0) stockActions.push({ direction: 'in', qty: rejected, reason: 'Production rejected output (QC hold)' });
  }
  if (table === 'stock_adjustments') {
    const delta = Math.trunc(Number(row.delta || 0));
    if (delta > 0) stockActions.push({ direction: 'in', qty: delta, reason: 'Approved adjustment' });
    if (delta < 0) {
      assertStockAvailable(stock[productId] || 0, Math.abs(delta));
      stockActions.push({ direction: 'out', qty: Math.abs(delta), reason: 'Approved adjustment' });
    }
  }

  if (table === 'invoices' || table === 'sales_returns') {
    ledgerActions.push({ partyId: String(row.customerId || ''), partyType: 'Customer', debitPaise: table === 'invoices' ? totals.grandPaise : 0, creditPaise: table === 'sales_returns' ? totals.grandPaise : 0, reference: String(row.invoiceNo || ref) });
  }
  if (table === 'bills' || table === 'purchase_returns' || table === 'supplier_payments') {
    ledgerActions.push({ partyId: String(row.supplierId || ''), partyType: 'Supplier', debitPaise: table === 'bills' ? totals.grandPaise : 0, creditPaise: table === 'purchase_returns' ? totals.grandPaise : table === 'supplier_payments' ? Math.round(Number(row.amountPaise || 0)) : 0, reference: String(row.supplierBillNo || ref) });
  }
  if (table === 'receipts') {
    ledgerActions.push({ partyId: String(row.customerId || ''), partyType: 'Customer', debitPaise: 0, creditPaise: Math.round(Number(row.amountPaise || 0)), reference: ref });
  }
  if (table === 'expenses' || table === 'journals' || table === 'cash_bank' || table === 'capital_drawings') {
    const amount = Math.round(Number(row.amountPaise || 0));
    ledgerActions.push({ partyId: String(row.accountId || row.debitAccount || row.category || 'account'), partyType: 'Account', debitPaise: amount, creditPaise: 0, reference: ref });
  }

  for (const action of stockActions) {
    await saveRow('stock_movements', {
      date: String(row.date || now.slice(0, 10)),
      productId,
      direction: action.direction,
      qty: action.qty,
      batchNo: action.batchNo,
      reason: action.reason,
      posted: true,
      status: 'Posted',
      postingRef: ref,
      createdBy: actor
    });
  }
  for (const action of ledgerActions) {
    await saveRow('ledger_entries', {
      date: String(row.date || now.slice(0, 10)),
      partyType: action.partyType,
      partyId: action.partyId,
      debitPaise: action.debitPaise,
      creditPaise: action.creditPaise,
      reference: action.reference,
      postingRef: ref,
      status: 'Posted',
      createdBy: actor
    });
  }
  if (table === 'qc_approvals') {
    const batchRows = await listRows('production_batches');
    const batch = batchRows.find((b) => b.batchNo === row.batchNo);
    if (batch) await saveRow('production_batches', { ...batch, qcStatus: String(row.decision || 'On Hold'), status: String(row.decision || 'On Hold') });
  }

  const saved = await saveRow(table, { ...row, ...updates });
  await audit(actor, 'post', table, `Posted ${ref}; stock=${stockActions.length}, ledger=${ledgerActions.length}`, String(row.reason || ''));
  return saved;
}

export async function cancelDocument(table: string, row: Row, actor: string, reason: string): Promise<Row> {
  if (row.status === 'Cancelled') throw new Error('Already cancelled.');
  const ref = postingRef(table, String(row.id));
  const movements = await listRows('stock_movements');
  for (const movement of movements.filter((m) => m.postingRef === ref)) {
    await saveRow('stock_movements', {
      ...movement,
      id: uid('rev'),
      direction: movement.direction === 'in' ? 'out' : 'in',
      qty: Math.abs(Number(movement.qty || 0)),
      reason: `Reversal: ${reason}`,
      postingRef: `${ref}:reversal`,
      createdAt: undefined
    });
  }
  const saved = await saveRow(table, { ...row, status: 'Cancelled', cancelledAt: new Date().toISOString(), cancelReason: reason });
  await audit(actor, 'cancel', table, `Cancelled ${ref}`, reason);
  return saved;
}
