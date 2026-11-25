import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_COMPANY } from '../src/lib/config';
import { invoiceTotals, printInvoice } from '../src/lib/printDocs';
import type { Row } from '../src/lib/types';

const invoice: Row = {
  id: 'r1',
  invoiceNo: 'GWS/INV/0001',
  date: '2026-11-25',
  customerId: 'C-1',
  productId: 'P-1',
  description: '500 ml water',
  qty: 2,
  ratePaise: 2000,
  discountPaise: 0,
  gstRate: 5,
  placeOfSupply: 'Same State',
  status: 'Posted',
  paidPaise: 2000
};

function stubPopup() {
  const write = vi.fn();
  const close = vi.fn();
  const focus = vi.fn();
  const print = vi.fn();
  const win = { document: { write, close }, focus, print } as unknown as Window;
  const open = vi.spyOn(window, 'open').mockReturnValue(win);
  return { write, open };
}

describe('invoice documents', () => {
  it('computes GST breakup on taxable value', () => {
    const totals = invoiceTotals(invoice, DEFAULT_COMPANY);
    expect(totals.taxablePaise).toBe(4000);
    expect(totals.cgstPaise).toBe(100);
    expect(totals.sgstPaise).toBe(100);
    expect(totals.igstPaise).toBe(0);
    expect(totals.grandPaise).toBe(4200);
  });

  it('prints an A4 tax invoice with GST breakup and balance', () => {
    const { write, open } = stubPopup();
    expect(printInvoice(invoice, DEFAULT_COMPANY, 'a4')).toBe(true);
    const html = String(write.mock.calls[0]?.[0] ?? '');
    expect(html).toContain('TAX INVOICE');
    expect(html).toContain('GWS/INV/0001');
    expect(html).toContain('CGST');
    expect(html).toContain('SGST');
    expect(html).toContain('Rs 42.00');
    expect(html).toContain('Balance');
    open.mockRestore();
  });

  it('prints an 80 mm receipt', () => {
    const { write, open } = stubPopup();
    expect(printInvoice(invoice, DEFAULT_COMPANY, '80mm')).toBe(true);
    const html = String(write.mock.calls[0]?.[0] ?? '');
    expect(html).toContain('size:80mm');
    expect(html).toContain('GWS/INV/0001');
    expect(html).toContain('TOTAL');
    expect(html).toContain('Rs 42.00');
    open.mockRestore();
  });
});
