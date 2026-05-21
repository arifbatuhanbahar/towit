// ─── apps/web/src/pages/operator/OperatorJobPage.tsx ─────────────────────────
// CHANGED sections:
//   1. Job type extended with customer vehicle fields
//   2. CustomerVehicleCard — breakdown badge + vehicle info + phone
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type JobStatus    = "payment_pending" | "open" | "accepted" | "en_route" | "completed" | "rejected" | "cancelled";
type BreakdownType = "lastik" | "motor" | "aku" | "yakıt" | "kaza" | "diger";

// Extend your existing Job type with these fields:
interface Job {
  // … your existing fields …
  status: JobStatus;

  // ── NEW ──
  customerVehicleBrand: string | null;
  customerVehicleModel: string | null;
  customerVehiclePlate: string | null;
  breakdownType:        BreakdownType;
  customerPhone:        string | null; // only present when status = accepted | en_route
}

// ── Breakdown badge config ─────────────────────────────────────────────────────

const BREAKDOWN_CONFIG: Record<BreakdownType, { icon: string; label: string; bg: string; color: string }> = {
  lastik: { icon: "🔩", label: "Patlak Lastik", bg: "rgba(234,179,8,0.12)",   color: "#a16207"  },
  motor:  { icon: "🔧", label: "Motor Arızası", bg: "rgba(239,68,68,0.10)",   color: "#b91c1c"  },
  aku:    { icon: "🔋", label: "Akü Bitti",     bg: "rgba(168,85,247,0.10)",  color: "#7e22ce"  },
  yakıt:  { icon: "⛽", label: "Yakıt Bitti",   bg: "rgba(245,158,11,0.12)",  color: "#92400e"  },
  kaza:   { icon: "💥", label: "Kaza",          bg: "rgba(239,68,68,0.12)",   color: "#b91c1c"  },
  diger:  { icon: "❓", label: "Diğer",         bg: "var(--surface-3)",       color: "var(--text-muted)" },
};

// ── CustomerVehicleCard ───────────────────────────────────────────────────────
// Drop this component into your operator job detail page.
// Show prominently when status = "open" (operator deciding to accept).

interface CustomerVehicleCardProps {
  brand:         string | null;
  model:         string | null;
  plate:         string | null;
  breakdownType: BreakdownType;
  customerPhone: string | null;
  status:        JobStatus;
}

export function CustomerVehicleCard({
  brand,
  model,
  plate,
  breakdownType,
  customerPhone,
  status,
}: CustomerVehicleCardProps) {
  const cfg          = BREAKDOWN_CONFIG[breakdownType] ?? BREAKDOWN_CONFIG.diger;
  const vehicleLine  = [brand, model, plate ? `· ${plate}` : null].filter(Boolean).join(" ");
  const showPhone    = customerPhone && (status === "accepted" || status === "en_route");

  return (
    <div style={cardStyle}>
      {/* Section label */}
      <div style={sectionLabelStyle}>Müşteri Araç Bilgileri</div>

      {/* Breakdown badge — large, coloured */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: "var(--r-md)",
        background: cfg.bg,
        color: cfg.color,
        fontWeight: 800,
        fontSize: "1rem",
        alignSelf: "flex-start",
      }}>
        <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{cfg.icon}</span>
        {cfg.label}
      </div>

      {/* Vehicle info line */}
      <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
        {vehicleLine || "—"}
      </div>

      {/* Customer phone — only when accepted / en_route */}
      {showPhone && (
        <a
          href={`tel:${customerPhone}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: "var(--r-md)",
            background: status === "en_route" ? "var(--primary)" : "var(--surface-2)",
            color: status === "en_route" ? "#000" : "var(--text)",
            fontWeight: 800,
            fontSize: "0.9375rem",
            textDecoration: "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
                  stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
          Müşteri: {customerPhone}
        </a>
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

const sectionLabelStyle: React.CSSProperties = {
  fontSize: "0.64rem",
  fontWeight: 900,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-faint)",
};
