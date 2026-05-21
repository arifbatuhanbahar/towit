import type { AuthUser } from '../lib/api';

// ── Nav icons ─────────────────────────────────────────────────────────────────
const WIcon = {
  Home:  () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 12L12 3l9 9M5 10v11h5v-6h4v6h5V10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Map:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"/></svg>,
  Jobs:  () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.9"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  Clock: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  User:  () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.9"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  Stack: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  Tow:   () => <svg width="17" height="17" viewBox="0 0 32 24" fill="none"><path d="M1 18h2m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m0 0h10m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m0 0h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M1 18V8a2 2 0 0 1 2-2h11v12M14 9h6l4 5v4M24 14h-4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"/></svg>,
  Car:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 17H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1l2-4h8l2 4h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.6"/><circle cx="16.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.6"/></svg>,
};

// ── Nav config ────────────────────────────────────────────────────────────────
type NavIcon = () => JSX.Element;
interface NavItem { id: string; label: string; I: NavIcon; }

const CUSTOMER_MAIN: NavItem[] = [
  { id: 'customer_home', label: 'Ana sayfa', I: WIcon.Home },
  { id: 'customer_job',  label: 'Aktif iş',  I: WIcon.Map  },
];
const CUSTOMER_ACCOUNT: NavItem[] = [
  { id: 'customer_history', label: 'Geçmiş', I: WIcon.Clock },
  { id: 'customer_profile', label: 'Profil',  I: WIcon.User  },
];
const OPERATOR_MAIN: NavItem[] = [
  { id: 'operator_home', label: 'İstekler', I: WIcon.Stack },
  { id: 'operator_job',  label: 'İşler',    I: WIcon.Jobs  },
];
const OPERATOR_ACCOUNT: NavItem[] = [
  { id: 'operator_history', label: 'Geçmiş', I: WIcon.Clock },
  { id: 'operator_profile', label: 'Profil',  I: WIcon.User  },
];

// ── WebHeader ──────────────────────────────────────────────────────────────────
interface HeaderProps {
  user: AuthUser;
  screen: string;
  setScreen: (s: string) => void;
  onLogout: () => void;
}

export function WebHeader({ user, screen, setScreen, onLogout }: HeaderProps) {
  const isC = user.role === 'customer';
  const items = isC ? CUSTOMER_MAIN : OPERATOR_MAIN;

  return (
    <header className="web-header">
      <button className="web-header__logo" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        onClick={() => setScreen(isC ? 'customer_home' : 'operator_home')}>
        Tow<em>it</em>
      </button>
      <nav className="web-header__nav">
        {items.map(({ id, label, I }) => (
          <button key={id} type="button" className={`nav-link${screen === id ? ' is-active' : ''}`} onClick={() => setScreen(id)}>
            <I /> {label}
          </button>
        ))}
      </nav>
      <div className="web-header__spacer" />
      <div className="web-header__user">
        <span className="badge-role" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.7rem' }}>
          <span style={{ display: 'inline-flex', color: 'var(--primary)' }}>{isC ? <WIcon.Car /> : <WIcon.Tow />}</span>
          {isC ? 'Müşteri' : 'Çekici'}
        </span>
        <span className="web-header__email">{user.email}</span>
        <button className="btn btn-ghost btn-sm btn-square" style={{ width: 'auto', minHeight: 34, padding: '0 14px', fontSize: '0.8125rem' }} onClick={onLogout}>Çıkış</button>
      </div>
    </header>
  );
}

// ── WebSidebar ─────────────────────────────────────────────────────────────────
interface SidebarProps {
  user: AuthUser;
  screen: string;
  setScreen: (s: string) => void;
  reqCount?: number;
  hasActive?: boolean;
}

export function WebSidebar({ user, screen, setScreen, reqCount = 0, hasActive = false }: SidebarProps) {
  const isC = user.role === 'customer';
  const [mainItems, accountItems, sectionLabel] = isC
    ? [CUSTOMER_MAIN, CUSTOMER_ACCOUNT, 'Müşteri']
    : [OPERATOR_MAIN, OPERATOR_ACCOUNT, 'Operatör'];

  function badge(id: string): string | null {
    if (id === 'customer_job'  && hasActive) return '1';
    if (id === 'operator_home' && reqCount > 0) return String(reqCount);
    return null;
  }

  return (
    <aside className="web-sidebar">
      <div className="web-sidebar__section">{sectionLabel}</div>
      {mainItems.map(({ id, label, I }) => (
        <button key={id} className={`sidebar-link${screen === id ? ' is-active' : ''}`} onClick={() => setScreen(id)}>
          <span className="sidebar-link__icon"><I /></span>
          {label}
          {badge(id) && <span className="sidebar-link__badge">{badge(id)}</span>}
        </button>
      ))}
      <div className="web-sidebar__section">Hesap</div>
      {accountItems.map(({ id, label, I }) => (
        <button key={id} className={`sidebar-link${screen === id ? ' is-active' : ''}`} onClick={() => setScreen(id)}>
          <span className="sidebar-link__icon"><I /></span>
          {label}
        </button>
      ))}
    </aside>
  );
}

// ── BottomNav ──────────────────────────────────────────────────────────────────
interface BottomNavProps {
  user: AuthUser;
  screen: string;
  setScreen: (s: string) => void;
  hasActive?: boolean;
}

export function BottomNav({ user, screen, setScreen, hasActive = false }: BottomNavProps) {
  const isC = user.role === 'customer';
  const items = isC
    ? [...CUSTOMER_MAIN, ...CUSTOMER_ACCOUNT]
    : [...OPERATOR_MAIN, ...OPERATOR_ACCOUNT];

  return (
    <nav className="bottom-nav">
      {items.map(({ id, label, I }) => (
        <button key={id} type="button" className={`bottom-nav__item${screen === id ? ' is-active' : ''}`} onClick={() => setScreen(id)}>
          {id === 'customer_job' && hasActive && <span className="dot" />}
          <I /> <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
