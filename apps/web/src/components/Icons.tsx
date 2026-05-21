export const Icon = {
  Tow: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 32 24" fill="none">
      <path d="M1 18h2m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m0 0h10m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m0 0h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M1 18V8a2 2 0 0 1 2-2h11v12M14 9h6l4 5v4M24 14h-4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M14 6l8-3 4 6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  ),
  Eye: ({ size = 20, off = false }: { size?: number; off?: boolean }) => off ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.7A10 10 0 0 1 12 5c5 0 9 4 10 7-.5 1.4-1.6 3-3.1 4.4M6.2 7.6C3.7 9.4 2.3 11.5 2 12c1 3 5 7 10 7 1.6 0 3.1-.4 4.4-1.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  Arrow: ({ size = 18, dir = 'right' }: { size?: number; dir?: 'left' | 'right' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: dir === 'left' ? 'rotate(180deg)' : undefined }}>
      <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Check: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Star: ({ size = 18, filled = false }: { size?: number; filled?: boolean }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  Pin: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  Phone: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  Shield: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Chevron: ({ size = 16, dir = 'down' }: { size?: number; dir?: 'up' | 'down' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: dir === 'up' ? 'rotate(180deg)' : undefined }}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Warn: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4l10 17H2L12 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M12 10v5M12 18v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  X: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Crosshair: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  Refresh: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export const VehicleIcon: Record<string, ({ size }: { size?: number }) => JSX.Element> = {
  platform: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 28 18" fill="none">
      <path d="M2 12V6a1 1 0 0 1 1-1h8v7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M11 8h6l4 3v1M21 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M2 12h23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="19" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  vinclu: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 28 18" fill="none">
      <path d="M2 12V7a1 1 0 0 1 1-1h6v6M9 9h7l4 3M20 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M2 12h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="18" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  kanca: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 28 18" fill="none">
      <path d="M2 12V7a1 1 0 0 1 1-1h8v6M11 9h5l3 3M19 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M2 12h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="17" cy="14" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  ahtapot: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 28 18" fill="none">
      <rect x="2" y="6" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 9h6l4 3M21 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M2 13h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6" cy="14" r="1.6" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="19" cy="14" r="1.6" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  motorsiklet: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 28 18" fill="none">
      <path d="M2 13V8a1 1 0 0 1 1-1h5v6M8 10h4l3 3M15 13h2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx="6" cy="15" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="14" cy="15" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  agir: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 28 18" fill="none">
      <path d="M1 13V6a1 1 0 0 1 1-1h13v8M15 8h6l4 5v2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M1 13h24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6" cy="15" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="15" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="22" cy="15" r="1.7" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
};

export const BreakdownIcon: Record<string, ({ size }: { size?: number }) => JSX.Element> = {
  motor: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 8.5v-2M12 17.5v-2M8.5 12h-2M17.5 12h-2M9.5 9.5l-1.4-1.4M15.9 15.9l-1.4-1.4M9.5 14.5l-1.4 1.4M15.9 8.1l-1.4 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  aku: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M19 11v3M8 5v2M14 5v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M7 12h2M8 11v2M13 12h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  yakıt: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 19V6a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v13" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M3 19h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M6 9h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M13 10l3 3v4a1.5 1.5 0 0 0 3 0V9l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  ),
  kaza: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l10 18H2L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor"/>
    </svg>
  ),
  lastik: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  diger: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="0.9" fill="currentColor"/>
    </svg>
  ),
};

export const STATUS_LABEL: Record<string, string> = {
  open: 'Açık', accepted: 'Kabul edildi', en_route: 'Yolda',
  completed: 'Tamamlandı', rejected: 'Reddedildi', cancelled: 'İptal edildi',
};
export const BREAKDOWN_LABEL: Record<string, string> = {
  motor: 'Motor Arızası', aku: 'Akü Bitti', yakıt: 'Yakıt Bitti',
  kaza: 'Kaza', lastik: 'Patlak Lastik', diger: 'Diğer',
};
export const VEHICLE_LABEL: Record<string, string> = {
  platform: 'Düz Platform', vinclu: 'Vinçli', kanca: 'Kanca',
  ahtapot: 'Ahtapot', motorsiklet: 'Motosiklet', agir: 'Ağır Vasıta',
};
