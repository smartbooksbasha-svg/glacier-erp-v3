import type { CSSProperties, ReactNode } from 'react';

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    sales: <><path d="M3 6h18l-2 12H5L3 6Z"/><path d="M8 10h8"/></>,
    purchase: <><path d="M4 7h16v13H4z"/><path d="M8 7V4h8v3"/></>,
    inventory: <><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></>,
    production: <><path d="M4 20h16"/><path d="M7 20V9l5-4 5 4v11"/><path d="M10 20v-5h4v5"/></>,
    quality: <><path d="M12 3l8 4v5c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V7l8-4Z"/><path d="m9 12 2 2 4-4"/></>,
    delivery: <><path d="M3 7h11v10H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>,
    accounts: <><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    reports: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    admin: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    edit: <><path d="m4 16-1 5 5-1L19 9l-4-4L4 16Z"/><path d="m14 6 4 4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    ban: <><circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 19h16"/></>,
    upload: <><path d="M12 21V9m0 0 4 4m-4-4-4 4"/><path d="M4 5h16"/></>,
    logout: <><path d="M10 4H5v16h5"/><path d="M15 8l4 4-4 4M9 12h10"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    close: <path d="M6 6l12 12M18 6 6 18"/>,
    cloud: <><path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.6 1.5A3.3 3.3 0 0 0 7 18Z"/></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.grid}</svg>;
}

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <section className={`card ${className}`} style={style}>{children}</section>;
}

export function Btn({ children, onClick, variant = 'ghost', type = 'button', disabled = false, small = false, ariaLabel }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'dark' | 'danger'; type?: 'button' | 'submit'; disabled?: boolean; small?: boolean; ariaLabel?: string;
}) {
  return <button type={type} className={`btn ${variant}${small ? ' small' : ''}`} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>{children}</button>;
}

export function Chip({ children, tone = '', cyan = false, ok = false, warn = false, danger = false }: {
  children: ReactNode; tone?: '' | 'cyan' | 'ok' | 'warn' | 'danger'; cyan?: boolean; ok?: boolean; warn?: boolean; danger?: boolean;
}) {
  const resolved = danger ? 'danger' : warn ? 'warn' : ok ? 'ok' : cyan ? 'cyan' : tone;
  return <span className={`chip ${resolved}`}>{children}</span>;
}

export function Field({ label, children, full = false }: { label: string; children: ReactNode; full?: boolean }) {
  return <div className={`field${full ? ' full' : ''}`}><label>{label}</label>{children}</div>;
}

export function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}
