import { getCurrentUser, makeDemoUser, OWNER_EMAIL, setCurrentUser } from './config';
import { audit, resetSupabaseClient, supabaseClient } from './store';
import type { Role, User } from './types';

const ATTEMPTS_KEY = 'gws3_login_attempts';

function attempts(): { count: number; until: number } {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : { count: 0, until: 0 };
  } catch {
    return { count: 0, until: 0 };
  }
}

function setAttempts(value: { count: number; until: number }): void {
  try { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

export function lockedUntil(): number {
  return attempts().until > Date.now() ? attempts().until : 0;
}

function failedLogin(): void {
  const a = attempts();
  const count = a.until > Date.now() ? a.count + 1 : 1;
  const until = count >= 5 ? Date.now() + 5 * 60 * 1000 : 0;
  setAttempts({ count, until });
}

function clearAttempts(): void {
  setAttempts({ count: 0, until: 0 });
}

export async function signIn(email: string, password: string): Promise<User> {
  if (lockedUntil()) throw new Error('Too many failed attempts. Try again in 5 minutes.');
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) throw new Error('Email and password are required.');

  const client = supabaseClient();
  if (client) {
    const { data, error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      failedLogin();
      throw new Error(error.message);
    }
    const { data: profile } = await client.from('app_users').select('role,name,phone,active').eq('email', cleanEmail).maybeSingle();
    const role = (profile?.role as Role) || (cleanEmail === OWNER_EMAIL ? 'owner' : 'auditor');
    const user: User = {
      id: data.user?.id || cleanEmail,
      name: String(profile?.name || cleanEmail.split('@')[0]),
      email: cleanEmail,
      role,
      active: profile?.active !== false,
      phone: profile?.phone ? String(profile.phone) : undefined
    };
    if (!user.active) throw new Error('This account is inactive. Contact the owner.');
    setCurrentUser(user);
    clearAttempts();
    await audit(user.email, 'login', 'auth', `Signed in as ${role}`);
    return user;
  }

  // Local demo mode: first-run owner has no password gate until set in Cloud setup.
  if (!password || password.length < 4) {
    failedLogin();
    throw new Error('Demo password must be at least 4 characters.');
  }
  if (cleanEmail !== OWNER_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    failedLogin();
    throw new Error('Enter a valid email.');
  }
  const role: Role = cleanEmail === OWNER_EMAIL ? 'owner' : 'auditor';
  const user = makeDemoUser(cleanEmail, role);
  setCurrentUser(user);
  clearAttempts();
  await audit(user.email, 'login', 'auth', `Demo sign-in as ${role}`);
  return user;
}

export async function signOut(): Promise<void> {
  const user = getCurrentUser();
  const client = supabaseClient();
  if (client) await client.auth.signOut();
  if (user) await audit(user.email, 'logout', 'auth', 'Signed out');
  setCurrentUser(null);
  resetSupabaseClient();
}

export function currentUser(): User | null {
  return getCurrentUser();
}
