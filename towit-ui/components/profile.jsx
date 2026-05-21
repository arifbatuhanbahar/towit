// profile.jsx — Customer & Operator profile pages

const { useState: useStateProf } = React;

// ──────────────────────────────────────────────────────────────
// Vehicle type options for operator profile
// ──────────────────────────────────────────────────────────────
const VEHICLE_OPTIONS = [
  { value: 'platform',    label: 'Düz Platform',   sub: 'Geleneksel düz çekici' },
  { value: 'vinclu',      label: 'Vinçli',         sub: 'Hooklift / vinçli çekici' },
  { value: 'kanca',       label: 'Kanca',          sub: 'Normal kanca çekici' },
  { value: 'ahtapot',     label: 'Ahtapot',        sub: 'Spider lift / çok kollu' },
  { value: 'motorsiklet', label: 'Motosiklet',     sub: 'Motosiklet çekicisi' },
  { value: 'agir',        label: 'Ağır Vasıta',    sub: 'Tır, otobüs için' },
];

// ──────────────────────────────────────────────────────────────
// CustomerProfile
// ──────────────────────────────────────────────────────────────
function CustomerProfile({ email, onLogout }) {
  const [name, setName]       = useStateProf('Mehmet Yılmaz');
  const [phone, setPhone]     = useStateProf('0532 123 45 67');
  const [brand, setBrand]     = useStateProf('Toyota');
  const [model, setModel]     = useStateProf('Corolla');
  const [plate, setPlate]     = useStateProf('34 XY 001');
  const [saved, setSaved]     = useStateProf(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="towit">
      <AppHeader role="customer" email={email} onLogout={onLogout} />
      <div className="scroll-area">
        <div className="screen">

          <h1 style={{fontSize:'1.625rem',fontWeight:900,letterSpacing:'-0.04em',margin:0}}>Profil</h1>

          {/* Profile avatar block */}
          <div style={{display:'flex',alignItems:'center',gap:16,padding:'var(--s-5)',background:'var(--surface)',borderRadius:'var(--r-lg)'}}>
            <div style={{
              width:64, height:64, borderRadius:'50%',
              background:'var(--surface-3)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontWeight:900, fontSize:'1.5rem', color:'var(--primary)',
              flexShrink:0,
            }}>{(name[0]||email[0]).toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:800,fontSize:'1.05rem',letterSpacing:'-0.02em'}}>{name}</div>
              <div style={{fontSize:'0.825rem',color:'var(--text-muted)',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{email}</div>
              <span className="badge-role" style={{marginTop:8}}>Müşteri</span>
            </div>
          </div>

          {/* Personal info */}
          <div className="stack-3">
            <div className="section-label">Kişisel Bilgiler</div>
            <div className="card stack-4">
              <div className="field">
                <label className="field-label">Ad Soyad</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Telefon</label>
                <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                <span style={{fontSize:'0.72rem',color:'var(--text-faint)',marginTop:2}}>
                  <Icon.Shield size={11}/> Çekici sizinle Towit hattı üzerinden iletişim kurar
                </span>
              </div>
              <div className="field">
                <label className="field-label">E-posta</label>
                <input className="input" type="email" value={email} readOnly
                       style={{background:'var(--surface-2)',color:'var(--text-muted)',cursor:'not-allowed'}} />
              </div>
            </div>
          </div>

          {/* Saved vehicle */}
          <div className="stack-3">
            <div className="section-label">Kayıtlı Araç</div>
            <div className="card stack-4">
              <div className="grid-2" style={{gap:'var(--s-3)'}}>
                <div className="field">
                  <label className="field-label">Marka</label>
                  <input className="input" value={brand} onChange={e => setBrand(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Model</label>
                  <input className="input" value={model} onChange={e => setModel(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Plaka</label>
                <input className="input" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} />
              </div>
              <span style={{fontSize:'0.72rem',color:'var(--text-faint)'}}>
                Talep oluştururken bu bilgiler önceden doldurulur.
              </span>
            </div>
          </div>

          {/* Notifications */}
          <div className="stack-3">
            <div className="section-label">Bildirimler</div>
            <div className="card stack-3">
              {['Çekici kabul edince bildir','Çekici yola çıkınca bildir','Pazarlama mesajları'].map((label, i) => (
                <ToggleRow key={i} label={label} defaultOn={i < 2} />
              ))}
            </div>
          </div>

          {saved && (
            <div style={{padding:'10px 14px',background:'var(--success-soft)',color:'var(--success)',borderRadius:'var(--r-md)',fontWeight:700,fontSize:'0.875rem',display:'flex',alignItems:'center',gap:8}}>
              <Icon.Check size={14}/> Kaydedildi
            </div>
          )}

          <button className="btn btn-primary btn-square" onClick={save}>Değişiklikleri kaydet</button>
          <button className="btn btn-danger-ghost btn-square" onClick={onLogout}>Hesaptan çıkış yap</button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// OperatorProfile
// ──────────────────────────────────────────────────────────────
function OperatorProfile({ email, onLogout }) {
  const [active,       setActive]       = useStateProf(true);
  const [businessName, setBusinessName] = useStateProf('Yıldız Çekici Hizmetleri');
  const [phone,        setPhone]        = useStateProf('0532 100 20 30');
  const [vehicleType,  setVehicleType]  = useStateProf('platform');
  const [vModel,       setVModel]       = useStateProf('Ford Transit 350');
  const [vYear,        setVYear]        = useStateProf('2022');
  const [vPlate,       setVPlate]       = useStateProf('34 ABC 123');
  const [capacity,     setCapacity]     = useStateProf('2.5 tona kadar, sedan/SUV/hafif ticari');
  const [radius,       setRadius]       = useStateProf(25);
  const [baseFee,      setBaseFee]      = useStateProf(350);
  const [perKmFee,     setPerKmFee]     = useStateProf(18);
  const [saved,        setSaved]        = useStateProf(false);

  const noteRemaining = 200 - capacity.length;
  function save() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <div className="towit">
      <AppHeader role="operator" email={email} onLogout={onLogout} />
      <div className="scroll-area">
        <div className="screen">

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
            <h1 style={{fontSize:'1.625rem',fontWeight:900,letterSpacing:'-0.04em',margin:0}}>Profil & Tarife</h1>
          </div>

          {/* Active/passive toggle — prominent */}
          <button type="button"
                  onClick={() => setActive(a => !a)}
                  style={{
                    display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,
                    padding:'var(--s-4) var(--s-5)',
                    background: active ? 'var(--success-soft)' : 'var(--surface)',
                    border: active ? '1px solid rgba(34,197,94,0.25)' : '1px solid var(--border)',
                    borderRadius:'var(--r-lg)',cursor:'pointer',fontFamily:'inherit',width:'100%',
                  }}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{
                width:14,height:14,borderRadius:'50%',
                background: active ? 'var(--success)' : 'var(--text-faint)',
                boxShadow: active ? '0 0 0 4px rgba(34,197,94,0.2)' : 'none',
              }}/>
              <div style={{textAlign:'left'}}>
                <div style={{fontWeight:800,fontSize:'1rem', color: active ? 'var(--success)' : 'var(--text)'}}>
                  {active ? 'Aktif — Talep alıyorsunuz' : 'Pasif — Talep almıyorsunuz'}
                </div>
                <div style={{fontSize:'0.775rem',color:'var(--text-muted)',marginTop:3}}>
                  {active ? 'Müşterilere sizinle iletişime geçme seçeneği gösterilir.' : 'Profiliniz müşterilere gösterilmez.'}
                </div>
              </div>
            </div>
            <div style={{
              width:48, height:28, borderRadius:14,
              background: active ? 'var(--success)' : 'var(--surface-3)',
              position:'relative', flexShrink:0, transition:'background 200ms',
            }}>
              <div style={{
                position:'absolute', top:3, left: active ? 23 : 3,
                width:22, height:22, borderRadius:'50%', background:'#fff',
                transition:'left 200ms', boxShadow:'0 1px 3px rgba(0,0,0,0.4)',
              }}/>
            </div>
          </button>

          {/* Business info */}
          <div className="stack-3">
            <div className="section-label">İşletme</div>
            <div className="card stack-4">
              <div className="field">
                <label className="field-label">İşletme Adı</label>
                <input className="input" value={businessName} onChange={e => setBusinessName(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Telefon</label>
                <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                <span style={{fontSize:'0.72rem',color:'var(--text-faint)',marginTop:2,display:'inline-flex',alignItems:'center',gap:4}}>
                  <Icon.Shield size={11}/> Müşteriler Towit hattı üzerinden arar. Gerçek numaranız gizli kalır.
                </span>
              </div>
            </div>
          </div>

          {/* Vehicle info */}
          <div className="stack-3">
            <div className="section-label">Araç Bilgileri</div>
            <div className="card stack-4">
              <div className="field">
                <label className="field-label">Araç Tipi</label>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:8}}>
                  {VEHICLE_OPTIONS.map(opt => {
                    const sel = vehicleType === opt.value;
                    const VIcon = VehicleIcon[opt.value] || VehicleIcon.platform;
                    return (
                      <button key={opt.value} type="button"
                              onClick={() => setVehicleType(opt.value)}
                              style={{
                                display:'flex',alignItems:'center',gap:10,
                                padding:'10px 12px',borderRadius:'var(--r-md)',
                                border:`2px solid ${sel ? 'var(--primary)' : 'var(--border-strong)'}`,
                                background: sel ? 'var(--primary-soft)' : 'var(--surface-2)',
                                cursor:'pointer',fontFamily:'inherit',
                                fontSize:'0.875rem',fontWeight:700, color:'var(--text)',
                                textAlign:'left',
                              }}>
                        <span style={{display:'inline-flex',color: sel ? 'var(--primary)' : 'var(--text-muted)'}}>
                          <VIcon size={18}/>
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="field">
                <label className="field-label">Marka & Model</label>
                <input className="input" value={vModel} onChange={e => setVModel(e.target.value)} />
              </div>
              <div className="grid-2" style={{gap:'var(--s-3)'}}>
                <div className="field">
                  <label className="field-label">Üretim Yılı</label>
                  <input className="input" type="number" min="1990" max="2030" value={vYear} onChange={e => setVYear(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Plaka</label>
                  <input className="input" value={vPlate} onChange={e => setVPlate(e.target.value.toUpperCase())} maxLength={15} />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Kapasite Notu — {noteRemaining} karakter</label>
                <textarea className="input" value={capacity}
                          onChange={e => { if(e.target.value.length <= 200) setCapacity(e.target.value); }}
                          rows={3}
                          style={{height:'auto',padding:'12px 14px',resize:'vertical',minHeight:74}}
                          placeholder="2.5 tona kadar, sedan / SUV / hafif ticari" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="stack-3">
            <div className="section-label">Tarife</div>
            <div className="card stack-4">
              <div className="grid-2" style={{gap:'var(--s-3)'}}>
                <div className="field">
                  <label className="field-label">Taban Ücret (₺)</label>
                  <input className="input" type="number" value={baseFee} onChange={e => setBaseFee(Number(e.target.value)||0)} />
                </div>
                <div className="field">
                  <label className="field-label">Km Başı Ücret (₺)</label>
                  <input className="input" type="number" value={perKmFee} onChange={e => setPerKmFee(Number(e.target.value)||0)} />
                </div>
              </div>
              <div style={{padding:'12px 14px',background:'var(--surface-2)',borderRadius:'var(--r-md)',fontSize:'0.875rem'}}>
                <span style={{color:'var(--text-muted)'}}>10 km'lik bir iş için tahmini: </span>
                <span style={{fontWeight:800,color:'var(--primary)',fontVariantNumeric:'tabular-nums'}}>
                  {(baseFee + 10*perKmFee).toLocaleString('tr-TR')} ₺
                </span>
              </div>
              <div style={{
                padding:'10px 12px', background:'var(--primary-soft)', borderRadius:'var(--r-sm)',
                fontSize:'0.78rem', color:'var(--primary)', lineHeight:1.5,
                display:'flex', alignItems:'flex-start', gap:8,
              }}>
                <span style={{flexShrink:0, marginTop:1}}><Icon.Shield size={13}/></span>
                <span><strong>Hizmet bedeli:</strong> Tamamlanan her eşleşme için Towit operatörden sabit komisyon alır. Müşteri ücretin tamamını size öder.</span>
              </div>
            </div>
          </div>

          {/* Service area */}
          <div className="stack-3">
            <div className="section-label">Hizmet Alanı</div>
            <div className="card stack-4">
              <div className="field">
                <label className="field-label">Yarıçap — {radius} km</label>
                <input type="range" min="5" max="100" value={radius} onChange={e => setRadius(Number(e.target.value))}
                       style={{width:'100%',accentColor:'var(--primary)'}} />
                <span style={{fontSize:'0.72rem',color:'var(--text-faint)'}}>Merkez konumunuzdan bu mesafe içinde talepler size gösterilir.</span>
              </div>
              <MapMock height={180} single chip={<><Icon.Pin size={11}/> Merkez konumunuz</>} />
            </div>
          </div>

          {saved && (
            <div style={{padding:'10px 14px',background:'var(--success-soft)',color:'var(--success)',borderRadius:'var(--r-md)',fontWeight:700,fontSize:'0.875rem',display:'flex',alignItems:'center',gap:8}}>
              <Icon.Check size={14}/> Kaydedildi
            </div>
          )}

          <button className="btn btn-primary btn-square" onClick={save}>Profili kaydet</button>
          <button className="btn btn-danger-ghost btn-square" onClick={onLogout}>Hesaptan çıkış yap</button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ToggleRow — small toggle for notification settings
// ──────────────────────────────────────────────────────────────
function ToggleRow({ label, defaultOn }) {
  const [on, setOn] = useStateProf(defaultOn);
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'6px 0'}}>
      <span style={{fontSize:'0.9375rem',color:'var(--text)'}}>{label}</span>
      <button type="button"
              onClick={() => setOn(o => !o)}
              style={{
                width:44, height:26, borderRadius:13,
                background: on ? 'var(--primary)' : 'var(--surface-3)',
                position:'relative', cursor:'pointer', border:'none', flexShrink:0,
                transition:'background 180ms',
              }}>
        <div style={{
          position:'absolute', top:3, left: on ? 21 : 3,
          width:20, height:20, borderRadius:'50%', background:'#fff',
          transition:'left 180ms', boxShadow:'0 1px 3px rgba(0,0,0,0.35)',
        }}/>
      </button>
    </div>
  );
}

Object.assign(window, { CustomerProfile, OperatorProfile, VEHICLE_OPTIONS });
