// shared.jsx — Towit shared atoms: Icons, AppHeader, StatusBadge, MapMock, etc.

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Icon set (single-stroke, currentColor)
// ─────────────────────────────────────────────────────────────
const Icon = {
  Tow: ({ size = 24 }) => (
    // Simple tow truck silhouette
    <svg width={size} height={size} viewBox="0 0 32 24" fill="none">
      <path d="M1 18h2m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m0 0h10m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m0 0h3"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M1 18V8a2 2 0 0 1 2-2h11v12M14 9h6l4 5v4M24 14h-4"
            stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M14 6l8-3 4 6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  ),
  Eye: ({ size = 20, off = false }) => off ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.7A10 10 0 0 1 12 5c5 0 9 4 10 7-.5 1.4-1.6 3-3.1 4.4M6.2 7.6C3.7 9.4 2.3 11.5 2 12c1 3 5 7 10 7 1.6 0 3.1-.4 4.4-1.1"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  Arrow: ({ size = 18, dir = 'right' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{transform: dir === 'left' ? 'rotate(180deg)' : null}}>
      <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Chevron: ({ size = 16, dir = 'down' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{transform: dir === 'up' ? 'rotate(180deg)' : dir === 'right' ? 'rotate(-90deg)' : null}}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Pin: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  Crosshair: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  Search: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Check: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  X: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Star: ({ size = 28, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"
            stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  Refresh: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Warn: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4l10 17H2L12 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M12 10v5M12 18v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Plus: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Phone: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
            stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  Headset: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v4H5a1 1 0 0 1-1-1v-3zM20 15h-3v4h2a1 1 0 0 0 1-1v-3z"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Shield: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"
            stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Car: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 16H3.5a.5.5 0 0 1-.5-.5V11a1 1 0 0 1 1-1h1l2-4h9l2 4h1a1 1 0 0 1 1 1v4.5a.5.5 0 0 1-.5.5H19"
            stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx="7.5" cy="16.5" r="1.5" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="16.5" cy="16.5" r="1.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M7 10h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// Vehicle type icons (operator's tow truck)
// ─────────────────────────────────────────────────────────────
const VehicleIcon = {
  platform: ({ size = 16 }) => (
    // Flatbed
    <svg width={size} height={size} viewBox="0 0 28 18" fill="none">
      <path d="M2 12V6a1 1 0 0 1 1-1h8v7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M11 8h6l4 3v1M21 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M2 12h23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.5" fill="var(--bg)"/>
      <circle cx="19" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.5" fill="var(--bg)"/>
      <path d="M11 5l-3-3M11 5l-3 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  vinclu: ({ size = 16 }) => (
    // Hooklift / crane truck
    <svg width={size} height={size} viewBox="0 0 28 18" fill="none">
      <path d="M2 12V7a1 1 0 0 1 1-1h6v6M9 9h7l4 3M20 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M2 12h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.5" fill="var(--bg)"/>
      <circle cx="18" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.5" fill="var(--bg)"/>
      <path d="M9 6l4-4M13 2l3 3M9 6h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  kanca: ({ size = 16 }) => (
    // Hook tow
    <svg width={size} height={size} viewBox="0 0 28 18" fill="none">
      <path d="M2 12V7a1 1 0 0 1 1-1h8v6M11 9h5l3 3M19 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M2 12h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.5" fill="var(--bg)"/>
      <circle cx="17" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.5" fill="var(--bg)"/>
      <path d="M22 12c1.5 0 2.5 1 2.5 2s-1 2-2.5 2-2.5-1-2.5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  motorsiklet: ({ size = 16 }) => (
    // Motorcycle hauler
    <svg width={size} height={size} viewBox="0 0 28 18" fill="none">
      <path d="M2 13V8a1 1 0 0 1 1-1h5v6M8 10h4l3 3M15 13h2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx="6" cy="15" r="1.7" stroke="currentColor" strokeWidth="1.5" fill="var(--bg)"/>
      <circle cx="14" cy="15" r="1.7" stroke="currentColor" strokeWidth="1.5" fill="var(--bg)"/>
      <circle cx="21" cy="13" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="25" cy="13" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M22 13l1-3 1 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ahtapot: ({ size = 16 }) => (
    // Ahtapot / octopus / multi-arm pickup tow (4 arms)
    <svg width={size} height={size} viewBox="0 0 28 18" fill="none">
      <rect x="2" y="6" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 9h6l4 3M21 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M2 13h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6" cy="14" r="1.6" stroke="currentColor" strokeWidth="1.4" fill="var(--bg)"/>
      <circle cx="19" cy="14" r="1.6" stroke="currentColor" strokeWidth="1.4" fill="var(--bg)"/>
      {/* 4 grab arms */}
      <path d="M14 11l-2-3M16 11l0-4M18 11l2-4M20 12l3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// Breakdown type icons + labels
// ─────────────────────────────────────────────────────────────
const BreakdownIcon = {
  motor: ({ size = 18 }) => (
    // Gear / engine
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 8.5v-2M12 17.5v-2M8.5 12h-2M17.5 12h-2M9.5 9.5l-1.4-1.4M15.9 15.9l-1.4-1.4M9.5 14.5l-1.4 1.4M15.9 8.1l-1.4 1.4"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  aku: ({ size = 18 }) => (
    // Battery
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M19 11v3M8 5v2M14 5v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M7 12h2M8 11v2M13 12h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  yakıt: ({ size = 18 }) => (
    // Fuel pump
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 19V6a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v13" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M3 19h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M6 9h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M13 10l3 3v4a1.5 1.5 0 0 0 3 0V9l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  ),
  kaza: ({ size = 18 }) => (
    // Warning triangle
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l10 18H2L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor"/>
    </svg>
  ),
  lastik: ({ size = 18 }) => (
    // Tire
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  diger: ({ size = 18 }) => (
    // Question circle
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="0.9" fill="currentColor"/>
    </svg>
  ),
};

const BREAKDOWN_LABEL = {
  motor:  'Motor Arızası',
  aku:    'Akü Bitti',
  yakıt:  'Yakıt Bitti',
  kaza:   'Kaza',
  lastik: 'Patlak Lastik',
  diger:  'Diğer',
};

const VEHICLE_LABEL = {
  platform:    'Düz Platform',
  vinclu:      'Vinçli',
  kanca:       'Kanca',
  motorsiklet: 'Motosiklet',
  agir:        'Ağır Vasıta',
  ahtapot:     'Ahtapot',
};

// ─────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────
const STATUS_LABEL = {
  payment_pending: 'Ödeme bekleniyor',
  open:            'Açık',
  accepted:        'Kabul edildi',
  en_route:        'Yolda',
  completed:       'Tamamlandı',
  rejected:        'Reddedildi',
  cancelled:       'İptal edildi',
};

function StatusBadge({ status }) {
  return (
    <span className={`badge status-${status}`}>
      <span className="badge-dot"></span>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// App header (sticky, role-aware)
// ─────────────────────────────────────────────────────────────
function AppHeader({ role, email, onLogout }) {
  return (
    <header className="app-header">
      <div className="app-header__logo">
        Tow<em>it</em>
      </div>
      <div className="app-header__spacer" />
      {email && <span className="app-header__email">{email}</span>}
      {role && <span className="badge-role">{role === 'customer' ? 'Müşteri' : 'Çekici'}</span>}
      <button className="btn btn-ghost btn-sm btn-square"
              style={{width:'auto', minHeight:36, padding:'0 12px', fontSize:'0.8125rem'}}
              onClick={onLogout}>
        Çıkış
      </button>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline error banner
// ─────────────────────────────────────────────────────────────
function ErrorInline({ children, onClose }) {
  if (!children) return null;
  return (
    <div className="err-inline">
      <span style={{flexShrink: 0, marginTop: 1}}><Icon.Warn /></span>
      <span style={{flex: 1}}>{children}</span>
      {onClose && <button className="err-inline__close" onClick={onClose} aria-label="Kapat"><Icon.X size={14} /></button>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MapMock — stylized non-leaflet placeholder
// ─────────────────────────────────────────────────────────────
function MapMock({ height = 240, route = false, live = false, single = false, chip }) {
  const id = useMemo(() => 'm-' + Math.random().toString(36).slice(2,8), []);
  return (
    <div className="map" style={{ height }}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`${id}-grid`} width="44" height="44" patternUnits="userSpaceOnUse">
            <rect width="44" height="44" fill="#0d0d0d"/>
            <path d="M0 0H44M0 0V44" stroke="#181818" strokeWidth="0.8"/>
          </pattern>
        </defs>
        {/* base */}
        <rect width="400" height="300" fill={`url(#${id}-grid)`}/>
        {/* city blocks */}
        <rect x="20"  y="20"  width="70" height="50" rx="3" fill="#141414"/>
        <rect x="110" y="20"  width="50" height="40" rx="3" fill="#141414"/>
        <rect x="200" y="30"  width="80" height="45" rx="3" fill="#141414"/>
        <rect x="310" y="15"  width="75" height="55" rx="3" fill="#141414"/>
        <rect x="20"  y="110" width="55" height="60" rx="3" fill="#141414"/>
        <rect x="290" y="100" width="90" height="70" rx="3" fill="#141414"/>
        <rect x="50"  y="220" width="80" height="60" rx="3" fill="#141414"/>
        <rect x="200" y="200" width="70" height="80" rx="3" fill="#141414"/>
        {/* park — very dark green */}
        <rect x="160" y="100" width="100" height="70" rx="6" fill="#0c1a0c" opacity="0.9"/>
        {/* water strip */}
        <path d="M0 255 Q 100 240 200 260 T 400 250 L 400 300 L 0 300 Z" fill="#071420" opacity="0.95"/>
        {/* major roads */}
        <path d="M0 148 L 400 138" stroke="#1e1e1e" strokeWidth="16"/>
        <path d="M0 148 L 400 138" stroke="#252525" strokeWidth="10" strokeDasharray="28 10" opacity="0.5"/>
        <path d="M145 0 L 130 300" stroke="#1e1e1e" strokeWidth="14"/>
        <path d="M280 0 L 295 300" stroke="#1e1e1e" strokeWidth="12"/>
        <path d="M0 68 L 400 75"   stroke="#1a1a1a" strokeWidth="8"/>
        {/* road centre lines */}
        <path d="M145 0 L 130 300" stroke="#282828" strokeWidth="1.5" strokeDasharray="20 14" opacity="0.7"/>
        <path d="M0 148 L 400 138" stroke="#282828" strokeWidth="1.5" strokeDasharray="28 10" opacity="0.7"/>

        {route && (
          <>
            {/* amber route */}
            <path d="M70 240 Q 120 170 195 150 T 330 72"
                  stroke="#f59e0b" strokeWidth="5" fill="none"
                  strokeLinecap="round" strokeLinejoin="round"/>
            {/* soft glow under route */}
            <path d="M70 240 Q 120 170 195 150 T 330 72"
                  stroke="#f59e0b" strokeWidth="12" fill="none"
                  strokeLinecap="round" opacity="0.12"/>
            {/* traveled — grey dashed */}
            <path d="M70 240 Q 95 210 118 190"
                  stroke="#444" strokeWidth="4" fill="none"
                  strokeDasharray="5 7" strokeLinecap="round"/>
          </>
        )}

        {/* pickup pin */}
        {!single && (
          <g transform="translate(70, 240)">
            <circle r="16" fill="#111" stroke="#22c55e" strokeWidth="2.5"/>
            <circle r="6"  fill="#22c55e"/>
          </g>
        )}
        {/* destination pin */}
        {route && (
          <g transform="translate(330, 72)">
            <circle r="16" fill="#111" stroke="#ef4444" strokeWidth="2.5"/>
            <circle r="6"  fill="#ef4444"/>
          </g>
        )}
        {single && (
          <g transform="translate(200, 150)">
            <circle r="18" fill="#111" stroke="#f59e0b" strokeWidth="2.5"/>
            <circle r="7"  fill="#f59e0b"/>
            <circle r="22" fill="#f59e0b" fillOpacity="0.10"/>
          </g>
        )}
        {/* live operator beacon */}
        {live && (
          <g transform="translate(178, 168)">
            <circle r="28" fill="#f59e0b" fillOpacity="0.07">
              <animate attributeName="r" values="18;30;18" dur="1.8s" repeatCount="indefinite"/>
              <animate attributeName="fill-opacity" values="0.12;0;0.12" dur="1.8s" repeatCount="indefinite"/>
            </circle>
            <circle r="11" fill="#111" stroke="#f59e0b" strokeWidth="2.5"/>
            <circle r="5"  fill="#f59e0b"/>
          </g>
        )}
      </svg>
      {chip && <div className="map__chip">{chip}</div>}
      {route && (
        <div className="map__route-badge">
          <span className="m">~12 dk</span>
          <span className="m">3.4 km</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stepper — numbered dots with connector line
// ─────────────────────────────────────────────────────────────
function Stepper({ step, total, title }) {
  return (
    <div className="stepper">
      <div className="stepper__label">
        <span className="stepper__step">Adım {step}/{total}</span>
        <span className="stepper__title">{title}</span>
      </div>
      <div className="stepper__dots">
        {Array.from({length: total}, (_, i) => {
          const n = i + 1;
          const isDone    = n < step;
          const isCurrent = n === step;
          return (
            <React.Fragment key={n}>
              <div className={'stepper-dot ' + (isDone ? 'is-done' : isCurrent ? 'is-current' : '')}>
                {isDone
                  ? <Icon.Check size={11} />
                  : <span style={{fontSize:'0.7rem',fontWeight:800,lineHeight:1}}>{n}</span>}
              </div>
              {n < total && <div className={'stepper-line ' + (isDone ? 'is-done' : '')} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pill toggle
// ─────────────────────────────────────────────────────────────
function PillToggle({ value, onChange, options }) {
  return (
    <div className="pill-toggle">
      {options.map(o => (
        <button key={o.value} type="button"
                className={'pill-toggle__opt ' + (value === o.value ? 'is-active' : '')}
                onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TabToggle({ value, onChange, options }) {
  return (
    <div className="tab-toggle" role="tablist">
      {options.map(o => (
        <button key={o.value} type="button" role="tab"
                className={'tab-toggle__opt ' + (value === o.value ? 'is-active' : '')}
                onClick={() => onChange(o.value)}>
          <span>{o.label}</span>
          {typeof o.count === 'number' && <span className="count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────
function EmptyState({ glyph, title, sub, action }) {
  return (
    <div className="empty">
      <div className="empty__glyph">{glyph}</div>
      <div className="empty__title">{title}</div>
      {sub && <div className="empty__sub">{sub}</div>}
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Format helpers
// ─────────────────────────────────────────────────────────────
const fmt = {
  tl: (n) => `${n.toLocaleString('tr-TR')} ₺`,
  km: (n) => `${n.toFixed(1)} km`,
};

Object.assign(window, {
  Icon, VehicleIcon, BreakdownIcon,
  StatusBadge, AppHeader, ErrorInline, MapMock,
  Stepper, PillToggle, TabToggle, EmptyState,
  STATUS_LABEL, BREAKDOWN_LABEL, VEHICLE_LABEL, fmt,
});
