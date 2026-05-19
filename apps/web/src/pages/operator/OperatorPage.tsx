import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../../lib/api";
import MapPicker, { type LatLng } from "../../components/map/MapPicker";
import CrossRoleCard from "../../components/feedback/CrossRoleCard";
import { statusBadge } from "../../lib/jobStatus";
import { getStoredRole, isAuthenticated } from "../../lib/auth";

type Me = {
  operatorProfile: null | {
    id: string;
    businessName: string;
    vehicleInfo: string;
    serviceCenterLat: number;
    serviceCenterLng: number;
    serviceRadiusKm: number;
    isActive: boolean;
    tariff: null | { baseFee: string; perKmFee: string };
  };
};

/** Web Audio API ile kısa bip sesi çalar */
function playAlert() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.18);
    g.gain.setValueAtTime(0.35, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.4);
  } catch {
    /* ses izni yoksa sessiz geç */
  }
}

export default function OperatorPage() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const role = getStoredRole();
  if (role === "customer") {
    return <CrossRoleCard sessionRole="customer" suggestedPath="/customer" suggestedLabel="Müşteri paneline git" />;
  }
  if (role !== "operator") return <Navigate to="/login" replace />;
  return <OperatorHome />;
}

function OperatorHome() {
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [serviceCenter, setServiceCenter] = useState<LatLng>({ lat: 41.0082, lng: 28.9784 });
  const [radius, setRadius] = useState("25");
  const [active, setActive] = useState(true);
  const [baseFee, setBaseFee] = useState("500");
  const [perKmFee, setPerKmFee] = useState("35");

  useEffect(() => {
    (async () => {
      const m = await api<Me>("/me");
      setMe(m);
      const p = m.operatorProfile;
      if (p) {
        setBusinessName(p.businessName);
        setVehicleInfo(p.vehicleInfo);
        setServiceCenter({ lat: p.serviceCenterLat, lng: p.serviceCenterLng });
        setRadius(String(p.serviceRadiusKm));
        setActive(p.isActive);
        if (p.tariff) {
          setBaseFee(p.tariff.baseFee);
          setPerKmFee(p.tariff.perKmFee);
        }
      }
    })().catch((e) => setErr(e instanceof Error ? e.message : "Profil yüklenemedi"));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    setBusy(true);
    try {
      await api("/operators/me", {
        method: "PUT",
        json: {
          businessName,
          vehicleInfo,
          serviceCenterLat: serviceCenter.lat,
          serviceCenterLng: serviceCenter.lng,
          serviceRadiusKm: Number(radius),
          isActive: active,
          tariff: { baseFee: Number(baseFee), perKmFee: Number(perKmFee) },
        },
      });
      const m = await api<Me>("/me");
      setMe(m);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  function useGps() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setServiceCenter({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setErr("Konum alınamadı.")
    );
  }

  const needsSetup =
    me !== null &&
    me.operatorProfile !== null &&
    (me.operatorProfile.businessName === "Yeni işletme" ||
      me.operatorProfile.vehicleInfo === "—" ||
      (me.operatorProfile.tariff?.baseFee === "0" &&
        me.operatorProfile.tariff?.perKmFee === "0"));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "1.35rem", letterSpacing: "-0.02em" }}>Çekici paneli</h2>
        <p className="muted" style={{ margin: 0 }}>
          {me?.operatorProfile?.isActive
            ? "Profiliniz müşteri aramalarında görünüyor."
            : "Profiliniz şu an pasif — müşteri aramasında görünmüyorsunuz."}
        </p>
      </div>

      {needsSetup && (
        <div style={{
          background: "#fffbeb",
          border: "1.5px solid #fbbf24",
          borderRadius: 14,
          padding: "14px 18px",
          marginBottom: 16,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}>
          <span style={{ fontSize: "1.4rem", lineHeight: 1.2, flexShrink: 0 }}>⚙️</span>
          <div>
            <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
              Profilinizi tamamlayın
            </div>
            <div style={{ color: "#78350f", fontSize: "0.88rem", lineHeight: 1.5 }}>
              İşletme adınızı, araç bilgilerinizi ve tarife bilgilerinizi güncelleyin;
              ardından <strong>"Aktif görün"</strong> kutusunu işaretleyip kaydedin —
              müşteriler sizi arama sonuçlarında görmeye başlar.
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 4 }}>Profil ve tarife</h3>
        <p className="muted" style={{ marginTop: 0, marginBottom: 16, fontSize: "0.85rem" }}>
          Hizmet merkezinizi haritadan seçin — müşteriler yalnızca bu noktaya belirlediğiniz yarıçap içinde görünürsünüz.
        </p>
        {!me ? (
          <p className="muted">Yükleniyor…</p>
        ) : (
          <form onSubmit={saveProfile}>
            <div className="row row-stretch">
              <div className="field">
                <label htmlFor="op-name">İşletme adı</label>
                <input id="op-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required placeholder="Örn. İstanbul Çekici Hizmetleri" />
              </div>
              <div className="field">
                <label htmlFor="op-veh">Araç bilgisi</label>
                <input id="op-veh" value={vehicleInfo} onChange={(e) => setVehicleInfo(e.target.value)} required placeholder="Örn. Ford Transit — 2022 — Düz platform" />
              </div>
            </div>

            {/* Hizmet merkezi harita seçici */}
            <div className="field">
              <label>Hizmet merkezi konumu</label>
              <div className="row" style={{ marginBottom: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={useGps} style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
                  GPS'ten al
                </button>
                <span className="muted" style={{ fontSize: "0.82rem" }}>
                  veya haritaya tıklayın
                  {serviceCenter
                    ? ` — ${serviceCenter.lat.toFixed(5)}, ${serviceCenter.lng.toFixed(5)}`
                    : ""}
                </span>
              </div>
              <MapPicker
                center={serviceCenter}
                value={serviceCenter}
                onChange={setServiceCenter}
                helperText="İşaretçiyi merkez noktanıza sürükleyin veya haritaya tıklayın."
              />
            </div>

            <div className="row row-stretch" style={{ marginTop: 8 }}>
              <div className="field">
                <label htmlFor="op-rad">Hizmet yarıçapı (km)</label>
                <input id="op-rad" type="number" min="1" max="500" value={radius} onChange={(e) => setRadius(e.target.value)} required />
                <span className="muted" style={{ fontSize: "0.78rem" }}>
                  Bu yarıçap içindeki çekim noktaları için listede görünürsünüz.
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label htmlFor="op-base">Taban ücret (₺)</label>
                <input id="op-base" type="number" min="0" value={baseFee} onChange={(e) => setBaseFee(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="op-km">Km başı ücret (₺)</label>
                <input id="op-km" type="number" min="0" step="0.5" value={perKmFee} onChange={(e) => setPerKmFee(e.target.value)} required />
              </div>
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                <span>Listede aktif görün (işaret kaldırırsanız yeni talep gelmez)</span>
              </label>
            </div>

            {err ? <div className="error" style={{ marginBottom: 12 }}>{err}</div> : null}
            {saved ? <div className="success-banner" style={{ marginBottom: 12 }}>Profil kaydedildi.</div> : null}

            <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%" }}>
              {busy ? "Kaydediliyor…" : "Profili kaydet"}
            </button>
          </form>
        )}
      </div>

      <OperatorJobs />
    </div>
  );
}

type Job = {
  id: string;
  status: string;
  priceSnapshot: string;
  customerEmail: string;
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  distanceKm: number;
  createdAt: string;
};

function OperatorJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [newJobIds, setNewJobIds] = useState<Set<string>>(new Set());
  const prevJobIds = useRef<Set<string>>(new Set());
  const [notifyBanner, setNotifyBanner] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      try {
        const res = await api<{ jobs: Job[] }>("/jobs");
        if (!alive) return;

        const incoming = res.jobs;
        setJobs(incoming);

        // Yeni gelen "open" talepleri tespit et
        const freshOpen = incoming.filter(
          (j) => j.status === "open" && !prevJobIds.current.has(j.id)
        );
        if (freshOpen.length > 0) {
          playAlert();
          const ids = new Set(freshOpen.map((j) => j.id));
          setNewJobIds((prev) => new Set([...prev, ...ids]));
          setNotifyBanner(`${freshOpen.length} yeni talep geldi!`);
          setTimeout(() => setNotifyBanner(null), 5000);
        }

        prevJobIds.current = new Set(incoming.map((j) => j.id));
      } catch {
        if (alive) setJobs([]);
      }
    };

    tick();
    const id = window.setInterval(tick, 4000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  const openJobs = jobs.filter((j) => j.status === "open" || j.status === "accepted" || j.status === "en_route");
  const pastJobs = jobs.filter((j) => j.status === "completed" || j.status === "rejected" || j.status === "cancelled" || j.status === "payment_pending");

  return (
    <>
      {notifyBanner ? (
        <div style={{
          position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, background: "#16a34a", color: "#fff",
          padding: "12px 24px", borderRadius: 12, fontWeight: 700,
          boxShadow: "0 4px 20px rgba(0,0,0,.2)", animation: "pageIn 0.3s ease both",
          whiteSpace: "nowrap"
        }}>
          🔔 {notifyBanner}
        </div>
      ) : null}

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>
          Aktif talepler
          {openJobs.length > 0 ? (
            <span style={{
              marginLeft: 8, display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 22, height: 22, borderRadius: "50%", background: "#16a34a",
              color: "#fff", fontSize: "0.75rem", fontWeight: 700, verticalAlign: "middle"
            }}>
              {openJobs.length}
            </span>
          ) : null}
        </h3>

        {!openJobs.length ? (
          <p className="muted">Bekleyen aktif talep yok. Yeni talepler otomatik güncellenir.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {openJobs.map((j) => (
              <JobCard key={j.id} job={j} isNew={newJobIds.has(j.id)} />
            ))}
          </div>
        )}
      </div>

      {pastJobs.length > 0 ? (
        <details className="past-jobs card">
          <summary>Geçmiş talepler ({pastJobs.length})</summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {pastJobs.map((j) => (
              <JobCard key={j.id} job={j} isNew={false} compact />
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

function JobCard({ job, isNew, compact = false }: { job: Job; isNew: boolean; compact?: boolean }) {
  const badge = statusBadge(job.status);
  const createdAt = new Date(job.createdAt);

  return (
    <Link
      to={`/operator/jobs/${job.id}`}
      className="job-link"
      style={{
        display: "block", textDecoration: "none", color: "inherit",
        border: isNew ? "2px solid #16a34a" : "1px solid var(--border)",
        borderRadius: 12, padding: compact ? "10px 14px" : "14px 16px",
        background: isNew ? "#f0fdf4" : "#fff",
        transition: "border-color .15s, background .15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center",
              padding: "3px 10px", borderRadius: 20,
              background: badge.bg, color: badge.color,
              fontSize: "0.78rem", fontWeight: 700,
            }}>
              {isNew ? "● " : ""}{badge.label}
            </span>
            <span className="muted" style={{ fontSize: "0.78rem" }}>
              {createdAt.toLocaleDateString("tr-TR")} {createdAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {!compact ? (
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
              <div>
                <span className="muted" style={{ fontSize: "0.78rem" }}>Müşteri</span>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {job.customerEmail}
                </div>
              </div>
              <div>
                <span className="muted" style={{ fontSize: "0.78rem" }}>Ücret · Mesafe</span>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {job.priceSnapshot} ₺ · {job.distanceKm.toFixed(1)} km
                </div>
              </div>
            </div>
          ) : (
            <div className="muted" style={{ fontSize: "0.82rem", marginTop: 4 }}>
              {job.customerEmail} — {job.priceSnapshot} ₺ — {job.distanceKm.toFixed(1)} km
            </div>
          )}
        </div>
        <span className="muted" style={{ fontSize: "0.85rem", flexShrink: 0 }}>→</span>
      </div>
    </Link>
  );
}
