import type { LineItem, MoneyBreakup } from './types';

export function toPaise(value: number | string): number {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function formatMoney(paise: number): string {
  return `Rs ${(Math.round(paise) / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function bottlesFromCases(cases: number, loose: number, perCase: number): number {
  const c = Math.max(0, Math.trunc(cases || 0));
  const l = Math.max(0, Math.trunc(loose || 0));
  const p = Math.max(1, Math.trunc(perCase || 1));
  return c * p + l;
}

export function casesFromBottles(totalBottles: number, perCase: number): { cases: number; loose: number } {
  const total = Math.max(0, Math.trunc(totalBottles || 0));
  const p = Math.max(1, Math.trunc(perCase || 1));
  return { cases: Math.floor(total / p), loose: total % p };
}

export function lineTaxablePaise(line: LineItem, inclusive: boolean): number {
  const gross = Math.round(line.qty * line.ratePaise) - Math.round(line.discountPaise);
  if (!inclusive) return Math.max(0, gross);
  const divisor = 1 + Math.max(0, line.gstRate) / 100;
  return Math.max(0, Math.round(gross / divisor));
}

export function calcTotals(
  lines: LineItem[],
  interState: boolean,
  freightPaise = 0,
  inclusive = false
): MoneyBreakup {
  let taxablePaise = 0;
  let taxPaise = 0;
  for (const line of lines) {
    const taxable = lineTaxablePaise(line, inclusive);
    taxablePaise += taxable;
    taxPaise += Math.round((taxable * Math.max(0, line.gstRate)) / 100);
  }
  taxablePaise += Math.max(0, Math.round(freightPaise));
  const cgstPaise = interState ? 0 : Math.round(taxPaise / 2);
  const sgstPaise = interState ? 0 : taxPaise - cgstPaise;
  const igstPaise = interState ? taxPaise : 0;
  const beforeRound = taxablePaise + taxPaise;
  const rounded = Math.round(beforeRound / 100) * 100;
  return {
    taxablePaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    roundOffPaise: rounded - beforeRound,
    grandPaise: rounded
  };
}

export function stockFromMovements(
  movements: Array<{ productId: string; direction: 'in' | 'out'; qty: number; posted?: boolean }>
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const m of movements) {
    if (m.posted === false) continue;
    const qty = Math.trunc(m.qty || 0);
    const delta = m.direction === 'in' ? qty : -qty;
    result[m.productId] = (result[m.productId] || 0) + delta;
  }
  return result;
}

export function assertStockAvailable(current: number, issue: number): void {
  if (current - issue < 0) throw new Error('Insufficient stock. Posted movements cannot make stock negative.');
}

export function gstBreakupLabel(interState: boolean): string {
  return interState ? 'IGST' : 'CGST + SGST';
}
