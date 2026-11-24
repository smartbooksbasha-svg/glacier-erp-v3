import { useEffect, useRef, useState } from 'react';
import { Btn, Card, Chip, Empty, Field, Icon } from '../components/ui';
import { getCloudConfig, getCompanyConfig, hasCloudConfig, setCloudConfig, setCompanyConfig } from '../lib/config';
import { currentUser } from '../lib/auth';
import { downloadText, exportCsv, exportJson } from '../lib/exports';
import { exportAll, listRows, importAll, resetSupabaseClient } from '../lib/store';
import schemaSql from '../lib/schema.sql?raw';
import type { Role, Row } from '../lib/types';

export function Admin({ role, actor }: { role: Role; actor: string }) {
  const [cloud, setCloud] = useState(getCloudConfig());
  const [company, setCompany] = useState(getCompanyConfig());
  const [users, setUsers] = useState<Row[]>([]);
  const [audit, setAudit] = useState<Row[]>([]);
  const [toast, setToast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void Promise.all([listRows('audit_logs'), listRows('app_users')]).then(([a, u]) => {
      setAudit(a.slice(0, 100));
      setUsers(u.length ? u : currentUser() ? [currentUser() as unknown as Row] : []);
    });
  }, []);

  if (role !== 'owner') return <Card><h2>Restricted</h2><p className="muted">Only the owner can open Administration.</p></Card>;

  const saveCloud = () => {
    setCloudConfig({ url: cloud.url.trim(), anonKey: cloud.anonKey.trim() });
    resetSupabaseClient();
    setToast('Cloud config saved. Reload to use the new backend.');
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, Row[]>;
      const result = await importAll(parsed);
      setToast(`Imported ${result.imported} rows; rejected ${result.rejected}. Check audit log.`);
    } catch (e) { setToast(e instanceof Error ? e.message : 'Import failed.'); }
  };

  return <>
    <div className="alert"><strong>Before go-live:</strong> export every v2 browser backup and keep it read-only in two places. Do not clear old browser storage. Owner + accountant must sign the reconciliation.</div>
    <div className="grid two">
      <Card>
        <div className="card-head"><h2>Cloud setup</h2><Chip tone={hasCloudConfig() ? 'ok' : 'warn'}>{hasCloudConfig() ? 'Connected' : 'Local demo'}</Chip></div>
        <div style={{ display: 'grid', gap: 12 }}>
          <Field label="Supabase project URL" full><input className="input" placeholder="https://xxxx.supabase.co" value={cloud.url} onChange={(e) => setCloud({ ...cloud, url: e.target.value })} /></Field>
          <Field label="Anon / public key" full><input className="input" placeholder="Public anon key only — never a service key" value={cloud.anonKey} onChange={(e) => setCloud({ ...cloud, anonKey: e.target.value })} /></Field>
          <Btn variant="primary" onClick={saveCloud}><Icon name="cloud" size={15} /> Save cloud setup</Btn>
          <p className="muted" style={{ margin: 0 }}>Paste only the public anon key. Row-level security in `schema.sql` enforces roles on the server.</p>
        </div>
      </Card>
      <Card>
        <div className="card-head"><h2>Company & tax setup</h2><Chip warn>Pending approval</Chip></div>
        <div style={{ display: 'grid', gap: 12 }}>
          <Field label="Legal name" full><input className="input" value={company.legalName} onChange={(e) => setCompany({ ...company, legalName: e.target.value })} /></Field>
          <Field label="GSTIN"><input className="input" value={company.gstin} onChange={(e) => setCompany({ ...company, gstin: e.target.value })} /></Field>
          <Field label="State"><input className="input" value={company.state} onChange={(e) => setCompany({ ...company, state: e.target.value })} /></Field>
          <Field label="Address" full><textarea className="input" rows={2} value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} /></Field>
          <Field label="HSN"><input className="input" value={company.hsn} onChange={(e) => setCompany({ ...company, hsn: e.target.value })} /></Field>
          <Field label="Default GST %"><input className="input" type="number" value={company.defaultGstRate} onChange={(e) => setCompany({ ...company, defaultGstRate: Number(e.target.value) })} /></Field>
          <Btn variant="primary" onClick={() => { setCompanyConfig(company); setToast('Company setup saved locally.'); }}>Save company setup</Btn>
        </div>
      </Card>
    </div>

    <div className="grid two" style={{ marginTop: 16 }}>
      <Card>
        <div className="card-head"><h2>Users & roles</h2><Chip>{users.length} users</Chip></div>
        {users.length === 0 ? <Empty text="No users yet. In cloud mode, create users in Supabase Auth then add a row to app_users." /> :
          <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>{users.map((u, i) => <tr key={String(u.id || i)}><td>{String(u.name || '')}</td><td className="mono">{String(u.email || '')}</td><td><Chip cyan>{String(u.role || 'user')}</Chip></td></tr>)}</tbody></table></div>}
        <p className="muted">Owner bootstrap SQL is included in the schema file.</p>
      </Card>
      <Card>
        <div className="card-head"><h2>Backup & migration</h2><Chip cyan>JSON</Chip></div>
        <div style={{ display: 'grid', gap: 10 }}>
          <Btn onClick={() => void exportAll().then((data) => exportJson(`glacier-v3-backup-${new Date().toISOString().slice(0, 10)}.json`, data))}><Icon name="download" size={15} /> Export full JSON backup</Btn>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => void doImport(e.target.files?.[0])} />
          <Btn onClick={() => fileRef.current?.click()}><Icon name="upload" size={15} /> Import v3 / v2 JSON backup</Btn>
          <Btn onClick={() => downloadText('glacier-v3-schema.sql', schemaSql)}><Icon name="download" size={15} /> Download PostgreSQL schema</Btn>
          <p className="muted" style={{ margin: 0 }}>Import logs rejected rows into the migration job register. Reconcile counts and totals before cutover.</p>
        </div>
      </Card>
    </div>

    <Card style={{ marginTop: 16 }}>
      <div className="card-head"><h2>Audit log</h2><div style={{ display: 'flex', gap: 8 }}><Chip>{audit.length} shown</Chip><Btn small onClick={() => exportCsv('audit-log.csv', audit, ['at', 'actor', 'action', 'entity', 'summary'])}>CSV</Btn></div></div>
      {audit.length === 0 ? <Empty text="No audit entries yet." /> : <div className="table-wrap"><table><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead><tbody>{audit.map((a, i) => <tr key={String(a.id || i)}><td className="mono">{String(a.at || a.createdAt || '')}</td><td>{String(a.actor || '')}</td><td><Chip>{String(a.action || '')}</Chip></td><td className="mono">{String(a.entity || '')}</td></tr>)}</tbody></table></div>}
    </Card>
    {toast && <div className="toast" role="status">{toast}</div>}
    <p className="muted" style={{ marginTop: 14 }}>Signed in as {actor}. Reports are working papers, not tax advice; GST setup needs auditor approval.</p>
  </>;
}
