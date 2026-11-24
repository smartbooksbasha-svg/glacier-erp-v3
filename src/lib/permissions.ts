import type { Role } from './types';

export type Action =
  | 'view' | 'create' | 'edit' | 'post' | 'approve' | 'cancel' | 'delete'
  | 'export' | 'finance' | 'costs' | 'settings' | 'users' | 'audit' | 'backup'
  | 'monthClose' | 'cloudSetup';

const PERMISSIONS: Record<Role, Action[]> = {
  owner: ['view', 'create', 'edit', 'post', 'approve', 'cancel', 'delete', 'export', 'finance', 'costs', 'settings', 'users', 'audit', 'backup', 'monthClose', 'cloudSetup'],
  admin: ['view', 'create', 'edit', 'post', 'approve', 'cancel', 'delete', 'export', 'finance', 'costs'],
  accountant: ['view', 'create', 'edit', 'post', 'approve', 'cancel', 'export', 'finance', 'costs'],
  sales: ['view', 'create', 'edit', 'post', 'cancel', 'export'],
  production: ['view', 'create', 'edit', 'post', 'export'],
  auditor: ['view', 'export', 'audit']
};

export function can(role: Role | undefined, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(action) ?? false;
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner / Super Admin',
  admin: 'Admin / Operations',
  accountant: 'Accountant',
  sales: 'Sales Staff',
  production: 'Production Staff',
  auditor: 'Read-only Auditor'
};

export function canSeeGroup(role: Role | undefined, group: string): boolean {
  if (!role) return false;
  if (['owner', 'admin', 'accountant'].includes(role)) return true;
  if (role === 'sales') return ['Overview', 'Sales', 'Reports'].includes(group);
  if (role === 'production') return ['Overview', 'Inventory', 'Manufacturing', 'Quality', 'Delivery', 'Reports'].includes(group);
  if (role === 'auditor') return ['Overview', 'Reports', 'Administration'].includes(group);
  return false;
}
