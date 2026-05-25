import { useCallback, useEffect, useMemo, useState } from 'react';
import { Stepper, PillToggle, ErrorInline } from '../../components/Shared';
import { BreakdownIcon, VehicleIcon } from '../../components/Icons';
import MapView from '../../components/MapView';
import { searchOperators, createJob, getJobs, searchPlaces, reverseGeocode } from '../../lib/api';
import type { OperatorResult, JobSummary, PlaceResult } from '../../lib/api';
import type { LatLng } from '../../components/MapView';
import type { ReactNode } from 'react';

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
const ISTANBUL: LatLng = { lat: 41.0082, lng: 28.9784 };

export interface CustomerMapPanelContext {
  step: number;
  panelTitle: string;
  panelEyebrow: string;
  center: LatLng;
  pickup: LatLng | null;
  destination: LatLng | null;
  pickupLabel?: string;
  destinationLabel?: string;
  interactive: boolean;
  chip: ReactNode;
  interactionHint?: ReactNode;
  helperText: string;
  onSelectLocation?: (point: LatLng) => void;
}

interface Props {
  onOpenJob: (jobId: string) => void;
  mapPanelActive?: boolean;
  onMapPanelChange?: (context: CustomerMapPanelContext) => void;
}

export default function CustomerPage({ onOpenJob, mapPanelActive = false, onMapPanelChange }: Props) {
  const [step, setStep]         = useState(1);
  const [city, setCity]         = useState(CITIES[0]);
  const [cityQ, setCityQ]       = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [breakdown, setBreakdown] = useState<string | null>(null);
  const [vBrand, setVBrand]     = useState('');
  const [vModel, setVModel]     = useState('');
  const [vPlate, setVPlate]     = useState('');
  const [cPhone, setCPhone]     = useState('');
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [pickupAddr, setPickupAddr] = useState('');
  const [destAddr, setDestAddr] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [destResults, setDestResults] = useState<PlaceResult[]>([]);
  const [searchingDest, setSearchingDest] = useState(false);
  const [destMode, setDestMode] = useState<'map' | 'search'>('map');
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
    if (!pickup || !destination) {
      setErr('Lütfen çekim ve varış konumlarını seçin.');
      return;
    }
    setErr('');
    try {
      const r = await searchOperators({ cityCode: city.code, pickup, destination, sort: sortBy === 'best' ? 'price' : 'distance' });
      setOperators(r.operators);
      setJobDist(r.jobDistanceKm);
      setStep(5);
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Çekiciler yüklenemedi.');
    }
  }

  async function handleSelectOperator(op: OperatorResult) {
    if (!pickup || !destination) {
      setErr('Konum bilgisi eksik. Lütfen çekim ve varış noktalarını seçin.');
      return;
    }
    setCreating(true); setErr('');
    try {
      const j = await createJob({
        cityCode: city.code, operatorProfileId: op.operatorProfileId,
        pickup, destination,
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
    if (step === 3 && !pickup) {
      setErr('Devam etmeden önce çekim noktasını seçin.');
      return;
    }
    if (step === 4) { goToStep5(); return; }
    setStep(s => s + 1);
  }

  const handlePickupSelect = useCallback(async (point: LatLng) => {
    setPickup(point);
    setErr('');
    const label = await reverseGeocode(point).catch(() => `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
    setPickupAddr(label);
  }, []);

  const handleDestinationSelect = useCallback(async (point: LatLng) => {
    setDestination(point);
    setErr('');
    const label = await reverseGeocode(point).catch(() => `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
    setDestAddr(label);
    setDestSearch(label);
    setDestResults([]);
  }, []);

  async function runDestSearch() {
    const query = destSearch.trim();
    if (!query) return;
    setSearchingDest(true);
    setErr('');
    try {
      const results = await searchPlaces(query, 6);
      setDestResults(results);
      if (results.length === 0) setErr('Adres bulunamadı. Haritadan seçmeyi deneyin.');
    } catch {
      setErr('Adres araması yapılamadı.');
    } finally {
      setSearchingDest(false);
    }
  }

  function pickSearchResult(result: PlaceResult) {
    setDestination(result.point);
    setDestAddr(result.displayName);
    setDestSearch(result.displayName);
    setDestResults([]);
  }

  useEffect(() => {
    if (!onMapPanelChange) return;
    if (step === 3) {
      onMapPanelChange({
        step,
        panelTitle: STEP_TITLES[step - 1],
        panelEyebrow: 'Konum seçimi',
        center: pickup ?? ISTANBUL,
        pickup,
        destination: null,
        pickupLabel: pickupAddr,
        destinationLabel: '',
        interactive: true,
        chip: <><span>📍</span> Çekim noktasını seçin</>,
        interactionHint: <><span className="dot" /> Haritada bir noktaya tıklayın</>,
        helperText: pickup ? 'Çekim noktası seçildi. Gerekirse büyük haritadan yeniden seçin.' : 'Nokta seçmek için büyük haritaya tıklayın.',
        onSelectLocation: handlePickupSelect,
      });
      return;
    }
    if (step === 4) {
      onMapPanelChange({
        step,
        panelTitle: STEP_TITLES[step - 1],
        panelEyebrow: 'Konum seçimi',
        center: destination ?? pickup ?? ISTANBUL,
        pickup,
        destination,
        pickupLabel: pickupAddr,
        destinationLabel: destAddr,
        interactive: true,
        chip: <><span>📌</span> Varış noktasını seçin</>,
        interactionHint: <><span className="dot" /> Varış noktası için haritaya tıklayın</>,
        helperText: destination ? 'Varış noktası seçildi. Büyük haritada düzeltebilirsiniz.' : 'Varış noktası seçmek için büyük haritaya tıklayın.',
        onSelectLocation: handleDestinationSelect,
      });
      return;
    }
    onMapPanelChange({
      step,
      panelTitle: STEP_TITLES[step - 1],
      panelEyebrow: step >= 5 ? 'Rota özeti' : 'Talep akışı',
      center: destination ?? pickup ?? ISTANBUL,
      pickup,
      destination,
      pickupLabel: pickupAddr,
      destinationLabel: destAddr,
      interactive: false,
      chip: <><span>🗺️</span> Rota önizlemesi</>,
      interactionHint: undefined,
      helperText: 'Konum seçim adımlarında büyük harita otomatik olarak etkileşimli olur.',
    });
  }, [step, pickup, destination, pickupAddr, destAddr, onMapPanelChange, handlePickupSelect, handleDestinationSelect]);

  return (
    <div className="towit">
      <div className="scroll-area">
        <div className={`screen${mapPanelActive ? ' customer-wizard' : ''}`}>
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
              {!mapPanelActive && (
                <MapView
                  height={250}
                  center={pickup ?? ISTANBUL}
                  pickup={pickup}
                  interactive
                  onSelectLocation={handlePickupSelect}
                  chip={<><span>📍</span> Çekim noktasını seçin</>}
                />
              )}
              {pickup ? (
                <div className="coord-confirm">
                  <span className="coord-confirm__check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                  <div className="stack-2">
                    <strong style={{ fontSize: 13, fontWeight: 800 }}>Çekim noktası seçildi</strong>
                    <span style={{ fontSize: 12, color: 'var(--success)' }}>{pickupAddr || `${pickup.lat.toFixed(5)}, ${pickup.lng.toFixed(5)}`}</span>
                  </div>
                </div>
              ) : (
                <div className="t-muted" style={{ fontSize: '0.8rem' }}>Harita üzerinden bir nokta seçin.</div>
              )}
            </div>
          )}

          {/* Adım 4: Varış noktası */}
          {step === 4 && (
            <div className="stack-4">
              <PillToggle value={destMode} onChange={v => setDestMode(v as 'map' | 'search')} options={[{ value: 'map', label: 'Haritadan sec' }, { value: 'search', label: 'Adres ara' }]} />

              {destMode === 'search' && (
                <div className="stack-3">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      value={destSearch}
                      onChange={e => setDestSearch(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); runDestSearch(); } }}
                      placeholder="Sokak, mahalle, ilçe..."
                    />
                    <button type="button" className="btn btn-ghost btn-square" style={{ width: 'auto', padding: '0 14px' }} onClick={runDestSearch} disabled={searchingDest}>
                      {searchingDest ? 'Aranıyor...' : 'Ara'}
                    </button>
                  </div>
                  {destResults.length > 0 && (
                    <div className="card-flat stack-2">
                      {destResults.map((item, idx) => (
                        <button
                          key={`${item.displayName}-${idx}`}
                          type="button"
                          className="btn-link"
                          style={{ textAlign: 'left', fontSize: '0.8rem' }}
                          onClick={() => pickSearchResult(item)}
                        >
                          {item.displayName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!mapPanelActive && (
                <MapView
                  height={250}
                  center={destination ?? pickup ?? ISTANBUL}
                  pickup={pickup}
                  destination={destination}
                  interactive
                  onSelectLocation={handleDestinationSelect}
                  chip={<><span>📌</span> Varış noktasını seçin</>}
                />
              )}
              {destination && (
                <div className="coord-confirm">
                  <span className="coord-confirm__check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                  <div className="stack-2">
                    <strong style={{ fontSize: 13, fontWeight: 800 }}>Varış noktası seçildi</strong>
                    <span style={{ fontSize: 12, color: 'var(--success)' }}>{destAddr || `${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}`}</span>
                  </div>
                </div>
              )}
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
