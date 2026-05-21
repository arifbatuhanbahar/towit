import React from 'react';
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
