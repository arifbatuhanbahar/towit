import { useState, useEffect } from 'react';
import { storedUser, logout, getJobs } from './lib/api';
import type { AuthUser, JobDetail } from './lib/api';
import type { Screen } from './types/screen';

import { WebHeader, WebSidebar, BottomNav } from './components/WebLayout';

import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OperatorRoutePage from './pages/operator/OperatorRoutePage';
import CustomerScreens from './screens/CustomerScreens';
import OperatorScreens from './screens/OperatorScreens';

export default function App() {
  const initialUser = storedUser();
  const [user,      setUser]      = useState<AuthUser | null>(initialUser);
  const [screen,    setScreen]    = useState<Screen>(
    initialUser ? (initialUser.role === 'customer' ? 'customer_home' : 'operator_home') : 'login'
  );
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [routeJob,  setRouteJob]  = useState<JobDetail | null>(null);
  const [hasActive, setHasActive] = useState(false);
  const [activeCustomerJobId, setActiveCustomerJobId] = useState<string | null>(null);
  const [reqCount,  setReqCount]  = useState(0);

  // Poll counts for sidebar badges
  useEffect(() => {
    if (!user) return;
    function poll() {
      getJobs().then(r => {
        const activeCustomerJobs = r.jobs.filter(j => ['open', 'accepted', 'en_route'].includes(j.status));
        const latestActive = activeCustomerJobs
          .slice()
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
        setHasActive(activeCustomerJobs.length > 0);
        setActiveCustomerJobId(latestActive?.id ?? null);
        setReqCount(r.jobs.filter(j => j.status === 'open').length);
      }).catch(() => {});
    }
    poll();
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, [user]);

  function handleLogout() {
    logout();
    setUser(null);
    setScreen('login');
    setOpenJobId(null);
    setActiveCustomerJobId(null);
    setRouteJob(null);
  }

  function openJob(id: string) {
    setOpenJobId(id);
    setScreen(user?.role === 'customer' ? 'customer_job' : 'operator_job');
  }

  function nav(s: Screen) {
    if (s !== 'customer_job' && s !== 'operator_job' && s !== 'operator_route') {
      setOpenJobId(null);
      setRouteJob(null);
    }
    // Customer active request page should open latest active request if no explicit selection.
    if (s === 'customer_job' && !openJobId) {
      if (activeCustomerJobId) {
        setOpenJobId(activeCustomerJobId);
        setScreen('customer_job');
        return;
      }
      setScreen('customer_home');
      return;
    }
    if (s === 'operator_job' && !openJobId) { setScreen('operator_home'); return; }
    setScreen(s);
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="web-root">
        <div className="auth-web-wrap">
          {screen === 'register'
            ? <RegisterPage onRegister={u => { setUser(u); setScreen(u.role === 'customer' ? 'customer_home' : 'operator_home'); }} onGoLogin={() => setScreen('login')} />
            : <LoginPage    onLogin={u => { setUser(u); setScreen(u.role === 'customer' ? 'customer_home' : 'operator_home'); }} onGoRegister={() => setScreen('register')} />
          }
        </div>
      </div>
    );
  }

  // ── Operator route — full screen overlay ──────────────────────────────────────
  if (screen === 'operator_route' && routeJob) {
    return (
      <div className="web-root" style={{ position: 'relative' }}>
        <OperatorRoutePage
          job={routeJob}
          onBack={() => setScreen('operator_job')}
          onComplete={() => { setRouteJob(null); setOpenJobId(null); setScreen('operator_home'); }}
        />
      </div>
    );
  }

  // ── Authenticated shell ───────────────────────────────────────────────────────
  return (
    <div className="web-root">
      <WebHeader user={user} screen={screen} setScreen={s => nav(s as Screen)} onLogout={handleLogout} />

      <div className="web-body">
        <WebSidebar user={user} screen={screen} setScreen={s => nav(s as Screen)} reqCount={reqCount} hasActive={hasActive} />

        <div className="web-content">
          {user.role === 'customer'
            ? (
                <CustomerScreens
                  user={user}
                  screen={screen}
                  openJobId={openJobId}
                  onOpenJob={openJob}
                  onNavigate={nav}
                  onLogout={handleLogout}
                />
              )
            : (
                <OperatorScreens
                  screen={screen}
                  openJobId={openJobId}
                  onOpenJob={openJob}
                  onNavigate={nav}
                  onLogout={handleLogout}
                  onOpenRoute={(job) => { setRouteJob(job); setScreen('operator_route'); }}
                />
              )}
        </div>
      </div>

      <BottomNav user={user} screen={screen} setScreen={s => nav(s as Screen)} hasActive={hasActive} />
    </div>
  );
}
