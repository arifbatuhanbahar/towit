// history.jsx — Customer & Operator history pages

const { useState: useStateHist, useMemo: useMemoHist } = React;

// ──────────────────────────────────────────────────────────────
// Demo data
// ──────────────────────────────────────────────────────────────
const CUSTOMER_HISTORY = [
  { id:'h1', date:'18 May 2026', time:'14:38', operator:'Yıldız Çekici',       vehicleType:'platform', breakdown:'motor',  dist:'3.4 km', price:850,  status:'completed', rating:5 },
  { id:'h2', date:'03 May 2026', time:'09:22', operator:'Hızlı Kurtarma 7/24', vehicleType:'vinclu',   breakdown:'aku',    dist:'1.8 km', price:540,  status:'completed', rating:4 },
  { id:'h3', date:'12 Nis 2026', time:'18:05', operator:'Mavi Yol Çekici',     vehicleType:'kanca',    breakdown:'kaza',   dist:'7.2 km', price:1240, status:'completed', rating:5 },
  { id:'h4', date:'28 Mar 2026', time:'21:14', operator:'Yıldız Çekici',       vehicleType:'platform', breakdown:'yakıt',  dist:'2.1 km', price:620,  status:'cancelled',rating:null },
  { id:'h5', date:'15 Mar 2026', time:'11:47', operator:'Ankara Kurtarma',     vehicleType:'ahtapot',  breakdown:'lastik', dist:'4.6 km', price:780,  status:'completed', rating:3 },
];

const OPERATOR_HISTORY = [
  { id:'oh1', date:'19 May 2026', time:'16:02', customer:'cn****@mail.com',  breakdown:'motor',  dist:'5.2 km', price:920,  status:'completed', rating:5  },
  { id:'oh2', date:'18 May 2026', time:'09:15', customer:'ay****@mail.com',  breakdown:'lastik', dist:'2.1 km', price:620,  status:'completed', rating:5  },
  { id:'oh3', date:'17 May 2026', time:'14:48', customer:'mu****@mail.com',  breakdown:'aku',    dist:'3.8 km', price:740,  status:'completed', rating:4  },
  { id:'oh4', date:'17 May 2026', time:'11:20', customer:'fa****@mail.com',  breakdown:'kaza',   dist:'8.4 km', price:1380, status:'completed', rating:5  },
  { id:'oh5', date:'16 May 2026', time:'19:34', customer:'er****@mail.com',  breakdown:'yakıt',  dist:'1.6 km', price:480,  status:'cancelled', rating:null },
  { id:'oh6', date:'15 May 2026', time:'08:55', customer:'sa****@mail.com',  breakdown:'diger',  dist:'6.1 km', price:1080, status:'completed', rating:5  },
];

// ──────────────────────────────────────────────────────────────
// CustomerHistory
// ──────────────────────────────────────────────────────────────
function CustomerHistory({ email, onLogout, onOpenJob }) {
  const [filter, setFilter] = useStateHist('all');
  const filtered = useMemoHist(() => {
    if (filter === 'all') return CUSTOMER_HISTORY;
    return CUSTOMER_HISTORY.filter(h => h.status === filter);
  }, [filter]);

  const completedCount = CUSTOMER_HISTORY.filter(h => h.status === 'completed').length;

  return (
    <div className="towit">
      <AppHeader role="customer" email={email} onLogout={onLogout} />
      <div className="scroll-area">
        <div className="screen">

          <h1 style={{fontSize:'1.625rem',fontWeight:900,letterSpacing:'-0.04em',margin:0}}>Geçmiş</h1>

          {/* Summary stats */}
          <div className="grid-2" style={{gap:'var(--s-3)'}}>
            <div style={{padding:'var(--s-4) var(--s-5)',background:'var(--surface)',borderRadius:'var(--r-md)'}}>
              <div style={{fontSize:'0.65rem',fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:6}}>Toplam Talep</div>
              <div style={{fontSize:'1.5rem',fontWeight:900,fontVariantNumeric:'tabular-nums'}}>{CUSTOMER_HISTORY.length}</div>
            </div>
            <div style={{padding:'var(--s-4) var(--s-5)',background:'var(--surface)',borderRadius:'var(--r-md)'}}>
              <div style={{fontSize:'0.65rem',fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:6}}>Tamamlanan</div>
              <div style={{fontSize:'1.5rem',fontWeight:900,fontVariantNumeric:'tabular-nums',color:'var(--success)'}}>{completedCount}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="pill-toggle">
            {[{value:'all',label:'Tümü'},{value:'completed',label:'Tamamlanan'},{value:'cancelled',label:'İptal'}].map(o => (
              <button key={o.value} type="button"
                      className={'pill-toggle__opt '+(filter===o.value?'is-active':'')}
                      onClick={() => setFilter(o.value)}>{o.label}</button>
            ))}
          </div>

          {/* History list */}
          {filtered.length === 0 ? (
            <EmptyState glyph={<Icon.Tow size={28}/>} title="Bu kategoride kayıt yok" />
          ) : (
            <div className="stack-3">
              {filtered.map(h => {
                const VIcon = VehicleIcon[h.vehicleType] || VehicleIcon.platform;
                const bcfg = BREAKDOWN_CFG_LITE[h.breakdown] || BREAKDOWN_CFG_LITE.diger;
                return (
                  <button key={h.id} type="button"
                          onClick={() => onOpenJob && onOpenJob({tower:{name:h.operator,vehicleType:h.vehicleType,vehicleModel:'Ford Transit 350',vehicleYear:2022,price:h.price}, status:h.status})}
                          style={{
                            background:'var(--surface)', border:'none', borderRadius:'var(--r-lg)',
                            padding:'var(--s-4) var(--s-5)', cursor:'pointer', textAlign:'left',
                            fontFamily:'inherit', display:'flex', flexDirection:'column', gap:10,
                            transition:'background 120ms',
                          }}>
                    {/* Header */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:'0.9375rem',letterSpacing:'-0.01em'}}>{h.operator}</div>
                        <div style={{fontSize:'0.775rem',color:'var(--text-faint)',marginTop:3,display:'flex',alignItems:'center',gap:6}}>
                          <span style={{color:'var(--text-muted)',display:'inline-flex'}}><VIcon size={14}/></span>
                          {h.date} · {h.time}
                        </div>
                      </div>
                      <StatusBadge status={h.status}/>
                    </div>

                    {/* Breakdown + dist */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                      <span style={{
                        display:'inline-flex',alignItems:'center',gap:6,
                        padding:'4px 9px',background:'var(--surface-2)',borderRadius:'var(--r-pill)',
                        fontSize:'0.72rem',fontWeight:600,color:'var(--text-muted)',
                      }}>
                        <span style={{color:'var(--text-faint)',display:'inline-flex'}}>
                          {React.createElement(BreakdownIcon[h.breakdown]||BreakdownIcon.diger,{size:12})}
                        </span>
                        {bcfg.label}
                      </span>
                      <span style={{fontSize:'0.775rem',color:'var(--text-muted)',fontVariantNumeric:'tabular-nums'}}>{h.dist}</span>
                    </div>

                    {/* Price + rating */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8,paddingTop:8,borderTop:'1px solid var(--border)'}}>
                      <span style={{fontSize:'1.25rem',fontWeight:900,letterSpacing:'-0.02em',fontVariantNumeric:'tabular-nums',color:h.status==='cancelled'?'var(--text-faint)':'var(--text)'}}>
                        {h.status==='cancelled' ? '—' : h.price.toLocaleString('tr-TR')+' ₺'}
                      </span>
                      {h.rating != null && (
                        <span style={{display:'inline-flex',alignItems:'center',gap:3,color:'var(--primary)',fontWeight:800,fontSize:'0.875rem'}}>
                          <Icon.Star size={13} filled/> {h.rating}/5
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// OperatorHistory
// ──────────────────────────────────────────────────────────────
function OperatorHistory({ email, onLogout }) {
  const [filter, setFilter] = useStateHist('all');
  const filtered = useMemoHist(() => {
    if (filter === 'all') return OPERATOR_HISTORY;
    return OPERATOR_HISTORY.filter(h => h.status === filter);
  }, [filter]);

  const completed = OPERATOR_HISTORY.filter(h => h.status === 'completed');
  const totalEarned = completed.reduce((s, h) => s + h.price, 0);
  const avgRating = completed.filter(h => h.rating).reduce((s, h, _, a) => s + h.rating / a.length, 0);

  return (
    <div className="towit">
      <AppHeader role="operator" email={email} onLogout={onLogout} />
      <div className="scroll-area">
        <div className="screen">

          <h1 style={{fontSize:'1.625rem',fontWeight:900,letterSpacing:'-0.04em',margin:0}}>Geçmiş İşler</h1>

          {/* Summary stats */}
          <div className="grid-2" style={{gap:'var(--s-3)'}}>
            <div style={{padding:'var(--s-4) var(--s-5)',background:'var(--surface)',borderRadius:'var(--r-md)'}}>
              <div style={{fontSize:'0.65rem',fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:6}}>Tamamlanan</div>
              <div style={{fontSize:'1.5rem',fontWeight:900,fontVariantNumeric:'tabular-nums'}}>{completed.length}</div>
            </div>
            <div style={{padding:'var(--s-4) var(--s-5)',background:'var(--surface)',borderRadius:'var(--r-md)'}}>
              <div style={{fontSize:'0.65rem',fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:6}}>Ortalama Puan</div>
              <div style={{fontSize:'1.5rem',fontWeight:900,fontVariantNumeric:'tabular-nums',color:'var(--primary)',display:'inline-flex',alignItems:'center',gap:6}}>
                <Icon.Star size={16} filled/> {avgRating.toFixed(1)}
              </div>
            </div>
            <div style={{padding:'var(--s-4) var(--s-5)',background:'var(--surface)',borderRadius:'var(--r-md)',gridColumn:'1 / -1'}}>
              <div style={{fontSize:'0.65rem',fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:6}}>Toplam Kazanç</div>
              <div style={{fontSize:'1.625rem',fontWeight:900,letterSpacing:'-0.03em',fontVariantNumeric:'tabular-nums',color:'var(--success)'}}>{totalEarned.toLocaleString('tr-TR')} ₺</div>
            </div>
          </div>

          {/* Filters */}
          <div className="pill-toggle">
            {[{value:'all',label:'Tümü'},{value:'completed',label:'Tamamlanan'},{value:'cancelled',label:'İptal'}].map(o => (
              <button key={o.value} type="button"
                      className={'pill-toggle__opt '+(filter===o.value?'is-active':'')}
                      onClick={() => setFilter(o.value)}>{o.label}</button>
            ))}
          </div>

          {/* History list */}
          {filtered.length === 0 ? (
            <EmptyState glyph={<Icon.Tow size={28}/>} title="Bu kategoride kayıt yok" />
          ) : (
            <div className="stack-3">
              {filtered.map(h => {
                const bcfg = BREAKDOWN_CFG_LITE[h.breakdown] || BREAKDOWN_CFG_LITE.diger;
                return (
                  <div key={h.id}
                       style={{
                         background:'var(--surface)', borderRadius:'var(--r-lg)',
                         padding:'var(--s-4) var(--s-5)',
                         display:'flex', flexDirection:'column', gap:10,
                       }}>
                    {/* Header */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:'0.875rem',fontFamily:'monospace',color:'var(--text-muted)'}}>{h.customer}</div>
                        <div style={{fontSize:'0.775rem',color:'var(--text-faint)',marginTop:3}}>{h.date} · {h.time}</div>
                      </div>
                      <StatusBadge status={h.status}/>
                    </div>

                    {/* Breakdown + dist */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                      <span style={{
                        display:'inline-flex',alignItems:'center',gap:6,
                        padding:'4px 9px',background:'var(--surface-2)',borderRadius:'var(--r-pill)',
                        fontSize:'0.72rem',fontWeight:600,color:'var(--text-muted)',
                      }}>
                        <span style={{color:'var(--text-faint)',display:'inline-flex'}}>
                          {React.createElement(BreakdownIcon[h.breakdown]||BreakdownIcon.diger,{size:12})}
                        </span>
                        {bcfg.label}
                      </span>
                      <span style={{fontSize:'0.775rem',color:'var(--text-muted)',fontVariantNumeric:'tabular-nums'}}>{h.dist}</span>
                    </div>

                    {/* Price + rating */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8,paddingTop:8,borderTop:'1px solid var(--border)'}}>
                      <span style={{fontSize:'1.25rem',fontWeight:900,letterSpacing:'-0.02em',fontVariantNumeric:'tabular-nums',color:h.status==='cancelled'?'var(--text-faint)':'var(--success)'}}>
                        {h.status==='cancelled' ? '—' : '+'+h.price.toLocaleString('tr-TR')+' ₺'}
                      </span>
                      {h.rating != null && (
                        <span style={{display:'inline-flex',alignItems:'center',gap:3,color:'var(--primary)',fontWeight:800,fontSize:'0.875rem'}}>
                          <Icon.Star size={13} filled/> {h.rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Lite breakdown config — just labels needed here
const BREAKDOWN_CFG_LITE = {
  motor:  { label:'Motor Arızası' },
  aku:    { label:'Akü Bitti'      },
  yakıt:  { label:'Yakıt Bitti'    },
  kaza:   { label:'Kaza'           },
  lastik: { label:'Patlak Lastik'  },
  diger:  { label:'Diğer'          },
};

Object.assign(window, { CustomerHistory, OperatorHistory });
