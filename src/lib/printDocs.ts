import { calcTotals, formatMoney, lineTaxablePaise } from './calc';
import { getCompanyConfig } from './config';
import type { CompanyConfig, LineItem, Row } from './types';

export type InvoiceFormat = 'a4' | '80mm';

const esc = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function invoiceLines(row: Row, company: CompanyConfig): LineItem[] {
  return [{
    productId: String(row.productId ?? ''),
    description: String(row.description ?? row.productId ?? 'Item'),
    hsn: String(row.hsn ?? company.hsn ?? ''),
    qty: num(row.qty) || 1,
    ratePaise: num(row.ratePaise),
    discountPaise: num(row.discountPaise),
    gstRate: num(row.gstRate) || num(company.defaultGstRate)
  }];
}

function isInterState(row: Row): boolean {
  return /other/i.test(String(row.placeOfSupply ?? ''));
}

export function invoiceTotals(row: Row, company: CompanyConfig) {
  return calcTotals(invoiceLines(row, company), isInterState(row), num(row.freightPaise));
}

function lineGross(line: LineItem): number {
  const taxable = lineTaxablePaise(line, false);
  return taxable + Math.round((taxable * Math.max(0, line.gstRate)) / 100);
}

function a4Html(row: Row, company: CompanyConfig, lines: LineItem[]): string {
  const t = invoiceTotals(row, company);
  const inter = isInterState(row);
  const paid = num(row.paidPaise);
  const balance = Math.max(0, t.grandPaise - paid);
  const invoiceNo = String(row.invoiceNo ?? row.refNo ?? row.id ?? '');
  const party = String(row.customerName ?? row.customerId ?? '—');
  const address = esc(company.address).replace(/\n/g, '<br>');
  const items = lines.map((line) => {
    const taxable = lineTaxablePaise(line, false);
    const tax = Math.round((taxable * Math.max(0, line.gstRate)) / 100);
    return `<tr><td>${esc(line.description)}</td><td class="mono">${esc(line.hsn)}</td><td class="num">${line.qty}</td><td class="num">${formatMoney(line.ratePaise)}</td><td class="num">${formatMoney(line.discountPaise)}</td><td class="num">${formatMoney(taxable)}</td><td class="num">${line.gstRate}%</td><td class="num">${formatMoney(taxable + tax)}</td></tr>`;
  }).join('');
  const taxRows = inter
    ? `<tr><th>IGST</th><td>${formatMoney(t.igstPaise)}</td></tr>`
    : `<tr><th>CGST</th><td>${formatMoney(t.cgstPaise)}</td></tr><tr><th>SGST</th><td>${formatMoney(t.sgstPaise)}</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(invoiceNo)} — Tax Invoice</title><style>
    @page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;color:#102a3b;margin:0;font-size:12px}
    .sheet{border:1px solid #d7e5ec;border-radius:10px;padding:22px}
    header{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #0e7490;padding-bottom:14px}
    header h1{font-size:20px;margin:0 0 6px;color:#0e7490}.stamp{font-size:18px;font-weight:700;letter-spacing:2px;color:#0e7490}
    .small{font-size:11px;color:#4b6475;line-height:1.5}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
    .meta div{background:#f4f9fb;border-radius:8px;padding:10px}.meta b{display:block;font-size:10px;text-transform:uppercase;color:#5b7688;margin-bottom:3px}
    table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #d7e5ec;padding:7px;text-align:left}th{background:#eef7fa;font-size:10px;text-transform:uppercase;letter-spacing:.4px}
    .num{text-align:right}.mono{font-family:ui-monospace,Menlo,monospace;font-size:11px}.totals{width:46%;margin-left:auto;margin-top:14px}.totals th{width:58%}
    footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:26px;font-size:11px;color:#4b6475}
    .sign{border-top:1px solid #7d94a3;padding-top:6px;min-width:180px;text-align:center}
    button{background:#0e7490;color:#fff;border:0;border-radius:8px;padding:9px 14px;cursor:pointer;margin-bottom:12px}
    @media print{button{display:none}.sheet{border:0;padding:0}}
  </style></head><body><button onclick="print()">Print / Save PDF</button><div class="sheet">
    <header><div><h1>${esc(company.legalName)}</h1><div class="small">GSTIN: ${esc(company.gstin)}<br>${address}<br>State: ${esc(company.state)} · HSN: ${esc(company.hsn)}</div></div><div class="stamp">TAX INVOICE<br><span class="small">${esc(row.status ?? 'Draft')}</span></div></header>
    <div class="meta"><div><b>Invoice</b>${esc(invoiceNo)}<br><b>Date</b>${esc(row.date ?? '')}<br><b>Place of supply</b>${esc(row.placeOfSupply ?? '')}</div><div><b>Customer</b>${esc(party)}<br><b>Customer ID</b>${esc(row.customerId ?? '')}<br><b>Payment</b>${esc(row.paymentMode ?? '')}</div></div>
    <table><thead><tr><th>Item</th><th>HSN</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Disc.</th><th class="num">Taxable</th><th class="num">GST</th><th class="num">Amount</th></tr></thead><tbody>${items}</tbody></table>
    <table class="totals"><tbody><tr><th>Taxable value</th><td>${formatMoney(t.taxablePaise)}</td></tr>${taxRows}<tr><th>Round off</th><td>${formatMoney(t.roundOffPaise)}</td></tr><tr><th><b>Grand total</b></th><td><b>${formatMoney(t.grandPaise)}</b></td></tr><tr><th>Paid</th><td>${formatMoney(paid)}</td></tr><tr><th>Balance</th><td>${formatMoney(balance)}</td></tr></tbody></table>
    <footer><div>Computer-generated invoice. GST breakup computed on taxable value.<br>Thank you for choosing ${esc(company.legalName)}.</div><div class="sign">For ${esc(company.legalName)}<br><br>Authorised signatory</div></footer>
  </div></body></html>`;
}

function receiptHtml(row: Row, company: CompanyConfig, lines: LineItem[]): string {
  const t = invoiceTotals(row, company);
  const inter = isInterState(row);
  const paid = num(row.paidPaise);
  const invoiceNo = String(row.invoiceNo ?? row.refNo ?? row.id ?? '');
  const party = String(row.customerName ?? row.customerId ?? '—');
  const items = lines.map((line) => `<div class="line"><span>${esc(line.description)} x${line.qty}</span><span>${formatMoney(lineGross(line))}</span></div>`).join('');
  const taxLine = inter
    ? `<div class="line"><span>IGST</span><span>${formatMoney(t.igstPaise)}</span></div>`
    : `<div class="line"><span>CGST</span><span>${formatMoney(t.cgstPaise)}</span></div><div class="line"><span>SGST</span><span>${formatMoney(t.sgstPaise)}</span></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(invoiceNo)} — Receipt</title><style>
    @page{size:80mm auto;margin:3mm}body{width:74mm;margin:0;font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#111}
    .center{text-align:center}.big{font-size:14px;font-weight:700}.rule{border-top:1px dashed #444;margin:7px 0}
    .line{display:flex;justify-content:space-between;gap:6px;margin:3px 0}.total{font-size:13px;font-weight:700}
    button{width:100%;padding:8px;margin-bottom:8px;background:#0e7490;color:#fff;border:0;border-radius:6px}
    @media print{button{display:none}}
  </style></head><body><button onclick="print()">Print 80 mm receipt</button>
    <div class="center big">${esc(company.legalName)}</div><div class="center">${esc(company.address).replace(/\n/g, ' ')}</div>
    <div class="center">GSTIN: ${esc(company.gstin)}</div><div class="rule"></div>
    <div class="center big">TAX INVOICE</div><div class="line"><span>No</span><span>${esc(invoiceNo)}</span></div>
    <div class="line"><span>Date</span><span>${esc(row.date ?? '')}</span></div><div class="line"><span>Customer</span><span>${esc(party)}</span></div>
    <div class="rule"></div>${items}<div class="rule"></div>
    <div class="line"><span>Taxable</span><span>${formatMoney(t.taxablePaise)}</span></div>${taxLine}
    <div class="line"><span>Round off</span><span>${formatMoney(t.roundOffPaise)}</span></div>
    <div class="line total"><span>TOTAL</span><span>${formatMoney(t.grandPaise)}</span></div>
    <div class="line"><span>Paid</span><span>${formatMoney(paid)}</span></div>
    <div class="line"><span>Balance</span><span>${formatMoney(Math.max(0, t.grandPaise - paid))}</span></div>
    <div class="rule"></div><div class="center">Thank you</div>
  </body></html>`;
}

export function printInvoice(row: Row, company: CompanyConfig, format: InvoiceFormat): boolean {
  const win = window.open('', '_blank');
  if (!win) return false;
  const lines = invoiceLines(row, company);
  const html = format === 'a4' ? a4Html(row, company, lines) : receiptHtml(row, company, lines);
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    try { win.focus(); win.print(); } catch { /* popup blocked or closed */ }
  }, 250);
  return true;
}

export function printInvoiceA4(row: Row, company = getCompanyConfig()): boolean {
  return printInvoice(row, company, 'a4');
}

export function printInvoice80mm(row: Row, company = getCompanyConfig()): boolean {
  return printInvoice(row, company, '80mm');
}
