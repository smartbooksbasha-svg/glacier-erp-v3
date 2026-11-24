import { useEffect, useState } from 'react';
import { Card, Chip, Empty, Icon } from '../components/ui';
import { formatMoney, casesFromBottles } from '../lib/calc';
import { can } from '../lib/permissions';
import { listRows, stockByProduct } from '../lib/store';
import type { Role, Row } from '../lib/types';

export function Dashboard({ role, onNavigate }: { role: Role; onNavigate: (group: string) => void }) {
  const [products, setProducts] = useState<Row[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [invoices, setInvoices] = useState<Row[]>([]);
  const [bills, setBills] = useState<Row[]>([]);
  const [batches, setBatches] = useState<Row[]>([]);

  useEffect(() => {
    void Promise.all([
      listRows('products'), stockByProduct(), listRows('invoices'), listRows('bills'), listRows('production_batches')
    ]).then(([p, s, i, b, pb]) => { setProducts(p); setStock(s); setInvoices(i); setBills(b); setBatches(pb); });
  }, []);

  const totalBottles = Object.values(stock).reduce((a, b) => a + b, 0);
  const salesValue = invoices.reduce((a, r) => a + Number(r.grandPaise || 0), 0);
  const lowStock = products.filter((p) => (stock[String(p.id)] || 0) < Number(p.reorderLevel || 0));
  const pending = invoices.filter((r) => r.status === 'Draft' || !r.status).length + bills.filter((r) => r.status === 'Draft' || !r.status).length;
  const maxStock = Math.max(1, ...Object.values(stock));

  return <>
    <div className="hero">
      <h2>One clear view of the factory.</h2>
      <p>Billing, stock, production, quality, delivery and accounts stay connected through one shared source of truth.</p>
      <div className="hero-actions">
        <button className="btn primary" onClick={() => onNavigate('Sales')}><Icon name="sales" size={16} /> New invoice</button>
        <button className="btn" onClick={() => onNavigate('Reports')}><Icon name="reports" size={16} /> View reports</button>
      </div>
    </div>
    <div className="grid kpi">
      <Card><div className="label">Products</div><div className="value">{products.length}</div><Chip cyan>Masters</Chip></Card>
      <Card><div className="label">Stock (bottles)</div><div className="value">{totalBottles.toLocaleString('en-IN')}</div><Chip>From ledger</Chip></Card>
      <Card><div className="label">Pending documents</div><div className="value">{pending}</div><Chip warn>Needs posting</Chip></Card>
      {can(role, 'costs') ? <Card><div className="label">Invoice value</div><div className="value">{formatMoney(salesValue)}</div><Chip ok>Posted + draft</Chip></Card>
        : <Card><div className="label">Production batches</div><div className="value">{batches.length}</div><Chip>Traceable</Chip></Card>}
    </div>
    <div className="grid two" style={{ marginTop: 16 }}>
      <Card>
        <div className="card-head"><h2>Stock by product</h2><button className="btn small ghost" onClick={() => onNavigate('Inventory')}>Open ledger</button></div>
        {products.length === 0 ? <Empty text="Add products in Inventory to see stock." /> :
          <div className="bar-list">{products.map((p) => {
            const bottles = stock[String(p.id)] || 0;
            const perCase = Number(p.perCase || 24);
            const display = casesFromBottles(bottles, perCase);
            return <div className="bar-row" key={String(p.id)}><span>{String(p.name)}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(100, (bottles / maxStock) * 100)}%` }} /></div><strong>{display.cases}c {display.loose}b</strong></div>;
          })}</div>}
      </Card>
      <Card>
        <div className="card-head"><h2>Attention</h2><Chip tone={lowStock.length ? 'warn' : 'ok'}>{lowStock.length} low stock</Chip></div>
        {lowStock.length === 0 ? <Empty text="No reorder alerts. Opening stock is seeded for demo." /> :
          <div className="bar-list">{lowStock.slice(0, 8).map((p) => <div className="bar-row" key={String(p.id)}><span>{String(p.name)}</span><div className="bar-track"><div className="bar-fill" style={{ width: '100%', background: '#f59e0b' }} /></div><strong>{stock[String(p.id)] || 0}</strong></div>)}</div>}
      </Card>
    </div>
  </>;
}
