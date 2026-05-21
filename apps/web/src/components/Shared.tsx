import React, { useId } from 'react';
import { Icon, STATUS_LABEL } from './Icons';

// ── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge status-${status}`}><span className="badge-dot" />{STATUS_LABEL[status] ?? status}</span>;
}

// ── ErrorInline ──────────────────────────────────────────────────────────────
export function ErrorInline({ children, onClose }: { children?: string; onClose?: () => void }) {
  if (!children) return null;
  return (
    <div className="err-inline">
      <span style={{ flexShrink: 0, marginTop: 1 }}><Icon.Warn /></span>
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && <button className="err-inline__close" onClick={onClose} aria-label="Kapat"><Icon.X size={14} /></button>}
    </div>
  );
}

// ── MapMock ──────────────────────────────────────────────────────────────────
export function MapMock({ height = 240, route = false, live = false, single = false, chip }: {
  height?: number | string; route?: boolean; live?: boolean; single?: boolean; chip?: React.ReactNode;
}) {
  const id = useId().replace(/:/g, '');
  return (
    <div className="map" style={{ height }}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`${id}-grid`} width="44" height="44" patternUnits="userSpaceOnUse">
            <rect width="44" height="44" fill="#0d0d0d"/>
            <path d="M0 0H44M0 0V44" stroke="#181818" strokeWidth="0.8"/>
          </pattern>
        </defs>
        <rect width="400" height="300" fill={`url(#${id}-grid)`}/>
        <rect x="20"  y="20"  width="70" height="50" rx="3" fill="#141414"/>
        <rect x="110" y="20"  width="50" height="40" rx="3" fill="#141414"/>
        <rect x="200" y="30"  width="80" height="45" rx="3" fill="#141414"/>
        <rect x="310" y="15"  width="75" height="55" rx="3" fill="#141414"/>
        <rect x="160" y="100" width="100" height="70" rx="6" fill="#0c1a0c" opacity="0.9"/>
        <path d="M0 255 Q 100 240 200 260 T 400 250 L 400 300 L 0 300 Z" fill="#071420" opacity="0.95"/>
        <path d="M0 148 L 400 138" stroke="#1e1e1e" strokeWidth="16"/>
        <path d="M145 0 L 130 300" stroke="#1e1e1e" strokeWidth="14"/>
        {route && (
          <>
            <path d="M70 240 Q 120 170 195 150 T 330 72" stroke="#f59e0b" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M70 240 Q 120 170 195 150 T 330 72" stroke="#f59e0b" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.12"/>
          </>
        )}
        {!single && (
          <g transform="translate(70, 240)">
            <circle r="16" fill="#111" stroke="#22c55e" strokeWidth="2.5"/>
            <circle r="6" fill="#22c55e"/>
          </g>
        )}
        {route && (
          <g transform="translate(330, 72)">
            <circle r="16" fill="#111" stroke="#ef4444" strokeWidth="2.5"/>
            <circle r="6" fill="#ef4444"/>
          </g>
        )}
        {single && (
          <g transform="translate(200, 150)">
            <circle r="18" fill="#111" stroke="#f59e0b" strokeWidth="2.5"/>
            <circle r="7" fill="#f59e0b"/>
            <circle r="22" fill="#f59e0b" fillOpacity="0.10"/>
          </g>
        )}
        {live && (
          <g transform="translate(178, 168)">
            <circle r="11" fill="#111" stroke="#f59e0b" strokeWidth="2.5"/>
            <circle r="5" fill="#f59e0b"/>
          </g>
        )}
      </svg>
      {chip && <div className="map__chip">{chip}</div>}
      {route && <div className="map__route-badge"><span className="m">~12 dk</span><span className="m">3.4 km</span></div>}
    </div>
  );
}

// ── Stepper ──────────────────────────────────────────────────────────────────
export function Stepper({ step, total, title }: { step: number; total: number; title: string }) {
  return (
    <div className="stepper">
      <div className="stepper__label">
        <span className="stepper__step">Adım {step}/{total}</span>
        <span className="stepper__title">{title}</span>
      </div>
      <div className="stepper__dots">
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          return (
            <React.Fragment key={n}>
              <div className={`stepper-dot${n < step ? ' is-done' : n === step ? ' is-current' : ''}`}>
                {n < step ? <Icon.Check size={11} /> : <span style={{ fontSize: '0.7rem', fontWeight: 800, lineHeight: 1 }}>{n}</span>}
              </div>
              {n < total && <div className={`stepper-line${n < step ? ' is-done' : ''}`} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── PillToggle ───────────────────────────────────────────────────────────────
export function PillToggle({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="pill-toggle">
      {options.map(o => (
        <button key={o.value} type="button" className={`pill-toggle__opt${value === o.value ? ' is-active' : ''}`} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

// ── TabToggle ────────────────────────────────────────────────────────────────
export function TabToggle({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; count?: number }[] }) {
  return (
    <div className="tab-toggle" role="tablist">
      {options.map(o => (
        <button key={o.value} type="button" role="tab" className={`tab-toggle__opt${value === o.value ? ' is-active' : ''}`} onClick={() => onChange(o.value)}>
          <span>{o.label}</span>
          {typeof o.count === 'number' && <span className="count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ glyph, title, sub }: { glyph: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="empty">
      <div className="empty__glyph">{glyph}</div>
      <div className="empty__title">{title}</div>
      {sub && <div className="empty__sub">{sub}</div>}
    </div>
  );
}
