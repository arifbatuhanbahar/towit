import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { reverseGeocode } from "../../lib/geocode";
import OperatorPreviewMap from "../../components/map/OperatorPreviewMap";
import { statusBadge } from "../../lib/jobStatus";
import { haversineKm, type LatLng } from "../../lib/geo";
import { getStoredRole, isAuthenticated } from "../../lib/auth";

type Job = {
  id: string;
  status: string;
  priceSnapshot: string;
  distanceKm: number;
  pickup: LatLng;
  destination: LatLng;
  customerEmail: string;
  createdAt: string;
};

type Me = {
  operatorProfile: null | {
    serviceCenterLat: number;
    serviceCenterLng: number;
  };
};

export default function OperatorJobPage() {
  const { id } = useParams();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (getStoredRole() !== "operator") return <Navigate to="/customer" replace />;
  if (!id) return <Navigate to="/operator" replace />;
  return <OperatorJobView id={id} />;
}

function OperatorJobView({ id }: { id: string }) {
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pickupAddr, setPickupAddr] = useState<string | null>(null);
  const [destAddr, setDestAddr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [serviceCenter, setServiceCenter] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    api<Me>("/me")
      .then((m) => {
        if (m.operatorProfile) {
          setServiceCenter({ lat: m.operatorProfile.serviceCenterLat, lng: m.operatorProfile.serviceCenterLng });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const j = await api<Job>(`/jobs/${id}`);
        if (!alive) return;
        setJob((prev) => {
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
    load();
    const t = window.setInterval(load, 3000);
    return () => { alive = false; window.clearInterval(t); };
  }, [id]);

  async function act(action: "accept" | "reject" | "en_route" | "complete") {
    setErr(null);
    setBusy(true);
    try {
      await api(`/jobs/${id}`, { method: "PATCH", json: { action } });
      const updated = await api<Job>(`/jobs/${id}`);
      setJob(updated);
      if (action === "accept") {
        navigate(`/operator/jobs/${id}/rota`, { replace: true });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  }

  const badge = job ? statusBadge(job.status) : null;

  return (
    <div>
      <p style={{ marginBottom: 16 }}>
        <Link to="/operator" className="btn btn-ghost" style={{ display: "inline-flex", padding: "6px 0" }}>
          ← Panele dön
        </Link>
      </p>

      {!job ? (
        <div className="card">
          <p className="muted">{err ?? "Yükleniyor…"}</p>
        </div>
      ) : (
        <div className="card">
          {/* Başlık + durum rozeti */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: "0 0 4px" }}>Talep detayı</h2>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {new Date(job.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}{" "}
                {new Date(job.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {badge ? (
              <span style={{
                display: "inline-flex", alignItems: "center", padding: "5px 12px",
                borderRadius: 20, background: badge.bg, color: badge.color,
                fontSize: "0.82rem", fontWeight: 700, flexShrink: 0
              }}>
                {badge.label}
              </span>
            ) : null}
          </div>

          {/* Müşteri */}
          <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, marginBottom: 12 }}>
            <div className="muted" style={{ fontSize: "0.75rem", marginBottom: 3 }}>Müşteri</div>
            <div style={{ fontWeight: 600 }}>{job.customerEmail}</div>
          </div>

          {/* Çekim ve Varış */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
                <span className="muted" style={{ fontSize: "0.75rem" }}>Çekim noktası</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                {pickupAddr ?? `${job.pickup.lat.toFixed(5)}, ${job.pickup.lng.toFixed(5)}`}
              </div>
              <div className="muted" style={{ fontSize: "0.72rem", marginTop: 2 }}>
                {job.pickup.lat.toFixed(5)}, {job.pickup.lng.toFixed(5)}
              </div>
            </div>
            <div style={{ padding: "12px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />
                <span className="muted" style={{ fontSize: "0.75rem" }}>Varış noktası</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                {destAddr ?? `${job.destination.lat.toFixed(5)}, ${job.destination.lng.toFixed(5)}`}
              </div>
              <div className="muted" style={{ fontSize: "0.72rem", marginTop: 2 }}>
                {job.destination.lat.toFixed(5)}, {job.destination.lng.toFixed(5)}
              </div>
            </div>
          </div>

          {/* Mesafe ve ücret */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
              <div className="muted" style={{ fontSize: "0.72rem", marginBottom: 2 }}>Mesafe</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{job.distanceKm.toFixed(1)} km</div>
            </div>
            <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "10px 12px" }}>
              <div className="muted" style={{ fontSize: "0.72rem", marginBottom: 2 }}>Tahmini ücret</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{job.priceSnapshot} ₺</div>
            </div>
          </div>

          {/* Rota önizlemesi — yalnızca açık talepler için */}
          {job.status === "open" && serviceCenter ? (
            <div style={{ marginBottom: 16 }}>
              <p className="muted" style={{ fontWeight: 600, marginBottom: 8, fontSize: "0.88rem" }}>
                Rota önizlemesi (kabul etmeden önce)
              </p>
              <OperatorPreviewMap
                operatorCenter={serviceCenter}
                pickup={job.pickup}
                destination={job.destination}
                jobDistanceKm={job.distanceKm}
                distanceToPickupKm={haversineKm(serviceCenter, job.pickup)}
                previewTotal={job.priceSnapshot}
              />
            </div>
          ) : null}

          {err ? <div className="error" style={{ marginBottom: 12 }}>{err}</div> : null}

          {/* Rota butonu */}
          {(job.status === "accepted" || job.status === "en_route") ? (
            <Link
              to={`/operator/jobs/${id}/rota`}
              className="btn btn-primary"
              style={{ display: "flex", width: "100%", marginBottom: 10, justifyContent: "center" }}
            >
              Navigasyonu aç
            </Link>
          ) : null}

          {/* Aksiyon butonları */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {job.status === "open" ? (
              <>
                <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => act("accept")} disabled={busy}>
                  Kabul et
                </button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => act("reject")} disabled={busy}>
                  Reddet
                </button>
              </>
            ) : null}
            {job.status === "accepted" ? (
              <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={() => act("en_route")} disabled={busy}>
                Yola çıkıldı — navigasyona geç
              </button>
            ) : null}
            {job.status === "en_route" ? (
              <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={() => act("complete")} disabled={busy}>
                Tamamlandı
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
