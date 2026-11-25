import { useEffect, useState } from 'react';
import { Btn, Card, Chip, Empty, Icon } from '../components/ui';
import { formatMoney } from '../lib/calc';
import { computeCosting, financialStatements } from '../lib/costing';
import { exportCsv, exportExcel, printRows } from '../lib/exports';
import { can } from '../lib/permissions';
import { listRows, stockByProduct } from '../lib/store';
import type { Role, Row } from '../lib/types';

export function Reports({ role }: { role: Role }) {
  const [invoices, setInvoices] = useState<Row[]>([]);
  const [bills, setBills] = useState<Row[]>([]);
  const [expenses, setExpenses] = useState<Row[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [batches, setBatches] = useState<Row[]>([]);
  const [consumptions, setConsumptions] = useState<Row[]>([]);
  const [accounts, setAccounts] = useState<Row[]>([]);
  const [ledger, setLedger] = useState<Row[]>([]);

  useEffect(() => {
    void Promise.all([
      listRows('invoices'), listRows('bills'), listRows('expenses'), stockByProduct(),
      listRows('production_batches'), listRows('consumptions'), listRows('accounts'), listRows('ledger_entries')
    ]).then(([i, b, e, s, pb, c, a, l]) => {
      setInvoices(i); setBills(b); setExpenses(e); setStock(s);
      setBatches(pb); setConsumptions(c); setAccounts(a); setLedger(l);
    });
  }, []);

  const sum = (rows: Row[], key: string) => rows.reduce((a, r) => a + Number(r[key] || 0), 0);
  const sales = sum(invoices, 'grandPaise');
  const purchases = sum(bills, 'grandPaise');
  const expenseTotal = sum(expenses, 'amountPaise');
  const stockRows = Object.entries(stock).map(([productId, bottles]) => ({ id: productId, productId, bottles }));
  const gstRows = invoices.map((r) => ({ id: r.id, invoiceNo: r.invoiceNo, date: r.date, taxablePaise: r.taxablePaise, cgstPaise: r.cgstPaise, sgstPaise: r.sgstPaise, igstPaise: r.igstPaise, grandPaise: r.grandPaise }));
  const costing = computeCosting(batches, consumptions);
  const statements = financialStatements({ invoices, bills, expenses, accounts, ledger, costing });

  return <>
    <div className="grid kpi">
      <Card><div className="label">Invoices</div><div className="value">{invoices.length}</div><Chip cyan>Sales register</Chip></Card>
      <Card><div className="label">Bills</div><div className="value">{bills.length}</div><Chip>Purchase register</Chip></Card>
      <Card><div className="label">Stock lines</div><div className="value">{stockRows.length}</div><Chip>Ledger-derived</Chip></Card>
      {can(role, 'costs') ? <Card><div className="label">Net before opening</div><div className="value">{formatMoney(sales - purchases - expenseTotal)}</div><Chip warn>Indicative</Chip></Card>
        : <Card><div className="label">Expense vouchers</div><div className="value">{expenses.length}</div><Chip>Restricted totals</Chip></Card>}
      {can(role, 'costs') && <Card><div className="label">Approved cost variance</div><div className="value">{formatMoney(statements.variancePaise)}</div><Chip cyan>Standard vs actual</Chip></Card>}
    </div>
    <div className="grid two" style={{ marginTop: 16 }}>
      <Card>
        <div className="card-head"><h2>Registers & exports</h2><Chip>Auditor pack</Chip></div>
        <div style={{ display: 'grid', gap: 10 }}>
          <Btn onClick={() => exportExcel('glacier-auditor-pack.xls', [
            { name: 'Sales', rows: invoices, columns: ['id', 'date', 'invoiceNo', 'customerId', 'taxablePaise', 'cgstPaise', 'sgstPaise', 'igstPaise', 'grandPaise', 'status'] },
            { name: 'Purchase', rows: bills, columns: ['id', 'date', 'supplierBillNo', 'supplierId', 'grandPaise', 'itcStatus', 'status'] },
            { name: 'Expenses', rows: expenses, columns: ['id', 'date', 'category', 'payee', 'amountPaise', 'status'] },
            { name: 'Stock', rows: stockRows, columns: ['productId', 'bottles'] },
            { name: 'GST working', rows: gstRows, columns: ['invoiceNo', 'date', 'taxablePaise', 'cgstPaise', 'sgstPaise', 'igstPaise', 'grandPaise'] }
          ])}><Icon name="download" size={15} /> Auditor Excel pack</Btn>
          <Btn onClick={() => exportCsv('gst-working.csv', gstRows, ['invoiceNo', 'date', 'taxablePaise', 'cgstPaise', 'sgstPaise', 'igstPaise', 'grandPaise'])}>GST working CSV</Btn>
          <Btn onClick={() => printRows('Glacier Water Solutions — Registers', invoices, ['date', 'invoiceNo', 'customerId', 'grandPaise', 'status'])}>Print / save PDF</Btn>
        </div>
      </Card>
      <Card>
        <div className="card-head"><h2>Month close</h2><Chip warn>Approval required</Chip></div>
        <p className="muted">Month close locks postings. Reopening needs a reason and an audit entry. Use Reports → Month Lock / Reopen in the navigation.</p>
        <p className="muted">P&amp;L and balance sheet depend on correct opening balances and accountant-approved accounting setup. Until then this screen shows working papers only.</p>
      </Card>
    </div>
    {can(role, 'costs') && <Card style={{ marginTop: 16 }}>
      <div className="card-head"><h2>Costing & statements</h2><Chip cyan>Standard vs actual</Chip></div>
      <div style={{ display: 'grid', gap: 10 }}>
        <div className="grid two">
          <div><div className="label">Net profit (working paper)</div><div className="value">{formatMoney(statements.profitPaise)}</div></div>
          <div><div className="label">Assets / liabilities</div><div className="value">{formatMoney(statements.assetsPaise)} / {formatMoney(statements.liabilitiesPaise)}</div></div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={() => exportCsv('costing-variance.csv', costing.map((c) => ({ id: c.batchNo, ...c })), ['batchNo', 'productId', 'standardPaise', 'actualPaise', 'variancePaise', 'approved'])}>Costing CSV</Btn>
          <Btn onClick={() => exportExcel('glacier-statements.xls', [
            { name: 'Costing', rows: costing.map((c) => ({ id: c.batchNo, ...c })), columns: ['batchNo', 'productId', 'standardPaise', 'actualPaise', 'variancePaise', 'approved'] },
            { name: 'Statements', rows: statements.rows, columns: ['id', 'line', 'amountPaise'] }
          ])}>Statements Excel</Btn>
          <Btn onClick={() => printRows('Glacier Water Solutions — P&L / Balance Sheet working paper', statements.rows, ['line', 'amountPaise'])}>Print / PDF</Btn>
        </div>
        {costing.length === 0 ? <Empty text="No production batches yet. Costing appears after BOM consumption is recorded." /> :
          <div className="table-wrap"><table><thead><tr><th>Batch</th><th>Standard</th><th>Actual</th><th>Variance</th><th>Approved</th></tr></thead><tbody>{costing.slice(0, 20).map((c) => <tr key={c.batchNo}><td className="mono">{c.batchNo}</td><td>{formatMoney(c.standardPaise)}</td><td>{formatMoney(c.actualPaise)}</td><td>{formatMoney(c.variancePaise)}</td><td><Chip tone={c.approved ? 'ok' : 'warn'}>{c.approved ? 'Yes' : 'Pending'}</Chip></td></tr>)}</tbody></table></div>}
      </div>
    </Card>}

    <Card style={{ marginTop: 16 }}>
      <div className="card-head"><h2>Stock register</h2><Chip>{stockRows.length} SKUs</Chip></div>
      {stockRows.length === 0 ? <Empty text="No posted stock movements yet." /> : <div className="table-wrap"><table><thead><tr><th>Product ID</th><th>Bottles</th></tr></thead><tbody>{stockRows.map((r) => <tr key={r.productId}><td className="mono">{r.productId}</td><td>{r.bottles.toLocaleString('en-IN')}</td></tr>)}</tbody></table></div>}
    </Card>
  </>;
}
