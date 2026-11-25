import { useState } from 'react';
import type { User } from '../lib/types';
import { APP_VER } from '../lib/config';
import { ROLE_LABELS, canSeeGroup } from '../lib/permissions';
import { Btn, Icon } from './ui';

const GROUPS = [
  ['Overview', 'grid'], ['Sales', 'sales'], ['Purchase', 'purchase'], ['Inventory', 'inventory'],
  ['Manufacturing', 'production'], ['Quality', 'quality'], ['Delivery', 'delivery'],
  ['Accounts', 'accounts'], ['Reports', 'reports'], ['Administration', 'admin']
] as const;

export function Shell({ active, onNavigate, onQuick, user, onLogout, children }: {
  active: string; onNavigate: (group: string) => void; onQuick: (group: string, module: string | null) => void; user: User; onLogout: () => void; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const nav = (group: string) => { onNavigate(group); setOpen(false); };
  return <div className="app">
    {open && <div className="scrim" onClick={() => setOpen(false)} />}
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="brand"><div className="brand-mark">GW</div><div><strong>Glacier ERP</strong><small>Water Solutions</small></div></div>
      <nav className="nav" aria-label="Main navigation">
        {GROUPS.filter(([group]) => canSeeGroup(user.role, group)).map(([group, icon]) =>
          <button key={group} className={active === group ? 'active' : ''} onClick={() => nav(group)} aria-current={active === group ? 'page' : undefined}>
            <Icon name={icon} size={16} /><span>{group}</span><span className="dot" style={{ marginLeft: 'auto', opacity: active === group ? 1 : .15 }} />
          </button>
        )}
      </nav>
      <div className="side-foot">
        <div>{ROLE_LABELS[user.role]}</div>
        <div className="mono">{user.email}</div>
        <Btn variant="ghost" small onClick={onLogout}><Icon name="logout" size={14} /> Log out</Btn>
        <div className="mono">{APP_VER}</div>
      </div>
    </aside>
    <main className="main">
      <div className="topbar">
        <div><h1>{active}</h1><p>Mobile-first cloud workplace · {APP_VER}</p></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn ghost menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /> Menu</button>
          <span className="chip cyan"><Icon name="cloud" size={14} /> {active === 'Administration' ? 'Cloud setup here' : 'Shared data ready'}</span>
        </div>
      </div>
      {children}
      <footer className="app-foot"><span>Glacier Water Solutions — RDP v3 build</span><span>India time (Asia/Kolkata) · {APP_VER}</span></footer>
      <div className="quickbar" aria-label="Quick actions">
        <button className={active === 'Overview' ? 'active' : ''} onClick={() => nav('Overview')}><Icon name="grid" size={16} /><span>Home</span></button>
        {canSeeGroup(user.role, 'Sales') && <button onClick={() => { onQuick('Sales', 'invoices'); setOpen(false); }}><Icon name="sales" size={16} /><span>Invoices</span></button>}
        {canSeeGroup(user.role, 'Inventory') && <button onClick={() => { onQuick('Inventory', 'products'); setOpen(false); }}><Icon name="inventory" size={16} /><span>Products</span></button>}
        {canSeeGroup(user.role, 'Reports') && <button onClick={() => { onQuick('Reports', null); setOpen(false); }}><Icon name="reports" size={16} /><span>Reports</span></button>}
        {canSeeGroup(user.role, 'Administration') && <button onClick={() => { onQuick('Administration', null); setOpen(false); }}><Icon name="admin" size={16} /><span>Admin</span></button>}
      </div>
    </main>
  </div>;
}
