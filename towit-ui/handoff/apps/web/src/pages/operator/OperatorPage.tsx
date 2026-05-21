// ─── apps/web/src/pages/operator/OperatorPage.tsx ────────────────────────────
// Complete rewrite of the profile section.
// Merges with your existing job list / tabs — only the profile form changed.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type VehicleType = "platform" | "vinclu" | "kanca" | "motorsiklet" | "agir";

interface ProfileForm {
  businessName:  string;
  serviceRadius: number | "";
  baseFee:       number | "";
  perKmFee:      number | "";
  phone:         string;
  vehicleType:   VehicleType;
  vehicleModel:  string;
  vehicleYear:   string;   // stored as string, parsed on save
  vehiclePlate:  string;
  capacityNote:  string;
}

const VEHICLE_TYPE_OPTIONS: { value: VehicleType; label: string; icon: string }[] = [
  { value: "platform",    label: "Düz Platform",        icon: "🚛" },
  { value: "vinclu",      label: "Vinçli / Hooklift",   icon: "🏗️" },
  { value: "kanca",       label: "Kanca Çekici",        icon: "🪝" },
  { value: "motorsiklet", label: "Motosiklet Çekicisi", icon: "🏍️" },
  { value: "agir",        label: "Ağır Vasıta",         icon: "🚚" },
];

const CAPACITY_MAX = 200;

// ── OperatorProfileForm component ─────────────────────────────────────────────

interface OperatorProfileFormProps {
  initial: Partial<ProfileForm>;
  onSave: (data: ProfileForm) => Promise<void>;
}

export function OperatorProfileForm({ initial, onSave }: OperatorProfileFormProps) {
  const [form, setForm] = useState<ProfileForm>({
    businessName:  initial.businessName  ?? "",
    serviceRadius: initial.serviceRadius ?? "",
    baseFee:       initial.baseFee       ?? "",
    perKmFee:      initial.perKmFee      ?? "",
    phone:         initial.phone         ?? "",
    vehicleType:   initial.vehicleType   ?? "platform",
    vehicleModel:  initial.vehicleModel  ?? "",
    vehicleYear:   initial.vehicleYear   !== undefined ? String(initial.vehicleYear) : "",
    vehiclePlate:  initial.vehiclePlate  ?? "",
    capacityNote:  initial.capacityNote  ?? "",
  });

  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setSuccess(false);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicleModel.trim()) {
      setError("Araç marka/model alanı zorunludur.");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız.");
    } finally {
      setSaving(false);
    }
  }

  const noteRemaining = CAPACITY_MAX - form.capacityNote.length;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── İşletme bilgileri ──────────────────────────── */}
      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>İşletme Bilgileri</h3>
        <div style={fieldGroupStyle}>
          <Field label="İşletme Adı *">
            <input
              className="input"
              value={form.businessName}
              onChange={e => set("businessName", e.target.value)}
              placeholder="Yıldız Çekici Hizmetleri"
              required
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Hizmet Yarıçapı (km) *">
              <input
                className="input"
                type="number"
                min={1}
                value={form.serviceRadius}
                onChange={e => set("serviceRadius", e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="25"
                required
              />
            </Field>
            <Field label="Taban Ücret (₺) *">
              <input
                className="input"
                type="number"
                min={0}
                value={form.baseFee}
                onChange={e => set("baseFee", e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="350"
                required
              />
            </Field>
            <Field label="Km Başı Ücret (₺) *">
              <input
                className="input"
                type="number"
                min={0}
                value={form.perKmFee}
                onChange={e => set("perKmFee", e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="18"
                required
              />
            </Field>
          </div>
        </div>
      </section>

      {/* ── Araç Bilgileri ─────────────────────────────── */}
      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Araç Bilgileri</h3>
        <div style={fieldGroupStyle}>

          {/* Araç Tipi */}
          <Field label="Araç Tipi *">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
              {VEHICLE_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("vehicleType", opt.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: "var(--r-md)",
                    border: `2px solid ${form.vehicleType === opt.value ? "var(--primary)" : "var(--border-strong)"}`,
                    background: form.vehicleType === opt.value ? "var(--primary-soft)" : "var(--surface-2)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text)",
                    transition: "border-color 150ms, background 150ms",
                  }}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Marka & Model */}
          <Field label="Marka & Model *">
            <input
              className="input"
              value={form.vehicleModel}
              onChange={e => set("vehicleModel", e.target.value)}
              placeholder="Ford Transit 350"
              required
            />
          </Field>

          {/* Yıl + Plaka */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Üretim Yılı">
              <input
                className="input"
                type="number"
                min={1990}
                max={2030}
                value={form.vehicleYear}
                onChange={e => set("vehicleYear", e.target.value)}
                placeholder="2022"
              />
            </Field>
            <Field label="Plaka">
              <input
                className="input"
                value={form.vehiclePlate}
                onChange={e => set("vehiclePlate", e.target.value.toUpperCase())}
                placeholder="34 ABC 123"
                maxLength={15}
              />
            </Field>
          </div>

          {/* Kapasite Notu */}
          <Field label={`Kapasite Notu (${noteRemaining} karakter kaldı)`}>
            <textarea
              className="input"
              value={form.capacityNote}
              onChange={e => {
                if (e.target.value.length <= CAPACITY_MAX) set("capacityNote", e.target.value);
              }}
              placeholder="2.5 tona kadar, sedan / SUV / hafif ticari araçlar"
              rows={3}
              style={{ height: "auto", padding: "12px 14px", resize: "vertical" }}
            />
          </Field>
        </div>
      </section>

      {/* ── İletişim ───────────────────────────────────── */}
      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>İletişim</h3>
        <div style={fieldGroupStyle}>
          <Field
            label="Telefon"
            hint="Müşteriler iş kabulünden sonra görebilir"
          >
            <input
              className="input"
              type="tel"
              value={form.phone}
              onChange={e => set("phone", e.target.value)}
              placeholder="0532 123 45 67"
              maxLength={20}
            />
          </Field>
        </div>
      </section>

      {/* ── Feedback ──────────────────────────────────── */}
      {error && (
        <div style={{ borderLeft: "3px solid var(--danger)", background: "var(--danger-soft)", padding: "10px 14px", borderRadius: "var(--r-sm)", color: "var(--danger)", fontSize: "0.875rem" }}>
          ⚠ {error}
        </div>
      )}
      {success && (
        <div style={{ borderLeft: "3px solid var(--success)", background: "var(--success-soft)", padding: "10px 14px", borderRadius: "var(--r-sm)", color: "var(--success)", fontSize: "0.875rem" }}>
          ✓ Profil kaydedildi.
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-square" disabled={saving}>
        {saving ? "Kaydediliyor…" : "Profili kaydet"}
      </button>
    </form>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-faint)" }}>
        {label}
      </label>
      {children}
      {hint && (
        <span style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>{hint}</span>
      )}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: "var(--r-lg)",
  padding: "var(--s-5)",
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "0.68rem",
  fontWeight: 900,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-faint)",
  margin: 0,
};

const fieldGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

// ── saveProfile — wire this to your API call ───────────────────────────────────
// Example:
//
//   async function saveProfile(form: ProfileForm) {
//     const res = await fetch("/api/operators/profile", {
//       method: "PUT",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       body: JSON.stringify({
//         ...form,
//         vehicleYear: form.vehicleYear !== "" ? Number(form.vehicleYear) : null,
//       }),
//     });
//     if (!res.ok) throw new Error(await res.text());
//   }
