import type { Row } from './types';

export function downloadText(filename: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  download(filename, content, mime);
}

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: unknown): string {
  const s = value === undefined || value === null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function exportCsv(filename: string, rows: Row[], columns: string[]): void {
  const header = columns.map(csvCell).join(',');
  const body = rows.map((row) => columns.map((c) => csvCell(row[c])).join(',')).join('\n');
  download(filename, `${header}\n${body}`, 'text/csv;charset=utf-8');
}

function xmlEscape(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function exportExcel(filename: string, sheets: Array<{ name: string; rows: Row[]; columns: string[] }>): void {
  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheets.map((sheet) => `<Worksheet ss:Name="${xmlEscape(sheet.name)}"><Table>
<tr>${sheet.columns.map((c) => `<Cell><Data ss:Type="String">${xmlEscape(c)}</Data></Cell>`).join('')}</tr>
${sheet.rows.map((row) => `<tr>${sheet.columns.map((c) => {
  const value = row[c];
  const numeric = typeof value === 'number' && Number.isFinite(value);
  return `<Cell><Data ss:Type="${numeric ? 'Number' : 'String'}">${xmlEscape(value)}</Data></Cell>`;
}).join('')}</tr>`).join('\n')}
</Table></Worksheet>`).join('\n')}
</Workbook>`;
  download(filename, xml, 'application/vnd.ms-excel;charset=utf-8');
}

export function exportJson(filename: string, data: unknown): void {
  download(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
}

export function printRows(title: string, rows: Row[], columns: string[]): void {
  const win = window.open('', '_blank');
  if (!win) return;
  const head = columns.map((c) => `<th>${xmlEscape(c)}</th>`).join('');
  const body = rows.map((r) => `<tr>${columns.map((c) => `<td>${xmlEscape(r[c])}</td>`).join('')}</tr>`).join('');
  win.document.write(`<!doctype html><html><head><title>${xmlEscape(title)}</title><style>
    body{font-family:Arial,sans-serif;padding:24px;color:#12263a}h1{font-size:20px;margin:0 0 16px}
    table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #cbd8e3;padding:6px;text-align:left}
    th{background:#eaf3fa}@media print{button{display:none}}
  </style></head><body><h1>${xmlEscape(title)}</h1><button onclick="print()">Print / Save PDF</button><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 300);
}
