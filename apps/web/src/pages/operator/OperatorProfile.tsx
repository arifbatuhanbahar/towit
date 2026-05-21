import { useState, useEffect } from 'react';
import MapView from '../../components/MapView';
import { Icon, VehicleIcon } from '../../components/Icons';
import { getMe, updateOperatorProfile, logout } from '../../lib/api';
import type { LatLng } from '../../components/MapView';

interface Props { onLogout: () => void; onBack: () => void; }

const VEHICLE_OPTIONS = [
  { value: 'platform',    label: 'Düz Platform',  sub: 'Geleneksel düz çekici' },
  { value: 'vinclu',      label: 'Vinçli',         sub: 'Hooklift / vinçli çekici' },
  { value: 'kanca',       label: 'Kanca',          sub: 'Normal kanca çekici' },
  { value: 'ahtapot',     label: 'Ahtapot',        sub: 'Spider lift / çok kollu' },
  { value: 'motorsiklet', label: 'Motosiklet',     sub: 'Motosiklet çekicisi' },
  { value: 'agir',        label: 'Ağır Vasıta',   sub: 'Tır, otobüs için' },
];

export default function OperatorProfile({ onLogout, onBack }: Props) {
  const [serviceCenter, setServiceCenter] = useState<LatLng>({ lat: 41.0082, lng: 28.9784 });
  const [active,       setActive]       = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [phone,        setPhone]        = useState('');
  const [vehicleType,  setVehicleType]  = useState('platform');
  const [vModel,       setVModel]       = useState('');
  const [vYear,        setVYear]        = useState('');
  const [vPlate,       setVPlate]       = useState('');
  const [capacity,     setCapacity]     = useState('');
  const [radius,       setRadius]       = useState(25);
  const [baseFee,      setBaseFee]      = useState(350);
  const [perKmFee,     setPerKmFee]     = useState(18);
  const [saved,        setSaved]        = useState(false);
  const [err,          setErr]          = useState('');
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    getMe().then(r => {
      const p = r.operatorProfile;
      if (p) {
        setActive(p.isActive ?? true);
        setBusinessName(p.businessName ?? '');
        setPhone(p.phone ?? '');
        setVehicleType(p.vehicleType ?? 'platform');
        setVModel(p.vehicleModel ?? '');
        setVYear(p.vehicleYear ? String(p.vehicleYear) : '');
        setVPlate(p.vehiclePlate ?? '');
        setCapacity(p.capacityNote ?? '');
        setRadius(p.serviceRadiusKm ?? 25);
        setServiceCenter({
          lat: Number(p.serviceCenterLat ?? 41.0082),
          lng: Number(p.serviceCenterLng ?? 28.9784),
        });
        if (p.tariff) {
          setBaseFee(Number(p.tariff.baseFee) || 350);
          setPerKmFee(Number(p.tariff.perKmFee) || 18);
        }
      }
    }).catch(() => {});
  }, []);

  async function save() {
    setErr(''); setLoading(true);
    try {
      await updateOperatorProfile({
        isActive: active,
        businessName, phone: phone || null,
        vehicleType, vehicleModel: vModel, vehicleYear: vYear ? parseInt(vYear) : null,
        vehiclePlate: vPlate || null, capacityNote: capacity || null,
        serviceCenterLat: serviceCenter.lat,
        serviceCenterLng: serviceCenter.lng,
        serviceRadiusKm: radius,
        baseFee, perKmFee,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Kayıt başarısız.');
    } finally { setLoading(false); }
  }

  function handleLogout() { logout(); onLogout(); }

  const noteRemaining = 200 - capacity.length;

  return (
    <div className="towit">
      <div className="scroll-area">
        <div className="screen">
          <button className="btn-link" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Geri dön</button>

          <h1 style={{ fontSize: '1.625rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>Profil & Tarife</h1>

          {err && <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 'var(--r-md)', fontSize: '0.875rem' }}>{err}</div>}

          <button type="button" onClick={() => setActive(a => !a)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 'var(--s-4) var(--s-5)', background: active ? 'var(--success-soft)' : 'var(--surface)', border: active ? '1px solid rgba(34,197,94,0.25)' : '1px solid var(--border)', borderRadius: 'var(--r-lg)', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: active ? 'var(--success)' : 'var(--text-faint)', boxShadow: active ? '0 0 0 4px rgba(34,197,94,0.2)' : 'none' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: active ? 'var(--success)' : 'var(--text)' }}>{active ? 'Aktif — Talep alıyorsunuz' : 'Pasif — Talep almıyorsunuz'}</div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: 3 }}>{active ? 'Müşterilere sizinle iletişime geçme seçeneği gösterilir.' : 'Profiliniz müşterilere gösterilmez.'}</div>
              </div>
            </div>
            <div style={{ width: 48, height: 28, borderRadius: 14, background: active ? 'var(--success)' : 'var(--surface-3)', position: 'relative', flexShrink: 0, transition: 'background 200ms' }}>
              <div style={{ position: 'absolute', top: 3, left: active ? 23 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
            </div>
          </button>

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
                <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon.Shield size={11} /> Müşteriler Towit hattı üzerinden arar. Gerçek numaranız gizli kalır.
                </span>
              </div>
            </div>
          </div>

          <div className="stack-3">
            <div className="section-label">Araç Bilgileri</div>
            <div className="card stack-4">
              <div className="field">
                <label className="field-label">Araç Tipi</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                  {VEHICLE_OPTIONS.map(opt => {
                    const sel = vehicleType === opt.value;
                    const VIcon = VehicleIcon[opt.value] || VehicleIcon.platform;
                    return (
                      <button key={opt.value} type="button" onClick={() => setVehicleType(opt.value)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--r-md)', border: `2px solid ${sel ? 'var(--primary)' : 'var(--border-strong)'}`, background: sel ? 'var(--primary-soft)' : 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', textAlign: 'left' }}>
                        <span style={{ display: 'inline-flex', color: sel ? 'var(--primary)' : 'var(--text-muted)' }}><VIcon size={18} /></span>
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
              <div className="grid-2" style={{ gap: 'var(--s-3)' }}>
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
                <textarea className="input" value={capacity} onChange={e => { if (e.target.value.length <= 200) setCapacity(e.target.value); }} rows={3} style={{ height: 'auto', padding: '12px 14px', resize: 'vertical', minHeight: 74 }} placeholder="2.5 tona kadar, sedan / SUV / hafif ticari" />
              </div>
            </div>
          </div>

          <div className="stack-3">
            <div className="section-label">Tarife</div>
            <div className="card stack-4">
              <div className="grid-2" style={{ gap: 'var(--s-3)' }}>
                <div className="field">
                  <label className="field-label">Taban Ücret (₺)</label>
                  <input className="input" type="number" value={baseFee} onChange={e => setBaseFee(Number(e.target.value) || 0)} />
                </div>
                <div className="field">
                  <label className="field-label">Km Başı Ücret (₺)</label>
                  <input className="input" type="number" value={perKmFee} onChange={e => setPerKmFee(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>10 km'lik bir iş için tahmini: </span>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {(baseFee + 10 * perKmFee).toLocaleString('tr-TR')} ₺
                </span>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--primary-soft)', borderRadius: 'var(--r-sm)', fontSize: '0.78rem', color: 'var(--primary)', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}><Icon.Shield size={13} /></span>
                <span><strong>Hizmet bedeli:</strong> Tamamlanan her eşleşme için Towit operatörden sabit komisyon alır. Müşteri ücretin tamamını size öder.</span>
              </div>
            </div>
          </div>

          <div className="stack-3">
            <div className="section-label">Hizmet Alanı</div>
            <div className="card stack-4">
              <div className="field">
                <label className="field-label">Yarıçap — {radius} km</label>
                <input type="range" min="5" max="100" value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>Merkez konumunuzdan bu mesafe içinde talepler size gösterilir.</span>
              </div>
              <MapView
                height={220}
                center={serviceCenter}
                interactive
                onSelectLocation={setServiceCenter}
                chip={<><Icon.Pin size={11} /> Merkez konumunu haritadan secin</>}
              />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
                Merkez: {serviceCenter.lat.toFixed(5)}, {serviceCenter.lng.toFixed(5)}
              </div>
            </div>
          </div>

          {saved && (
            <div style={{ padding: '10px 14px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon.Check size={14} /> Kaydedildi
            </div>
          )}

          <button className="btn btn-primary btn-square" onClick={save} disabled={loading}>
            {loading ? 'Kaydediliyor…' : 'Profili kaydet'}
          </button>
          <button className="btn btn-danger-ghost btn-square" onClick={handleLogout}>Hesaptan çıkış yap</button>
        </div>
      </div>
    </div>
  );
}
