import type { CloudConfig, CompanyConfig, Role, User } from './types';

export const APP_VER = 'v3.0.0';
export const OWNER_EMAIL = 'smartbooksbasha@gmail.com';

const KEYS = {
  cloud: 'gws3_cloud',
  company: 'gws3_company',
  user: 'gws3_user',
  seed: 'gws3_seeded'
};

export const DEFAULT_COMPANY: CompanyConfig = {
  legalName: 'Glacier Water Solutions',
  gstin: 'PENDING_AUDITOR_APPROVAL',
  address: 'PENDING_OWNER_APPROVAL',
  state: 'PENDING_OWNER_APPROVAL',
  hsn: 'PENDING_AUDITOR_APPROVAL',
  defaultGstRate: 0,
  invoicePrefix: 'GWS/INV',
  invoiceStart: 1
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } as T : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

export function getCloudConfig(): CloudConfig {
  return read<CloudConfig>(KEYS.cloud, { url: '', anonKey: '' });
}

export function setCloudConfig(config: CloudConfig): void {
  write(KEYS.cloud, config);
}

export function hasCloudConfig(): boolean {
  const c = getCloudConfig();
  return /^https:\/\/.+\.supabase\.co\/?$/.test(c.url.trim()) && c.anonKey.trim().length > 40;
}

export function getCompanyConfig(): CompanyConfig {
  return read<CompanyConfig>(KEYS.company, DEFAULT_COMPANY);
}

export function setCompanyConfig(config: CompanyConfig): void {
  write(KEYS.company, config);
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(KEYS.user);
    return raw ? JSON.parse(raw) as User : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  try {
    if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
    else localStorage.removeItem(KEYS.user);
  } catch { /* storage unavailable */ }
}

export function makeDemoUser(email: string, role: Role = 'owner'): User {
  return {
    id: 'demo-' + email.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: email === OWNER_EMAIL ? 'Owner' : email.split('@')[0],
    email,
    role,
    active: true
  };
}

export function seedDone(): boolean {
  try { return localStorage.getItem(KEYS.seed) === '1'; } catch { return false; }
}

export function markSeedDone(): void {
  try { localStorage.setItem(KEYS.seed, '1'); } catch { /* storage unavailable */ }
}
