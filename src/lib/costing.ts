import type { Row } from './types';

export type CostingRow = {
  batchNo: string;
  productId: string;
  standardPaise: number;
  actualPaise: number;
  variancePaise: number;
  goodOutput: number;
  approved: boolean;
};

export type FinancialStatements = {
  salesPaise: number;
  purchasePaise: number;
  expensePaise: number;
  variancePaise: number;
  profitPaise: number;
  assetsPaise: number;
  liabilitiesPaise: number;
  capitalPaise: number;
  rows: Row[];
};

const n = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export function computeCosting(batches: Row[], consumptions: Row[]): CostingRow[] {
  return batches.map((batch) => {
    const batchNo = String(batch.batchNo ?? '');
    const lines = consumptions.filter((line) => String(line.batchNo ?? '') === batchNo);
    const standardMaterial = lines.reduce((sum, line) => sum + Math.max(0, n(line.standardQty)) * Math.max(0, n(line.standardRatePaise ?? line.ratePaise)), 0);
    const actualMaterial = lines.reduce((sum, line) => sum + Math.max(0, n(line.qty)) * Math.max(0, n(line.ratePaise)), 0);
    const standardPaise = Math.round(standardMaterial + n(batch.standardLabourPaise) + n(batch.standardOverheadPaise));
    const actualPaise = Math.round(actualMaterial + n(batch.labourPaise) + n(batch.overheadPaise) + n(batch.electricityPaise));
    return {
      batchNo,
      productId: String(batch.productId ?? ''),
      standardPaise,
      actualPaise,
      variancePaise: actualPaise - standardPaise,
      goodOutput: Math.max(0, Math.trunc(n(batch.goodOutput))),
      approved: batch.approved === true || String(batch.approvalStatus ?? '') === 'Approved'
    };
  });
}

export function financialStatements(data: {
  invoices: Row[];
  bills: Row[];
  expenses: Row[];
  accounts: Row[];
  ledger: Row[];
  costing: CostingRow[];
}): FinancialStatements {
  const posted = (rows: Row[]) => rows.filter((row) => String(row.status ?? 'Posted') === 'Posted' || row.postedAt);
  const salesPaise = Math.round(posted(data.invoices).reduce((sum, row) => sum + n(row.grandPaise), 0));
  const purchasePaise = Math.round(posted(data.bills).reduce((sum, row) => sum + n(row.grandPaise), 0));
  const expensePaise = Math.round(posted(data.expenses).reduce((sum, row) => sum + n(row.amountPaise), 0));
  const variancePaise = data.costing.filter((row) => row.approved).reduce((sum, row) => sum + row.variancePaise, 0);
  const profitPaise = salesPaise - purchasePaise - expensePaise - variancePaise;

  let assetsPaise = 0;
  let liabilitiesPaise = 0;
  let capitalPaise = 0;
  for (const account of data.accounts) {
    const opening = n(account.openingPaise);
    const type = String(account.type ?? '');
    if (type === 'Asset') assetsPaise += opening;
    else if (type === 'Liability') liabilitiesPaise += opening;
    else if (type === 'Capital') capitalPaise += opening;
  }
  for (const entry of data.ledger) {
    const amount = n(entry.debitPaise) - n(entry.creditPaise);
    const party = String(entry.partyType ?? '');
    if (party === 'Customer' || party === 'Account') assetsPaise += amount;
    else if (party === 'Supplier') liabilitiesPaise -= amount;
  }
  assetsPaise += profitPaise;
  capitalPaise += profitPaise;

  const rows: Row[] = [
    { id: 'sales', line: 'Sales', amountPaise: salesPaise },
    { id: 'purchase', line: 'Purchases', amountPaise: -purchasePaise },
    { id: 'expenses', line: 'Expenses', amountPaise: -expensePaise },
    { id: 'variance', line: 'Approved costing variance', amountPaise: -variancePaise },
    { id: 'profit', line: 'Net profit (working paper)', amountPaise: profitPaise },
    { id: 'assets', line: 'Assets', amountPaise: assetsPaise },
    { id: 'liabilities', line: 'Liabilities', amountPaise: liabilitiesPaise },
    { id: 'capital', line: 'Capital + profit', amountPaise: capitalPaise }
  ];
  return { salesPaise, purchasePaise, expensePaise, variancePaise, profitPaise, assetsPaise, liabilitiesPaise, capitalPaise, rows };
}
