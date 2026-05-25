import { useState, useEffect } from 'react';
import { Icon } from '../../components/Icons';
import { getMe, updateCustomerProfile, logout } from '../../lib/api';
import type { AuthUser } from '../../lib/api';

interface Props { user: AuthUser; onLogout: () => void; onBack: () => void; }

export default function CustomerProfile({ user, onLogout, onBack }: Props) {
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [saved, setSaved] = useState(false);
  const [err, setErr]     = useState('');
  const [loading, setLoading] = useState(false);
  const avatarLetter = (name.trim().charAt(0) || user.email.trim().charAt(0) || 'K').toUpperCase();

  useEffect(() => {
    getMe().then(r => {
      const p = r.customerProfile;
      if (p) {
        setName(p.name ?? '');
        setPhone(p.phone ?? '');
        setBrand(p.savedVehicleBrand ?? '');
        setModel(p.savedVehicleModel ?? '');
        setPlate(p.savedVehiclePlate ?? '');
      }
    }).catch(() => {});
  }, []);

  async function save() {
    setErr(''); setLoading(true);
    try {
      await updateCustomerProfile({ name, phone: phone || null, savedVehicleBrand: brand || null, savedVehicleModel: model || null, savedVehiclePlate: plate || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Kayıt başarısız.');
    } finally { setLoading(false); }
  }

  function handleLogout() { logout(); onLogout(); }

  return (
    <div className="towit">
      <div className="scroll-area">
        <div className="screen">
          <button className="btn-link" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Geri dön</button>

          <h1 style={{ fontSize: '1.625rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>Profil</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'var(--s-5)', background: 'var(--surface)', borderRadius: 'var(--r-lg)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary)', flexShrink: 0 }}>
              {avatarLetter}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>{name || user.email}</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              <span className="badge-role" style={{ marginTop: 8, display: 'inline-block' }}>Müşteri</span>
            </div>
          </div>

          {err && <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 'var(--r-md)', fontSize: '0.875rem' }}>{err}</div>}

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
                <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon.Shield size={11} /> Çekici sizinle Towit hattı üzerinden iletişim kurar
                </span>
              </div>
              <div className="field">
                <label className="field-label">E-posta</label>
                <input className="input" type="email" value={user.email} readOnly style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
              </div>
            </div>
          </div>

          <div className="stack-3">
            <div className="section-label">Kayıtlı Araç</div>
            <div className="card stack-4">
              <div className="grid-2" style={{ gap: 'var(--s-3)' }}>
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
                <input className="input" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} maxLength={15} />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>Talep oluştururken bu bilgiler önceden doldurulur.</span>
            </div>
          </div>

          {saved && (
            <div style={{ padding: '10px 14px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon.Check size={14} /> Kaydedildi
            </div>
          )}

          <button className="btn btn-primary btn-square" onClick={save} disabled={loading}>
            {loading ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}
          </button>
          <button className="btn btn-danger-ghost btn-square" onClick={handleLogout}>Hesaptan çıkış yap</button>
        </div>
      </div>
    </div>
  );
}
