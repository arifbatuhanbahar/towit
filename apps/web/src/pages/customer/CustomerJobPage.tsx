import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "../../lib/mapIcons";
import { operatorLiveIcon, pickupIcon } from "../../lib/mapIcons";
import { api } from "../../lib/api";
import { reverseGeocode } from "../../lib/geocode";
import { statusBadge } from "../../lib/jobStatus";
import type { LatLng } from "../../lib/geo";
import { getStoredRole, isAuthenticated } from "../../lib/auth";
import ReviewForm from "../../components/feedback/ReviewForm";

type Job = {
  id: string;
  status: string;
  priceSnapshot: string;
  distanceKm: number;
  pickup: LatLng;
  destination: LatLng;
  operator: { businessName: string };
  operatorLocation: { lat: number; lng: number; updatedAt: string } | null;
};

function PanTo({ pos }: { pos: LatLng }) {
  const map = useMap();
  const prevRef = useRef<LatLng | null>(null);
  useEffect(() => {
    const prev = prevRef.current;
    if (!prev) {
      map.setView([pos.lat, pos.lng], map.getZoom(), { animate: true });
    } else {
      const dist = Math.hypot(pos.lat - prev.lat, pos.lng - prev.lng);
      if (dist > 0.001) {
        map.panTo([pos.lat, pos.lng], { animate: true });
      }
    }
    prevRef.current = pos;
  }, [map, pos]);
  return null;
}

export default function CustomerJobPage() {
  const { id } = useParams();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (getStoredRole() !== "customer") return <Navigate to="/operator" replace />;
  if (!id) return <Navigate to="/customer" replace />;
  return <CustomerJobInner id={id} />;
}

function CustomerJobInner({ id }: { id: string }) {
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pickupAddr, setPickupAddr] = useState<string | null>(null);
  const [destAddr, setDestAddr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const j = await api<Job>(`/jobs/${id}`);
        if (!alive) return;
        setJob((prev) => {
          // Adres fetch'i sadece ilk yüklemede yap
          if (!prev) {
            reverseGeocode(j.pickup.lat, j.pickup.lng).then((a) => { if (alive) setPickupAddr(a); });
            reverseGeocode(j.destination.lat, j.destination.lng).then((a) => { if (alive) setDestAddr(a); });
          }
          return j;
        });
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : "Yüklenemedi");
      }
    };

    // Önce ilk snapshot'ı al (UI boş kalmasın)
    load();

    // SSE ile canlı güncelleme (fallback: polling)
    let es: EventSource | null = null;
    let t: number | null = null;

    const startPolling = () => {
      if (t != null) return;
      t = window.setInterval(load, 3000);
    };

    try {
      // Vite proxy ile aynı origin: /api -> server. EventSource auth header desteklemediği için token query ile taşınıyor.
      const access = localStorage.getItem("towit_access");
      if (access) {
        const url = `/api/jobs/${id}/stream?access=${encodeURIComponent(access)}`;
        es = new EventSource(url);
        es.addEventListener("job", (ev) => {
          try {
            const data = JSON.parse((ev as MessageEvent).data) as Job | { error?: { code: string; message: string } };
            if (!alive) return;
            if ("error" in data && data.error) {
              setErr(data.error.message);
              // erişim yoksa polling’e geçmek de anlamsız
              return;
            }
            const j = data as Job;
            setErr(null);
            setJob((prev) => {
              if (!prev) {
                reverseGeocode(j.pickup.lat, j.pickup.lng).then((a) => { if (alive) setPickupAddr(a); });
                reverseGeocode(j.destination.lat, j.destination.lng).then((a) => { if (alive) setDestAddr(a); });
              }
              return j;
            });
          } catch {
            // ignore malformed event
          }
        });
        es.addEventListener("error", () => {
          // SSE kesildiyse polling'e dön
          startPolling();
        });
      } else {
        startPolling();
      }
    } catch {
      startPolling();
    }

    return () => {
      alive = false;
      if (t != null) window.clearInterval(t);
      es?.close();
    };
  }, [id]);

  async function demoPay() {
    setErr(null);
    try {
      await api(`/jobs/${id}/demo-payment`, { method: "POST" });
      const j = await api<Job>(`/jobs/${id}`);
      setJob(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ödeme adımı başarısız");
    }
  }

  async function cancel() {
    setErr(null);
    try {
      await api(`/jobs/${id}`, { method: "PATCH", json: { action: "cancel" } });
      const j = await api<Job>(`/jobs/${id}`);
      setJob(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "İptal başarısız");
    }
  }

  const showMap =
    job &&
    (job.status === "accepted" || job.status === "en_route") &&
    job.operatorLocation != null;

  const mapCenter: LatLng =
    job?.operatorLocation ?? job?.pickup ?? { lat: 41.0082, lng: 28.9784 };

  const badge = job ? statusBadge(job.status) : null;

  return (
    <div>
      <p style={{ marginBottom: 16 }}>
        <Link to="/customer" className="btn btn-ghost" style={{ display: "inline-flex", padding: "8px 0" }}>
          ← Yeni talebe dön
        </Link>
      </p>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Talep durumu</h2>
        {!job ? (
          <p className="muted">{err ?? "Yükleniyor…"}</p>
        ) : (
          <>
            {badge ? (
              <p>
                <strong>Durum:</strong>{" "}
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 12,
                    background: badge.bg,
                    color: badge.color,
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  {badge.label}
                </span>
              </p>
            ) : null}
            <p>
              <strong>Tahmini tutar:</strong> {job.priceSnapshot} ₺
            </p>
            <p className="muted">
              <strong>Çekici:</strong> {job.operator.businessName}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "12px 0" }}>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                <div className="muted" style={{ fontSize: "0.72rem", marginBottom: 3 }}>Çekim noktası</div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                  {pickupAddr ?? `${job.pickup.lat.toFixed(4)}, ${job.pickup.lng.toFixed(4)}`}
                </div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                <div className="muted" style={{ fontSize: "0.72rem", marginBottom: 3 }}>Varış noktası</div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                  {destAddr ?? `${job.destination.lat.toFixed(4)}, ${job.destination.lng.toFixed(4)}`}
                </div>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>Mesafe: <strong style={{ color: "var(--text)" }}>{job.distanceKm.toFixed(2)} km</strong></p>

            {showMap && job.operatorLocation ? (
              <div style={{ marginTop: 16, marginBottom: 8 }}>
                <p className="muted" style={{ marginBottom: 8, fontWeight: 600 }}>
                  Çekicinin anlık konumu
                  {job.operatorLocation.updatedAt ? (
                    <span style={{ fontWeight: 400, marginLeft: 8 }}>
                      — {new Date(job.operatorLocation.updatedAt).toLocaleTimeString("tr-TR")}
                    </span>
                  ) : null}
                </p>
                <div
                  className="map-wrap"
                  style={{ height: 280, borderRadius: 10, overflow: "hidden" }}
                  role="application"
                  aria-label="Çekici konumu haritası"
                >
                  <MapContainer
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[job.pickup.lat, job.pickup.lng]} icon={pickupIcon} title="Çekim noktası" />
                    <Marker position={[job.destination.lat, job.destination.lng]} title="Varış noktası" />
                    <Marker
                      position={[job.operatorLocation.lat, job.operatorLocation.lng]}
                      icon={operatorLiveIcon}
                      title="Çekici konumu"
                    />
                    <PanTo pos={job.operatorLocation} />
                  </MapContainer>
                </div>
                <div className="row" style={{ marginTop: 8, gap: 16, flexWrap: "wrap" }}>
                  <span className="muted" style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
                    Çekim noktası
                  </span>
                  <span className="muted" style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#f97316", flexShrink: 0 }} />
                    Çekici (canlı)
                  </span>
                  <span className="muted" style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#2563eb", flexShrink: 0 }} />
                    Varış noktası
                  </span>
                </div>
              </div>
            ) : (job.status === "accepted" || job.status === "en_route") ? (
              <p className="muted" style={{ marginTop: 12, fontSize: "0.9rem" }}>
                Çekici konum paylaşımını başlatmadı veya henüz güncellenmedi. Otomatik yenilenecek.
              </p>
            ) : null}

            {err ? <div className="error">{err}</div> : null}
            <div className="row" style={{ marginTop: 12 }}>
              {job.status === "payment_pending" ? (
                <button type="button" className="btn btn-primary" onClick={demoPay}>
                  Demo ödemeyi tamamla
                </button>
              ) : null}
              {job.status === "payment_pending" || job.status === "open" ? (
                <button type="button" className="btn btn-secondary" onClick={cancel}>
                  Talebi iptal et
                </button>
              ) : null}
            </div>

            {/* Sonlanmış talep — yeni talep başlatma akışı */}
            {(job.status === "rejected" || job.status === "cancelled" || job.status === "completed") ? (
              <div style={{
                marginTop: 20, padding: "16px 18px", borderRadius: 12,
                background: job.status === "completed" ? "#f0fdf4" : "#fafafa",
                border: `1px solid ${job.status === "completed" ? "#bbf7d0" : "var(--border)"}`,
              }}>
                {job.status === "rejected" && (
                  <>
                    <p style={{ margin: "0 0 10px", fontWeight: 600 }}>Talep reddedildi</p>
                    <p className="muted" style={{ margin: "0 0 14px", fontSize: "0.88rem" }}>
                      Başka bir çekici seçerek yeni talep oluşturabilirsiniz.
                    </p>
                    <button type="button" className="btn btn-primary" onClick={() => navigate("/customer")}>
                      Yeni çekici seç
                    </button>
                  </>
                )}
                {job.status === "cancelled" && (
                  <>
                    <p style={{ margin: "0 0 10px", fontWeight: 600 }}>Talep iptal edildi</p>
                    <p className="muted" style={{ margin: "0 0 14px", fontSize: "0.88rem" }}>
                      İstediğinizde yeni bir talep oluşturabilirsiniz.
                    </p>
                    <button type="button" className="btn btn-primary" onClick={() => navigate("/customer")}>
                      Yeni talep oluştur
                    </button>
                  </>
                )}
                {job.status === "completed" && (
                  <>
                    <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#15803d" }}>Tamamlandı!</p>
                    <p className="muted" style={{ margin: "0 0 14px", fontSize: "0.88rem" }}>
                      Hizmet başarıyla tamamlandı. Tekrar ihtiyacınız olursa:
                    </p>
                    <button type="button" className="btn btn-primary" onClick={() => navigate("/customer")}>
                      Yeni talep oluştur
                    </button>
                  </>
                )}
              </div>
            ) : null}

            {/* Tamamlanan işler için müşteri değerlendirmesi */}
            {job.status === "completed" ? (
              <div style={{ marginTop: 14 }}>
                <ReviewForm jobId={job.id} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
