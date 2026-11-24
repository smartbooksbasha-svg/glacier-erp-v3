import { useEffect, useState } from 'react';
import { signIn, lockedUntil } from '../lib/auth';
import { hasCloudConfig, OWNER_EMAIL } from '../lib/config';
import { Btn, Field, Icon } from '../components/ui';

export function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setWait(Math.max(0, Math.ceil((lockedUntil() - Date.now()) / 1000))), 1000);
    return () => clearInterval(timer);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await signIn(email, password); onDone(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Login failed.'); }
    finally { setBusy(false); }
  };

  return <div className="login-wrap">
    <form className="login-card" onSubmit={submit}>
      <div className="brand-mark"><Icon name="cloud" size={22} /></div>
      <h1>Glacier ERP sign in</h1>
      <p>{hasCloudConfig() ? 'Cloud workspace connected. Use your Supabase account.' : 'Local demo mode. Enter Cloud setup after login to connect shared data.'}</p>
      {error && <div className="alert" role="alert">{error}</div>}
      {wait > 0 && <div className="alert">Too many attempts. Try again in {Math.floor(wait / 60)}:{String(wait % 60).padStart(2, '0')}.</div>}
      <Field label="Email"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Field>
      <Field label="Password"><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
      <Btn type="submit" variant="primary" disabled={busy || wait > 0}>{busy ? 'Signing in…' : 'Sign in'}</Btn>
      <p style={{ fontSize: 11, marginTop: 4 }}>Owner account: {OWNER_EMAIL}</p>
    </form>
  </div>;
}
