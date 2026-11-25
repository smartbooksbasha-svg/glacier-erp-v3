export type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'money' | 'checkbox' | 'file';

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  default?: string | number | boolean;
};

export type ModuleConfig = {
  key: string;
  title: string;
  group: string;
  fields: Field[];
  columns: string[];
  postable?: boolean;
  sensitive?: boolean;
  statusField?: string;
};

const f = (name: string, label: string, type: FieldType = 'text', options?: string[], required = false, def?: string | number | boolean): Field => ({ name, label, type, options, required, default: def });

const STANDARD = ['id', 'date', 'status'];
const docDates = [f('date', 'Date', 'date', undefined, true), f('refNo', 'Reference No')];

export const MODULES: ModuleConfig[] = [
  // Sales
  { key: 'customers', title: 'Customers', group: 'Sales', fields: [f('name', 'Customer name', 'text', undefined, true), f('phone', 'Phone'), f('gstin', 'GSTIN'), f('address', 'Address', 'textarea'), f('creditLimitPaise', 'Credit limit', 'money'), f('priceList', 'Price list', 'select', ['Retail', 'Wholesale', 'Distributor', 'Custom'])], columns: ['id', 'name', 'phone', 'gstin'] },
  { key: 'price_lists', title: 'Price Lists', group: 'Sales', fields: [f('name', 'List name', 'text', undefined, true), f('productId', 'Product ID'), f('ratePaise', 'Rate', 'money'), f('effectiveFrom', 'Effective from', 'date'), f('approved', 'Approved', 'checkbox', undefined, false, false)], columns: ['id', 'name', 'productId', 'ratePaise', 'approved'] },
  { key: 'quotations', title: 'Quotations', group: 'Sales', fields: [...docDates, f('customerId', 'Customer ID', 'text', undefined, true), f('validUntil', 'Valid until', 'date'), f('description', 'Description', 'textarea'), f('amountPaise', 'Amount', 'money')], columns: STANDARD.concat(['customerId', 'amountPaise']), postable: true, statusField: 'status' },
  { key: 'sales_orders', title: 'Sales Orders', group: 'Sales', fields: [...docDates, f('customerId', 'Customer ID', 'text', undefined, true), f('deliveryDate', 'Delivery date', 'date'), f('description', 'Description', 'textarea'), f('amountPaise', 'Amount', 'money')], columns: STANDARD.concat(['customerId', 'amountPaise']), postable: true },
  { key: 'invoices', title: 'Invoices', group: 'Sales', fields: [...docDates, f('invoiceNo', 'Invoice No', 'text', undefined, true), f('customerId', 'Customer ID', 'text', undefined, true), f('productId', 'Product ID', 'text', undefined, true), f('placeOfSupply', 'Place of supply', 'select', ['Same State', 'Other State']), f('description', 'Item description', 'textarea', undefined, true),
 f('qty', 'Quantity', 'number', undefined, true), f('ratePaise', 'Rate', 'money', undefined, true), f('discountPaise', 'Discount', 'money'), f('gstRate', 'GST %', 'number', undefined, false, 0), f('freightPaise', 'Freight', 'money'), f('paymentMode', 'Payment mode', 'select', ['Cash', 'UPI', 'Bank', 'Cheque', 'Credit', 'Split']), f('paidPaise', 'Paid amount', 'money')], columns: STANDARD.concat(['invoiceNo', 'customerId', 'grandPaise', 'paidPaise']), postable: true, statusField: 'status' },
  { key: 'challans', title: 'Delivery Challans', group: 'Sales', fields: [...docDates, f('customerId', 'Customer ID'), f('productId', 'Product ID'), f('description', 'Description', 'textarea'), f('qty', 'Quantity', 'number')],
 columns: STANDARD.concat(['customerId', 'qty']), postable: true },
  { key: 'sales_returns', title: 'Sales Returns / Credit Notes', group: 'Sales', fields: [...docDates, f('invoiceId', 'Invoice ID'), f('reason', 'Reason', 'textarea', undefined, true), f('qty', 'Quantity', 'number'), f('amountPaise', 'Credit amount', 'money')], columns: STANDARD.concat(['invoiceId', 'amountPaise']), postable: true },
  { key: 'receipts', title: 'Receipts', group: 'Sales', fields: [...docDates, f('customerId', 'Customer ID', 'text', undefined, true), f('amountPaise', 'Amount', 'money', undefined, true), f('mode', 'Mode', 'select', ['Cash', 'UPI', 'Bank', 'Cheque']), f('reference', 'Reference')], columns: STANDARD.concat(['customerId', 'amountPaise', 'mode']) },

  // Purchase
  { key: 'suppliers', title: 'Suppliers', group: 'Purchase', fields: [f('name', 'Supplier name', 'text', undefined, true), f('phone', 'Phone'), f('gstin', 'GSTIN'), f('address', 'Address', 'textarea'), f('itcEligible', 'ITC eligible by default', 'checkbox', undefined, false, false)], columns: ['id', 'name', 'phone', 'gstin'] },
  { key: 'purchase_orders', title: 'Purchase Orders', group: 'Purchase', fields: [...docDates, f('supplierId', 'Supplier ID', 'text', undefined, true), f('productId', 'Product ID'), f('description', 'Description', 'textarea'), f('qty', 'Quantity', 'number'), f('ratePaise', 'Rate', 'money')],
 columns: STANDARD.concat(['supplierId', 'qty']), postable: true },
  { key: 'goods_receipts', title: 'Goods Receipt Notes', group: 'Purchase', fields: [...docDates, f('poId', 'Purchase Order ID'), f('productId', 'Product ID', 'text', undefined, true), f('qty', 'Quantity received', 'number', undefined, true), f('batchNo', 'Batch / lot')], columns: STANDARD.concat(['poId', 'productId', 'qty']), postable: true },
  { key: 'bills', title: 'Supplier Bills', group: 'Purchase', fields: [...docDates, f('supplierBillNo', 'Supplier bill no', 'text', undefined, true), f('supplierId', 'Supplier ID', 'text', undefined, true), f('productId', 'Product ID'), f('description', 'Description', 'textarea'), f('qty', 'Quantity', 'number'), f('ratePaise', 'Rate', 'money'), f('gstRate', 'GST %', 'number', undefined, false, 0), f('itcStatus', 'ITC status',
 'select', ['Pending review', 'Eligible', 'Ineligible', 'Matched', 'Unmatched']), f('billFile', 'Supplier bill scan', 'file')], columns: STANDARD.concat(['supplierBillNo', 'supplierId', 'itcStatus']), postable: true },
  { key: 'purchase_returns', title: 'Purchase Returns / Debit Notes', group: 'Purchase', fields: [...docDates, f('billId', 'Bill ID'), f('productId', 'Product ID'), f('qty', 'Quantity', 'number'), f('reason', 'Reason', 'textarea')], columns: STANDARD.concat(['billId', 'qty']), postable: true },
  { key: 'supplier_payments', title: 'Supplier Payments', group: 'Purchase', fields: [...docDates, f('supplierId', 'Supplier ID', 'text', undefined, true), f('amountPaise', 'Amount', 'money', undefined, true), f('mode', 'Mode', 'select', ['Cash', 'UPI', 'Bank', 'Cheque']), f('reference', 'Reference')], columns: STANDARD.concat(['supplierId', 'amountPaise', 'mode']) },

  // Inventory
  { key: 'products', title: 'Products', group: 'Inventory', fields: [f('name', 'Product name', 'text', undefined, true), f('sku', 'SKU', 'text', undefined, true), f('type', 'Type', 'select', ['Finished goods', 'Raw material', 'Packaging', 'Consumable', 'Service', 'Non-stock']), f('unit', 'Base unit', 'select', ['Bottle', 'Case', 'Kg', 'Piece', 'Litre']), f('perCase', 'Bottles per case', 'number', undefined, false, 24), f('hsn', 'HSN'), f('gstRate', 'GST %', 'number', undefined, false, 0), f('mrpPaise', 'MRP', 'money'), f('salePaise', 'Sale price', 'money'), f('purchasePaise', 'Purchase price', 'money'), f('reorderLevel', 'Reorder level', 'number')], columns: ['id', 'name', 'sku', 'type', 'perCase', 'reorderLevel'], sensitive: true },
  { key: 'batches', title: 'Stock Batches', group: 'Inventory', fields: [f('batchNo', 'Batch No', 'text', undefined, true), f('productId', 'Product ID', 'text', undefined, true), f('mfgDate', 'Manufacturing date', 'date'), f('expiryDate', 'Expiry date', 'date'), f('qty', 'Quantity', 'number'), f('qcStatus', 'QC status', 'select', ['Awaiting QC', 'Released', 'On Hold', 'Rejected'])], columns: ['id', 'batchNo', 'productId', 'expiryDate', 'qcStatus'] },
  { key: 'stock_movements', title: 'Stock Ledger', group: 'Inventory', fields: [...docDates, f('productId', 'Product ID', 'text', undefined, true), f('direction', 'Direction', 'select', ['in', 'out'], true, 'in'), f('qty', 'Quantity', 'number', undefined, true), f('batchNo', 'Batch / lot'), f('reason', 'Reason', 'textarea'), f('posted', 'Posted', 'checkbox', undefined, false, false)], columns: STANDARD.concat(['productId', 'direction', 'qty', 'batchNo']) },
  { key: 'stock_counts', title: 'Physical Count Sheets', group: 'Inventory', fields: [...docDates, f('productId', 'Product ID'), f('countedQty', 'Counted quantity', 'number'), f('systemQty', 'System quantity', 'number'), f('reason', 'Reason', 'textarea')], columns: STANDARD.concat(['productId', 'countedQty', 'systemQty']) },
  { key: 'stock_adjustments', title: 'Stock Adjustments', group: 'Inventory', fields: [...docDates, f('productId', 'Product ID', 'text', undefined, true), f('delta', 'Delta (+/-)', 'number', undefined, true), f('reason', 'Reason', 'textarea', undefined, true)], columns: STANDARD.concat(['productId', 'delta']), postable: true },

  // Manufacturing
  { key: 'boms', title: 'BOM / Recipes', group: 'Manufacturing', fields: [f('name', 'BOM name', 'text', undefined, true), f('productId', 'Finished product ID', 'text', undefined, true), f('materials', 'Materials (text)', 'textarea', undefined, true), f('expectedOutput', 'Expected output', 'number'), f('rejectPct', 'Reject %', 'number')], columns: ['id', 'name', 'productId', 'expectedOutput'], sensitive: true },
  { key: 'production_plans', title: 'Production Plans', group: 'Manufacturing', fields: [...docDates, f('productId', 'Product ID', 'text', undefined, true), f('shift', 'Shift', 'select', ['Morning', 'Evening', 'Night']), f('targetOutput', 'Target output', 'number', undefined, true)], columns: STANDARD.concat(['productId', 'shift', 'targetOutput']) },
  { key: 'production_batches', title: 'Production Batches', group: 'Manufacturing', fields: [f('batchNo', 'Batch No', 'text', undefined, true), f('date', 'Date', 'date', undefined, true), f('productId', 'Product ID', 'text', undefined, true), f('shift', 'Shift', 'select', ['Morning', 'Evening', 'Night']), f('operator', 'Operator'), f('startTime', 'Start time'), f('endTime', 'End time'), f('goodOutput', 'Good output', 'number', undefined, true), f('rejectedOutput', 'Rejected output', 'number'), f('rework', 'Rework', 'number'), f('standardLabourPaise', 'Standard labour', 'money'), f('labourPaise', 'Actual labour', 'money'), f('standardOverheadPaise', 'Standard overhead', 'money'), f('overheadPaise', 'Actual overhead', 'money'), f('electricityPaise', 'Electricity', 'money'), f('approved', 'Costing approved', 'checkbox', undefined, false, false), f('notes', 'Notes', 'textarea')], columns: ['id', 'batchNo', 'productId', 'goodOutput', 'rejectedOutput', 'status'], postable: true },
  { key: 'consumptions', title: 'Material Consumption', group: 'Manufacturing', fields: [...docDates, f('batchNo', 'Batch No'), f('materialId', 'Material ID', 'text', undefined, true), f('qty', 'Actual qty', 'number', undefined, true), f('standardQty', 'Standard qty', 'number'), f('ratePaise', 'Actual rate', 'money'), f('standardRatePaise', 'Standard rate', 'money'), f('reason', 'Variance reason', 'textarea')], columns: STANDARD.concat(['batchNo', 'materialId', 'qty']) },
  { key: 'rejects', title: 'Rejects & Scrap', group: 'Manufacturing', fields: [...docDates, f('batchNo', 'Batch No'), f('qty', 'Quantity', 'number'), f('reason', 'Reason', 'textarea', undefined, true), f('disposition', 'Disposition', 'select', ['Rework', 'Scrap', 'Destroy', 'Released'])], columns: STANDARD.concat(['batchNo', 'qty', 'disposition']) },

  // Quality
  { key: 'qc_tests', title: 'QC Test Register', group: 'Quality', fields: [f('sampleId', 'Sample ID', 'text', undefined, true), f('date', 'Date', 'date', undefined, true), f('batchNo', 'Batch No', 'text', undefined, true), f('parameter', 'Parameter', 'select', ['TDS', 'pH', 'Microbiology', 'Turbidity', 'Other']), f('measured', 'Measured value', 'text'), f('unit', 'Unit'), f('specification', 'Specification'), f('result', 'Result', 'select', ['Pass', 'Fail', 'Pending']), f('tester', 'Tester'), f('reviewer', 'Reviewer'), f('reportFile', 'Lab report', 'file')], columns: ['id', 'sampleId', 'batchNo', 'parameter', 'result'] },
  { key: 'qc_approvals', title: 'Batch Hold / Release', group: 'Quality', fields: [f('batchNo', 'Batch No', 'text', undefined, true), f('date', 'Date', 'date'), f('decision', 'Decision', 'select', ['Released', 'On Hold', 'Rejected'], true), f('authority', 'Release authority'), f('notes', 'Notes', 'textarea'), f('releaseFile', 'Release note', 'file')], columns: ['id', 'batchNo', 'decision', 'authority'], postable: true },
  { key: 'non_conformance', title: 'Non-Conformance / CAPA', group: 'Quality', fields: [...docDates, f('batchNo', 'Batch No'), f('issue', 'Issue', 'textarea', undefined, true), f('correctiveAction', 'Corrective action', 'textarea'), f('closed', 'Closed', 'checkbox', undefined, false, false)], columns: STANDARD.concat(['batchNo', 'issue', 'closed']) },

  // Delivery
  { key: 'dispatches', title: 'Dispatch Notes', group: 'Delivery', fields: [...docDates, f('orderId', 'Order / Invoice ID'), f('customerId', 'Customer ID', 'text', undefined, true), f('productId', 'Product ID'), f('batchNo', 'Batch / lot'), f('overrideReason', 'Override reason (if not FEFO-first)'), f('driver', 'Driver'), f('vehicle', 'Vehicle'), f('route', 'Route'), f('cases', 'Cases', 'number'),
  f('looseBottles', 'Loose bottles', 'number'), f('chargesPaise', 'Delivery charges', 'money')], columns: STANDARD.concat(['customerId', 'batchNo', 'driver', 'cases', 'looseBottles']), postable: true },
  { key: 'delivery_events', title: 'Delivery Events / POD', group: 'Delivery', fields: [...docDates, f('dispatchId', 'Dispatch ID', 'text', undefined, true), f('status', 'Status', 'select', ['Pending', 'Packed', 'Dispatched', 'Delivered', 'Part-delivered', 'Failed', 'Returned']), f('podFile', 'POD photo / file', 'file'), f('collectionPaise', 'Collection', 'money'), f('notes', 'Notes', 'textarea')], columns: STANDARD.concat(['dispatchId', 'podFile', 'collectionPaise']) },
  { key: 'returnables', title: 'Crates / Empty Bottles', group: 'Delivery', fields: [...docDates, f('customerId', 'Customer ID', 'text', undefined, true), f('issued', 'Issued', 'number'), f('returned', 'Returned', 'number'), f('depositPaise', 'Deposit', 'money')], columns: STANDARD.concat(['customerId', 'issued', 'returned']) },

  // Accounts
  { key: 'accounts', title: 'Chart of Accounts', group: 'Accounts', fields: [f('name', 'Account name', 'text', undefined, true), f('code', 'Code'), f('type', 'Type', 'select', ['Asset', 'Liability', 'Income', 'Expense', 'Capital']), f('openingPaise', 'Opening balance', 'money')], columns: ['id', 'name', 'code', 'type'], sensitive: true },
  { key: 'cash_bank', title: 'Cash / Bank Book', group: 'Accounts', fields: [...docDates, f('accountId', 'Account ID', 'text', undefined, true), f('direction', 'Direction', 'select', ['in', 'out'], true), f('amountPaise', 'Amount', 'money', undefined, true), f('reference', 'Reference'), f('reconciled', 'Reconciled', 'checkbox', undefined, false, false)], columns: STANDARD.concat(['accountId', 'direction', 'amountPaise']), sensitive: true },
  { key: 'expenses', title: 'Expense Vouchers', group: 'Accounts', fields: [...docDates, f('category', 'Category', 'text', undefined, true), f('payee', 'Payee'), f('amountPaise', 'Amount', 'money', undefined, true), f('gstRate', 'GST %', 'number'), f('proofFile', 'Proof file', 'file'), f('notes', 'Notes', 'textarea')], columns: STANDARD.concat(['category', 'amountPaise']), sensitive: true },
  { key: 'journals', title: 'Journal Vouchers', group: 'Accounts', fields: [...docDates, f('narration', 'Narration', 'textarea', undefined, true), f('debitAccount', 'Debit account', 'text', undefined, true), f('creditAccount', 'Credit account', 'text', undefined, true), f('amountPaise', 'Amount', 'money', undefined, true), f('reference', 'Reference')], columns: STANDARD.concat(['debitAccount', 'creditAccount', 'amountPaise']), postable: true, sensitive: true },
  { key: 'capital_drawings', title: 'Capital & Drawings', group: 'Accounts', fields: [...docDates, f('type', 'Type', 'select', ['Capital', 'Additional capital', 'Drawings'], true), f('amountPaise', 'Amount', 'money', undefined, true), f('notes', 'Notes', 'textarea')], columns: STANDARD.concat(['type', 'amountPaise']), sensitive: true },
  { key: 'fixed_assets', title: 'Fixed Asset Register', group: 'Accounts', fields: [f('name', 'Asset name', 'text', undefined, true), f('purchaseDate', 'Purchase date', 'date'), f('costPaise', 'Cost', 'money'), f('location', 'Location'), f('usefulLifeYears', 'Useful life (years)', 'number'), f('depreciationPolicy', 'Depreciation policy'), f('disposalDate', 'Disposal date', 'date')], columns: ['id', 'name', 'costPaise', 'location'], sensitive: true },
  { key: 'ledger_entries', title: 'Ledger Entries', group: 'Accounts', fields: [...docDates, f('partyType', 'Party type', 'select', ['Customer', 'Supplier', 'Account']), f('partyId', 'Party ID'), f('debitPaise', 'Debit', 'money'), f('creditPaise', 'Credit', 'money'), f('reference', 'Reference')], columns: STANDARD.concat(['partyId', 'debitPaise', 'creditPaise']), sensitive: true },

  // Reports / governance
  { key: 'month_locks', title: 'Month Lock / Reopen', group: 'Reports', fields: [f('month', 'Month (YYYY-MM)', 'text', undefined, true), f('locked', 'Locked', 'checkbox', undefined, false, true), f('reason', 'Reason', 'textarea'), f('actor', 'Actor')], columns: ['id', 'month', 'locked', 'actor'] },
  { key: 'audit_logs', title: 'Audit Log', group: 'Administration', fields: [f('at', 'Timestamp', 'text'), f('actor', 'Actor'), f('action', 'Action'), f('entity', 'Entity'), f('summary', 'Summary', 'textarea'), f('reason', 'Reason')], columns: ['at', 'actor', 'action', 'entity'] },
  { key: 'attachments', title: 'Attachment Index', group: 'Administration', fields: [f('name', 'File name', 'text', undefined, true), f('file', 'Choose file', 'file'), f('entity', 'Entity'), f('entityId', 'Entity ID'), f('url', 'Private URL'), f('uploadedBy', 'Uploaded by')], columns: ['id', 'name', 'entity', 'entityId'] },
  { key: 'import_jobs', title: 'Migration / Import Jobs', group: 'Administration', fields: [...docDates, f('source', 'Source device / file', 'text', undefined, true), f('rows', 'Rows', 'number'), f('rejected', 'Rejected rows', 'number'), f('status', 'Status', 'select', ['Staged', 'Imported', 'Reconciled', 'Rejected']), f('notes', 'Notes', 'textarea')], columns: STANDARD.concat(['source', 'rows', 'rejected']) }
];

export function modulesForGroup(group: string): ModuleConfig[] {
  return MODULES.filter((m) => m.group === group);
}

export function findModule(key: string): ModuleConfig | undefined {
  return MODULES.find((m) => m.key === key);
}
