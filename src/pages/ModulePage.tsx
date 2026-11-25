import { useCallback, useEffect, useMemo, useState } from 'react';
import { Btn, Chip, Empty, Field, Icon } from '../components/ui';
import { formatMoney, toPaise } from '../lib/calc';
import { getCompanyConfig } from '../lib/config';
import { exportCsv, printRows } from '../lib/exports';
import { findModule, type ModuleConfig } from '../lib/modules';
import { can } from '../lib/permissions';
import { printInvoiceA4, printInvoice80mm } from '../lib/printDocs';
import { audit, cancelDocument, deleteRow, listRows, postDocument, saveRow } from '../lib/store';
import type { Role, Row } from '../lib/types';
import { readUpload, storagePathFor } from '../lib/upload';

type FormState = Record<string, string | boolean>;

function renderCell(column: string, value: unknown) {
  if (value === undefined || value === null || value === '') return <span className="muted">—</span>;
  if (column === 'status' || String(value) === 'Posted' || String(value) === 'Cancelled' || String(value) === 'Held') {
    const tone = String(value) === 'Posted' || String(value) === 'Released' ? 'ok' : String(value) === 'Cancelled' || String(value) === 'Rejected' ? 'danger' : 'warn';
    return <Chip tone={tone}>{String(value)}</Chip>;
  }
  if (column.endsWith('Paise') && typeof value === 'number') return formatMoney(value);
  if (typeof value === 'boolean') return <Chip tone={value ? 'ok' : ''}>{value ? 'Yes' : 'No'}</Chip>;
  return <span className="mono">{String(value)}</span>;
}

export function ModulePage({ moduleKey, role, actor }: { moduleKey: string; role: Role; actor: string }) {
  const mod = findModule(moduleKey) as ModuleConfig | undefined;
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);
  const [form, setForm] = useState<FormState>({});
  const [toast, setToast] = useState<{ text: string; err?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelRow, setCancelRow] = useState<Row | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    if (!mod) return;
    try { setRows(await listRows(mod.key)); }
    catch (e) { setToast({ text: e instanceof Error ? e.message : 'Load failed.', err: true }); }
  }, [mod]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((row) => mod?.columns.some((c) => String(row[c] ?? '').toLowerCase().includes(q)));
  }, [rows, search, mod]);

  if (!mod) return <div className="card">Unknown module: {moduleKey}</div>;
  if (mod.sensitive && !can(role, 'costs')) return <div className="card"><h2>Restricted</h2><p className="muted">Your role cannot view cost, profit or full accounts data.</p></div>;

  const openForm = (row?: Row) => {
    const initial: FormState = {};
    for (const field of mod.fields) {
      const value = row ? row[field.name] : field.default;
      initial[field.name] = field.type === 'checkbox' ? Boolean(value) : value === undefined || value === null ? (field.type === 'date' ? new Date().toISOString().slice(0, 10) : '') : String(value);
      if (field.type === 'file') initial[`${field.name}Name`] = row ? String(row[`${field.name}Name`] ?? '') : '';
    }
    setForm(initial);
    setEditing(row === undefined ? null : row);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      for (const field of mod.fields) {
        if (field.required && !String(form[field.name] ?? '').trim()) throw new Error(`${field.label} is required.`);
      }
      const payload: Record<string, unknown> = { ...(editing || {}) };
      for (const field of mod.fields) {
        const value = form[field.name];
        payload[field.name] = field.type === 'checkbox' ? Boolean(value)
          : field.type === 'number' ? Number(value || 0)
          : field.type === 'money' ? toPaise(String(value ?? '0'))
          : String(value ?? '');
        if (field.type === 'file') {
          const fileName = String(form[`${field.name}Name`] ?? '');
          payload[`${field.name}Name`] = fileName;
          payload[`${field.name}StoragePath`] = storagePathFor(mod.key, String(payload.id || 'new'), fileName || 'file');
        }
      }
      if (mod.key === 'attachments') {
        if (!String(payload.name ?? '').trim() && form.fileName) payload.name = String(form.fileName);
        if (!String(payload.url ?? '').trim() && payload.file) payload.url = String(payload.file);
      }
      if (mod.statusField && !payload.status) payload.status = 'Draft';
      await saveRow(mod.key, payload as Row);
      await audit(actor, editing ? 'edit' : 'create', mod.key, `${editing ? 'Updated' : 'Created'} ${String(payload.id || '')}`);
      setEditing(undefined);
      setToast({ text: 'Saved.' });
      await load();
    } catch (err) { setToast({ text: err instanceof Error ? err.message : 'Save failed.', err: true }); }
    finally { setBusy(false); }
  };

  const pickFile = async (fieldName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const uploaded = await readUpload(file);
      setForm((current) => ({ ...current, [fieldName]: uploaded.dataUrl, [`${fieldName}Name`]: uploaded.name }));
      setToast({ text: `${uploaded.name} attached.` });
    } catch (err) { setToast({ text: err instanceof Error ? err.message : 'Upload failed.', err: true }); }
    finally { setBusy(false); event.target.value = ''; }
  };

  const doAction = async (row: Row, action: 'post' | 'delete') => {
    try {
      setBusy(true);
      if (action === 'post') {
        if (!window.confirm('Post this document? Stock and ledger entries will be created.')) return;
        await postDocument(mod.key, row, actor);
        setToast({ text: 'Posted with stock/ledger entries.' });
      } else {
        if (!window.confirm('Delete this record? This is audited and cannot be undone.')) return;
        await deleteRow(mod.key, String(row.id), actor, 'User requested deletion');
        setToast({ text: 'Deleted.' });
      }
      await load();
    } catch (err) { setToast({ text: err instanceof Error ? err.message : 'Action failed.', err: true }); }
    finally { setBusy(false); }
  };

  const confirmCancel = async () => {
    if (!cancelRow) return;
    if (!cancelReason.trim()) { setToast({ text: 'Reason is required.', err: true }); return; }
    try {
      setBusy(true);
      await cancelDocument(mod.key, cancelRow, actor, cancelReason.trim());
      setCancelRow(null); setCancelReason('');
      setToast({ text: 'Cancelled with reversal entries.' });
      await load();
    } catch (err) { setToast({ text: err instanceof Error ? err.message : 'Cancel failed.', err: true }); }
    finally { setBusy(false); }
  };

  return <>
    <div className="toolbar">
      <input className="input" placeholder={`Search ${mod.title.toLowerCase()}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
      {can(role, 'create') && <Btn variant="primary" onClick={() => openForm()}><Icon name="plus" size={15} /> Add {mod.title.replace(/s$/, '')}</Btn>}
      {can(role, 'export') && <Btn onClick={() => exportCsv(`${mod.key}.csv`, filtered, mod.columns)}><Icon name="download" size={15} /> CSV</Btn>}
      {can(role, 'export') && <Btn onClick={() => printRows(mod.title, filtered, mod.columns)}><Icon name="reports" size={15} /> Print / PDF</Btn>}
    </div>
    <div className="table-wrap">
      {filtered.length === 0 ? <Empty text={`No ${mod.title.toLowerCase()} found. Add a record or import a backup.`} /> :
        <table><thead><tr>{mod.columns.map((c) => <th key={c}>{c.replace(/Paise$/, '').replace(/([A-Z])/g, ' $1')}</th>)}<th>Actions</th></tr></thead>
          <tbody>{filtered.map((row) => <tr key={String(row.id)}>
            {mod.columns.map((c) => <td key={c}>{renderCell(c, row[c])}</td>)}
            <td><div className="row-actions">
              {can(role, 'edit') && <Btn small onClick={() => openForm(row)} aria-label="Edit"><Icon name="edit" size={14} /></Btn>}
              {mod.key === 'invoices' && can(role, 'export') && <>
                <Btn small onClick={() => printInvoiceA4(row, getCompanyConfig())} aria-label="Print A4 invoice">A4</Btn>
                <Btn small onClick={() => printInvoice80mm(row, getCompanyConfig())} aria-label="Print 80 mm receipt">80mm</Btn>
              </>}
              {mod.postable && can(role, 'post') && row.status !== 'Posted' && row.status !== 'Cancelled' && <Btn small variant="primary" onClick={() => void doAction(row, 'post')} disabled={busy} aria-label="Post"><Icon name="check" size={14} /></Btn>}
              {row.status !== 'Cancelled' && can(role, 'cancel') && <Btn small onClick={() => { setCancelRow(row); setCancelReason(''); }} aria-label="Cancel"><Icon name="ban" size={14} /></Btn>}
              {can(role, 'delete') && <Btn small variant="danger" onClick={() => void doAction(row, 'delete')} disabled={busy} aria-label="Delete"><Icon name="trash" size={14} /></Btn>}
            </div></td>
          </tr>)}</tbody></table>}
    </div>

    {editing !== undefined && <div className="modal-back" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-head"><h2>{editing ? 'Edit' : 'Add'} {mod.title.replace(/s$/, '')}</h2><button className="btn ghost small" onClick={() => setEditing(undefined)} aria-label="Close"><Icon name="close" /></button></div>
        <form onSubmit={submit}>
          <div className="modal-body">{mod.fields.map((field) => <Field key={field.name} label={field.label} full={field.type === 'textarea' || field.type === 'file'}>
            {field.type === 'select' ? <select className="input" value={String(form[field.name] ?? '')} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}>
              <option value="">—</option>{field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            : field.type === 'textarea' ? <textarea className="input" rows={3} value={String(form[field.name] ?? '')} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />
            : field.type === 'checkbox' ? <input className="input" type="checkbox" checked={Boolean(form[field.name])} onChange={(e) => setForm({ ...form, [field.name]: e.target.checked })} style={{ width: 'auto', minHeight: 0 }} />
            : field.type === 'file' ? <div className="file-field">
              <input className="input" type="file" accept="image/*,application/pdf" aria-label={field.label} onChange={(e) => void pickFile(field.name, e)} />
              {form[field.name]
                ? <span className="file-chip"><Icon name="upload" size={13} /> {String(form[`${field.name}Name`] ?? 'Attached')} <button type="button" onClick={() => setForm((current) => ({ ...current, [field.name]: '', [`${field.name}Name`]: '' }))} aria-label="Remove attachment"><Icon name="close" size={13} /></button></span>
                : <span className="muted file-hint">No file attached</span>}
            </div>
            : <input className="input" type={field.type === 'date' ? 'date' : field.type === 'number' || field.type === 'money' ? 'number' : 'text'} step={field.type === 'money' ? '0.01' : undefined} value={String(form[field.name] ?? '')} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} />}
          </Field>)}
          {mod.fields.some((field) => field.type === 'file') && <p className="file-note">Demo mode: files are saved on this device only (images compressed to 1280px). After Supabase setup they move to the private Storage bucket.</p>}</div>
          <div className="modal-foot"><Btn onClick={() => setEditing(undefined)}>Cancel</Btn><Btn type="submit" variant="primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Btn></div>
        </form>
      </div>
    </div>}

    {cancelRow && <div className="modal-back" role="dialog" aria-modal="true"><div className="modal" style={{ width: 'min(460px,100%)' }}>
      <div className="modal-head"><h2>Cancel document</h2><button className="btn ghost small" onClick={() => setCancelRow(null)}><Icon name="close" /></button></div>
      <div className="modal-body" style={{ display: 'block' }}><Field label="Reason" full><textarea className="input" rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} /></Field><p className="muted">A reversal entry will be created. The original record stays in history.</p></div>
      <div className="modal-foot"><Btn onClick={() => setCancelRow(null)}>Keep</Btn><Btn variant="danger" onClick={() => void confirmCancel()} disabled={busy}>Cancel document</Btn></div>
    </div></div>}

    {toast && <div className={`toast${toast.err ? ' err' : ''}`} role="status">{toast.text}</div>}
  </>;
}
