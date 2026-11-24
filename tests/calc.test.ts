import { describe, expect, it } from 'vitest';
import { bottlesFromCases, calcTotals, casesFromBottles, formatMoney, stockFromMovements, toPaise } from '../src/lib/calc';

describe('integer-paise money', () => {
  it('converts rupees to exact paise', () => {
    expect(toPaise(1500.5)).toBe(150050);
    expect(toPaise('0.01')).toBe(1);
    expect(toPaise('abc')).toBe(0);
  });

  it('formats Indian money', () => {
    expect(formatMoney(150050)).toBe('Rs 1,500.50');
  });
});

describe('case and bottle conversion', () => {
  it('matches the RDP examples exactly', () => {
    expect(bottlesFromCases(100, 15, 30)).toBe(3015);
    expect(bottlesFromCases(80, 10, 24)).toBe(1930);
    expect(bottlesFromCases(50, 12, 24)).toBe(1212);
  });

  it('converts back to cases plus loose bottles', () => {
    expect(casesFromBottles(3015, 30)).toEqual({ cases: 100, loose: 15 });
    expect(casesFromBottles(1930, 24)).toEqual({ cases: 80, loose: 10 });
  });
});

describe('GST math', () => {
  const lines = [{ productId: 'p', description: 'Water', hsn: '', qty: 10, ratePaise: 100000, discountPaise: 0, gstRate: 5 }];

  it('splits intra-state tax into CGST and SGST', () => {
    const t = calcTotals(lines, false, 0);
    expect(t.taxablePaise).toBe(1000000);
    expect(t.cgstPaise + t.sgstPaise).toBe(50000);
    expect(t.igstPaise).toBe(0);
    expect(t.grandPaise % 100).toBe(0);
  });

  it('uses IGST for inter-state supply', () => {
    const t = calcTotals(lines, true, 0);
    expect(t.igstPaise).toBe(50000);
    expect(t.cgstPaise).toBe(0);
    expect(t.sgstPaise).toBe(0);
  });

  it('handles inclusive pricing without rounding away tax', () => {
    const t = calcTotals(lines, false, 0, true);
    expect(t.taxablePaise + t.cgstPaise + t.sgstPaise).toBe(1000000);
    expect(t.cgstPaise + t.sgstPaise).toBeGreaterThan(0);
  });
});

describe('stock ledger', () => {
  it('derives stock from posted inward and outward movements', () => {
    const stock = stockFromMovements([
      { productId: 'p', direction: 'in', qty: 100, posted: true },
      { productId: 'p', direction: 'out', qty: 30, posted: true },
      { productId: 'p', direction: 'out', qty: 500, posted: false }
    ]);
    expect(stock.p).toBe(70);
  });
});
