import { useState, useEffect } from 'react';
import { storedUser, logout, getJobs } from './lib/api';
import type { AuthUser, JobDetail } from './lib/api';

import { WebHeader, WebSidebar, BottomNav } from './components/WebLayout';
import MapView from './components/MapView';
import { Icon } from './components/Icons';

import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import CustomerPage    from './pages/customer/CustomerPage';
import CustomerJobPage from './pages/customer/CustomerJobPage';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerHistory from './pages/customer/CustomerHistory';

import OperatorHomeWeb from './pages/operator/OperatorHomeWeb';
import OperatorJobPage from './pages/operator/OperatorJobPage';
import OperatorRoutePage from './pages/operator/OperatorRoutePage';
import OperatorProfile from './pages/operator/OperatorProfile';
import OperatorHistory from './pages/operator/OperatorHistory';

type Screen =
  | 'login' | 'register'
  | 'customer_home' | 'customer_job' | 'customer_profile' | 'customer_history'
  | 'operator_home' | 'operator_job' | 'operator_route' | 'operator_profile' | 'operator_history';

export default function App() {
  const [user,      setUser]      = useState<AuthUser | null>(storedUser);
  const [screen,    setScreen]    = useState<Screen>('login');
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [routeJob,  setRouteJob]  = useState<JobDetail | null>(null);
  const [hasActive, setHasActive] = useState(false);
  const [reqCount,  setReqCount]  = useState(0);

  // Poll counts for sidebar badges
  useEffect(() => {
    if (!user) return;
    function poll() {
      getJobs().then(r => {
        setHasActive(r.jobs.some(j => j.status === 'accepted' || j.status === 'en_route'));
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
    // If navigating to a job screen without a job selected, go to home instead
    if (s === 'customer_job' && !openJobId) { setScreen('customer_home'); return; }
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

          {/* ── Customer ── */}
          {screen === 'customer_home' && (
            <div className="page-wide">
              <div className="customer-split">
                <div className="customer-split__wizard">
                  <CustomerPage
                    user={user}
                    onOpenJob={openJob}
                    onGoProfile={() => nav('customer_profile')}
                    onGoHistory={() => nav('customer_history')}
                  />
                </div>
                <div className="customer-split__map-panel">
                  <MapView height={340} chip={<><Icon.Pin size={11} /> İstanbul</>} />
                </div>
              </div>
            </div>
          )}

          {screen === 'customer_job' && openJobId && (
            <div className="page-narrow">
              <CustomerJobPage user={user} jobId={openJobId} onBack={() => nav('customer_home')} />
            </div>
          )}

          {screen === 'customer_profile' && (
            <div className="page-narrow">
              <CustomerProfile user={user} onLogout={handleLogout} onBack={() => nav('customer_home')} />
            </div>
          )}

          {screen === 'customer_history' && (
            <div className="page-narrow">
              <CustomerHistory user={user} onBack={() => nav('customer_home')} onOpenJob={openJob} />
            </div>
          )}

          {/* ── Operator ── */}
          {screen === 'operator_home' && (
            <OperatorHomeWeb onOpenJob={openJob} />
          )}

          {screen === 'operator_job' && openJobId && (
            <div className="page-narrow">
              <OperatorJobPage
                user={user}
                jobId={openJobId}
                onBack={() => nav('operator_home')}
                onGoRoute={job => { setRouteJob(job); setScreen('operator_route'); }}
              />
            </div>
          )}

          {screen === 'operator_profile' && (
            <div className="page-narrow">
              <OperatorProfile user={user} onLogout={handleLogout} onBack={() => nav('operator_home')} />
            </div>
          )}

          {screen === 'operator_history' && (
            <div className="page-narrow">
              <OperatorHistory user={user} onBack={() => nav('operator_home')} />
            </div>
          )}

        </div>
      </div>

      <BottomNav user={user} screen={screen} setScreen={s => nav(s as Screen)} hasActive={hasActive} />
    </div>
  );
}
