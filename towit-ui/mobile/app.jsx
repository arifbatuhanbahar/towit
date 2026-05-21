// app.jsx — Towit full prototype, all screens wired together
// Renders in the DesignCanvas as labelled iOS artboards

const { useState: useStateApp, useEffect: useEffectApp } = React;

function NavHomeIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 3l9 9M5 10v11h5v-6h4v6h5V10" stroke={active ? "#f59e0b" : "#8f8f8f"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function NavJobsIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="14" rx="2" stroke={active ? "#f59e0b" : "#8f8f8f"} strokeWidth="1.9" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={active ? "#f59e0b" : "#8f8f8f"} strokeWidth="1.9" />
    </svg>
  );
}
function NavStackIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M18 20V10M12 20V4M6 20v-6" stroke={active ? "#f59e0b" : "#8f8f8f"} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function MobileBottomNav({ role, screen, hasJob, onNavigate }) {
  const items = role === 'customer'
    ? [
        { id: 'customer_home', label: 'Ana Sayfa', Icon: NavHomeIcon },
        { id: 'customer_job', label: 'Aktif Is', Icon: NavJobsIcon },
      ]
    : [
        { id: 'operator_home', label: 'Istekler', Icon: NavStackIcon },
        { id: 'operator_job', label: 'Isler', Icon: NavJobsIcon },
      ];

  const navStyle = {
    minHeight: 64,
    height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    flexShrink: 0,
    display: 'flex',
    borderTop: '1px solid rgba(255,255,255,0.09)',
    background: 'rgba(0,0,0,0.94)',
    backdropFilter: 'blur(14px)',
  };

  return (
    <nav style={navStyle}>
      {items.map(({ id, label, Icon }) => {
        const active = screen === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              if ((id === 'customer_job' || id === 'operator_job') && !hasJob) {
                onNavigate(role === 'customer' ? 'customer_home' : 'operator_home');
                return;
              }
              onNavigate(id);
            }}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: active ? '#f59e0b' : '#8f8f8f',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            <Icon active={active} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// Single screen + interactive routing inside one IOSDevice
// ─────────────────────────────────────────────────────────────
function TowitiOS({ initialScreen = 'login', role: initRole = 'customer', hasActiveJob = false }) {
  const [screen, setScreen] = useStateApp(initialScreen);
  const [role,   setRole]   = useStateApp(initRole);
  const [job,    setJob]    = useStateApp(null);

  const email = role === 'customer' ? 'mehmet@towit.tr' : 'ali.celik@operatör.tr';

  function handleLogin()     { setScreen('customer_home'); }
  function handleRegister(r) { setRole(r.role); setScreen(r.role === 'customer' ? 'customer_home' : 'operator_home'); }
  function handleLogout()    { setScreen('login'); }

  function openJob(j) {
    setJob(j);
    setScreen(role === 'customer' ? 'customer_job' : 'operator_job');
  }
  function openRoute(j) { setJob(j); setScreen('operator_route'); }

  const isAuth  = screen === 'login' || screen === 'register';
  const isRoute = screen === 'operator_route';
  const showBottomNav = !isAuth && !isRoute;

  const deviceStyle = {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--bg)',
    fontFamily: 'var(--font)',
    // Keep content clear of notch/status area across devices.
    paddingTop: isAuth || isRoute ? 0 : 'calc(env(safe-area-inset-top, 0px) + 10px)',
  };

  return (
    <div style={deviceStyle}>
      <div style={{ flex: 1, minHeight: 0 }}>
        {screen === 'login' && (
          <LoginPage onLogin={handleLogin} onGoRegister={() => setScreen('register')} />
        )}
        {screen === 'register' && (
          <RegisterPage onRegister={handleRegister} onGoLogin={() => setScreen('login')} />
        )}
        {screen === 'customer_home' && (
          <CustomerPage email={email} onLogout={handleLogout}
                        hasActiveJob={hasActiveJob}
                        onOpenJob={(j) => openJob(j)} />
        )}
        {screen === 'customer_job' && (
          <CustomerJobPage email={email} onLogout={handleLogout}
                           tower={job?.tower} status={job?.status}
                           onBack={() => setScreen('customer_home')} />
        )}
        {screen === 'operator_home' && (
          <OperatorPage email={email} onLogout={handleLogout}
                        onOpenJob={(j) => openJob(j)} />
        )}
        {screen === 'operator_job' && (
          <OperatorJobPage email={email} onLogout={handleLogout}
                           job={job}
                           onBack={() => setScreen('operator_home')}
                           onGoRoute={(j) => openRoute(j)} />
        )}
        {screen === 'operator_route' && (
          <OperatorRoutePage job={job}
                             onBack={() => setScreen('operator_job')}
                             onComplete={() => setScreen('operator_home')} />
        )}
      </div>
      {showBottomNav && (
        <MobileBottomNav
          role={role}
          screen={screen}
          hasJob={!!job}
          onNavigate={setScreen}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tweaks
// ─────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primaryColor": "#f59e0b",
  "bgColor": "#000000",
  "activeJobBanner": true,
  "completedStatus": false
}/*EDITMODE-END*/;

function TowiTweaks() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply primary color live
  React.useEffect(() => {
    document.documentElement.style.setProperty('--primary', tweaks.primaryColor);
    const h = tweaks.primaryColor; // naive darken
    document.documentElement.style.setProperty('--primary-hover', shadeHex(tweaks.primaryColor, -12));
    document.documentElement.style.setProperty('--bg', tweaks.bgColor);
  }, [tweaks.primaryColor, tweaks.bgColor]);

  return (
    <TweaksPanel>
      <TweakSection label="Renkler">
        <TweakColor label="Vurgu rengi" id="primaryColor"
                    value={tweaks.primaryColor}
                    onChange={v => {
                      setTweak('primaryColor', v);
                      document.documentElement.style.setProperty('--primary', v);
                    }}
                    options={['#f59e0b','#3b82f6','#a78bfa','#34d399']} />
      </TweakSection>
      <TweakSection label="Demo durumu">
        <TweakToggle label="Aktif iş banner'ı" id="activeJobBanner"
                     value={tweaks.activeJobBanner}
                     onChange={v => setTweak('activeJobBanner', v)} />
        <TweakToggle label="Tamamlandı durumu" id="completedStatus"
                     value={tweaks.completedStatus}
                     onChange={v => setTweak('completedStatus', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}

function shadeHex(hex, pct) {
  try {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + pct));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + pct));
    const b = Math.max(0, Math.min(255, (n & 0xff) + pct));
    return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
  } catch { return hex; }
}

// ─────────────────────────────────────────────────────────────
// Root render
// ─────────────────────────────────────────────────────────────
function App() {
  const [tweaks] = useTweaks(TWEAK_DEFAULTS);
  const W = 390, H = 844;

  const screens = [
    { id:'login',      label:'01 Giriş',          section:'auth',     screen:'login',         role:'customer', active:false,     completed:false },
    { id:'register',   label:'02 Kayıt',           section:'auth',     screen:'register',      role:'customer', active:false,     completed:false },
    { id:'cust_home',  label:'03 Müşteri Ana',     section:'customer', screen:'customer_home', role:'customer', active:tweaks.activeJobBanner, completed:false },
    { id:'cust_job',   label:'04 Müşteri İş Det.', section:'customer', screen:'customer_job',  role:'customer', active:false,     completed:tweaks.completedStatus },
    { id:'op_home',    label:'05 Operatör Ana',    section:'operator', screen:'operator_home', role:'operator', active:false,     completed:false },
    { id:'op_job',     label:'06 Operatör İş Det.', section:'operator', screen:'operator_job', role:'operator', active:false,     completed:false },
    { id:'op_route',   label:'07 Operatör Rota',   section:'operator', screen:'operator_route',role:'operator', active:false,     completed:false },
  ];

  // Group by section
  const sections = [
    { id:'auth',     title:'Kimlik doğrulama' },
    { id:'customer', title:'Müşteri akışı' },
    { id:'operator', title:'Operatör akışı' },
  ];

  return (
    <>
      <DesignCanvas>
        {sections.map(sec => (
          <DCSection key={sec.id} id={sec.id} title={sec.title}>
            {screens.filter(s => s.section === sec.id).map(s => (
              <DCArtboard key={s.id} id={s.id} label={s.label} width={W + 40} height={H + 90}>
                <IOSDevice width={W} height={H} dark={false}>
                  <TowitiOS
                    initialScreen={s.screen}
                    role={s.role}
                    hasActiveJob={s.active}
                    completedJob={s.completed}
                  />
                </IOSDevice>
              </DCArtboard>
            ))}
          </DCSection>
        ))}
      </DesignCanvas>
      <TowiTweaks />
    </>
  );
}

function MobileLiveApp() {
  useEffectApp(() => {
    document.documentElement.classList.add('live-mobile');
    document.body.classList.add('live-mobile');
    const root = document.getElementById('root');
    root?.classList.add('live-mobile-root');
    return () => {
      document.documentElement.classList.remove('live-mobile');
      document.body.classList.remove('live-mobile');
      root?.classList.remove('live-mobile-root');
    };
  }, []);

  return (
    <div style={{ minHeight: '100dvh', width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg)' }}>
      <TowitiOS initialScreen="login" role="customer" hasActiveJob={false} />
    </div>
  );
}

const params = new URLSearchParams(window.location.search);
// Mobile entry should default to the real app flow.
// Use ?canvas=1 only when explicitly opening design boards.
const isCanvasMode = params.get('canvas') === '1';

ReactDOM.createRoot(document.getElementById('root')).render(
  isCanvasMode ? <App /> : <MobileLiveApp />
);
