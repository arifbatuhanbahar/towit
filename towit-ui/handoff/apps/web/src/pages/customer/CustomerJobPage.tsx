// ─── apps/web/src/pages/customer/CustomerJobPage.tsx ─────────────────────────
// CHANGED sections:
//   1. Job type extended with operator vehicle + customer vehicle fields
//   2. OperatorInfoCard — new section showing tow truck details + phone
//   3. CustomerVehicleSummary — compact customer vehicle info bar
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type JobStatus = "payment_pending" | "open" | "accepted" | "en_route" | "completed" | "rejected" | "cancelled";
type VehicleType = "platform" | "vinclu" | "kanca" | "motorsiklet" | "agir";
type BreakdownType = "lastik" | "motor" | "aku" | "yakıt" | "kaza" | "diger";

interface JobOperator {
  businessName: string;
  vehicleType:  VehicleType;
  vehicleModel: string;
  vehicleYear:  number | null;
  phone:        string | null;  // only present when status is accepted / en_route
}

// Extend your existing Job type with these fields:
interface Job {
  // … your existing fields …
  status: JobStatus;

  // ── NEW ──
  operator: JobOperator;
  customerVehicleBrand: string | null;
  customerVehicleModel: string | null;
  customerVehiclePlate: string | null;
  breakdownType:        BreakdownType;
  customerPhone:        string | null;
}

// ── Vehicle type icon map ──────────────────────────────────────────────────────

const VEHICLE_ICONS: Record<VehicleType, string> = {
  platform:    "🚛",
  vinclu:      "🏗️",
  kanca:       "🪝",
  motorsiklet: "🏍️",
  agir:        "🚚",
};

const BREAKDOWN_LABELS: Record<BreakdownType, string> = {
  lastik: "Patlak Lastik",
  motor:  "Motor Arızası",
  aku:    "Akü Bitti",
  yakıt:  "Yakıt Bitti",
  kaza:   "Kaza",
  diger:  "Diğer",
};

// ── OperatorInfoCard ───────────────────────────────────────────────────────────
// Drop this component into your job detail page, below the status hero card.

interface OperatorInfoCardProps {
  operator: JobOperator;
  status:   JobStatus;
}

export function OperatorInfoCard({ operator, status }: OperatorInfoCardProps) {
  const showPhone = (status === "accepted" || status === "en_route") && operator.phone;
  const isEnRoute = status === "en_route";

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={labelStyle}>Çekiciniz</span>
      </div>

      {/* Business name */}
      <div style={{ fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
        {operator.businessName}
      </div>

      {/* Vehicle line */}
      <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
        <span>{VEHICLE_ICONS[operator.vehicleType] ?? "🚛"}</span>
        <span>
          {operator.vehicleModel}
          {operator.vehicleYear ? ` · ${operator.vehicleYear}` : ""}
        </span>
      </div>

      {/* Phone — only when accepted / en_route */}
      {showPhone && (
        <a
          href={`tel:${operator.phone}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: "var(--r-md)",
            background: isEnRoute ? "var(--primary)" : "var(--surface-2)",
            color: isEnRoute ? "#000" : "var(--text)",
            fontWeight: 800,
            fontSize: "0.9375rem",
            textDecoration: "none",
            transition: "opacity 150ms",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
                  stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
          {operator.phone}
        </a>
      )}
    </div>
  );
}

// ── CustomerVehicleSummary ─────────────────────────────────────────────────────
// Compact bar showing the customer's own vehicle info.
// Place below OperatorInfoCard.

interface CustomerVehicleSummaryProps {
  brand:         string | null;
  model:         string | null;
  plate:         string | null;
  breakdownType: BreakdownType;
}

export function CustomerVehicleSummary({ brand, model, plate, breakdownType }: CustomerVehicleSummaryProps) {
  const vehicleLine = [brand, model].filter(Boolean).join(" ");
  const hasVehicle  = vehicleLine || plate;

  if (!hasVehicle && breakdownType === "diger") return null;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 4,
      padding: "12px 16px",
      background: "var(--surface)",
      borderRadius: "var(--r-md)",
    }}>
      {hasVehicle && (
        <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          <span style={labelStyle}>Araç</span>
          {" "}
          {[vehicleLine, plate].filter(Boolean).join(" · ")}
        </div>
      )}
      {breakdownType !== "diger" && (
        <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          <span style={labelStyle}>Arıza</span>
          {" "}
          {BREAKDOWN_LABELS[breakdownType]}
        </div>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: "var(--r-lg)",
  padding: "var(--s-5)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.64rem",
  fontWeight: 900,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-faint)",
};
