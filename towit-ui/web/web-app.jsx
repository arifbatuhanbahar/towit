// web-app.jsx — Towit responsive web prototype (Asphalt v4)

const { useState: useWeb, useMemo: useMemoWeb } = React;

// ── Nav icons ──────────────────────────────────────────────────
const WIcon = {
  Home:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 12L12 3l9 9M5 10v11h5v-6h4v6h5V10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Map:      () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"/></svg>,
  Jobs:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.9"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  Clock:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  User:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.9"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  Stack:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
};

// ── Web Header ─────────────────────────────────────────────────
function WebHeader({ role, email, screen, setScreen, onLogout }) {
  const isC = role === 'customer';
  const items = isC
    ? [{ id:'customer_home', label:'Ana sayfa', I:WIcon.Home }, { id:'customer_job', label:'Aktif iş', I:WIcon.Map }]
    : [{ id:'operator_home', label:'İstekler',  I:WIcon.Stack}, { id:'operator_job', label:'İşler',    I:WIcon.Jobs }];

  return (
    <header className="web-header">
      <a className="web-header__logo" href="#"
         onClick={e => { e.preventDefault(); setScreen(isC ? 'customer_home' : 'operator_home'); }}>
        Tow<em>it</em>
      </a>
      <nav className="web-header__nav">
        {items.map(({id, label, I}) => (
          <button key={id} type="button"
                  className={'nav-link ' + (screen===id ? 'is-active' : '')}
                  onClick={() => setScreen(id)}>
            <I/> {label}
          </button>
        ))}
      </nav>
      <div className="web-header__spacer"/>
      <div className="web-header__user">
        {/* Rol badge — sadece bilgi, değiştirilemez */}
        <span className="badge-role" style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:'0.7rem'}}>
          <span style={{display:'inline-flex',color:'var(--primary)'}}>
            {isC ? <Icon.Car size={14}/> : <Icon.Tow size={14}/>}
          </span>
          {isC ? 'Müşteri' : 'Çekici'}
        </span>
        <span className="web-header__email">{email}</span>
        <button className="btn btn-ghost btn-sm btn-square"
                style={{width:'auto', minHeight:34, padding:'0 14px', fontSize:'0.8125rem'}}
                onClick={onLogout}>Çıkış</button>
      </div>
    </header>
  );
}

// ── Sidebar ────────────────────────────────────────────────────
function WebSidebar({ role, screen, setScreen, reqCount=3, hasActive=false }) {
  const isC = role === 'customer';
  return (
    <aside className="web-sidebar">
      {isC ? (
        <>
          <div className="web-sidebar__section">Müşteri</div>
          {[
            { id:'customer_home', label:'Ana sayfa',  I:WIcon.Home  },
            { id:'customer_job',  label:'Aktif iş',   I:WIcon.Map,  badge: hasActive ? '1' : null },
          ].map(({id,label,I,badge}) => (
            <button key={id} className={'sidebar-link '+(screen===id?'is-active':'')}
                    onClick={() => setScreen(id)}>
              <span className="sidebar-link__icon"><I/></span>
              {label}
              {badge && <span className="sidebar-link__badge">{badge}</span>}
            </button>
          ))}
          <div className="web-sidebar__section">Hesap</div>
          {[
            { id:'customer_history', label:'Geçmiş', I:WIcon.Clock },
            { id:'customer_profile', label:'Profil',  I:WIcon.User  },
          ].map(({id,label,I}) => (
            <button key={id} className={'sidebar-link '+(screen===id?'is-active':'')}
                    onClick={() => setScreen(id)}>
              <span className="sidebar-link__icon"><I/></span>
              {label}
            </button>
          ))}
        </>
      ) : (
        <>
          <div className="web-sidebar__section">Operatör</div>
          {[
            { id:'operator_home',  label:'İstekler', I:WIcon.Stack, badge: reqCount > 0 ? String(reqCount) : null },
            { id:'operator_job',   label:'İşler',    I:WIcon.Jobs  },
            { id:'operator_route', label:'Rota',     I:WIcon.Map   },
          ].map(({id,label,I,badge}) => (
            <button key={id} className={'sidebar-link '+(screen===id?'is-active':'')}
                    onClick={() => setScreen(id)}>
              <span className="sidebar-link__icon"><I/></span>
              {label}
              {badge && <span className="sidebar-link__badge">{badge}</span>}
            </button>
          ))}
          <div className="web-sidebar__section">Hesap</div>
          <button className={'sidebar-link '+(screen==='operator_history'?'is-active':'')}
                  onClick={() => setScreen('operator_history')}>
            <span className="sidebar-link__icon"><WIcon.Clock/></span>
            Geçmiş
          </button>
          <button className={'sidebar-link '+(screen==='operator_profile'?'is-active':'')}
                  onClick={() => setScreen('operator_profile')}>
            <span className="sidebar-link__icon"><WIcon.User/></span>
            Profil
          </button>
        </>
      )}
    </aside>
  );
}

// ── Bottom Nav ─────────────────────────────────────────────────
function BottomNav({ role, screen, setScreen, hasActive }) {
  const isC = role === 'customer';
  const items = isC
    ? [{ id:'customer_home',    label:'Ana sayfa', I:WIcon.Home },
       { id:'customer_job',     label:'Aktif iş',  I:WIcon.Map, dot:hasActive },
       { id:'customer_history', label:'Geçmiş',    I:WIcon.Clock },
       { id:'customer_profile', label:'Profil',    I:WIcon.User }]
    : [{ id:'operator_home',    label:'İstekler', I:WIcon.Stack },
       { id:'operator_job',     label:'İşler',    I:WIcon.Jobs  },
       { id:'operator_history', label:'Geçmiş',   I:WIcon.Clock },
       { id:'operator_profile', label:'Profil',   I:WIcon.User  }];

  return (
    <nav className="bottom-nav">
      {items.map(({id,label,I,dot}) => (
        <button key={id} type="button"
                className={'bottom-nav__item '+(screen===id?'is-active':'')}
                onClick={() => setScreen(id)}>
          {dot && <span className="dot"/>}
          <I/> <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── Customer Home (desktop 2-col) ──────────────────────────────
function CustomerHomeWeb({ email, onLogout, onOpenJob, hasActiveJob }) {
  return (
    <div className="web-content">
      <div className="page-wide">
        {hasActiveJob && (
          <button type="button" className="active-banner"
                  style={{width:'100%', marginBottom:'var(--s-6)', font:'inherit', color:'#000', cursor:'pointer', maxWidth:960}}
                  onClick={() => onOpenJob && onOpenJob({ tower:TOWERS[0], status:'en_route' })}>
            <div className="active-banner__body">
              <span className="active-banner__status"><span className="dot"></span>Yolda</span>
              <span className="active-banner__name">Yıldız Çekici — tahminen 9 dk</span>
              <span className="active-banner__price">850 ₺ · Kadıköy → Levent</span>
            </div>
            <span className="active-banner__cta">Canlı takip →</span>
          </button>
        )}
        <div className="customer-split">
          {/* Wizard side */}
          <div className="customer-split__wizard">
            <CustomerPage email={email} onLogout={onLogout}
                          hasActiveJob={false}
                          onOpenJob={onOpenJob} />
          </div>
          {/* Map + nearby panel side */}
          <div className="customer-split__map-panel">
            <MapMock height={340} route chip={<><Icon.Pin size={11}/> İstanbul</>} />
            <div style={{background:'var(--surface)', borderRadius:'var(--r-lg)', padding:'0 var(--s-5) var(--s-4)'}}>
              <div className="towers-widget__header">Yakındaki çekiciler</div>
              <div className="towers-widget">
                {TOWERS.map((t,i) => (
                  <div key={t.id} className="towers-widget__row">
                    <span className="towers-widget__num">{i+1}</span>
                    <div style={{flex:1, minWidth:0}}>
                      <div className="towers-widget__name"
                           style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {t.name}
                      </div>
                      <div className="towers-widget__meta">{t.vehicle} · ~{t.eta} dk</div>
                    </div>
                    <div>
                      <div className="towers-widget__price">{t.price.toLocaleString('tr-TR')} ₺</div>
                      <div style={{fontSize:11,color:'var(--primary)',fontWeight:800,textAlign:'right',display:'inline-flex',alignItems:'center',gap:3,justifyContent:'flex-end'}}>
                        <Icon.Star size={11} filled/> {t.rating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Operator split (list + detail) ─────────────────────────────
const OP_REQ_DATA = [
  { id:'r1', email:'ayse.kaya@mail.com',    city:'Kadıköy, İstanbul',  date:'14:07', dist:'2.1 km', price:620,  status:'open' },
  { id:'r2', email:'murat.demir@mail.com',  city:'Ümraniye, İstanbul', date:'13:51', dist:'4.8 km', price:890,  status:'open' },
  { id:'r3', email:'fatma.yilmaz@mail.com', city:'Şişli, İstanbul',   date:'13:22', dist:'1.6 km', price:540,  status:'payment_pending' },
];
const OP_ACTIVE_DATA = [
  { id:'j1', email:'can.ozturk@mail.com', city:'Sarıyer, İstanbul', status:'en_route', price:850, dist:'9.2 km', date:'13:05' },
];

function OperatorHomeWeb({ onGoRoute }) {
  const [reqs,     setReqs]     = useWeb(OP_REQ_DATA);
  const [actives,  setActives]  = useWeb(OP_ACTIVE_DATA);
  const [tab,      setTab]      = useWeb('requests');
  const [selected, setSelected] = useWeb(OP_REQ_DATA[0]);
  const [detStatus, setDetStatus] = useWeb('open');

  const list = tab === 'requests' ? reqs : actives;

  function accept(item) {
    setReqs(p => p.filter(x => x.id !== item.id));
    setActives(p => [...p, {...item, status:'accepted'}]);
    setSelected(null);
  }
  function reject(item) {
    setReqs(p => p.filter(x => x.id !== item.id));
    setSelected(null);
  }
  function selectItem(item) {
    setSelected(item);
    setDetStatus(item.status);
  }

  return (
    <div className="op-split">
      {/* List panel */}
      <div className="op-split__list">
        <TabToggle value={tab} onChange={v => { setTab(v); setSelected(null); }}
          options={[
            { value:'requests', label:'İstekler', count: reqs.length },
            { value:'active',   label:'Aktif',    count: actives.length },
          ]} />

        {list.length === 0 && (
          <EmptyState
            glyph={<Icon.Tow size={24}/>}
            title={tab==='requests' ? 'İstek yok' : 'Aktif iş yok'}
            sub="Yeni talepler burada listelenir."
          />
        )}

        {list.map(item => (
          <div key={item.id}
               className={'op-list-item ' + (selected?.id === item.id ? 'is-selected' : '')}
               onClick={() => selectItem(item)}>
            <div style={{display:'flex', alignItems:'flex-start', gap:'var(--s-3)'}}>
              <div style={{
                width:36, height:36, borderRadius:'50%',
                background:'var(--surface-3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:900, fontSize:'0.9rem', color:'var(--primary)', flexShrink:0,
              }}>
                {item.email[0].toUpperCase()}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:700, fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                  {item.email}
                </div>
                <div style={{fontSize:12, color:'var(--text-faint)', marginTop:2}}>
                  {item.city}
                </div>
              </div>
              <div style={{textAlign:'right', flexShrink:0}}>
                <div style={{fontSize:'1.1rem', fontWeight:900, fontVariantNumeric:'tabular-nums', letterSpacing:'-0.03em'}}>
                  {item.price.toLocaleString('tr-TR')} ₺
                </div>
                <div style={{fontSize:11, color:'var(--text-faint)', marginTop:2}}>{item.dist}</div>
              </div>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <StatusBadge status={item.status} />
              <span style={{fontSize:11, color:'var(--text-faint)'}}>{item.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div className="op-split__detail">
        {!selected ? (
          <div className="detail-empty">
            <div className="detail-empty__arrow">←</div>
            <div className="detail-empty__title">Bir iş seçin</div>
            <div className="detail-empty__sub">Listeden bir talep veya aktif iş seçin.</div>
          </div>
        ) : (
          <div style={{maxWidth:540}}>
            {/* Title */}
            <div style={{marginBottom:'var(--s-6)'}}>
              <div style={{fontSize:'1.5rem', fontWeight:900, letterSpacing:'-0.04em',
                           overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:8}}>
                {selected.email}
              </div>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <StatusBadge status={detStatus} />
                <span style={{fontSize:12, color:'var(--text-faint)'}}>{selected.city} · {selected.dist}</span>
              </div>
            </div>

            {/* Info grid */}
            <div className="detail-grid">
              {[
                ['Çekim',  '41.0451, 29.0331'],
                ['Varış',   '41.0082, 28.9784'],
                ['Mesafe',  selected.dist],
                ['Ücret',   selected.price.toLocaleString('tr-TR')+' ₺'],
              ].map(([k,v]) => (
                <div key={k} className="detail-cell">
                  <div className="detail-cell__label">{k}</div>
                  <div className="detail-cell__value">{v}</div>
                </div>
              ))}
            </div>

            <MapMock height={200} route />

            <div style={{display:'flex', flexDirection:'column', gap:'var(--s-3)', marginTop:'var(--s-5)'}}>
              {tab === 'requests' ? (
                <>
                  <button className="btn btn-primary btn-square"
                          style={{borderRadius:'var(--r-lg)'}}
                          onClick={() => accept(selected)}>
                    İşi kabul et
                  </button>
                  <button className="btn btn-danger-ghost btn-sm btn-square"
                          onClick={() => reject(selected)}>
                    Reddet
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary btn-square"
                          style={{minHeight:56, fontSize:'1rem', borderRadius:'var(--r-lg)'}}
                          onClick={() => onGoRoute && onGoRoute(selected)}>
                    Rotayı aç — Navigasyona başla
                  </button>
                  <button className="btn btn-success btn-square"
                          style={{borderRadius:'var(--r-lg)'}}
                          onClick={() => setDetStatus('completed')}>
                    Teslim edildi — Tamamla
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tweaks ─────────────────────────────────────────────────────
const WEB_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primaryColor": "#f59e0b",
  "hasActiveJob": true,
  "startRole": "customer"
}/*EDITMODE-END*/;

function WebTweaks({ tweaks, setTweak, onSwitchRole }) {
  return (
    <TweaksPanel>
      <TweakSection label="Renk">
        <TweakColor label="Vurgu" id="primary"
                    value={tweaks.primaryColor}
                    onChange={v => {
                      setTweak('primaryColor', v);
                      document.documentElement.style.setProperty('--primary', v);
                    }}
                    options={['#f59e0b','#60a5fa','#a78bfa','#34d399']} />
      </TweakSection>
      <TweakSection label="Demo">
        <TweakRadio label="Rol" id="startRole"
                    value={tweaks.startRole}
                    onChange={v => { setTweak('startRole', v); onSwitchRole && onSwitchRole(v); }}
                    options={[{value:'customer',label:'Müşteri'},{value:'operator',label:'Operatör'}]} />
        <TweakToggle label="Aktif iş banner" id="hasActiveJob"
                     value={tweaks.hasActiveJob}
                     onChange={v => setTweak('hasActiveJob', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}

// ── Root ───────────────────────────────────────────────────────
function WebApp() {
  const [tweaks, setTweak] = useTweaks(WEB_TWEAK_DEFAULTS);
  const [authed,  setAuthed]  = useWeb(false);
  const [role,    setRole]    = useWeb('customer');
  const [screen,  setScreen]  = useWeb('login');
  const [job,     setJob]     = useWeb(null);
  const [userEmail, setUserEmail] = useWeb('');

  const email = userEmail || (role === 'customer' ? 'musteri@towit.tr' : 'sofor@towit.tr');

  function detectRole(e) {
    const s = e.toLowerCase();
    if (s.includes('sofor') || s.includes('şoför') || s.includes('operator') || s.includes('operatör') || s.includes('surucu')) return 'operator';
    return 'customer';
  }
  function handleLogin(e)    { const r = detectRole(e); setUserEmail(e); setRole(r); setAuthed(true); setScreen(r === 'customer' ? 'customer_home' : 'operator_home'); }
  function handleRegister(r) { setUserEmail(r.email); setRole(r.role); setAuthed(true); setScreen(r.role === 'customer' ? 'customer_home' : 'operator_home'); }
  function handleLogout()    { setAuthed(false); setRole('customer'); setUserEmail(''); setScreen('login'); }
  function openJob(j)        { setJob(j); setScreen(role === 'customer' ? 'customer_job' : 'operator_job'); }
  function openRoute(j)      { setJob(j); setScreen('operator_route'); }

  // ── Auth ──
  if (!authed) {
    return (
      <div className="web-root">
        <div className={`auth-web-wrap${screen === 'login' ? ' is-login' : ''}`}>
          {screen === 'login'    && <LoginPage    onLogin={handleLogin}       onGoRegister={() => setScreen('register')} />}
          {screen === 'register' && <RegisterPage onRegister={handleRegister} onGoLogin={() => setScreen('login')} />}
        </div>
        <WebTweaks tweaks={tweaks} setTweak={setTweak} />
      </div>
    );
  }

  // ── Operator route — full screen ──
  if (screen === 'operator_route') {
    return (
      <div className="web-root" style={{position:'relative'}}>
        <div style={{flex:1, position:'relative', overflow:'hidden'}}>
          <OperatorRoutePage job={job}
                             onBack={() => setScreen('operator_job')}
                             onComplete={() => setScreen('operator_home')} />
        </div>
        <WebTweaks tweaks={tweaks} setTweak={setTweak} />
      </div>
    );
  }

  return (
    <div className="web-root">
      <WebHeader role={role} email={email} screen={screen}
                 setScreen={setScreen} onLogout={handleLogout}
                 />
      <div className="web-body">
        <WebSidebar role={role} screen={screen} setScreen={setScreen}
                    reqCount={3} hasActive={tweaks.hasActiveJob} />
        <div className="web-content">

          {/* Customer */}
          {screen==='customer_home' && (
            <CustomerHomeWeb email={email} onLogout={handleLogout}
                             hasActiveJob={tweaks.hasActiveJob}
                             onOpenJob={openJob} />
          )}
          {screen==='customer_job' && (
            <div className="page-narrow">
              <CustomerJobPage email={email} onLogout={handleLogout}
                               tower={job?.tower || TOWERS[0]}
                               status={job?.status || 'en_route'}
                               onBack={() => setScreen('customer_home')} />
            </div>
          )}

          {/* Operator */}
          {screen==='operator_home' && (
            <OperatorHomeWeb onGoRoute={openRoute} />
          )}
          {screen==='operator_job' && (
            <div className="page-narrow">
              <OperatorJobPage email={email} onLogout={handleLogout}
                               job={job || { id:'j1', email:'can.ozturk@mail.com', city:'Sarıyer, İstanbul', status:'accepted', price:850, dist:'9.2 km' }}
                               onBack={() => setScreen('operator_home')}
                               onGoRoute={openRoute} />
            </div>
          )}

          {/* Profile + History — both roles */}
          {screen==='customer_profile' && (
            <div className="page-narrow">
              <CustomerProfile email={email} onLogout={handleLogout} />
            </div>
          )}
          {screen==='customer_history' && (
            <div className="page-narrow">
              <CustomerHistory email={email} onLogout={handleLogout}
                               onOpenJob={openJob} />
            </div>
          )}
          {screen==='operator_profile' && (
            <div className="page-narrow">
              <OperatorProfile email={email} onLogout={handleLogout} />
            </div>
          )}
          {screen==='operator_history' && (
            <div className="page-narrow">
              <OperatorHistory email={email} onLogout={handleLogout} />
            </div>
          )}

        </div>
      </div>
      <BottomNav role={role} screen={screen} setScreen={setScreen} hasActive={tweaks.hasActiveJob} />
      <WebTweaks tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<WebApp />);
