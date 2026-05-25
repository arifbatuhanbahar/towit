import { useState, useEffect } from 'react';
import { getJob, patchJob, createReview } from '../../lib/api';
import type { JobDetail } from '../../lib/api';
import { StatusBadge } from '../../components/Shared';
import MapView from '../../components/MapView';
import { Icon, BREAKDOWN_LABEL, VehicleIcon } from '../../components/Icons';

interface Props { jobId: string; onBack: () => void; }

export default function CustomerJobPage({ jobId, onBack }: Props) {
  const [job, setJob]         = useState<JobDetail | null>(null);
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [note, setNote]       = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [err, setErr]         = useState('');

  useEffect(() => {
    getJob(jobId).then(setJob).catch(() => setErr('Talep yüklenemedi.'));
    const id = setInterval(() => {
      getJob(jobId).then(setJob).catch(() => {});
    }, 4000);
    return () => clearInterval(id);
  }, [jobId]);

  async function cancel() {
    try { const r = await patchJob(jobId, 'cancel'); setJob(j => j ? { ...j, status: r.status } : j); }
    catch (ex: unknown) { setErr(ex instanceof Error ? ex.message : 'İptal başarısız.'); }
  }

  async function submitReview() {
    try { await createReview(jobId, rating, note); setReviewed(true); }
    catch (ex: unknown) { setErr(ex instanceof Error ? ex.message : 'Değerlendirme gönderilemedi.'); }
  }

  if (!job) return (
    <div className="towit">
      <div className="scroll-area"><div className="screen"><div className="t-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>{err || 'Yükleniyor…'}</div></div></div>
    </div>
  );

  const VIcon = VehicleIcon[job.operator.vehicleType] || VehicleIcon.platform;
  const phoneVisible = job.status === 'accepted' || job.status === 'en_route';
  const liveOperatorPoint = job.operatorLocation
    ? { lat: job.operatorLocation.lat, lng: job.operatorLocation.lng }
    : null;
  const mapOrigin = liveOperatorPoint && phoneVisible ? liveOperatorPoint : job.pickup;
  const mapDestination = job.status === 'accepted' ? job.pickup : job.destination;
  const events = [
    { label: 'Talep oluşturuldu', state: 'done' },
    { label: 'Çekici kabul etti', state: ['accepted', 'en_route', 'completed'].includes(job.status) ? 'done' : 'pending' },
    { label: 'Çekici yolda',      state: ['en_route', 'completed'].includes(job.status) ? (job.status === 'en_route' ? 'active' : 'done') : 'pending' },
    { label: 'Tamamlandı',        state: job.status === 'completed' ? 'done' : 'pending' },
  ];

  return (
    <div className="towit">
      <div className="scroll-area">
        <div className="screen">
          <button className="btn-link" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Geri dön</button>

          {err && <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 'var(--r-md)', fontSize: '0.875rem' }}>{err}</div>}

          <div className="hero-status">
            <div className="row-between">
              <StatusBadge status={job.status} />
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>#{job.id.slice(-6).toUpperCase()}</span>
            </div>
            <div className="hero-status__title">
              {job.status === 'en_route' && 'Çekiciniz yolda'}
              {job.status === 'accepted' && 'Çekici görevi kabul etti'}
              {job.status === 'completed' && 'İş başarıyla tamamlandı'}
              {job.status === 'open' && 'Çekici bekleniyor'}
              {job.status === 'cancelled' && 'Talep iptal edildi'}
              {job.status === 'rejected' && 'Talep reddedildi'}
            </div>
            {job.status === 'en_route' && job.operatorLocation && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--primary)' }}>~9</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>dakika</span>
              </div>
            )}
          </div>

          <MapView
            height={200}
            pickup={mapOrigin}
            destination={mapDestination}
            operatorLocation={phoneVisible ? liveOperatorPoint : null}
          />

          {/* Operatör bilgi kartı */}
          <div className="card stack-3">
            <div style={{ fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Çekiciniz</div>
            <div style={{ fontWeight: 900, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>{job.operator.businessName}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-flex', color: 'var(--text-faint)' }}><VIcon size={16} /></span>
              <span>{job.operator.vehicleModel}{job.operator.vehicleYear ? ` · ${job.operator.vehicleYear}` : ''}</span>
            </div>
            {phoneVisible && job.operator.phone && (
              <a href={`tel:${job.operator.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px var(--s-4)', borderRadius: 'var(--r-md)', background: 'var(--success-soft)', border: '1px solid rgba(34,197,94,0.25)', textDecoration: 'none', color: 'var(--success)' }}>
                <span style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--success)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon.Phone size={17} /></span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text)' }}>Çekiciyi ara — Towit Hattı</div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: 2 }}><Icon.Shield size={11} /> Numaran gizli kalır</div>
                </div>
              </a>
            )}
          </div>

          {/* Müşteri araç özeti */}
          {(job.customerVehicleBrand || job.customerVehicleModel || job.customerVehiclePlate) && (
            <div className="card-flat stack-2">
              {(job.customerVehicleBrand || job.customerVehicleModel) && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Araç </span>
                  {[job.customerVehicleBrand, job.customerVehicleModel, job.customerVehiclePlate].filter(Boolean).join(' · ')}
                </div>
              )}
              {job.breakdownType && job.breakdownType !== 'diger' && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Arıza </span>
                  {BREAKDOWN_LABEL[job.breakdownType] ?? job.breakdownType}
                </div>
              )}
            </div>
          )}

          {/* Detay grid */}
          <div className="grid-2" style={{ gap: 'var(--s-3)' }}>
            {[['Çekici', job.operator.businessName], ['Mesafe', `${job.distanceKm.toFixed(1)} km`], ['Toplam', `${Number(job.priceSnapshot).toLocaleString('tr-TR')} ₺`]].map(([k, v]) => (
              <div key={k} style={{ padding: 'var(--s-3) var(--s-4)', background: 'var(--surface)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 4 }}>{k}</div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div>
            <div className="section-label" style={{ marginBottom: 'var(--s-4)' }}>Durum geçmişi</div>
            <div className="timeline">
              {events.map((e, i) => (
                <div key={i} className="timeline__row">
                  <div className="timeline__col">
                    <div className={`timeline__dot${e.state === 'done' ? ' is-done' : e.state === 'active' ? ' is-active' : ''}`} />
                    <div className={`timeline__line${e.state === 'done' ? ' is-done' : ''}`} />
                  </div>
                  <div className="timeline__content">
                    <div className="timeline__label">{e.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Değerlendirme */}
          {job.status === 'completed' && !reviewed && (
            <div className="stack-4">
              <div className="section-label">Değerlendir</div>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" className={`rating-star${(hovered || rating) >= n ? ' is-on' : ''}`}
                    onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)} onClick={() => setRating(n)}>
                    ★
                  </button>
                ))}
              </div>
              <textarea className="input" value={note} onChange={e => setNote(e.target.value)} style={{ height: 76, padding: '12px 14px', resize: 'vertical' }} placeholder="Kısa yorum (opsiyonel)" />
              <button className="btn btn-primary" disabled={!rating} onClick={submitReview}>Değerlendirmeyi gönder</button>
            </div>
          )}
          {job.status === 'completed' && reviewed && (
            <div style={{ padding: '10px 14px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              ✓ Değerlendirmeniz gönderildi
            </div>
          )}

          {/* İptal */}
          {(job.status === 'open') && (
            <button className="btn btn-danger-ghost btn-square" onClick={cancel}>Talebi iptal et</button>
          )}
        </div>
      </div>
    </div>
  );
}
