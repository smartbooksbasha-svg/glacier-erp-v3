import { useCallback, useEffect, useState } from 'react';
import { Shell } from './components/Shell';
import { Btn, Card, Chip, Icon } from './components/ui';
import { currentUser, signOut } from './lib/auth';
import { modulesForGroup } from './lib/modules';
import { seedDemoData } from './lib/store';
import type { Role, User } from './lib/types';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ModulePage } from './pages/ModulePage';
import { Reports } from './pages/Reports';
import { Admin } from './pages/Admin';

function parseHash(): { group: string; module: string | null } {
  const raw = window.location.hash.replace(/^#/, '');
  const [group = 'Overview', module = ''] = raw.split('/');
  return { group: group || 'Overview', module: module || null };
}

export default function App() {
  const [user, setUser] = useState<User | null>(currentUser());
  const initial = parseHash();
  const [group, setGroup] = useState(initial.group);
  const [module, setModule] = useState<string | null>(initial.module);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const onHash = () => {
      const parsed = parseHash();
      setGroup(parsed.group);
      setModule(parsed.module);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!user || seeded) return;
    void seedDemoData().then(() => setSeeded(true));
  }, [user, seeded]);

  const navigate = useCallback((nextGroup: string, nextModule: string | null = null) => {
    setGroup(nextGroup);
    setModule(nextModule);
    const hash = `#${nextGroup}${nextModule ? `/${nextModule}` : ''}`;
    if (window.location.hash !== hash) window.location.hash = hash;
  }, []);

  const logout = useCallback(() => {
    void signOut().finally(() => { setUser(null); navigate('Overview'); });
  }, [navigate]);

  if (!user) return <Login onDone={() => setUser(currentUser())} />;

  const role: Role = user.role;
  let content: React.ReactNode;

  if (group === 'Overview') {
    content = <Dashboard role={role} onNavigate={(g) => navigate(g)} />;
  } else if (group === 'Reports') {
    content = module ? <ModulePage moduleKey={module} role={role} actor={user.email} /> : <Reports role={role} />;
  } else if (group === 'Administration') {
    content = module ? <ModulePage moduleKey={module} role={role} actor={user.email} /> : <Admin role={role} actor={user.email} />;
  } else if (module) {
    content = <ModulePage moduleKey={module} role={role} actor={user.email} />;
  } else {
    const modules = modulesForGroup(group);
    content = <>
      <div className="grid kpi">{modules.map((m) => <button key={m.key} className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => navigate(group, m.key)}>
        <Icon name={group.toLowerCase()} size={20} />
        <h3 style={{ margin: '10px 0 4px' }}>{m.title}</h3>
        <span className="muted">{m.fields.length} fields · {m.postable ? 'postable' : 'register'}</span>
      </button>)}</div>
      {modules.length === 0 && <Card><Chip warn>Empty group</Chip><p className="muted">No modules available for this role.</p></Card>}
    </>;
  }

  return <Shell active={group} onNavigate={(g) => navigate(g)} user={user} onLogout={logout}>
    {group !== 'Overview' && <div className="toolbar">
      <Btn variant={module ? 'ghost' : 'primary'} onClick={() => navigate(group)}>{group === 'Reports' ? 'Report summary' : group === 'Administration' ? 'Admin home' : `${group} home`}</Btn>
      {modulesForGroup(group).map((m) => <button key={m.key} className={`chip${module === m.key ? ' cyan' : ''}`} onClick={() => navigate(group, m.key)}>{m.title}</button>)}
    </div>}
    {content}
  </Shell>;
}
