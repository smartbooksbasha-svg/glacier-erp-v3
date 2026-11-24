export type Role = 'owner' | 'admin' | 'accountant' | 'sales' | 'production' | 'auditor';

export type Row = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  status?: string;
  [key: string]: unknown;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  phone?: string;
};

export type CloudConfig = {
  url: string;
  anonKey: string;
};

export type CompanyConfig = {
  legalName: string;
  gstin: string;
  address: string;
  state: string;
  hsn: string;
  defaultGstRate: number;
  invoicePrefix: string;
  invoiceStart: number;
};

export type LineItem = {
  productId: string;
  description: string;
  hsn: string;
  qty: number;
  ratePaise: number;
  discountPaise: number;
  gstRate: number;
};

export type MoneyBreakup = {
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  roundOffPaise: number;
  grandPaise: number;
};
