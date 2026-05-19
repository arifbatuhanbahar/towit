import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import MapPicker, { type LatLng } from "../../components/map/MapPicker";
import RoutePreviewMap, { type RoutePreviewData } from "../../components/map/RoutePreviewMap";
import OperatorPreviewMap from "../../components/map/OperatorPreviewMap";
import CrossRoleCard from "../../components/feedback/CrossRoleCard";
import { ACTIVE_STATUSES, statusBadge } from "../../lib/jobStatus";
import { useJobs, type JobSummary } from "../../hooks/useJobs";
import { getStoredRole, isAuthenticated } from "../../lib/auth";

type Province = { code: string; name: string };

const STEPS = [
  { id: 1, label: "Bölge" },
  { id: 2, label: "Çekim" },
  { id: 3, label: "Varış" },
  { id: 4, label: "Çekiciler" },
] as const;

export default function CustomerPage() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const role = getStoredRole();
  if (role === "operator") {
    return <CrossRoleCard sessionRole="operator" suggestedPath="/operator" suggestedLabel="Çekici paneline git" />;
  }
  if (role !== "customer") return <Navigate to="/login" replace />;
  return <CustomerHome />;
}

function CustomerHome() {
  const navigate = useNavigate();
  const allJobs = useJobs();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cityCode, setCityCode] = useState("34");
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [destMode, setDestMode] = useState<"map" | "search">("map");
  const [destQuery, setDestQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ placeId: string; description: string }[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [sort, setSort] = useState<"price" | "distance">("price");
  const [operators, setOperators] = useState<
    {
      operatorProfileId: string;
      businessName: string;
      vehicleInfo: string;
      serviceCenterLat: number;
      serviceCenterLng: number;
      distanceToPickupKm: number;
      previewTotal: string;
      baseFee: string;
      perKmFee: string;
      jobDistanceKm: number;
      rating: number | null;
      ratingCount: number;
    }[]
  >([]);
  const [expandedOperatorId, setExpandedOperatorId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [destLat, setDestLat] = useState("");
  const [destLng, setDestLng] = useState("");
  const [routePreview, setRoutePreview] = useState<RoutePreviewData | null>(null);
  const [routePreviewLoading, setRoutePreviewLoading] = useState(false);

  const mapCenter = useMemo<LatLng>(() => {
    if (cityCode === "06") return { lat: 39.9334, lng: 32.8597 };
    if (cityCode === "35") return { lat: 38.4237, lng: 27.1428 };
    return { lat: 41.0082, lng: 28.9784 };
  }, [cityCode]);

  const provinceName = useMemo(() => provinces.find((p) => p.code === cityCode)?.name ?? "", [provinces, cityCode]);

  useEffect(() => {
    (async () => {
      const res = await api<{ provinces: Province[] }>("/cities");
      setProvinces(res.provinces);
    })().catch(() => setProvinces([]));
  }, []);

  const loadSuggestions = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setBusy(true);
      setSuggestLoading(true);
      setErr(null);
      try {
        const res = await api<{ suggestions: { placeId: string; description: string }[] }>("/places/suggest", {
          method: "POST",
          json: { query: destQuery, cityCode },
        });
        setSuggestions(res.suggestions);
      } catch (e) {
        if (!opts?.silent) setErr(e instanceof Error ? e.message : "Öneri alınamadı");
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
        if (!opts?.silent) setBusy(false);
      }
    },
    [destQuery, cityCode]
  );

  useEffect(() => {
    if (step !== 3 || destMode !== "search") return;
    const q = destQuery.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    const t = window.setTimeout(() => {
      void loadSuggestions({ silent: true });
    }, 450);
    return () => window.clearTimeout(t);
  }, [destQuery, step, destMode, loadSuggestions]);

  async function useGps() {
    setErr(null);
    if (!navigator.geolocation) {
      setErr("Tarayıcı konum özelliğini desteklemiyor.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickup({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setBusy(false);
      },
      () => {
        setErr("Konum izni verilemedi. Haritaya dokunarak veya işaretçiyi sürükleyerek seçebilirsiniz.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12_000 }
    );
  }

  async function pickSuggestion(placeId: string) {
    setErr(null);
    setBusy(true);
    try {
      const res = await api<{ lat: number; lng: number }>("/places/resolve", {
        method: "POST",
        json: { placeId },
      });
      setDestination({ lat: res.lat, lng: res.lng });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Adres konumu alınamadı");
    } finally {
      setBusy(false);
    }
  }

  const fetchOperators = useCallback(async () => {
    if (!pickup || !destination) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await api<{
        operators: {
          operatorProfileId: string;
          businessName: string;
          vehicleInfo: string;
          serviceCenterLat: number;
          serviceCenterLng: number;
          distanceToPickupKm: number;
          previewTotal: string;
          baseFee: string;
          perKmFee: string;
          jobDistanceKm: number;
          rating: number | null;
          ratingCount: number;
        }[];
      }>("/operators/search", {
        method: "POST",
        json: { cityCode, pickup, destination, sort },
      });
      setOperators(res.operators);
      if (res.operators.length === 0) {
        setErr("Bu bölgede şu an listelenecek çekici yok. Çekici tarafında profil ve hizmet alanını kontrol edin.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Arama başarısız");
    } finally {
      setBusy(false);
    }
  }, [pickup, destination, cityCode, sort]);

  useEffect(() => {
    if (step !== 4) return;
    void fetchOperators();
  }, [step, fetchOperators]);

  useEffect(() => {
    if (!pickup || !destination) {
      setRoutePreview(null);
      return;
    }
    let alive = true;
    setRoutePreviewLoading(true);
    api<{ points: LatLng[]; distanceKm: number; durationMinutes: number; source: string }>(
      `/directions?fromLat=${pickup.lat}&fromLng=${pickup.lng}&toLat=${destination.lat}&toLng=${destination.lng}`
    )
      .then((r) => {
        if (alive) setRoutePreview(r);
      })
      .catch(() => {
        if (alive) setRoutePreview(null);
      })
      .finally(() => {
        if (alive) setRoutePreviewLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [pickup, destination]);

  async function createJob(operatorProfileId: string) {
    setErr(null);
    if (!pickup || !destination) return;
    setBusy(true);
    try {
      const job = await api<{ id: string }>("/jobs", {
        method: "POST",
        json: { cityCode, operatorProfileId, pickup, destination },
      });
      navigate(`/customer/jobs/${job.id}`);
    } catch (e) {
      // CONFLICT_OPEN_JOB: aktif bir talep varken yeni talep → mevcut işe yönlendir
      if (e instanceof ApiError && e.code === "CONFLICT_OPEN_JOB") {
        const activeJob = allJobs.find((j) => ACTIVE_STATUSES.has(j.status));
        if (activeJob) {
          navigate(`/customer/jobs/${activeJob.id}`);
          return;
        }
      }
      setErr(e instanceof Error ? e.message : "Talep oluşturulamadı");
    } finally {
      setBusy(false);
    }
  }

  function goNext() {
    setErr(null);
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!pickup) {
        setErr("Lütfen çekim noktasını haritada seçin veya “Konumumu kullan” deyin.");
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!destination) {
        setErr("Varış noktasını haritadan seçin veya adres aramasından bir sonuç seçin.");
        return;
      }
      setStep(4);
      return;
    }
  }

  function goBack() {
    setErr(null);
    if (step <= 1) return;
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));
  }

  function applyManualDest() {
    const lat = Number(destLat.replace(",", "."));
    const lng = Number(destLng.replace(",", "."));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setErr("Enlem ve boylam sayı olmalıdır (ör. 41.02 ve 28.97).");
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setErr("Koordinat aralığı geçersiz.");
      return;
    }
    setErr(null);
    setDestination({ lat, lng });
  }

  return (
    <div>
      <ActiveJobBanner jobs={allJobs} />
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "1.35rem", letterSpacing: "-0.02em" }}>Yeni talep</h2>
        <p className="muted" style={{ margin: 0 }}>
          Birkaç adımda çekim ve varışı belirleyin; ardından uygun çekicileri görün.
        </p>
      </div>

      <nav className="stepper" aria-label="Adımlar">
        {STEPS.map((s) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div
              key={s.id}
              className={`stepper-item ${active ? "stepper-item--active" : ""} ${done ? "stepper-item--done" : ""}`}
            >
              <div className="stepper-dot" aria-hidden>
                {done ? "✓" : s.id}
              </div>
              {s.label}
            </div>
          );
        })}
      </nav>

      {step === 1 && (
        <div className="card">
          <h3>Hangi ildesiniz?</h3>
          <p className="muted">Liste ve fiyat önizlemesi bu bölgeye göre ayarlanır.</p>
          <div className="field">
            <label htmlFor="province">İl seçin</label>
            <select id="province" value={cityCode} onChange={(e) => setCityCode(e.target.value)}>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            Seçilen: <strong>{provinceName || "…"}</strong>
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h3>Aracınız nerede?</h3>
          <p className="muted">Haritaya dokunun veya mavi işaretçiyi sürükleyin. İsterseniz tek dokunuşla GPS kullanın.</p>
          <div className="row" style={{ marginBottom: 12 }}>
            <button type="button" className="btn btn-primary" onClick={useGps} disabled={busy}>
              Konumumu kullan
            </button>
          </div>
          <MapPicker
            center={mapCenter}
            value={pickup}
            onChange={setPickup}
            helperText="İpucu: yakınlaştırıp doğru yolu seçmek daha isabetli fiyat verir."
          />
          {pickup ? (
            <div className="row" style={{ marginTop: 10, justifyContent: "space-between", alignItems: "center" }}>
              <p className="muted" style={{ margin: 0 }}>
                Seçilen çekim: <strong>{pickup.lat.toFixed(6)}</strong>, <strong>{pickup.lng.toFixed(6)}</strong>
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPickup({ lat: pickup.lng, lng: pickup.lat })}
                title="Enlem/boylam ters geldiyse düzeltir"
              >
                Enlem/Boylam değiştir
              </button>
            </div>
          ) : null}
          {pickup ? (
            <p className="success-banner" style={{ marginTop: 14 }}>
              Çekim kaydedildi. İsterseniz işaretçiyi sürükleyerek ince ayar yapabilirsiniz.
            </p>
          ) : null}
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h3>Nereye gidilecek?</h3>
          <p className="muted">En kolayı: haritada varışı işaretlemek. Alternatif: adres yazıp listeden seçmek.</p>

          <div className="segmented" role="tablist" aria-label="Varış seçim yöntemi">
            <button type="button" aria-pressed={destMode === "map"} onClick={() => { setDestMode("map"); setErr(null); }}>
              Haritada seç
            </button>
            <button
              type="button"
              aria-pressed={destMode === "search"}
              onClick={() => {
                setDestMode("search");
                setErr(null);
              }}
            >
              Adres ara
            </button>
          </div>

          {destMode === "map" ? (
            <>
              <MapPicker
                center={pickup ?? mapCenter}
                value={destination}
                onChange={setDestination}
                helperText="Varış noktasına dokunun veya işaretçiyi sürükleyin. Harita, çekim noktasına odaklanmıştır."
              />
              {destination ? (
                <div className="row" style={{ marginTop: 10, justifyContent: "space-between", alignItems: "center" }}>
                  <p className="muted" style={{ margin: 0 }}>
                    Seçilen varış: <strong>{destination.lat.toFixed(6)}</strong>, <strong>{destination.lng.toFixed(6)}</strong>
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setDestination({ lat: destination.lng, lng: destination.lat })}
                    title="Enlem/boylam ters geldiyse düzeltir"
                  >
                    Enlem/Boylam değiştir
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="field">
                <label htmlFor="destq">Adres veya yer adı (en az 3 harf)</label>
                <input
                  id="destq"
                  type="text"
                  value={destQuery}
                  onChange={(e) => setDestQuery(e.target.value)}
                  placeholder="Örn. Kadıköy otogar"
                  autoComplete="off"
                />
              </div>
              {suggestLoading ? <p className="muted">Aranıyor…</p> : null}
              {suggestions.length > 0 ? (
                <ul className="suggestion-list" aria-label="Önerilen yerler">
                  {suggestions.map((s) => (
                    <li key={s.placeId}>
                      <button type="button" className="suggestion-item" onClick={() => pickSuggestion(s.placeId)}>
                        {s.description}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : destQuery.trim().length >= 3 && !suggestLoading ? (
                <p className="muted">Sonuç yok. Haritadan seçmeyi deneyin veya Google Places API anahtarını sunucuya ekleyin.</p>
              ) : null}
              {destination ? (
                <div className="row" style={{ marginTop: 10, justifyContent: "space-between", alignItems: "center" }}>
                  <p className="muted" style={{ margin: 0 }}>
                    Seçilen varış: <strong>{destination.lat.toFixed(6)}</strong>, <strong>{destination.lng.toFixed(6)}</strong>
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setDestination({ lat: destination.lng, lng: destination.lat })}
                    title="Enlem/boylam ters geldiyse düzeltir"
                  >
                    Enlem/Boylam değiştir
                  </button>
                </div>
              ) : null}
            </>
          )}

          {destination && pickup ? (
            <>
              <p className="success-banner" style={{ marginTop: 14 }}>
                Varış hazır. {routePreviewLoading ? "Rota hesaplanıyor…" : "Sonraki adımda tahmini ücretleri göreceksiniz."}
              </p>
              <RoutePreviewMap
                pickup={pickup}
                destination={destination}
                route={routePreview}
              />
            </>
          ) : destination ? (
            <p className="success-banner" style={{ marginTop: 14 }}>
              Varış hazır. Sonraki adımda tahmini ücretleri göreceksiniz.
            </p>
          ) : null}

          <details className="past-jobs" style={{ marginTop: 16 }}>
            <summary>Gelişmiş: koordinat gir</summary>
            <p className="muted" style={{ marginTop: 8 }}>
              Enlem ve boylamı biliyorsanız buraya yazabilirsiniz (ondalık ayırıcı olarak nokta kullanın).
            </p>
            <div className="row" style={{ marginTop: 8 }}>
              <input type="text" value={destLat} onChange={(e) => setDestLat(e.target.value)} placeholder="Enlem" aria-label="Enlem" />
              <input type="text" value={destLng} onChange={(e) => setDestLng(e.target.value)} placeholder="Boylam" aria-label="Boylam" />
              <button type="button" className="btn btn-secondary" onClick={applyManualDest}>
                Uygula
              </button>
            </div>
          </details>
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <h3>Uygun çekiciler</h3>
          <p className="muted">Tutarlar tahminidir; rota ve trafik değişince fark olabilir.</p>
          {routePreview ? (
            <p className="muted" style={{ marginBottom: 14 }}>
              Rota mesafesi: <strong style={{ color: "var(--text)" }}>{routePreview.distanceKm} km</strong>
              {" — "}tahmini süre: <strong style={{ color: "var(--text)" }}>~{routePreview.durationMinutes} dk</strong>
            </p>
          ) : null}
          <div className="row" style={{ marginBottom: 14, alignItems: "center" }}>
            <span className="muted" style={{ fontWeight: 600, marginRight: 4 }}>
              Sırala:
            </span>
            <div className="sort-pills" role="group" aria-label="Sıralama">
              <button
                type="button"
                className={`btn ${sort === "price" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSort("price")}
              >
                En uygun fiyat
              </button>
              <button
                type="button"
                className={`btn ${sort === "distance" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSort("distance")}
              >
                En yakın
              </button>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => void fetchOperators()} disabled={busy}>
              Yenile
            </button>
          </div>
          {operators.map((o) => {
            const expanded = expandedOperatorId === o.operatorProfileId;
            return (
              <div key={o.operatorProfileId} className="operator-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <strong>{o.businessName}</strong>
                      {o.rating !== null ? (
                        <span
                          title={`${o.ratingCount} değerlendirme`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: "0.8rem",
                            padding: "2px 6px",
                            background: "#fffbeb",
                            border: "1px solid #fde68a",
                            borderRadius: 6,
                            color: "#92400e",
                          }}
                        >
                          <span style={{ color: "#f59e0b" }}>★</span>
                          <strong>{o.rating.toFixed(1)}</strong>
                          <span className="muted" style={{ fontSize: "0.72rem" }}>({o.ratingCount})</span>
                        </span>
                      ) : (
                        <span className="muted" style={{ fontSize: "0.75rem" }}>Henüz puan yok</span>
                      )}
                    </div>
                    <div className="muted">{o.vehicleInfo}</div>
                    <div className="muted" style={{ marginTop: 2 }}>
                      Tahmini:{" "}
                      <strong style={{ color: "var(--text)" }}>{o.previewTotal} ₺</strong>
                    </div>
                    <div className="muted" style={{ fontSize: "0.78rem", marginTop: 2 }}>
                      {o.baseFee} ₺ taban + {o.jobDistanceKm.toFixed(1)} km × {o.perKmFee} ₺/km
                      {" · "}hizmet merkezine ~{o.distanceToPickupKm.toFixed(1)} km
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn ${expanded ? "btn-secondary" : "btn-ghost"}`}
                    style={{ flexShrink: 0, marginLeft: 12 }}
                    onClick={() => setExpandedOperatorId(expanded ? null : o.operatorProfileId)}
                  >
                    {expanded ? "Kapat" : "Rotayı gör"}
                  </button>
                </div>

                {expanded && pickup && destination ? (
                  <OperatorPreviewMap
                    operatorCenter={{ lat: o.serviceCenterLat, lng: o.serviceCenterLng }}
                    pickup={pickup}
                    destination={destination}
                    jobDistanceKm={o.jobDistanceKm}
                    distanceToPickupKm={o.distanceToPickupKm}
                    previewTotal={o.previewTotal}
                    onConfirm={() => createJob(o.operatorProfileId)}
                    busy={busy}
                  />
                ) : null}

                {!expanded ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: 10 }}
                    onClick={() => createJob(o.operatorProfileId)}
                    disabled={busy}
                  >
                    Bu çekiciyi seç
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {err ? (
        <div className="error" role="alert" style={{ marginBottom: 12 }}>
          {err}
        </div>
      ) : null}

      <div className="step-actions">
        <button type="button" className="btn btn-ghost" onClick={goBack} disabled={step === 1 || busy}>
          Geri
        </button>
        {step < 4 ? (
          <button type="button" className="btn btn-primary" onClick={goNext} disabled={busy}>
            Devam
          </button>
        ) : (
          <span className="muted" style={{ fontSize: 0.9 }}>
            Çekici seçerek talep oluşturun
          </span>
        )}
      </div>

      <JobsList jobs={allJobs} />
    </div>
  );
}

function ActiveJobBanner({ jobs }: { jobs: JobSummary[] }) {
  const active = jobs.filter((j) => ACTIVE_STATUSES.has(j.status));
  if (!active.length) return null;

  const j = active[0];
  const badge = statusBadge(j.status);

  return (
    <div style={{
      background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
      borderRadius: 14, padding: "16px 20px", marginBottom: 20,
      display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
      boxShadow: "0 4px 14px rgba(37,99,235,.35)",
    }}>
      <div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>
          Aktif talep mevcut
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", padding: "3px 10px", borderRadius: 20,
            background: badge.bg, color: badge.color, fontSize: "0.78rem", fontWeight: 700
          }}>
            {badge.label}
          </span>
          <span style={{ color: "rgba(255,255,255,.8)", fontSize: "0.85rem" }}>
            {j.operator?.businessName} · {j.priceSnapshot} ₺
          </span>
        </div>
      </div>
      <Link
        to={`/customer/jobs/${j.id}`}
        style={{
          background: "#fff", color: "#1e40af", borderRadius: 10,
          padding: "10px 20px", fontWeight: 700, fontSize: "0.9rem",
          textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap",
        }}
      >
        Durumu gör →
      </Link>
    </div>
  );
}

function JobCard({ j }: { j: JobSummary }) {
  const badge = statusBadge(j.status);
  const isActive = ACTIVE_STATUSES.has(j.status);
  return (
    <Link
      to={`/customer/jobs/${j.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div style={{
        border: `1px solid ${isActive ? "#bfdbfe" : "var(--border)"}`,
        borderLeft: isActive ? "4px solid #2563eb" : "1px solid var(--border)",
        borderRadius: 12, padding: "12px 14px", marginBottom: 8,
        background: isActive ? "#f8faff" : "#fafafa",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
        transition: "box-shadow .15s",
      }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 10px rgba(37,99,235,.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 2 }}>
            {j.operator?.businessName ?? "—"}
          </div>
          <div className="muted" style={{ fontSize: "0.78rem" }}>
            {new Date(j.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
            {" · "}{j.distanceKm?.toFixed(1)} km{" · "}{j.priceSnapshot} ₺
          </div>
        </div>
        <span style={{
          display: "inline-flex", padding: "3px 10px", borderRadius: 20,
          background: badge.bg, color: badge.color, fontSize: "0.75rem", fontWeight: 700, flexShrink: 0
        }}>
          {badge.label}
        </span>
      </div>
    </Link>
  );
}

function JobsList({ jobs }: { jobs: JobSummary[] }) {
  if (!jobs.length) return null;

  const active = jobs.filter((j) => ACTIVE_STATUSES.has(j.status));
  const past = jobs.filter((j) => !ACTIVE_STATUSES.has(j.status));

  return (
    <div style={{ marginTop: 8 }}>
      {active.length > 0 ? (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontWeight: 700, margin: "0 0 8px", fontSize: "0.9rem" }}>
            Aktif talepler ({active.length})
          </p>
          {active.map((j) => <JobCard key={j.id} j={j} />)}
        </div>
      ) : null}

      {past.length > 0 ? (
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", color: "var(--muted)", marginBottom: 6, userSelect: "none" }}>
            Geçmiş talepler ({past.length})
          </summary>
          <div style={{ marginTop: 8 }}>
            {past.map((j) => <JobCard key={j.id} j={j} />)}
          </div>
        </details>
      ) : null}
    </div>
  );
}
