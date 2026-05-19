import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "../../lib/mapIcons";
import { destIcon, operatorPulsingIcon, pickupIcon } from "../../lib/mapIcons";
import { api } from "../../lib/api";
import { haversineKm, type LatLng } from "../../lib/geo";
import { useLiveLocation } from "../../hooks/useLiveLocation";
import { getStoredRole, isAuthenticated } from "../../lib/auth";

type JobDetail = {
  id: string;
  status: string;
  pickup: LatLng;
  destination: LatLng;
  customerEmail: string;
  distanceKm: number;
  priceSnapshot: string;
};

type RoutePayload = {
  jobId: string;
  jobStatus: string;
  origin: LatLng;
  pickup?: LatLng;
  destination?: LatLng;
  points: LatLng[];
  distanceKm: number;
  durationMinutes: number;
  durationSeconds: number;
  source: "google" | "osrm" | "straight";
};

/** Rotada mevcut konuma en yakın noktanın index'ini döndürür */
function nearestPointIndex(points: LatLng[], pos: LatLng): number {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < points.length; i++) {
    const d = Math.hypot(points[i].lat - pos.lat, points[i].lng - pos.lng);
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }
  return minIdx;
}

/** Geçilen kısmı kes — sadece kalan rotayı döndür */
function trimRoute(points: LatLng[], pos: LatLng): { remaining: LatLng[]; traveled: LatLng[] } {
  if (points.length < 2) return { remaining: points, traveled: [] };
  const idx = nearestPointIndex(points, pos);
  return {
    traveled: points.slice(0, idx + 1),
    remaining: points.slice(idx),
  };
}

/** Kalan rota mesafesini ve süresini hesaplar */
function remainingStats(points: LatLng[], totalMeters: number, totalSeconds: number): { km: number; minutes: number } {
  if (points.length < 2) return { km: 0, minutes: 0 };
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    dist += haversineKm(points[i - 1], points[i]);
  }
  const ratio = dist / (totalMeters / 1000);
  return {
    km: Number(dist.toFixed(1)),
    minutes: Math.max(1, Math.round(totalSeconds * ratio / 60)),
  };
}

/** Haritayı operatör konumuna smooth olarak takip ettirir */
function FollowOperator({ pos, follow }: { pos: LatLng; follow: boolean }) {
  const map = useMap();
  const firstRef = useRef(true);

  useEffect(() => {
    if (!follow) return;
    if (firstRef.current) {
      map.setView([pos.lat, pos.lng], Math.max(map.getZoom(), 15), { animate: true });
      firstRef.current = false;
    } else {
      map.panTo([pos.lat, pos.lng], { animate: true, duration: 1.0 });
    }
  }, [map, pos, follow]);

  return null;
}

function FitRoute({ points }: { points: LatLng[] }) {
  const map = useMap();
  const fittedRef = useRef(false);
  useEffect(() => {
    if (points.length < 2 || fittedRef.current) return;
    const b = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(b, { padding: [48, 48], maxZoom: 15, animate: true });
    fittedRef.current = true;
  }, [map, points]);
  return null;
}

export default function OperatorRoutePage() {
  const { id } = useParams();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (getStoredRole() !== "operator") return <Navigate to="/customer" replace />;
  if (!id) return <Navigate to="/operator" replace />;
  return <OperatorRouteInner jobId={id} />;
}

function OperatorRouteInner({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [routeToPickup, setRouteToPickup] = useState<RoutePayload | null>(null);
  const [routeToDestination, setRouteToDestination] = useState<RoutePayload | null>(null);
  const [tracking, setTracking] = useState(true);
  const [followMap, setFollowMap] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [routeErr, setRouteErr] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const lastFetchOrigin = useRef<LatLng | null>(null);
  const lastPushedPos = useRef<LatLng | null>(null);

  // Her 80m'de bir müşteri tarafına konum bilgisi iletir (polling ile okuyor).
  const pushLocation = useCallback((pos: LatLng) => {
    const prev = lastPushedPos.current;
    if (prev && haversineKm(prev, pos) < 0.08) return;
    lastPushedPos.current = pos;
    api(`/jobs/${jobId}/location`, { method: "PATCH", json: { lat: pos.lat, lng: pos.lng } }).catch(() => {});
  }, [jobId]);

  const { pos: myPos, error: geoError } = useLiveLocation({ enabled: tracking, onPosition: pushLocation });

  const loadJob = useCallback(async () => {
    const j = await api<JobDetail>(`/jobs/${jobId}`);
    setJob(j);
    return j;
  }, [jobId]);

  const fetchPickupRoute = useCallback(
    async (origin: LatLng | null) => {
      setRouteErr(null);
      const qs = origin
        ? `?fromLat=${encodeURIComponent(String(origin.lat))}&fromLng=${encodeURIComponent(String(origin.lng))}`
        : "";
      const r = await api<RoutePayload>(`/jobs/${jobId}/route${qs}`);
      setRouteToPickup(r);
      setLastRefresh(new Date());
      if (origin) lastFetchOrigin.current = origin;
    },
    [jobId]
  );

  const fetchDestinationRoute = useCallback(
    async (origin: LatLng | null) => {
      setRouteErr(null);
      const qs = origin
        ? `?fromLat=${encodeURIComponent(String(origin.lat))}&fromLng=${encodeURIComponent(String(origin.lng))}`
        : "";
      const r = await api<RoutePayload>(`/jobs/${jobId}/route-to-destination${qs}`);
      setRouteToDestination(r);
      setLastRefresh(new Date());
    },
    [jobId]
  );

  async function updateJobStatus(action: "en_route" | "complete") {
    setRouteErr(null);
    try {
      await api(`/jobs/${jobId}`, { method: "PATCH", json: { action } });
      const j = await loadJob();
      if (action === "en_route") {
        void fetchDestinationRoute(myPos);
      }
      return j;
    } catch (e) {
      setRouteErr(e instanceof Error ? e.message : "Durum güncellenemedi");
    }
  }

  // İlk yükleme
  useEffect(() => {
    void loadJob()
      .then((j) => {
        if (j.status === "accepted") return fetchPickupRoute(null);
        if (j.status === "en_route") {
          void fetchPickupRoute(null);
          return fetchDestinationRoute(null);
        }
        return undefined;
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "Yüklenemedi"));
  }, [loadJob, fetchPickupRoute, fetchDestinationRoute]);

  // Job status polling
  useEffect(() => {
    let alive = true;
    const t = window.setInterval(() => {
      if (!alive) return;
      void loadJob().catch(() => {});
    }, 6000);
    return () => { alive = false; window.clearInterval(t); };
  }, [loadJob]);

  // Konum değişince rota yenile (30m eşik)
  useEffect(() => {
    if (!job || (job.status !== "accepted" && job.status !== "en_route")) return;
    if (!myPos) return;
    const prev = lastFetchOrigin.current;
    if (prev && haversineKm(prev, myPos) < 0.03) return; // 30m

    const h = window.setTimeout(() => {
      if (job.status === "accepted") {
        void fetchPickupRoute(myPos).catch((e) => setRouteErr(e instanceof Error ? e.message : "Rota güncellenemedi"));
      } else {
        void fetchDestinationRoute(myPos).catch((e) => setRouteErr(e instanceof Error ? e.message : "Rota güncellenemedi"));
      }
    }, 800);
    return () => window.clearTimeout(h);
  }, [myPos, job, fetchPickupRoute, fetchDestinationRoute]);

  // Aktif rota ve kalan kısım
  const activeRoute = job?.status === "en_route" ? routeToDestination : routeToPickup;

  const { traveled, remaining } = useMemo(() => {
    if (!activeRoute?.points?.length || !myPos) {
      return { traveled: [] as LatLng[], remaining: activeRoute?.points ?? [] };
    }
    return trimRoute(activeRoute.points, myPos);
  }, [activeRoute, myPos]);

  const stats = useMemo(() => {
    if (!activeRoute) return null;
    if (myPos && remaining.length >= 2) {
      return remainingStats(remaining, activeRoute.distanceKm * 1000, activeRoute.durationSeconds);
    }
    return { km: activeRoute.distanceKm, minutes: activeRoute.durationMinutes };
  }, [activeRoute, myPos, remaining]);

  const mapCenter = useMemo<LatLng>(() => {
    if (myPos && tracking) return myPos;
    if (activeRoute?.points?.length) return activeRoute.points[Math.floor(activeRoute.points.length / 2)];
    if (job) return job.pickup;
    return { lat: 41.0082, lng: 28.9784 };
  }, [activeRoute, job, myPos, tracking]);

  if (loadErr && !job) {
    return (
      <div className="card">
        <p className="error">{loadErr}</p>
        <Link to="/operator" className="btn btn-secondary">Panele dön</Link>
      </div>
    );
  }

  if (job) {
    if (job.status === "completed" || job.status === "cancelled" || job.status === "rejected") {
      return <Navigate to="/operator" replace />;
    }
    if (job.status !== "accepted" && job.status !== "en_route") {
      return <Navigate to={`/operator/jobs/${jobId}`} replace />;
    }
  }

  const traveledPos = traveled.map((p) => [p.lat, p.lng] as [number, number]);
  const remainingPos = remaining.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <div className="route-page">
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            {job?.status === "en_route" ? "Varışa gidiş" : "Müşteriye gidiş"}
          </h2>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
            {tracking && myPos
              ? "Canlı konum aktif — harita sizi takip ediyor"
              : "Konum bekleniyor…"}
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link to={`/operator/jobs/${jobId}`} className="btn btn-secondary">Detay</Link>
          <Link to="/operator" className="btn btn-ghost">Liste</Link>
        </div>
      </div>

      {geoError ? <div className="error" style={{ marginBottom: 10 }}>{geoError}</div> : null}
      {routeErr ? <div className="error" style={{ marginBottom: 10 }}>{routeErr}</div> : null}

      {/* ETA banner */}
      {stats ? (
        <div style={{
          display: "flex", gap: 24, padding: "12px 16px", borderRadius: 10, marginBottom: 12,
          background: job?.status === "en_route" ? "#fff7ed" : "#eff6ff",
          border: `1px solid ${job?.status === "en_route" ? "#fed7aa" : "#bfdbfe"}`,
          flexWrap: "wrap", alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>
              ~{stats.minutes} dk
            </div>
            <div className="muted" style={{ fontSize: "0.78rem", marginTop: 2 }}>kalan süre</div>
          </div>
          <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {stats.km} km
            </div>
            <div className="muted" style={{ fontSize: "0.78rem", marginTop: 2 }}>kalan mesafe</div>
          </div>
          {lastRefresh ? (
            <div className="muted" style={{ fontSize: "0.78rem", marginLeft: "auto" }}>
              Güncellendi: {lastRefresh.toLocaleTimeString("tr-TR")}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="route-grid">
        <div className="route-map-wrap card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={15}
            style={{ height: "min(62vh, 560px)", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Geçilen kısım — soluk gri */}
            {traveledPos.length >= 2 ? (
              <Polyline positions={traveledPos} pathOptions={{ color: "#94a3b8", weight: 5, opacity: 0.5, dashArray: "6,4" }} />
            ) : null}

            {/* Kalan rota — canlı renk */}
            {remainingPos.length >= 2 ? (
              <Polyline
                positions={remainingPos}
                pathOptions={{
                  color: job?.status === "en_route" ? "#f97316" : "#2563eb",
                  weight: 7,
                  opacity: 0.92,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            ) : null}

            {/* Noktalar */}
            {job ? <Marker position={[job.pickup.lat, job.pickup.lng]} icon={pickupIcon} title="Çekim noktası" /> : null}
            {job ? <Marker position={[job.destination.lat, job.destination.lng]} icon={destIcon} title="Varış noktası" /> : null}
            {myPos ? <Marker position={[myPos.lat, myPos.lng]} icon={operatorPulsingIcon} title="Sizin konumunuz" zIndexOffset={1000} /> : null}

            {/* Map follow / fit */}
            {myPos && followMap ? <FollowOperator pos={myPos} follow={followMap} /> : null}
            {!myPos && remaining.length >= 2 ? <FitRoute points={remaining} /> : null}
          </MapContainer>

          {/* Harita üstü — konum takip butonu */}
          <button
            type="button"
            onClick={() => setFollowMap((v) => !v)}
            style={{
              position: "absolute", top: 10, right: 10, zIndex: 1000,
              padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: followMap ? "#2563eb" : "#f1f5f9",
              color: followMap ? "#fff" : "#475569",
              fontWeight: 600, fontSize: "0.8rem",
              boxShadow: "0 2px 8px rgba(0,0,0,.15)"
            }}
          >
            {followMap ? "Takip: Açık" : "Takip: Kapalı"}
          </button>
        </div>

        <aside className="card route-aside">
          <h3 style={{ marginTop: 0 }}>
            {job?.status === "en_route" ? "Varış bilgileri" : "Çekim bilgileri"}
          </h3>

          {job ? (
            <div style={{ marginBottom: 16 }}>
              <p className="muted" style={{ margin: "0 0 4px" }}>Müşteri</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{job.customerEmail}</p>
            </div>
          ) : null}

          {job ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                <div className="muted" style={{ fontSize: "0.75rem", marginBottom: 2 }}>İş mesafesi</div>
                <div style={{ fontWeight: 700 }}>{job.distanceKm.toFixed(1)} km</div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                <div className="muted" style={{ fontSize: "0.75rem", marginBottom: 2 }}>Tahmini ücret</div>
                <div style={{ fontWeight: 700 }}>{job.priceSnapshot} ₺</div>
              </div>
            </div>
          ) : null}

          {/* Renk açıklamaları */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 4, borderRadius: 2, background: job?.status === "en_route" ? "#f97316" : "#2563eb" }} />
              <span className="muted" style={{ fontSize: "0.82rem" }}>Kalan rota</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 4, borderRadius: 2, background: "#94a3b8", opacity: 0.6 }} />
              <span className="muted" style={{ fontSize: "0.82rem" }}>Geçilen yol</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#2563eb", border: "2px solid #fff", boxShadow: "0 0 0 2px #93c5fd" }} />
              <span className="muted" style={{ fontSize: "0.82rem" }}>Sizin konumunuz</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#16a34a" }} />
              <span className="muted" style={{ fontSize: "0.82rem" }}>Çekim noktası</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#dc2626" }} />
              <span className="muted" style={{ fontSize: "0.82rem" }}>Varış noktası</span>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={tracking}
                onChange={(e) => setTracking(e.target.checked)}
              />
              <span style={{ fontSize: "0.9rem" }}>Canlı konum takibi</span>
            </label>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: 12, width: "100%" }}
            onClick={() => {
              const fn = job?.status === "en_route" ? fetchDestinationRoute : fetchPickupRoute;
              void fn(myPos).catch((e) => setRouteErr(e instanceof Error ? e.message : "Hata"));
            }}
          >
            Rotayı yenile
          </button>

          {job?.status === "accepted" ? (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 10, width: "100%" }}
              onClick={() => void updateJobStatus("en_route")}
            >
              Yola çıkıldı — müşteri alındı
            </button>
          ) : null}

          {job?.status === "en_route" ? (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 10, width: "100%" }}
              onClick={() => void updateJobStatus("complete")}
            >
              Varışa ulaşıldı — işi tamamla
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
