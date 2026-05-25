import { useState, useEffect } from 'react';
import { StatusBadge } from '../../components/Shared';
import MapView from '../../components/MapView';
import { Icon, BreakdownIcon, BREAKDOWN_LABEL } from '../../components/Icons';
import { getJob, patchJob } from '../../lib/api';
import type { JobDetail } from '../../lib/api';

interface Props { jobId: string; onBack: () => void; onGoRoute?: (job: JobDetail) => void; }

export default function OperatorJobPage({ jobId, onBack, onGoRoute }: Props) {
  const [job, setJob]   = useState<JobDetail | null>(null);
  const [err, setErr]   = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    getJob(jobId).then(setJob).catch(() => setErr('Talep yüklenemedi.'));
    const id = setInterval(() => getJob(jobId).then(setJob).catch(() => {}), 5000);
    return () => clearInterval(id);
  }, [jobId]);

  const ACTIONS: Record<string, { label: string; action: string; cls: string; disabled?: boolean; route?: boolean }> = {
    open:      { label: 'İşi kabul et',             action: 'accept',   cls: 'btn-primary' },
    accepted:  { label: 'Rotayı aç',                 action: '',         cls: 'btn-primary', route: true },
    en_route:  { label: 'Teslim edildi — Tamamla', action: 'complete', cls: 'btn-success' },
    completed: { label: 'İş tamamlandı',             action: '',         cls: 'btn-ghost', disabled: true },
  };

  async function handleAction() {
    if (!job) return;
    const act = ACTIONS[job.status];
    if (!act) return;
    if (act.route) { onGoRoute?.(job); return; }
    if (!act.action) return;
    setActing(true); setErr('');
    try {
      const r = await patchJob(jobId, act.action);
      setJob(j => j ? { ...j, status: r.status as string } : j);
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'İşlem başarısız.');
    } finally {
      setActing(false);
    }
  }

  async function rejectJob() {
    try { await patchJob(jobId, 'reject'); onBack(); } catch (ex: unknown) { setErr(ex instanceof Error ? ex.message : 'Reddetme başarısız.'); }
  }

  if (!job) return (
    <div className="towit">
      <div className="scroll-area"><div className="screen"><div className="t-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>{err || 'Yükleniyor…'}</div></div></div>
    </div>
  );

  const BIcon = BreakdownIcon[job.breakdownType] || BreakdownIcon.diger;
  const action = ACTIONS[job.status];
  const phoneVisible = job.status === 'accepted' || job.status === 'en_route';
  const liveOperatorPoint = job.operatorLocation
    ? { lat: job.operatorLocation.lat, lng: job.operatorLocation.lng }
    : null;
  const mapOrigin = liveOperatorPoint && phoneVisible ? liveOperatorPoint : job.pickup;
  const mapDestination = job.status === 'accepted' ? job.pickup : job.destination;

  return (
    <div className="towit">
      <div className="scroll-area">
        <div className="screen">
          <button className="btn-link" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Panele dön</button>

          {err && <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 'var(--r-md)', fontSize: '0.875rem' }}>{err}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.customerEmail}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge status={job.status} />
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>#{job.id.slice(-6).toUpperCase()}</span>
            </div>
          </div>

          {/* Müşteri araç bilgileri */}
          <div className="card stack-3">
            <div style={{ fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Müşteri Araç Bilgileri</div>
            {job.breakdownType && job.breakdownType !== 'diger' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 'var(--r-md)', background: 'rgba(239,68,68,0.10)', color: '#f87171', fontWeight: 800, fontSize: '1rem', alignSelf: 'flex-start' }}>
                <BIcon size={18} />{BREAKDOWN_LABEL[job.breakdownType] ?? job.breakdownType}
              </div>
            )}
            {(job.customerVehicleBrand || job.customerVehicleModel) && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {[job.customerVehicleBrand, job.customerVehicleModel, job.customerVehiclePlate].filter(Boolean).join(' · ')}
              </div>
            )}
            {phoneVisible && job.customerPhone && (
              <a href={`tel:${job.customerPhone}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px var(--s-4)', borderRadius: 'var(--r-md)', background: 'var(--success-soft)', border: '1px solid rgba(34,197,94,0.25)', textDecoration: 'none', color: 'var(--success)' }}>
                <span style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--success)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon.Phone size={17} /></span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text)' }}>Müşteriyi ara</div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: 2 }}>{job.customerPhone} · <Icon.Shield size={11} /> Gerçek numaran gizli</div>
                </div>
              </a>
            )}
          </div>

          {/* Detay grid */}
          <div className="grid-2" style={{ gap: 'var(--s-3)' }}>
            {[
              ['Çekim', `${job.pickup.lat.toFixed(4)}, ${job.pickup.lng.toFixed(4)}`],
              ['Varış', `${job.destination.lat.toFixed(4)}, ${job.destination.lng.toFixed(4)}`],
              ['Mesafe', `${job.distanceKm.toFixed(1)} km`],
              ['Ücret', `${Number(job.priceSnapshot).toLocaleString('tr-TR')} ₺`],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: 'var(--s-3) var(--s-4)', background: 'var(--surface)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 5 }}>{k}</div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              </div>
            ))}
          </div>

          <MapView
            height={190}
            pickup={mapOrigin}
            destination={mapDestination}
            operatorLocation={phoneVisible ? liveOperatorPoint : null}
          />

          {action && (
            <button className={`btn ${action.cls} btn-square`} style={{ minHeight: 60, fontSize: '1rem', borderRadius: 'var(--r-lg)' }} disabled={action.disabled || acting} onClick={handleAction}>
              {acting ? 'İşleniyor…' : action.label}
            </button>
          )}

          {job.status === 'open' && (
            <button className="btn btn-danger-ghost btn-sm btn-square" style={{ marginTop: -8 }} onClick={rejectJob}>Reddet / İptal et</button>
          )}
        </div>
      </div>
    </div>
  );
}
