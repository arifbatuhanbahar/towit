// operator.jsx — OperatorPage + OperatorJobPage + OperatorRoutePage  (Asphalt v4)

const { useState: useStateOp } = React;

const REQUESTS = [
  { id:'r1', email:'ayse.kaya@mail.com',    city:'Kadıköy, İstanbul',  timeAgo:'2 dk önce',  dist:'2.1 km', price:620,  status:'open',            breakdown:'motor',  isNew:true  },
  { id:'r2', email:'murat.demir@mail.com',  city:'Ümraniye, İstanbul', timeAgo:'18 dk önce', dist:'4.8 km', price:890,  status:'open',            breakdown:'lastik', isNew:false },
  { id:'r3', email:'fatma.yilmaz@mail.com', city:'Şişli, İstanbul',   timeAgo:'47 dk önce', dist:'1.6 km', price:540,  status:'payment_pending', breakdown:'aku',    isNew:false },
];
const ACTIVE_JOBS = [
  { id:'j1', email:'can.ozturk@mail.com', city:'Sarıyer, İstanbul', status:'en_route', price:850, dist:'9.2 km' },
];

const BREAKDOWN_CFG = {
  lastik: { iconName:'lastik', label:'Patlak Lastik', bg:'rgba(234,179,8,0.12)',  color:'#fbbf24' },
  motor:  { iconName:'motor',  label:'Motor Arızası', bg:'rgba(239,68,68,0.10)',  color:'#f87171' },
  aku:    { iconName:'aku',    label:'Akü Bitti',     bg:'rgba(168,85,247,0.10)', color:'#c084fc' },
  yakıt:  { iconName:'yakıt',  label:'Yakıt Bitti',   bg:'rgba(245,158,11,0.12)', color:'#fbbf24' },
  kaza:   { iconName:'kaza',   label:'Kaza',          bg:'rgba(239,68,68,0.12)',  color:'#f87171' },
  diger:  { iconName:'diger',  label:'Diğer',         bg:'var(--surface-3)',      color:'var(--text-muted)' },
};

// ── OperatorPage ─────────────────────────────────────────────
function OperatorPage({ email, onLogout, onOpenJob }) {
  const [tab,    setTab]    = useStateOp('requests');
  const [reqs,   setReqs]   = useStateOp(REQUESTS);
  const [active, setActive] = useStateOp(ACTIVE_JOBS);

  function accept(id) {
    const r = reqs.find(x => x.id === id);
    setReqs(p => p.filter(x => x.id !== id));
    if (r) setActive(p => [...p, { ...r, status:'accepted' }]);
  }
  function reject(id) { setReqs(p => p.filter(x => x.id !== id)); }

  return (
    <div className="towit">
      <AppHeader role="operator" email={email} onLogout={onLogout} />
      <div className="scroll-area">
        <div className="screen">

          {/* Summary pills */}
          <div style={{display:'flex', gap:8}}>
            <button type="button" onClick={() => setTab('requests')}
                    className={'badge ' + (reqs.length > 0 ? 'status-open' : 'status-cancelled')}
                    style={{fontSize:12, padding:'6px 14px', cursor:'pointer', border:'none', font:'600 0.8rem var(--font)'}}>
              {reqs.length} yeni istek
            </button>
            <button type="button" onClick={() => setTab('active')}
                    className={'badge ' + (active.length > 0 ? 'status-en_route' : 'status-cancelled')}
                    style={{fontSize:12, padding:'6px 14px', cursor:'pointer', border:'none', font:'600 0.8rem var(--font)'}}>
              {active.length} aktif iş
            </button>
          </div>

          <TabToggle value={tab} onChange={setTab}
            options={[
              { value:'requests', label:'Yeni istekler', count: reqs.length },
              { value:'active',   label:'Aktif işler',   count: active.length },
            ]} />

          {/* ── Requests ── */}
          {tab === 'requests' && (
            reqs.length === 0 ? (
              <EmptyState
                glyph={<Icon.Tow size={28}/>}
                title="Yeni talep yok"
                sub="Yeni iş istekleri burada görünecek."
              />
            ) : (
              <div className="stack-3">
                {reqs.map(r => {
                  const bcfg = BREAKDOWN_CFG[r.breakdown] || BREAKDOWN_CFG.diger;
                  const BIcon = BreakdownIcon[r.breakdown] || BreakdownIcon.diger;
                  return (
                  <div key={r.id} className="req-card">
                    {/* Header row: Yeni badge + time */}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      {r.isNew ? (
                        <span className="new-badge"><span className="pulse"></span>Yeni</span>
                      ) : <span></span>}
                      <span className="time-elapsed">{r.timeAgo}</span>
                    </div>

                    <div className="req-card__row">
                      <div className="req-card__avatar">{r.email[0].toUpperCase()}</div>
                      <div style={{flex:1, minWidth:0}}>
                        <div className="req-card__id"
                             style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'17ch'}}>
                          {r.email}
                        </div>
                        <div className="req-card__meta">{r.city}</div>
                      </div>
                      <div className="req-card__price-block">
                        <div className="req-card__price">{r.price.toLocaleString('tr-TR')} ₺</div>
                        <div className="req-card__dist">{r.dist}</div>
                      </div>
                    </div>

                    {/* Breakdown chip */}
                    <div className="req-card__breakdown-chip">
                      <BIcon size={14}/>
                      {bcfg.label}
                    </div>

                    <div className="req-card__actions">
                      <button className="btn btn-primary" onClick={() => accept(r.id)}>Kabul et</button>
                      <button className="btn btn-ghost btn-sm btn-square"
                              style={{width:'auto', minWidth:76}}
                              onClick={() => reject(r.id)}>Reddet</button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── Active jobs ── */}
          {tab === 'active' && (
            active.length === 0 ? (
              <EmptyState
                glyph={<Icon.Tow size={28}/>}
                title="Aktif iş yok"
                sub="Kabul ettiğiniz işler burada görünür."
              />
            ) : (
              <div className="stack-3">
                {active.map(j => (
                  <div key={j.id} className="active-job">
                    <div className={'active-job__stripe ' + j.status} />
                    <div className="active-job__body">
                      <div className="row-between">
                        <div>
                          <div style={{fontWeight:800, fontSize:'0.9375rem', letterSpacing:'-0.01em',
                                       overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'18ch'}}>
                            {j.email}
                          </div>
                          <div style={{fontSize:12, color:'var(--text-faint)', marginTop:3}}>{j.city}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:'1.625rem', fontWeight:900, letterSpacing:'-0.04em',
                                       fontVariantNumeric:'tabular-nums', lineHeight:1}}>
                            {j.price.toLocaleString('tr-TR')} ₺
                          </div>
                          <div style={{marginTop:4}}><StatusBadge status={j.status} /></div>
                        </div>
                      </div>
                      <button className="btn btn-primary"
                              onClick={() => onOpenJob && onOpenJob(j)}>
                        Detay → Rotaya git
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}

// ── OperatorJobPage ──────────────────────────────────────────
function OperatorJobPage({ job, onBack, onLogout, onGoRoute, email }) {
  const j = job || ACTIVE_JOBS[0];
  const [status, setStatus] = useStateOp(j.status || 'accepted');

  const custVehicle = { brand:'Toyota', model:'Corolla', plate:'34 XY 001', breakdownType:'motor', phone:'0532 987 65 43' };

  const ACTIONS = {
    payment_pending: { label:'Talebi onayla',          cls:'btn-primary'                       },
    open:            { label:'İşi kabul et',            cls:'btn-primary'                       },
    accepted:        { label:'Rotayı aç',               cls:'btn-primary', big:true, onRoute:true },
    en_route:        { label:'Teslim edildi — Tamamla', cls:'btn-success', big:true             },
    completed:       { label:'İş tamamlandı',           cls:'btn-ghost',   disabled:true        },
  };
  const action = ACTIONS[status] || ACTIONS.accepted;

  function handleAction() {
    if (action.onRoute) { onGoRoute && onGoRoute(j); return; }
    if (status === 'payment_pending') setStatus('open');
    else if (status === 'open')       setStatus('accepted');
    else if (status === 'en_route')   setStatus('completed');
  }

  const cfg       = BREAKDOWN_CFG[custVehicle.breakdownType] || BREAKDOWN_CFG.diger;
  const showPhone = status === 'accepted' || status === 'en_route';

  return (
    <div className="towit">
      <AppHeader role="operator" email={email} onLogout={onLogout} />
      <div className="scroll-area">
        <div className="screen">

          <button className="btn-link" onClick={onBack} style={{alignSelf:'flex-start'}}>
            <Icon.Arrow dir="left" size={14}/> Panele dön
          </button>

          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{fontSize:'1.5rem',fontWeight:900,letterSpacing:'-0.04em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.email}</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <StatusBadge status={status} />
              <span style={{fontSize:12,color:'var(--text-faint)'}}>#{j.id?.toUpperCase()}</span>
            </div>
          </div>

          {/* Customer vehicle card */}
          <div className="card stack-3">
            <div style={{fontSize:'0.64rem',fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)'}}>Müşteri Araç Bilgileri</div>
            <div style={{
              display:'inline-flex',alignItems:'center',gap:10,
              padding:'10px 16px',borderRadius:'var(--r-md)',
              background:cfg.bg,color:cfg.color,
              fontWeight:800,fontSize:'1rem',alignSelf:'flex-start',
            }}>
              <span style={{display:'inline-flex', alignItems:'center'}}>
                {React.createElement(BreakdownIcon[cfg.iconName] || BreakdownIcon.diger, {size: 18})}
              </span>
              {cfg.label}
            </div>
            <div style={{fontSize:'0.9rem',color:'var(--text-muted)'}}>
              {[custVehicle.brand,custVehicle.model,custVehicle.plate?'· '+custVehicle.plate:null].filter(Boolean).join(' ')}
            </div>
            {showPhone && (
              <a href="tel:08503000000"
                 style={{
                   display:'flex', alignItems:'center', gap:12,
                   padding:'14px var(--s-4)', borderRadius:'var(--r-md)',
                   background:'var(--success-soft)',
                   border:'1px solid rgba(34,197,94,0.25)',
                   textDecoration:'none', color:'var(--success)',
                 }}>
                <span style={{
                  width:36, height:36, borderRadius:8,
                  background:'var(--success)', color:'#000',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}>
                  <Icon.Phone size={17}/>
                </span>
                <div>
                  <div style={{fontWeight:800, fontSize:'0.9375rem', color:'var(--text)'}}>Müşteriyi ara — Towit Hattı</div>
                  <div style={{fontSize:'0.775rem', color:'var(--text-muted)', marginTop:2}}>0850 300 00 00 · Numaran gizli kalır</div>
                </div>
              </a>
            )}
          </div>

          <div className="grid-2" style={{gap:'var(--s-3)'}}>
            {[['Çekim','41.0451, 29.0331'],['Varış','41.0082, 28.9784'],['Mesafe',j.dist||'3.4 km'],['Ücret',(j.price||850).toLocaleString('tr-TR')+' ₺']].map(([k,v]) => (
              <div key={k} style={{padding:'var(--s-3) var(--s-4)',background:'var(--surface)',borderRadius:'var(--r-md)'}}>
                <div style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:5}}>{k}</div>
                <div style={{fontWeight:800,fontSize:'0.9375rem',fontVariantNumeric:'tabular-nums'}}>{v}</div>
              </div>
            ))}
          </div>

          <MapMock height={190} route />

          <button className={'btn '+action.cls+' btn-square'}
                  style={action.big?{minHeight:60,fontSize:'1rem',borderRadius:'var(--r-lg)'}:{}}
                  disabled={action.disabled} onClick={handleAction}>
            {action.label}
          </button>

          {status !== 'completed' && (
            <button className="btn btn-danger-ghost btn-sm btn-square" style={{marginTop:-8}}>
              Reddet / İptal et
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── OperatorRoutePage ────────────────────────────────────────
function OperatorRoutePage({ job, onBack, onComplete }) {
  const j = job || ACTIVE_JOBS[0];
  const [phase,    setPhase]    = useStateOp('to_pickup');
  const [tracking, setTracking] = useStateOp(true);

  function advance() {
    if (phase === 'to_pickup') setPhase('to_dest');
    else onComplete && onComplete();
  }

  return (
    <div className="rota-shell">
      <div style={{position:'absolute',inset:0}}>
        <MapMock height="100%" route live />
      </div>

      <div className="rota-top">
        <button type="button" className="rota-top__icon" onClick={onBack} aria-label="Geri">
          <Icon.Arrow dir="left" size={16} />
        </button>
        <div style={{flex:1}}>
          <div className="rota-top__title">
            {phase === 'to_pickup' ? 'Müşteriye gidiş' : 'Varışa gidiş'}
          </div>
          <div className="rota-top__detail">{j.email || 'can.ozturk@mail.com'}</div>
        </div>
        <button type="button"
                style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-faint)',fontSize:13,fontWeight:700,fontFamily:'inherit'}}
                onClick={() => {}}>
          Detay →
        </button>
      </div>

      <div className="rota-eta">
        <div>
          <div className="rota-eta__time">{phase==='to_pickup' ? '~9 dk' : '~14 dk'}</div>
          <div className="rota-eta__sub">tahmini varış</div>
        </div>
        <div className="rota-eta__dist">{phase==='to_pickup' ? '2.1 km' : '3.4 km'}</div>
      </div>

      <div className="rota-fab-group">
        <button type="button"
                className={'rota-fab '+(tracking?'is-active':'')}
                onClick={() => setTracking(t => !t)}
                aria-label="Konum takibi">
          <Icon.Crosshair size={20}/>
        </button>
        <button type="button" className="rota-fab" aria-label="Rotayı yenile">
          <Icon.Refresh size={17}/>
        </button>
      </div>

      <div className="rota-cta">
        <button className={'btn btn-square '+(phase==='to_dest'?'btn-success':'btn-primary')}
                onClick={advance}
                style={{borderRadius:'var(--r-lg)'}}>
          {phase === 'to_pickup'
            ? 'Müşteriyi aldım — Yola devam'
            : 'Hedefe ulaştım — İşi tamamla'}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { OperatorPage, OperatorJobPage, OperatorRoutePage, REQUESTS, ACTIVE_JOBS });
