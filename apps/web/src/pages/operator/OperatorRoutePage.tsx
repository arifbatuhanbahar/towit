import { useCallback, useMemo, useState } from 'react';
import { Icon } from '../../components/Icons';
import MapView from '../../components/MapView';
import { getRouteToDestination, getRouteToPickup, patchJob, updateJobLocation } from '../../lib/api';
import type { JobDetail } from '../../lib/api';
import { useEffect } from 'react';

interface Props { job: JobDetail; onBack: () => void; onComplete: () => void; }

export default function OperatorRoutePage({ job, onBack, onComplete }: Props) {
  const [phase, setPhase] = useState<'to_pickup' | 'to_dest'>(job.status === 'en_route' ? 'to_dest' : 'to_pickup');
  const [tracking, setTracking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeData, setRouteData] = useState<{
    origin: { lat: number; lng: number };
    target: { lat: number; lng: number };
    points: { lat: number; lng: number }[];
    durationMinutes: number;
    distanceKm: number;
    source: 'google' | 'osrm' | 'straight';
  } | null>(null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(
    job.operatorLocation ? { lat: job.operatorLocation.lat, lng: job.operatorLocation.lng } : null
  );

  const currentOperatorLocation = useMemo(
    () => liveLocation ?? (job.operatorLocation ? { lat: job.operatorLocation.lat, lng: job.operatorLocation.lng } : null),
    [liveLocation, job.operatorLocation]
  );

  const fetchRouteData = useCallback(async () => {
    try {
      if (phase === 'to_pickup') {
        const route = await getRouteToPickup(job.id, currentOperatorLocation ?? undefined);
        return {
          origin: route.origin,
          target: route.pickup ?? job.pickup,
          points: route.points,
          durationMinutes: route.durationMinutes,
          distanceKm: route.distanceKm,
          source: route.source,
        } as const;
      }
      const route = await getRouteToDestination(job.id, currentOperatorLocation ?? undefined);
      return {
        origin: route.origin,
        target: route.destination ?? job.destination,
        points: route.points,
        durationMinutes: route.durationMinutes,
        distanceKm: route.distanceKm,
        source: route.source,
      } as const;
    } catch {
      return null;
    }
  }, [phase, job.id, job.pickup, job.destination, currentOperatorLocation]);

  const refreshRoute = useCallback(async () => {
    setRouteLoading(true);
    try {
      const nextRoute = await fetchRouteData();
      setRouteData(nextRoute);
    } finally {
      setRouteLoading(false);
    }
  }, [fetchRouteData]);

  useEffect(() => {
    if (!tracking || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        setLiveLocation(point);
        void updateJobLocation(job.id, point).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, job.id]);

  useEffect(() => {
    let cancelled = false;
    void fetchRouteData().then((nextRoute) => {
      if (!cancelled) setRouteData(nextRoute);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchRouteData]);

  async function advance() {
    if (phase === 'to_pickup') {
      setLoading(true);
      try {
        await patchJob(job.id, 'en_route');
        setRouteData(null);
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

  const mapStart = routeData?.origin ?? currentOperatorLocation ?? job.pickup;
  const mapEnd = routeData?.target ?? (phase === 'to_pickup' ? job.pickup : job.destination);
  const etaMinutes = routeData?.durationMinutes ?? (phase === 'to_pickup' ? 9 : 14);
  const distanceKm = routeData?.distanceKm ?? job.distanceKm;
  const etaLabel = routeData?.source === 'straight' ? 'tahmini varış (yedek)' : 'tahmini varış';

  return (
    <div className="rota-shell">
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapView
          height="100%"
          pickup={mapStart}
          destination={mapEnd}
          operatorLocation={currentOperatorLocation}
          routePoints={routeData?.points ?? null}
        />
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
          <div className="rota-eta__time">{routeLoading ? '...' : `~${etaMinutes} dk`}</div>
          <div className="rota-eta__sub">{etaLabel}</div>
        </div>
        <div className="rota-eta__dist">{distanceKm.toFixed(1)} km</div>
      </div>

      <div className="rota-fab-group">
        <button type="button" className={`rota-fab${tracking ? ' is-active' : ''}`} onClick={() => setTracking(t => !t)} aria-label="Konum takibi">
          <Icon.Crosshair size={20} />
        </button>
        <button type="button" className="rota-fab" aria-label="Rotayı yenile" onClick={() => void refreshRoute()}>
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
