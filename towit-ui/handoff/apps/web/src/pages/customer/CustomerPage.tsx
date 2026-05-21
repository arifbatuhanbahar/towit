// ─── apps/web/src/pages/customer/CustomerPage.tsx ────────────────────────────
// CHANGED sections:
//   1. VehicleStep (new Step 2)
//   2. OperatorCard (Step 5 — enriched)
//   3. STEPS array updated to 5 steps
//   4. createJob payload extended
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type BreakdownType = "lastik" | "motor" | "aku" | "yakıt" | "kaza" | "diger";
type VehicleType   = "platform" | "vinclu" | "kanca" | "motorsiklet" | "agir";

interface VehicleInfo {
  breakdownType:        BreakdownType | null;
  customerVehicleBrand: string;
  customerVehicleModel: string;
  customerVehiclePlate: string;
  customerPhone:        string;
}

interface OperatorResult {
  id:                 string;
  businessName:       string;
  rating:             number;
  ratingCount:        number;
  vehicleType:        VehicleType;
  vehicleModel:       string;
  vehicleYear:        number | null;
  capacityNote:       string | null;
  baseFee:            number;
  perKmFee:           number;
  previewTotal:       number;
  distanceToPickupKm: number;
}

// ── STEPS ─────────────────────────────────────────────────────────────────────
// Replace your existing STEPS / STEP_TITLES with this 5-step array.

export const STEPS = [
  { id: 1, label: "Bölge"     },
  { id: 2, label: "Araç"      },  // ← NEW
  { id: 3, label: "Çekim"     },
  { id: 4, label: "Varış"     },
  { id: 5, label: "Çekiciler" },
] as const;

// ── VehicleStep — new Step 2 ───────────────────────────────────────────────────

const BREAKDOWN_OPTIONS: { value: BreakdownType; icon: string; label: string }[] = [
  { value: "motor",   icon: "🔧", label: "Motor Arızası"  },
  { value: "aku",     icon: "🔋", label: "Akü Bitti"      },
  { value: "yakıt",   icon: "⛽", label: "Yakıt Bitti"    },
  { value: "kaza",    icon: "💥", label: "Kaza"           },
  { value: "lastik",  icon: "🔩", label: "Patlak Lastik"  },
  { value: "diger",   icon: "❓", label: "Diğer"          },
];

interface VehicleStepProps {
  value:    VehicleInfo;
  onChange: (v: VehicleInfo) => void;
  onNext:   () => void;
  onSkip:   () => void;
}

export function VehicleStep({ value, onChange, onNext, onSkip }: VehicleStepProps) {
  function set<K extends keyof VehicleInfo>(key: K, val: VehicleInfo[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Arıza türü */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={fieldLabelStyle}>Arıza Türü <span style={{ color: "var(--text-faint)" }}>(opsiyonel)</span></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {BREAKDOWN_OPTIONS.map(opt => {
            const selected = value.breakdownType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("breakdownType", selected ? null : opt.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: "var(--r-md)",
                  border: `2px solid ${selected ? "var(--primary)" : "var(--border-strong)"}`,
                  background: selected ? "var(--primary-soft)" : "var(--surface-2)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "var(--text)",
                  textAlign: "left",
                  transition: "border-color 150ms, background 150ms",
                }}
              >
                <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Araç bilgisi */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={fieldWrapStyle}>
            <label style={fieldLabelStyle}>Araç Markası</label>
            <input
              className="input"
              value={value.customerVehicleBrand}
              onChange={e => set("customerVehicleBrand", e.target.value)}
              placeholder="Toyota, Ford, BMW…"
            />
          </div>
          <div style={fieldWrapStyle}>
            <label style={fieldLabelStyle}>Araç Modeli</label>
            <input
              className="input"
              value={value.customerVehicleModel}
              onChange={e => set("customerVehicleModel", e.target.value)}
              placeholder="Corolla, Focus, 3 Serisi…"
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={fieldWrapStyle}>
            <label style={fieldLabelStyle}>Plaka</label>
            <input
              className="input"
              value={value.customerVehiclePlate}
              onChange={e => set("customerVehiclePlate", e.target.value.toUpperCase())}
              placeholder="34 XY 001"
              maxLength={15}
            />
          </div>
          <div style={fieldWrapStyle}>
            <label style={fieldLabelStyle}>Telefon</label>
            <input
              className="input"
              type="tel"
              value={value.customerPhone}
              onChange={e => set("customerPhone", e.target.value)}
              placeholder="0532 123 45 67"
              maxLength={20}
            />
            <span style={{ fontSize: "0.72rem", color: "var(--text-faint)", marginTop: 4 }}>
              Çekici kabul edince paylaşılır
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          className="btn btn-primary btn-square"
          style={{ flex: 1 }}
          onClick={onNext}
        >
          Devam et
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-square"
          style={{ width: "auto", minWidth: 80, flex: "0 0 auto" }}
          onClick={onSkip}
        >
          Atla
        </button>
      </div>
    </div>
  );
}

// ── OperatorCard — enriched Step 5 card ───────────────────────────────────────

const VEHICLE_ICONS: Record<VehicleType, string> = {
  platform:    "🚛",
  vinclu:      "🏗️",
  kanca:       "🪝",
  motorsiklet: "🏍️",
  agir:        "🚚",
};

interface OperatorCardProps {
  op:              OperatorResult;
  jobDistanceKm:   number;
  onSelect:        (id: string) => void;
  onShowRoute:     (id: string) => void;
}

export function OperatorCard({ op, jobDistanceKm, onSelect, onShowRoute }: OperatorCardProps) {
  return (
    <div style={cardStyle}>
      {/* Row 1 — name + rating */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.01em" }}>
          {op.businessName}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--primary)", fontWeight: 800, fontSize: "0.875rem", flexShrink: 0 }}>
          ★ {op.rating.toFixed(1)}
          <span style={{ color: "var(--text-faint)", fontWeight: 600, fontSize: "0.775rem" }}>
            ({op.ratingCount})
          </span>
        </span>
      </div>

      {/* Row 2 — vehicle */}
      <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
        <span>{VEHICLE_ICONS[op.vehicleType] ?? "🚛"}</span>
        <span>
          {op.vehicleModel}
          {op.vehicleYear ? ` · ${op.vehicleYear}` : ""}
        </span>
      </div>

      {/* Row 3 — capacity note pill */}
      {op.capacityNote && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "var(--surface-2)", borderRadius: "var(--r-pill)",
          padding: "4px 10px", fontSize: "0.775rem", color: "var(--text-muted)",
          alignSelf: "flex-start",
        }}>
          <span style={{ color: "var(--success)" }}>✓</span>
          {op.capacityNote.length > 45 ? op.capacityNote.slice(0, 45) + "…" : op.capacityNote}
        </div>
      )}

      {/* Row 4 — price */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <span style={{ fontSize: "1.625rem", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          ~{op.previewTotal.toLocaleString("tr-TR")} ₺
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", textAlign: "right", lineHeight: 1.4 }}>
          {op.baseFee.toLocaleString("tr-TR")} ₺ taban<br />
          {jobDistanceKm.toFixed(1)} km × {op.perKmFee} ₺
        </span>
      </div>

      {/* Row 5 — distance + route link */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-faint)" }}>
          Merkeze ~{op.distanceToPickupKm.toFixed(1)} km
        </span>
        <button
          type="button"
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, padding: 0 }}
          onClick={() => onShowRoute(op.id)}
        >
          Rotayı gör →
        </button>
      </div>

      {/* CTA */}
      <button
        type="button"
        className="btn btn-primary btn-square"
        onClick={() => onSelect(op.id)}
      >
        Bu çekiciyi seç →
      </button>
    </div>
  );
}

// ── createJob payload helper ───────────────────────────────────────────────────
// Call this when the user selects an operator in Step 5.

interface CreateJobPayload {
  regionId:             string;
  operatorId:           string;
  pickupLat:            number;
  pickupLng:            number;
  destLat:              number;
  destLng:              number;
  customerVehicleBrand: string | undefined;
  customerVehicleModel: string | undefined;
  customerVehiclePlate: string | undefined;
  breakdownType:        BreakdownType;
  customerPhone:        string | undefined;
}

export function buildCreateJobPayload(
  base: Pick<CreateJobPayload, "regionId" | "operatorId" | "pickupLat" | "pickupLng" | "destLat" | "destLng">,
  vehicle: VehicleInfo
): CreateJobPayload {
  return {
    ...base,
    customerVehicleBrand: vehicle.customerVehicleBrand || undefined,
    customerVehicleModel: vehicle.customerVehicleModel || undefined,
    customerVehiclePlate: vehicle.customerVehiclePlate || undefined,
    breakdownType:        vehicle.breakdownType ?? "diger",
    customerPhone:        vehicle.customerPhone || undefined,
  };
}

// ── Initial VehicleInfo state ──────────────────────────────────────────────────

export const INITIAL_VEHICLE_INFO: VehicleInfo = {
  breakdownType:        null,
  customerVehicleBrand: "",
  customerVehicleModel: "",
  customerVehiclePlate: "",
  customerPhone:        "",
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: "var(--r-lg)",
  padding: "var(--s-5)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--s-3)",
};

const fieldWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: "0.68rem",
  fontWeight: 800,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "var(--text-faint)",
};
