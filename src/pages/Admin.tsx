import { useEffect, useRef, useState } from 'react';
import { Btn, Card, Chip, Empty, Field, Icon } from '../components/ui';
import { formatMoney } from '../lib/calc';
import { approvalsComplete, getApprovals, getCloudConfig, getCompanyConfig, getReconciliation, hasCloudConfig, reconciliationComplete, setApprovals as saveApprovals, setCloudConfig, setCompanyConfig, setReconciliation as saveReconciliation } from '../lib/config';
import { currentUser } from '../lib/auth';
import { downloadText, exportCsv, exportJson } from '../lib/exports';
import { exportAll, listRows, importAll, resetSupabaseClient, supabaseClient } from '../lib/store';
import schemaSql from '../lib/schema.sql?raw';
import type { Role, Row } from '../lib/types';

export function Admin({ role, actor }: { role: Role; actor: string }) {
  const [cloud, setCloud] = useState(getCloudConfig());
  const [company, setCompany] = useState(getCompanyConfig());
  const [users, setUsers] = useState<Row[]>([]);
  const [audit, setAudit] = useState<Row[]>([]);
  const [approvals, setApprovalRecord] = useState(getApprovals());
  const [recon, setRecon] = useState(getReconciliation());
  const [health, setHealth] = useState<Array<{ label: string; ok: boolean; note: string }>>([]);
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

  const runHealth = async () => {
    const checks: Array<{ label: string; ok: boolean; note: string }> = [];
    const cloudReady = hasCloudConfig();
    checks.push({ label: 'Cloud config', ok: cloudReady, note: cloudReady ? 'URL + anon key present' : 'Local demo mode' });
    let storageOk = false;
    try { localStorage.setItem('gws3_health', '1'); localStorage.removeItem('gws3_health'); storageOk = true; } catch { /* unavailable */ }
    checks.push({ label: 'Device storage', ok: storageOk, note: storageOk ? 'Writable' : 'Browser blocked storage' });
    const swOk = 'serviceWorker' in navigator;
    checks.push({ label: 'Offline support', ok: swOk, note: swOk ? 'Service worker supported' : 'No service worker in this browser' });
    if (cloudReady && supabaseClient()) {
      try {
        const { error } = await supabaseClient()!.from('app_users').select('id').limit(1);
        checks.push({ label: 'PostgreSQL schema', ok: !error, note: error ? error.message : 'app_users responded' });
      } catch (e) { checks.push({ label: 'PostgreSQL schema', ok: false, note: e instanceof Error ? e.message : 'Unreachable' }); }
    } else {
      checks.push({ label: 'PostgreSQL schema', ok: false, note: 'Not executed in local demo' });
    }
    setHealth(checks);
    setToast('Health check complete.');
  };

  const trainingNote = `# Glacier ERP v3 — launch note
1. Export v2 browser backups from every old device; keep two read-only copies.
2. Enter Supabase URL + anon key in Administration → Cloud setup, then execute schema.sql.
3. Capture auditor approval for GSTIN, address, HSN, GST rates and opening balances.
4. Import backup, reconcile counts/totals, record owner + accountant sign-off.
5. Verify A4 invoice, 80 mm receipt, FEFO dispatch and attachment upload on a real device.
Reports are working papers, not tax advice.`;

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

    <div className="grid two" style={{ marginTop: 16 }}>
      <Card>
        <div className="card-head"><h2>Approvals & sign-off</h2><Chip tone={approvalsComplete(approvals) ? 'ok' : 'warn'}>{approvalsComplete(approvals) ? 'Approved' : 'Pending'}</Chip></div>
        <div style={{ display: 'grid', gap: 10 }}>
          <Field label="Auditor name"><input className="input" value={approvals.auditorName} onChange={(e) => setApprovalRecord({ ...approvals, auditorName: e.target.value })} /></Field>
          <Field label="Approval reference"><input className="input" value={approvals.reference} onChange={(e) => setApprovalRecord({ ...approvals, reference: e.target.value })} /></Field>
          {(['gstin', 'address', 'hsn', 'rates', 'opening'] as const).map((key) => {
            const labels: Record<string, string> = { gstin: 'GSTIN approved', address: 'Address & state approved', hsn: 'HSN approved', rates: 'GST rates approved', opening: 'Opening balances approved' };
            return <Field key={key} label={labels[key]}><input className="input" type="checkbox" checked={approvals[key]} onChange={(e) => setApprovalRecord({ ...approvals, [key]: e.target.checked })} style={{ width: 'auto', minHeight: 0 }} /></Field>;
          })}
          <Btn variant="primary" onClick={() => {
            const next = { ...approvals, approvedAt: new Date().toISOString() };
            const record = approvalsComplete(next) ? next : { ...next, approvedAt: '' };
            saveApprovals(record); setApprovalRecord(record);
            setToast(record.approvedAt ? 'Approval register signed.' : 'Saved pending approval register.');
          }}>Save approval register</Btn>
        </div>
      </Card>
      <Card>
        <div className="card-head"><h2>Reconciliation sign-off</h2><Chip tone={reconciliationComplete(recon) ? 'ok' : 'warn'}>{reconciliationComplete(recon) ? 'Signed' : 'Pending'}</Chip></div>
        <div style={{ display: 'grid', gap: 10 }}>
          <Field label="Imported rows"><input className="input" type="number" value={recon.importedRows} onChange={(e) => setRecon({ ...recon, importedRows: Number(e.target.value) })} /></Field>
          <Field label="Matched rows"><input className="input" type="number" value={recon.matchedRows} onChange={(e) => setRecon({ ...recon, matchedRows: Number(e.target.value) })} /></Field>
          <Field label="Variance"><input className="input" type="number" step="0.01" value={recon.variancePaise / 100} onChange={(e) => setRecon({ ...recon, variancePaise: Math.round(Number(e.target.value) * 100) })} /></Field>
          <Field label="Owner sign-off"><input className="input" value={recon.ownerSignoff} onChange={(e) => setRecon({ ...recon, ownerSignoff: e.target.value })} /></Field>
          <Field label="Accountant sign-off"><input className="input" value={recon.accountantSignoff} onChange={(e) => setRecon({ ...recon, accountantSignoff: e.target.value })} /></Field>
          <Field label="Notes" full><textarea className="input" rows={2} value={recon.notes} onChange={(e) => setRecon({ ...recon, notes: e.target.value })} /></Field>
          <Btn variant="primary" onClick={() => {
            const next = { ...recon, signedAt: new Date().toISOString() };
            const record = reconciliationComplete(next) ? next : { ...next, signedAt: '' };
            saveReconciliation(record); setRecon(record);
            setToast(record.signedAt ? 'Reconciliation signed.' : `Reconciliation saved; variance ${formatMoney(record.variancePaise)}.`);
          }}>Save reconciliation</Btn>
        </div>
      </Card>
    </div>

    <Card style={{ marginTop: 16 }}>
      <div className="card-head"><h2>Health check & launch note</h2><Btn small onClick={() => void runHealth()}><Icon name="check" size={14} /> Run health check</Btn></div>
      <div style={{ display: 'grid', gap: 10 }}>
        <Btn onClick={() => downloadText('glacier-v3-launch-note.md', trainingNote)}><Icon name="download" size={15} /> Download launch/training note</Btn>
        {health.length === 0 ? <p className="muted" style={{ margin: 0 }}>Run a check to verify cloud config, device storage, offline support and schema reachability.</p>
          : health.map((check) => <div key={check.label} className="fefo-row"><Chip tone={check.ok ? 'ok' : 'warn'}>{check.ok ? 'PASS' : 'CHECK'}</Chip><strong>{check.label}</strong><span className="muted">{check.note}</span></div>)}
      </div>
    </Card>

    <Card style={{ marginTop: 16 }}>
      <div className="card-head"><h2>Audit log</h2><div style={{ display: 'flex', gap: 8 }}><Chip>{audit.length} shown</Chip><Btn small onClick={() => exportCsv('audit-log.csv', audit, ['at', 'actor', 'action', 'entity', 'summary'])}>CSV</Btn></div></div>
      {audit.length === 0 ? <Empty text="No audit entries yet." /> : <div className="table-wrap"><table><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead><tbody>{audit.map((a, i) => <tr key={String(a.id || i)}><td className="mono">{String(a.at || a.createdAt || '')}</td><td>{String(a.actor || '')}</td><td><Chip>{String(a.action || '')}</Chip></td><td className="mono">{String(a.entity || '')}</td></tr>)}</tbody></table></div>}
    </Card>
    {toast && <div className="toast" role="status">{toast}</div>}
    <p className="muted" style={{ marginTop: 14 }}>Signed in as {actor}. Reports are working papers, not tax advice; GST setup needs auditor approval.</p>
  </>;
}
