import { beforeEach, describe, expect, it } from 'vitest';
import { bottlesFromCases } from '../src/lib/calc';
import { cancelDocument, listRows, postDocument, resetSupabaseClient, saveRow, seedDemoData, stockByProduct, audit } from '../src/lib/store';
import type { Row } from '../src/lib/types';

beforeEach(() => {
  localStorage.clear();
  resetSupabaseClient();
});

describe('local demo data layer', () => {
  it('seeds exact opening stock from the RDP examples', async () => {
    await seedDemoData();
    const stock = await stockByProduct();
    expect(stock.prod_300).toBe(bottlesFromCases(100, 15, 30));
    expect(stock.prod_500).toBe(bottlesFromCases(80, 10, 24));
    expect(stock.prod_1000).toBe(bottlesFromCases(50, 12, 24));
  });

  it('posts an invoice atomically into stock and customer ledger, then blocks duplicates', async () => {
    await seedDemoData();
    const before = (await stockByProduct()).prod_300;
    const invoice = await saveRow('invoices', {
      date: '2026-11-25', invoiceNo: 'GWS/INV/00001', customerId: 'cust_1', productId: 'prod_300',
      description: '300 ml PET', qty: 30, ratePaise: 150000, discountPaise: 0, gstRate: 0,
      placeOfSupply: 'Same State', status: 'Draft'
    } as unknown as Row);
    const posted = await postDocument('invoices', invoice, 'owner@test');
    expect(posted.status).toBe('Posted');
    expect(posted.grandPaise).toBe(4500000);
    expect((await stockByProduct()).prod_300).toBe(before - 30);
    const ledger = await listRows('ledger_entries');
    expect(ledger.some((l) => l.partyId === 'cust_1' && Number(l.debitPaise) === 4500000)).toBe(true);
    const movements = await listRows('stock_movements');
    expect(movements.some((m) => m.postingRef === `invoices:${invoice.id}` && m.direction === 'out')).toBe(true);
    await expect(postDocument('invoices', posted, 'owner@test')).rejects.toThrow(/already posted|duplicate/i);
  });

  it('blocks posting when stock would go negative', async () => {
    await seedDemoData();
    const invoice = await saveRow('invoices', { productId: 'prod_300', qty: 999999, ratePaise: 1000, status: 'Draft' } as unknown as Row);
    await expect(postDocument('invoices', invoice, 'owner@test')).rejects.toThrow(/insufficient stock/i);
  });

  it('cancels with a reversal that restores stock and writes an audit entry', async () => {
    await seedDemoData();
    const before = (await stockByProduct()).prod_500;
    const grn = await saveRow('goods_receipts', { date: '2026-11-25', productId: 'prod_500', qty: 48, status: 'Draft' } as unknown as Row);
    await postDocument('goods_receipts', grn, 'owner@test');
    expect((await stockByProduct()).prod_500).toBe(before + 48);
    await cancelDocument('goods_receipts', await listRows('goods_receipts').then((r) => r[0]), 'owner@test', 'Duplicate receipt');
    expect((await stockByProduct()).prod_500).toBe(before);
    const auditRows = await listRows('audit_logs');
    expect(auditRows.some((a) => a.action === 'cancel' && a.entity === 'goods_receipts')).toBe(true);
  });

  it('records audit entries for user actions', async () => {
    await audit('owner@test', 'settings', 'company', 'Saved tax setup');
    const rows = await listRows('audit_logs');
    expect(rows).toHaveLength(1);
    expect(rows[0].actor).toBe('owner@test');
  });
});
