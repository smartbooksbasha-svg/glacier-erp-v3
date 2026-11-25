import { describe, expect, it } from 'vitest';
import { DEFAULT_APPROVALS, DEFAULT_RECONCILIATION, approvalsComplete, reconciliationComplete } from '../src/lib/config';
import { computeCosting, financialStatements } from '../src/lib/costing';
import { dispatchQty, pickFefo } from '../src/lib/fefo';
import type { Row } from '../src/lib/types';

describe('pending-item engines', () => {
  it('picks the earliest-expiry released batch with enough stock', () => {
    const batches: Row[] = [
      { id: 'b1', batchNo: 'B-LATE', productId: 'p1', expiryDate: '2027-01-01', qcStatus: 'Released', qty: 100 },
      { id: 'b2', batchNo: 'B-EARLY', productId: 'p1', expiryDate: '2026-12-01', qcStatus: 'Released', qty: 50 },
      { id: 'b3', batchNo: 'B-HOLD', productId: 'p1', expiryDate: '2026-11-01', qcStatus: 'On Hold', qty: 20 }
    ];
    const movements: Row[] = [{ id: 'm1', batchNo: 'B-EARLY', productId: 'p1', direction: 'in', qty: 30, posted: true }];
    expect(pickFefo(batches, movements, 'p1', 20)?.batchNo).toBe('B-EARLY');
    expect(pickFefo(batches, movements, 'p1', 60)?.batchNo).toBe('B-LATE');
    expect(dispatchQty({ id: 'd1', productId: 'p1', cases: 2, looseBottles: 3 }, { id: 'p1', perCase: 24 }).qty).toBe(51);
  });

  it('computes standard-vs-actual batch costing and statements', () => {
    const batches: Row[] = [{ id: 'pb1', batchNo: 'P1', productId: 'p1', goodOutput: 100, standardLabourPaise: 1000, labourPaise: 1200, standardOverheadPaise: 500, overheadPaise: 600, electricityPaise: 100, approved: true }];
    const consumptions: Row[] = [{ id: 'c1', batchNo: 'P1', standardQty: 10, standardRatePaise: 100, qty: 11, ratePaise: 100 }];
    const cost = computeCosting(batches, consumptions)[0];
    expect(cost.standardPaise).toBe(2500);
    expect(cost.actualPaise).toBe(3000);
    expect(cost.variancePaise).toBe(500);
    const statements = financialStatements({
      invoices: [{ id: 'i1', status: 'Posted', grandPaise: 10000 }],
      bills: [], expenses: [],
      accounts: [{ id: 'a1', type: 'Asset', openingPaise: 5000 }],
      ledger: [], costing: [cost]
    });
    expect(statements.profitPaise).toBe(9500);
    expect(statements.assetsPaise).toBe(14500);
    expect(statements.rows.some((row) => row.id === 'profit')).toBe(true);
  });

  it('requires real approval and reconciliation sign-offs', () => {
    expect(approvalsComplete(DEFAULT_APPROVALS)).toBe(false);
    expect(approvalsComplete({ ...DEFAULT_APPROVALS, auditorName: 'Auditor', reference: 'REF-1', gstin: true, address: true, hsn: true, rates: true, opening: true })).toBe(true);
    expect(reconciliationComplete({ ...DEFAULT_RECONCILIATION, importedRows: 10, matchedRows: 8, ownerSignoff: 'O', accountantSignoff: 'A' })).toBe(false);
    expect(reconciliationComplete({ ...DEFAULT_RECONCILIATION, importedRows: 10, matchedRows: 10, ownerSignoff: 'O', accountantSignoff: 'A' })).toBe(true);
  });
});
