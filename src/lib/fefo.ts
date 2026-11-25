import type { Row } from './types';

export type FefoSuggestion = {
  batchNo: string;
  productId: string;
  expiryDate: string;
  available: number;
  qcStatus: string;
};

export function dispatchQty(row: Row, product?: Row): { productId: string; qty: number } {
  const productId = String(row.productId ?? 'unknown');
  const perCase = Math.max(1, Math.trunc(Number(product?.perCase ?? 24)));
  const cases = Math.max(0, Math.trunc(Number(row.cases ?? 0)));
  const loose = Math.max(0, Math.trunc(Number(row.looseBottles ?? 0)));
  const fromCases = cases > 0 || loose > 0 ? cases * perCase + loose : Math.max(0, Math.trunc(Number(row.qty ?? 0)));
  return { productId, qty: fromCases };
}

export function pickFefo(batches: Row[], movements: Row[], productId: string, requiredQty: number): FefoSuggestion | null {
  const byBatch: Record<string, number> = {};
  for (const move of movements) {
    if (move.posted === false) continue;
    const batchNo = String(move.batchNo ?? '');
    if (!batchNo) continue;
    const delta = String(move.direction) === 'in' ? Number(move.qty ?? 0) : -Number(move.qty ?? 0);
    byBatch[batchNo] = (byBatch[batchNo] ?? 0) + delta;
  }
  const candidates: FefoSuggestion[] = batches
    .filter((batch) => String(batch.productId ?? '') === productId && String(batch.qcStatus ?? '') === 'Released')
    .map((batch) => {
      const batchNo = String(batch.batchNo ?? '');
      const available = Math.max(0, Math.round(byBatch[batchNo] ?? Number(batch.qty ?? 0)));
      return {
        batchNo,
        productId,
        expiryDate: String(batch.expiryDate ?? '9999-12-31'),
        available,
        qcStatus: String(batch.qcStatus ?? '')
      };
    })
    .filter((batch) => batch.batchNo && batch.available > 0)
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  return candidates.find((batch) => batch.available >= requiredQty) ?? candidates[0] ?? null;
}
