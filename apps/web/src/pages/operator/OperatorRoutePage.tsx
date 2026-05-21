import { useState } from 'react';
import { Icon } from '../../components/Icons';
import MapView from '../../components/MapView';
import { patchJob, updateJobLocation } from '../../lib/api';
import type { JobDetail } from '../../lib/api';
import { useEffect } from 'react';

interface Props { job: JobDetail; onBack: () => void; onComplete: () => void; }

export default function OperatorRoutePage({ job, onBack, onComplete }: Props) {
  const [phase, setPhase] = useState<'to_pickup' | 'to_dest'>('to_pickup');
  const [tracking, setTracking] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tracking || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        void updateJobLocation(job.id, { lat: coords.latitude, lng: coords.longitude }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, job.id]);

  async function advance() {
    if (phase === 'to_pickup') {
      setLoading(true);
      try {
        await patchJob(job.id, 'en_route');
        setPhase('to_dest');
      } catch {
        // keep current phase when transition fails
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await patchJob(job.id, 'complete');
        onComplete();
      } catch {
        setLoading(false);
      }
    }
  }

  return (
    <div className="rota-shell">
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapView height="100%" pickup={job.pickup} destination={job.destination} operatorLocation={job.operatorLocation} />
      </div>

      <div className="rota-top">
        <button type="button" className="rota-top__icon" onClick={onBack} aria-label="Geri">
          <Icon.Arrow dir="left" size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="rota-top__title">
            {phase === 'to_pickup' ? 'Müşteriye gidiş' : 'Varışa gidiş'}
          </div>
          <div className="rota-top__detail">{job.customerEmail}</div>
        </div>
      </div>

      <div className="rota-eta">
        <div>
          <div className="rota-eta__time">{phase === 'to_pickup' ? '~9 dk' : '~14 dk'}</div>
          <div className="rota-eta__sub">tahmini varış</div>
        </div>
        <div className="rota-eta__dist">{job.distanceKm.toFixed(1)} km</div>
      </div>

      <div className="rota-fab-group">
        <button type="button" className={`rota-fab${tracking ? ' is-active' : ''}`} onClick={() => setTracking(t => !t)} aria-label="Konum takibi">
          <Icon.Crosshair size={20} />
        </button>
        <button type="button" className="rota-fab" aria-label="Rotayı yenile">
          <Icon.Refresh size={17} />
        </button>
      </div>

      <div className="rota-cta">
        <button
          className={`btn btn-square${phase === 'to_dest' ? ' btn-success' : ' btn-primary'}`}
          onClick={advance}
          disabled={loading}
          style={{ borderRadius: 'var(--r-lg)' }}
        >
          {loading ? 'İşleniyor…' : phase === 'to_pickup' ? 'Müşteriyi aldım — Yola devam' : 'Hedefe ulaştım — İşi tamamla'}
        </button>
      </div>
    </div>
  );
}
