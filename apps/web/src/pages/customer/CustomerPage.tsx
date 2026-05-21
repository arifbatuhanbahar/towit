import { useState, useMemo } from 'react';
import { Stepper, PillToggle, ErrorInline } from '../../components/Shared';
import { BreakdownIcon, VehicleIcon, BREAKDOWN_LABEL } from '../../components/Icons';
import MapView from '../../components/MapView';
import { searchOperators, createJob, getJobs } from '../../lib/api';
import type { OperatorResult, JobSummary, AuthUser } from '../../lib/api';

const CITIES = [
  { name: 'İstanbul', code: '34' }, { name: 'Ankara', code: '06' }, { name: 'İzmir', code: '35' },
  { name: 'Bursa', code: '16' }, { name: 'Antalya', code: '07' }, { name: 'Adana', code: '01' },
];
const BREAKDOWN_OPTS = [
  { value: 'motor', label: 'Motor Arızası' }, { value: 'aku', label: 'Akü Bitti' },
  { value: 'yakıt', label: 'Yakıt Bitti' }, { value: 'kaza', label: 'Kaza' },
  { value: 'lastik', label: 'Patlak Lastik' }, { value: 'diger', label: 'Diğer' },
];
const STEP_TITLES = ['Bölge seç', 'Aracınız', 'Çekim noktası', 'Varış noktası', 'Çekici seç'];
// Demo koordinatlar (harita entegrasyonuna kadar)
const DEMO_PICKUP =  { lat: 41.0451, lng: 29.0331 };
const DEMO_DEST   =  { lat: 41.0082, lng: 28.9784 };

interface Props { user: AuthUser; onOpenJob: (jobId: string) => void; onGoProfile: () => void; onGoHistory: () => void; }

export default function CustomerPage({ user, onOpenJob, onGoProfile, onGoHistory }: Props) {
  const [step, setStep]         = useState(1);
  const [city, setCity]         = useState(CITIES[0]);
  const [cityQ, setCityQ]       = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [breakdown, setBreakdown] = useState<string | null>(null);
  const [vBrand, setVBrand]     = useState('');
  const [vModel, setVModel]     = useState('');
  const [vPlate, setVPlate]     = useState('');
  const [cPhone, setCPhone]     = useState('');
  const [destAddr, setDestAddr] = useState('');
  const [sortBy, setSortBy]     = useState('best');
  const [operators, setOperators] = useState<OperatorResult[]>([]);
  const [jobDist, setJobDist]   = useState(3.4);
  const [histOpen, setHistOpen] = useState(false);
  const [history, setHistory]   = useState<JobSummary[]>([]);
  const [err, setErr]           = useState('');
  const [creating, setCreating] = useState(false);

  const filteredCities = useMemo(() => {
    const q = cityQ.toLowerCase().trim();
    return q ? CITIES.filter(c => c.name.toLowerCase().includes(q)) : CITIES;
  }, [cityQ]);

  const sorted = useMemo(() => {
    return [...operators].sort((a, b) =>
      sortBy === 'best' ? Number(a.previewTotal) - Number(b.previewTotal) : a.distanceToPickupKm - b.distanceToPickupKm
    );
  }, [operators, sortBy]);

  async function goToStep5() {
    setErr('');
    try {
      const r = await searchOperators({ cityCode: city.code, pickup: DEMO_PICKUP, destination: DEMO_DEST, sort: sortBy === 'best' ? 'price' : 'distance' });
      setOperators(r.operators);
      setJobDist(r.jobDistanceKm);
      setStep(5);
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Çekiciler yüklenemedi.');
    }
  }

  async function handleSelectOperator(op: OperatorResult) {
    setCreating(true); setErr('');
    try {
      const j = await createJob({
        cityCode: city.code, operatorProfileId: op.operatorProfileId,
        pickup: DEMO_PICKUP, destination: DEMO_DEST,
        customerVehicleBrand: vBrand || undefined,
        customerVehicleModel: vModel || undefined,
        customerVehiclePlate: vPlate || undefined,
        breakdownType: breakdown ?? 'diger',
        customerPhone: cPhone || undefined,
      });
      onOpenJob(j.id);
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Talep oluşturulamadı.');
    } finally {
      setCreating(false);
    }
  }

  async function loadHistory() {
    if (histOpen) { setHistOpen(false); return; }
    try {
      const r = await getJobs();
      setHistory(r.jobs);
      setHistOpen(true);
    } catch { setHistOpen(true); }
  }

  function next() {
    if (step === 4) { goToStep5(); return; }
    setStep(s => s + 1);
  }

  return (
    <div className="towit">
      <div className="scroll-area">
        <div className="screen">
          <div className="nav-shortcuts" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm btn-square" style={{ width: 'auto', minHeight: 32, padding: '0 12px', fontSize: '0.8rem' }} onClick={onGoHistory}>Geçmiş</button>
            <button type="button" className="btn btn-ghost btn-sm btn-square" style={{ width: 'auto', minHeight: 32, padding: '0 12px', fontSize: '0.8rem' }} onClick={onGoProfile}>Profil</button>
          </div>
          <ErrorInline onClose={() => setErr('')}>{err}</ErrorInline>
          <Stepper step={step} total={5} title={STEP_TITLES[step - 1]} />

          {/* Adım 1: Şehir */}
          {step === 1 && (
            <div className="stack-4">
              <div className="field">
                <label className="field-label">Şehir</label>
                <div className="combo">
                  <input className="input combo__input" placeholder="Şehir ara…"
                    value={cityOpen ? cityQ : `${city.name} (${city.code})`}
                    onFocus={() => setCityOpen(true)}
                    onBlur={() => setTimeout(() => setCityOpen(false), 150)}
                    onChange={e => setCityQ(e.target.value)} />
                  {cityOpen && (
                    <div className="combo__menu">
                      {filteredCities.map(c => (
                        <div key={c.code} className="combo__opt" onMouseDown={() => { setCity(c); setCityOpen(false); setCityQ(''); }}>
                          <span>{c.name}</span><span className="combo__code">({c.code})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Adım 2: Araç bilgileri */}
          {step === 2 && (
            <div className="stack-5">
              <div className="stack-3">
                <div className="field-label">Arıza türü <span style={{ color: 'var(--text-faint)', textTransform: 'none', letterSpacing: 0 }}>(opsiyonel)</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {BREAKDOWN_OPTS.map(opt => {
                    const BIcon = BreakdownIcon[opt.value] || BreakdownIcon.diger;
                    const sel = breakdown === opt.value;
                    return (
                      <button key={opt.value} type="button" onClick={() => setBreakdown(sel ? null : opt.value)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 'var(--r-md)', border: `2px solid ${sel ? 'var(--primary)' : 'var(--border-strong)'}`, background: sel ? 'var(--primary-soft)' : 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', textAlign: 'left', transition: 'border-color 150ms, background 150ms' }}>
                        <span style={{ display: 'inline-flex', width: 22, height: 22, alignItems: 'center', justifyContent: 'center', color: sel ? 'var(--primary)' : 'var(--text-muted)' }}><BIcon size={18} /></span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="field"><label className="field-label">Araç Markası</label><input className="input" value={vBrand} onChange={e => setVBrand(e.target.value)} placeholder="Toyota, Ford…" /></div>
                <div className="field"><label className="field-label">Araç Modeli</label><input className="input" value={vModel} onChange={e => setVModel(e.target.value)} placeholder="Corolla, Focus…" /></div>
                <div className="field"><label className="field-label">Plaka</label><input className="input" value={vPlate} onChange={e => setVPlate(e.target.value.toUpperCase())} placeholder="34 XY 001" maxLength={15} /></div>
                <div className="field">
                  <label className="field-label">Telefon</label>
                  <input className="input" type="tel" value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="0532 123 45 67" />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>Çekici kabul edince paylaşılır</span>
                </div>
              </div>
            </div>
          )}

          {/* Adım 3: Çekim noktası */}
          {step === 3 && (
            <div className="stack-4">
              <MapView height={210} pickup={DEMO_PICKUP} chip={<><span>📍</span> Haritaya dokunun</>} />
              <div className="coord-confirm">
                <span className="coord-confirm__check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                <div className="stack-2">
                  <strong style={{ fontSize: 13, fontWeight: 800 }}>Çekim noktası seçildi</strong>
                  <span style={{ fontSize: 12, color: 'var(--success)' }}>{DEMO_PICKUP.lat}, {DEMO_PICKUP.lng}</span>
                </div>
              </div>
            </div>
          )}

          {/* Adım 4: Varış noktası */}
          {step === 4 && (
            <div className="stack-4">
              <PillToggle value="search" onChange={() => {}} options={[{ value: 'map', label: 'Haritada seç' }, { value: 'search', label: 'Adres ara' }]} />
              <div className="input-wrap">
                <input className="input" value={destAddr} onChange={e => setDestAddr(e.target.value)} placeholder="Sokak, mahalle…" />
              </div>
              <div className="coord-confirm">
                <span className="coord-confirm__check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                <div className="stack-2">
                  <strong style={{ fontSize: 13, fontWeight: 800 }}>Varış noktası</strong>
                  <span style={{ fontSize: 12, color: 'var(--success)' }}>{DEMO_DEST.lat}, {DEMO_DEST.lng}</span>
                </div>
              </div>
            </div>
          )}

          {/* Adım 5: Çekici seç */}
          {step === 5 && (
            <div className="stack-4">
              <PillToggle value={sortBy} onChange={setSortBy} options={[{ value: 'best', label: 'En uygun' }, { value: 'nearest', label: 'En yakın' }]} />
              {sorted.length === 0 && <div className="t-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>Bu bölgede aktif çekici bulunamadı.</div>}
              {sorted.map(op => {
                const VIcon = VehicleIcon[op.vehicleType] || VehicleIcon.platform;
                return (
                  <div key={op.operatorProfileId} className="tower-card">
                    <div className="tower-card__top">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="tower-card__name">{op.businessName}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ display: 'inline-flex', color: 'var(--text-faint)' }}><VIcon size={16} /></span>
                          <span>{op.vehicleModel}{op.vehicleYear ? ` · ${op.vehicleYear}` : ''}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="tower-card__rating">⭐ {op.rating?.toFixed(1) ?? '—'} <span style={{ color: 'var(--text-faint)', fontWeight: 600, fontSize: '0.75rem' }}>({op.ratingCount})</span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: 2 }}>~{op.etaMinutes} dk</div>
                      </div>
                    </div>
                    {op.capacityNote && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--surface-2)', borderRadius: 'var(--r-pill)', padding: '4px 10px', fontSize: '0.775rem', color: 'var(--text-muted)', alignSelf: 'flex-start' }}>
                        ✓ {op.capacityNote.length > 42 ? op.capacityNote.slice(0, 42) + '…' : op.capacityNote}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '1.625rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                        ~{Number(op.previewTotal).toLocaleString('tr-TR')} ₺
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textAlign: 'right', lineHeight: 1.5 }}>
                        {Number(op.baseFee).toLocaleString('tr-TR')} ₺ taban<br />{jobDist.toFixed(1)} km × {op.perKmFee} ₺
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>Merkeze ~{op.distanceToPickupKm.toFixed(1)} km</div>
                    <button className="btn btn-primary" disabled={creating} onClick={() => handleSelectOperator(op)}>
                      {creating ? 'Talep oluşturuluyor…' : 'Bu çekiciyi seç →'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigasyon butonları */}
          <div className="wizard-cta">
            {step > 1 && (
              <button className="btn btn-ghost btn-square" style={{ flex: '0 0 auto', width: 'auto', minWidth: 80 }} onClick={() => setStep(s => s - 1)}>
                ← Geri
              </button>
            )}
            {step === 2 && (
              <button className="btn btn-ghost btn-square" style={{ flex: '0 0 auto', width: 'auto', minWidth: 72 }} onClick={() => setStep(3)}>Atla</button>
            )}
            {step < 5 && (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={next}>Devam et</button>
            )}
          </div>

          {/* Geçmiş talepler */}
          <div className="accordion">
            <button type="button" className="accordion__toggle" onClick={loadHistory}>
              <span>Geçmiş talepler</span>
              <span className={`accordion__chev${histOpen ? ' is-open' : ''}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            </button>
            {histOpen && (
              <div className="accordion__body">
                {history.length === 0 && <div className="t-muted" style={{ padding: '1rem', textAlign: 'center' }}>Henüz talep yok.</div>}
                {history.slice(0, 5).map(h => (
                  <div key={h.id} className="history-row" onClick={() => onOpenJob(h.id)} style={{ cursor: 'pointer' }}>
                    <span className="history-row__date">{new Date(h.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    <span className="history-row__name">{h.operator?.businessName ?? '—'}</span>
                    <div className="history-row__right">
                      <span className="history-row__price">{h.status === 'cancelled' ? '—' : `${Number(h.priceSnapshot).toLocaleString('tr-TR')} ₺`}</span>
                      <span className={`badge status-${h.status}`}>{h.status}</span>
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
