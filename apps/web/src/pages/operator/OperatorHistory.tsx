import { useState, useEffect, useMemo } from 'react';
import { EmptyState, StatusBadge } from '../../components/Shared';
import { Icon, BreakdownIcon, BREAKDOWN_LABEL } from '../../components/Icons';
import { getJobs } from '../../lib/api';
import type { JobSummary } from '../../lib/api';

interface Props { onBack: () => void; }

export default function OperatorHistory({ onBack }: Props) {
  const [jobs, setJobs]     = useState<JobSummary[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobs().then(r => setJobs(r.jobs)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const history = useMemo(() => jobs.filter(j => ['completed', 'cancelled', 'rejected'].includes(j.status)), [jobs]);
  const filtered = useMemo(() => filter === 'all' ? history : history.filter(h => h.status === filter), [history, filter]);

  const completed    = history.filter(h => h.status === 'completed');
  const totalEarned  = completed.reduce((s, h) => s + Number(h.priceSnapshot), 0);

  return (
    <div className="towit">
      <div className="scroll-area">
        <div className="screen">
          <button className="btn-link" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Geri dön</button>

          <h1 style={{ fontSize: '1.625rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>Geçmiş İşler</h1>

          <div className="grid-2" style={{ gap: 'var(--s-3)' }}>
            <div style={{ padding: 'var(--s-4) var(--s-5)', background: 'var(--surface)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 6 }}>Tamamlanan</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{completed.length}</div>
            </div>
            <div style={{ padding: 'var(--s-4) var(--s-5)', background: 'var(--surface)', borderRadius: 'var(--r-md)', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 6 }}>Toplam Kazanç</div>
              <div style={{ fontSize: '1.625rem', fontWeight: 900, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--success)' }}>
                {totalEarned.toLocaleString('tr-TR')} ₺
              </div>
            </div>
          </div>

          <div className="pill-toggle">
            {[{ value: 'all', label: 'Tümü' }, { value: 'completed', label: 'Tamamlanan' }, { value: 'cancelled', label: 'İptal' }].map(o => (
              <button key={o.value} type="button" className={`pill-toggle__opt${filter === o.value ? ' is-active' : ''}`} onClick={() => setFilter(o.value)}>{o.label}</button>
            ))}
          </div>

          {loading ? (
            <div className="t-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>Yükleniyor…</div>
          ) : filtered.length === 0 ? (
            <EmptyState glyph={<Icon.Tow size={28} />} title="Bu kategoride kayıt yok" />
          ) : (
            <div className="stack-3">
              {filtered.map(h => {
                const BIcon = BreakdownIcon[h.breakdownType] || BreakdownIcon.diger;
                const emailMasked = h.customerEmail
                  ? h.customerEmail.replace(/^(.{2})(.*)(@.*)$/, (_, a, _b, c) => `${a}****${c}`)
                  : '—';
                return (
                  <div key={h.id} style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: 'var(--s-4) var(--s-5)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{emailMasked}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-faint)', marginTop: 3 }}>
                          {new Date(h.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(h.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <StatusBadge status={h.status} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', background: 'var(--surface-2)', borderRadius: 'var(--r-pill)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--text-faint)', display: 'inline-flex' }}><BIcon size={12} /></span>
                        {BREAKDOWN_LABEL[h.breakdownType] ?? h.breakdownType}
                      </span>
                      <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{h.distanceKm.toFixed(1)} km</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: h.status === 'cancelled' ? 'var(--text-faint)' : 'var(--success)' }}>
                        {h.status === 'cancelled' ? '—' : `+${Number(h.priceSnapshot).toLocaleString('tr-TR')} ₺`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
