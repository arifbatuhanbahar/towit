// customer.jsx — CustomerPage (5-step wizard) + CustomerJobPage  (Asphalt v4 + vehicle details)

const { useState: useStateCust, useMemo: useMemoCust } = React;

const CITIES = [
  { name: 'İstanbul',  code: '34' }, { name: 'Ankara',    code: '06' },
  { name: 'İzmir',     code: '35' }, { name: 'Bursa',     code: '16' },
  { name: 'Antalya',   code: '07' }, { name: 'Adana',     code: '01' },
  { name: 'Konya',     code: '42' }, { name: 'Gaziantep', code: '27' },
];
const ADDRESSES = [
  { type:'service', label:'Toyota Yetkili Servisi',  detail:'Maslak Sanayi Mah., Sarıyer' },
  { type:'service', label:'Ford Plaza Servis',       detail:'Atatürk Havalimanı, Bakırköy' },
  { type:'industry', label:'İkitelli Sanayi Sitesi', detail:'Başakşehir' },
  { type:'address', label:'Levent Mah., Beşiktaş',   detail:null },
  { type:'address', label:'Kadıköy İskele Meydanı',  detail:null },
];
const TOWERS = [
  { id:'t1', name:'Yıldız Çekici',       vehicleType:'platform',    vehicleModel:'Ford Transit 350', vehicleYear:2022, capacityNote:'2.5 tona kadar, sedan/SUV/hafif ticari', rating:4.9, ratingCount:87,  eta:9,  price:850,  base:350, perKm:18, distToPickup:2.1 },
  { id:'t2', name:'Hızlı Kurtarma 7/24', vehicleType:'vinclu',      vehicleModel:'Iveco Daily 70C',  vehicleYear:2021, capacityNote:'Sedan ve SUV uyumlu, 3.5 ton',            rating:4.7, ratingCount:54,  eta:12, price:720,  base:280, perKm:15, distToPickup:4.8 },
  { id:'t3', name:'Mavi Yol Çekici',     vehicleType:'agir',        vehicleModel:'MAN TGS 26',       vehicleYear:2020, capacityNote:null,                                      rating:4.6, ratingCount:120, eta:18, price:1200, base:500, perKm:22, distToPickup:6.3 },
];
const STEP_TITLES = ['Bölge seç', 'Aracınız', 'Çekim noktası', 'Varış noktası', 'Çekici seç'];
const BREAKDOWN_OPTS = [
  { value:'motor',  label:'Motor Arızası'  },
  { value:'aku',    label:'Akü Bitti'      },
  { value:'yakıt',  label:'Yakıt Bitti'    },
  { value:'kaza',   label:'Kaza'           },
  { value:'lastik', label:'Patlak Lastik'  },
  { value:'diger',  label:'Diğer'          },
];
// Vehicle icons now come from window.VehicleIcon (SVG components)

// ── City combo ──────────────────────────────────────────────
function CityCombo({ value, onChange }) {
  const [open, setOpen] = useStateCust(false);
  const [q, setQ]       = useStateCust('');
  const filtered = useMemoCust(() => {
    const s = q.toLowerCase().trim();
    return s ? CITIES.filter(c => c.name.toLowerCase().includes(s)) : CITIES;
  }, [q]);
  return (
    <div className="combo">
      <input className="input combo__input"
             placeholder="Şehir ara…"
             value={open ? q : (value ? `${value.name}  (${value.code})` : '')}
             onFocus={() => setOpen(true)}
             onBlur={() => setTimeout(() => setOpen(false), 150)}
             onChange={e => setQ(e.target.value)} />
      <span className="combo__chev"><Icon.Chevron dir={open ? 'up' : 'down'} /></span>
      {open && (
        <div className="combo__menu">
          {filtered.map(c => (
            <div key={c.code} className="combo__opt"
                 onMouseDown={() => { onChange(c); setOpen(false); setQ(''); }}>
              <span>{c.name}</span><span className="combo__code">({c.code})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CustomerPage ─────────────────────────────────────────────
function CustomerPage({ email, onLogout, onOpenJob, hasActiveJob }) {
  const [step,       setStep]       = useStateCust(2);
  const [city,       setCity]       = useStateCust(CITIES[0]);
  const [breakdown,  setBreakdown]  = useStateCust(null);
  const [vBrand,     setVBrand]     = useStateCust('');
  const [vModel,     setVModel]     = useStateCust('');
  const [vPlate,     setVPlate]     = useStateCust('');
  const [cPhone,     setCPhone]     = useStateCust('');
  const [destMode,   setDestMode]   = useStateCust('search');
  const [destAddr,   setDestAddr]   = useStateCust('Levent Mah., Beşiktaş');
  const [sortBy,     setSortBy]     = useStateCust('best');
  const [histOpen,   setHistOpen]   = useStateCust(false);
  const [expanded,   setExpanded]   = useStateCust(null);

  const sorted = useMemoCust(() => {
    const arr = [...TOWERS];
    return sortBy === 'best' ? arr.sort((a,b) => a.price - b.price) : arr.sort((a,b) => a.eta - b.eta);
  }, [sortBy]);

  const JOB_DIST = 3.4;

  return (
    <div className="towit">
      <AppHeader role="customer" email={email} onLogout={onLogout} />
      <div className="scroll-area">
        <div className="screen">

          {hasActiveJob && (
            <button type="button" className="active-banner"
                    style={{width:'100%', font:'inherit', color:'#000', cursor:'pointer'}}
                    onClick={() => onOpenJob && onOpenJob({ tower:TOWERS[0], status:'en_route' })}>
              <div className="active-banner__body">
                <span className="active-banner__status"><span className="dot"></span>Yolda</span>
                <span className="active-banner__name">Yıldız Çekici</span>
                <span className="active-banner__price">850 ₺ · tahminen 9 dk</span>
              </div>
              <span className="active-banner__cta">Takip et →</span>
            </button>
          )}

          <Stepper step={step} total={5} title={STEP_TITLES[step-1]} />

          {/* ── Step 1: Bölge ── */}
          {step === 1 && (
            <div className="stack-4">
              <div className="field">
                <label className="field-label">Şehir</label>
                <CityCombo value={city} onChange={setCity} />
              </div>
            </div>
          )}

          {/* ── Step 2: Araç (YENİ) ── */}
          {step === 2 && (
            <div className="stack-5">
              <div className="stack-3">
                <div className="field-label">Arıza türü <span style={{color:'var(--text-faint)',textTransform:'none',letterSpacing:0}}>(opsiyonel)</span></div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  {BREAKDOWN_OPTS.map(opt => {
                    const sel = breakdown === opt.value;
                    return (
                      <button key={opt.value} type="button"
                              onClick={() => setBreakdown(sel ? null : opt.value)}
                              style={{
                                display:'flex', alignItems:'center', gap:10,
                                padding:'12px 14px', borderRadius:'var(--r-md)',
                                border:`2px solid ${sel ? 'var(--primary)' : 'var(--border-strong)'}`,
                                background: sel ? 'var(--primary-soft)' : 'var(--surface-2)',
                                cursor:'pointer', fontFamily:'inherit',
                                fontSize:'0.875rem', fontWeight:600, color:'var(--text)',
                                textAlign:'left', transition:'border-color 150ms, background 150ms',
                              }}>
                        <span style={{display:'inline-flex',width:22,height:22,alignItems:'center',justifyContent:'center',color: sel ? 'var(--primary)' : 'var(--text-muted)'}}>
                          {React.createElement(BreakdownIcon[opt.value] || BreakdownIcon.diger, {size: 18})}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid-2" style={{gap:12}}>
                <div className="field">
                  <label className="field-label">Araç Markası</label>
                  <input className="input" value={vBrand} onChange={e => setVBrand(e.target.value)} placeholder="Toyota, Ford…" />
                </div>
                <div className="field">
                  <label className="field-label">Araç Modeli</label>
                  <input className="input" value={vModel} onChange={e => setVModel(e.target.value)} placeholder="Corolla, Focus…" />
                </div>
                <div className="field">
                  <label className="field-label">Plaka</label>
                  <input className="input" value={vPlate} onChange={e => setVPlate(e.target.value.toUpperCase())} placeholder="34 XY 001" maxLength={15} />
                </div>
                <div className="field">
                  <label className="field-label">Telefon</label>
                  <input className="input" type="tel" value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="0532 123 45 67" />
                  <span style={{fontSize:'0.72rem',color:'var(--text-faint)'}}>Çekici kabul edince paylaşılır</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Çekim ── */}
          {step === 3 && (
            <div className="stack-4">
              <button type="button" className="btn-locate"><Icon.Crosshair size={18}/> Konumumu kullan</button>
              <MapMock height={210} single chip={<><Icon.Pin size={11}/> Haritaya dokunun</>} />
              <div className="coord-confirm">
                <span className="coord-confirm__check"><Icon.Check /></span>
                <div className="stack-2">
                  <strong style={{fontSize:13, fontWeight:800}}>Çekim noktası seçildi</strong>
                  <span style={{fontSize:12, color:'var(--success)'}}>41.0451, 29.0331</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Varış ── */}
          {step === 4 && (
            <div className="stack-4">
              <PillToggle value={destMode} onChange={setDestMode}
                options={[{value:'map',label:'Haritada seç'},{value:'search',label:'Adres ara'}]} />
              {destMode === 'search' ? (
                <div className="stack-3">
                  <div className="input-wrap">
                    <input className="input" value={destAddr} onChange={e => setDestAddr(e.target.value)} placeholder="Sokak, mahalle…" />
                    <button type="button" className="input-icon-btn"><Icon.Search /></button>
                  </div>
                  <div className="card-flat" style={{padding:4}}>
                    {ADDRESSES.map((a,i) => {
                      const isSel = destAddr === a.label;
                      const typeColor = a.type==='service' ? 'var(--primary)' : a.type==='industry' ? 'var(--success)' : 'var(--text-faint)';
                      const typeLabel = a.type==='service' ? 'Yetkili Servis' : a.type==='industry' ? 'Sanayi Sitesi' : null;
                      return (
                      <div key={i} onMouseDown={() => setDestAddr(a.label)}
                           style={{padding:'10px 12px', borderRadius:'var(--r-sm)', cursor:'pointer',
                                   display:'flex', alignItems:'flex-start', gap:10,
                                   background: isSel ? 'var(--surface-3)' : 'transparent'}}>
                        <span style={{color:typeColor, marginTop:2, flexShrink:0}}><Icon.Pin size={14}/></span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13, fontWeight:600, color:'var(--text)'}}>{a.label}</div>
                          {(a.detail || typeLabel) && (
                            <div style={{fontSize:11, color:'var(--text-muted)', marginTop:2, display:'flex', alignItems:'center', gap:6}}>
                              {typeLabel && <span style={{color:typeColor, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', fontSize:'0.62rem'}}>{typeLabel}</span>}
                              {a.detail && <span>{a.detail}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              ) : <MapMock height={200} route />}
            </div>
          )}

          {/* ── Step 5: Çekiciler ── */}
          {step === 5 && (
            <div className="stack-4">
              <PillToggle value={sortBy} onChange={setSortBy}
                options={[{value:'best',label:'En uygun'},{value:'nearest',label:'En yakın'}]} />
              {sorted.map(t => {
                const isOpen = expanded === t.id;
                return (
                  <div key={t.id} className={'tower-card' + (isOpen ? ' is-expanded' : '')}>
                    {/* Row 1 — name + rating */}
                    <div className="tower-card__top">
                      <div style={{flex:1, minWidth:0}}>
                        <div className="tower-card__name">{t.name}</div>
                        {/* Row 2 — vehicle */}
                        <div style={{fontSize:'0.85rem', color:'var(--text-muted)', marginTop:4, display:'flex', alignItems:'center', gap:5}}>
                          <span style={{display:'inline-flex',color:'var(--text-faint)'}}>
                            {React.createElement(VehicleIcon[t.vehicleType] || VehicleIcon.platform, {size: 16})}
                          </span>
                          <span>{t.vehicleModel}{t.vehicleYear ? ` · ${t.vehicleYear}` : ''}</span>
                        </div>
                      </div>
                      <div style={{textAlign:'right', flexShrink:0}}>
                        <div className="tower-card__rating"><Icon.Star size={13} filled /> {t.rating.toFixed(1)} <span style={{color:'var(--text-faint)',fontWeight:600,fontSize:'0.75rem'}}>({t.ratingCount})</span></div>
                      </div>
                    </div>

                    {/* Row 3 — capacity pill */}
                    {t.capacityNote && (
                      <div style={{
                        display:'inline-flex', alignItems:'center', gap:5,
                        background:'var(--surface-2)', borderRadius:'var(--r-pill)',
                        padding:'4px 10px', fontSize:'0.775rem', color:'var(--text-muted)',
                        alignSelf:'flex-start',
                      }}>
                        <span style={{color:'var(--success)',display:'inline-flex'}}><Icon.Check size={11}/></span>
                        {t.capacityNote.length > 42 ? t.capacityNote.slice(0,42)+'…' : t.capacityNote}
                      </div>
                    )}

                    {/* Row 4 — price */}
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                      <span style={{fontSize:'1.625rem', fontWeight:900, letterSpacing:'-0.04em', color:'var(--primary)', fontVariantNumeric:'tabular-nums', lineHeight:1}}>
                        ~{t.price.toLocaleString('tr-TR')} ₺
                      </span>
                      <span style={{fontSize:'0.75rem', color:'var(--text-faint)', textAlign:'right', lineHeight:1.5}}>
                        {t.base.toLocaleString('tr-TR')} ₺ taban<br/>
                        {JOB_DIST} km × {t.perKm} ₺
                      </span>
                    </div>

                    {/* Row 5 — dist + route link */}
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontSize:'0.8rem', color:'var(--text-faint)'}}>
                        Merkeze ~{t.distToPickup} km
                      </span>
                      <button type="button" className="tower-card__expand"
                              onClick={() => setExpanded(isOpen ? null : t.id)}>
                        {isOpen ? 'Rotayı gizle' : 'Rotayı gör'} <Icon.Chevron size={11} dir={isOpen?'up':'down'}/>
                      </button>
                    </div>
                    {isOpen && <MapMock height={130} route />}

                    <button className="btn btn-primary"
                            onClick={() => onOpenJob && onOpenJob({ tower:t, status:'accepted' })}>
                      Bu çekiciyi seç →
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Nav buttons — sticky at bottom of step */}
          <div className="wizard-cta">
            {step > 1 && (
              <button className="btn btn-ghost btn-square"
                      style={{flex:'0 0 auto', width:'auto', minWidth:80}}
                      onClick={() => setStep(s => s-1)}>
                <Icon.Arrow dir="left" size={14}/> Geri
              </button>
            )}
            {step === 2 && (
              <button className="btn btn-ghost btn-square"
                      style={{flex:'0 0 auto', width:'auto', minWidth:72}}
                      onClick={() => setStep(3)}>
                Atla
              </button>
            )}
            {step < 5 && (
              <button className="btn btn-primary" style={{flex:1}} onClick={() => setStep(s => s+1)}>
                Devam et
              </button>
            )}
          </div>

          {/* History */}
          <div className="accordion">
            <button type="button" className="accordion__toggle" onClick={() => setHistOpen(o => !o)}>
              <span>Geçmiş talepler <span style={{color:'var(--text-faint)'}}>3</span></span>
              <span className={'accordion__chev '+(histOpen?'is-open':'')}><Icon.Chevron /></span>
            </button>
            {histOpen && (
              <div className="accordion__body">
                {[
                  {date:'03 May', name:'Yıldız Çekici',       price:920, status:'completed'},
                  {date:'12 Nis', name:'Hızlı Kurtarma 7/24', price:640, status:'completed'},
                  {date:'28 Mar', name:'Mavi Yol Çekici',     price:0,   status:'cancelled'},
                ].map((h,i) => (
                  <div key={i} className="history-row">
                    <span className="history-row__date">{h.date}</span>
                    <span className="history-row__name">{h.name}</span>
                    <div className="history-row__right">
                      <span className="history-row__price">{h.price ? h.price.toLocaleString('tr-TR')+' ₺' : '—'}</span>
                      <StatusBadge status={h.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CustomerJobPage ──────────────────────────────────────────
const BREAKDOWN_LABELS = { motor:'Motor Arızası', aku:'Akü Bitti', yakıt:'Yakıt Bitti', kaza:'Kaza', lastik:'Patlak Lastik', diger:'Diğer' };

function CustomerJobPage({ tower, status, onBack, onLogout, email }) {
  const t = tower || TOWERS[0];
  const s = status || 'en_route';
  const [rating,  setRating]  = useStateCust(0);
  const [hovered, setHovered] = useStateCust(0);
  const [note,    setNote]    = useStateCust('');

  const events = [
    { label:'Talep oluşturuldu', time:'14:02', state:'done' },
    { label:'Çekici kabul etti', time:'14:04', state:'done' },
    { label:'Çekici yolda',      time:'14:05', state: s==='completed'?'done':'active' },
    { label:'Tamamlandı',        time: s==='completed'?'14:38':'—', state: s==='completed'?'done':'pending' },
  ];

  return (
    <div className="towit">
      <AppHeader role="customer" email={email} onLogout={onLogout} />
      <div className="scroll-area">
        <div className="screen">

          <button className="btn-link" onClick={onBack} style={{alignSelf:'flex-start'}}>
            <Icon.Arrow dir="left" size={14}/> Geri dön
          </button>

          {/* Hero */}
          <div className="hero-status">
            <div className="row-between">
              <StatusBadge status={s} />
              <span style={{fontSize:12,color:'var(--text-faint)'}}>#TW-7421</span>
            </div>
            <div className="hero-status__title">
              {s==='en_route'  && 'Çekiciniz yolda'}
              {s==='accepted'  && 'Çekici görevi kabul etti'}
              {s==='completed' && 'İş başarıyla tamamlandı'}
            </div>
            {s==='en_route' && (
              <div style={{display:'flex', alignItems:'baseline', gap:8, marginTop:4}}>
                <span style={{fontSize:'2.5rem',fontWeight:900,letterSpacing:'-0.04em',color:'var(--primary)'}}>~9</span>
                <span style={{fontSize:'1rem',fontWeight:700,color:'var(--text-muted)'}}>dakika</span>
              </div>
            )}
          </div>

          <MapMock height={200} route live={s==='en_route'} />

          {/* Operator info card */}
          <div className="card stack-3">
            <div style={{fontSize:'0.64rem',fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)'}}>Çekiciniz</div>
            <div style={{fontWeight:900,fontSize:'1.05rem',letterSpacing:'-0.02em'}}>{t.name}</div>
            <div style={{fontSize:'0.875rem',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:6}}>
              <span style={{display:'inline-flex',color:'var(--text-faint)'}}>
                {React.createElement(VehicleIcon[t.vehicleType] || VehicleIcon.platform, {size: 16})}
              </span>
              <span>{t.vehicleModel}{t.vehicleYear?` · ${t.vehicleYear}`:''}</span>
            </div>
            {(s === 'accepted' || s === 'en_route') && (
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
                  <div style={{fontWeight:800, fontSize:'0.9375rem', color:'var(--text)'}}>Çekiciyi ara — Towit Hattı</div>
                  <div style={{fontSize:'0.775rem', color:'var(--text-muted)', marginTop:2}}>0850 300 00 00 · Numaran gizli kalır</div>
                </div>
              </a>
            )}
          </div>

          {/* Customer vehicle summary */}
          <div className="card-flat stack-2">
            <div style={{fontSize:'0.875rem',color:'var(--text-muted)'}}>
              <span style={{fontSize:'0.64rem',fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)'}}>Araç </span>
              Toyota Corolla · 34 XY 001
            </div>
            <div style={{fontSize:'0.875rem',color:'var(--text-muted)'}}>
              <span style={{fontSize:'0.64rem',fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)'}}>Arıza </span>
              <span style={{display:'inline-flex', verticalAlign:'-3px', marginRight:4, color:'var(--text-faint)'}}>
                <BreakdownIcon.motor size={14}/>
              </span>
              Motor Arızası
            </div>
          </div>

          {/* Details grid */}
          <div className="grid-2" style={{gap:'var(--s-3)'}}>
            {[['Çekici',t.name],['Araç',t.vehicleModel],['Mesafe','3.4 km'],['Toplam',t.price.toLocaleString('tr-TR')+' ₺']].map(([k,v]) => (
              <div key={k} style={{padding:'var(--s-3) var(--s-4)',background:'var(--surface)',borderRadius:'var(--r-md)'}}>
                <div style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:4}}>{k}</div>
                <div style={{fontWeight:800,fontSize:'0.9375rem'}}>{v}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div>
            <div className="section-label" style={{marginBottom:'var(--s-4)'}}>Durum geçmişi</div>
            <div className="timeline">
              {events.map((e,i) => (
                <div key={i} className="timeline__row">
                  <div className="timeline__col">
                    <div className={'timeline__dot '+(e.state==='done'?'is-done':e.state==='active'?'is-active':'')} />
                    <div className={'timeline__line '+(e.state==='done'?'is-done':'')} />
                  </div>
                  <div className="timeline__content">
                    <div className="timeline__label">{e.label}</div>
                    <div className="timeline__time">{e.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {s==='completed' && (
            <div className="stack-4">
              <div className="section-label">Değerlendir</div>
              <div className="rating-stars">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button"
                          className={'rating-star '+((hovered||rating)>=n?'is-on':'')}
                          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(n)}>
                    <Icon.Star size={32} filled={(hovered||rating)>=n} />
                  </button>
                ))}
              </div>
              <textarea className="input" value={note} onChange={e=>setNote(e.target.value)}
                        style={{height:76,padding:'12px 14px',resize:'vertical'}}
                        placeholder="Kısa yorum (opsiyonel)" />
              <button className="btn btn-primary" disabled={!rating}>Değerlendirmeyi gönder</button>
            </div>
          )}
          {s !== 'completed' && (
            <button className="btn btn-danger-ghost btn-square">Talebi iptal et</button>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CustomerPage, CustomerJobPage, TOWERS, CITIES });
