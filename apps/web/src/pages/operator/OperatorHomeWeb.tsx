import { useState, useEffect } from 'react';
import { TabToggle, EmptyState } from '../../components/Shared';
import MapView from '../../components/MapView';
import { Icon, BreakdownIcon, BREAKDOWN_LABEL, STATUS_LABEL } from '../../components/Icons';
import { getJobs, patchJob } from '../../lib/api';
import type { JobSummary } from '../../lib/api';

interface Props {
  onOpenJob: (id: string) => void;
}

export default function OperatorHomeWeb({ onOpenJob }: Props) {
  const [jobs, setJobs]         = useState<JobSummary[]>([]);
  const [tab, setTab]           = useState('requests');
  const [selected, setSelected] = useState<JobSummary | null>(null);
  const [acting, setActing]     = useState(false);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  async function load() {
    try { const r = await getJobs(); setJobs(r.jobs); } catch { /* silent */ }
  }

  async function accept(job: JobSummary) {
    setActing(true);
    try { await patchJob(job.id, 'accept'); await load(); setSelected(null); }
    catch { /* silent */ }
    finally { setActing(false); }
  }

  async function reject(job: JobSummary) {
    setActing(true);
    try { await patchJob(job.id, 'reject'); await load(); setSelected(null); }
    catch { /* silent */ }
    finally { setActing(false); }
  }

  const requests = jobs.filter(j => j.status === 'open');
  const active   = jobs.filter(j => j.status === 'accepted' || j.status === 'en_route');
  const list     = tab === 'requests' ? requests : active;

  return (
    <div className="op-split">
      {/* ── List panel ── */}
      <div className="op-split__list">
        <TabToggle
          value={tab}
          onChange={v => { setTab(v); setSelected(null); }}
          options={[
            { value: 'requests', label: 'İstekler', count: requests.length },
            { value: 'active',   label: 'Aktif',    count: active.length },
          ]}
        />

        {list.length === 0 ? (
          <EmptyState
            glyph={<Icon.Tow size={24} />}
            title={tab === 'requests' ? 'Yeni istek yok' : 'Aktif iş yok'}
            sub="Talepler buraya düşer."
          />
        ) : list.map(item => {
          const BIcon = BreakdownIcon[item.breakdownType] || BreakdownIcon.diger;
          return (
            <div
              key={item.id}
              className={`op-list-item${selected?.id === item.id ? ' is-selected' : ''}`}
              onClick={() => setSelected(item)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-3)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', color: 'var(--primary)', flexShrink: 0 }}>
                  {(item.customerEmail ?? '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.customerEmail}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <BIcon size={11} /> {BREAKDOWN_LABEL[item.breakdownType] ?? item.breakdownType}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
                    {Number(item.priceSnapshot).toLocaleString('tr-TR')} ₺
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{item.distanceKm.toFixed(1)} km</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge status-${item.status}`}><span className="badge-dot" />{STATUS_LABEL[item.status] ?? item.status}</span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detail panel ── */}
      <div className="op-split__detail">
        {!selected ? (
          <div className="detail-empty">
            <div className="detail-empty__arrow">←</div>
            <div className="detail-empty__title">Bir iş seçin</div>
            <div className="detail-empty__sub">Listeden bir talep veya aktif iş seçin.</div>
          </div>
        ) : (
          <div style={{ maxWidth: 540 }}>
            <div style={{ marginBottom: 'var(--s-6)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
                {selected.customerEmail}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge status-${selected.status}`}><span className="badge-dot" />{STATUS_LABEL[selected.status] ?? selected.status}</span>
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>#{selected.id.slice(-6).toUpperCase()} · {selected.distanceKm.toFixed(1)} km</span>
              </div>
            </div>

            {(selected.customerVehicleBrand || selected.customerVehicleModel || selected.customerVehiclePlate) && (
              <div style={{ padding: 'var(--s-3) var(--s-4)', background: 'var(--surface)', borderRadius: 'var(--r-md)', marginBottom: 'var(--s-4)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {[selected.customerVehicleBrand, selected.customerVehicleModel, selected.customerVehiclePlate].filter(Boolean).join(' · ')}
              </div>
            )}

            <div className="detail-grid">
              {selected.pickup && (
                <div className="detail-cell">
                  <div className="detail-cell__label">Çekim</div>
                  <div className="detail-cell__value">{selected.pickup.lat.toFixed(4)}, {selected.pickup.lng.toFixed(4)}</div>
                </div>
              )}
              {selected.destination && (
                <div className="detail-cell">
                  <div className="detail-cell__label">Varış</div>
                  <div className="detail-cell__value">{selected.destination.lat.toFixed(4)}, {selected.destination.lng.toFixed(4)}</div>
                </div>
              )}
              <div className="detail-cell">
                <div className="detail-cell__label">Mesafe</div>
                <div className="detail-cell__value">{selected.distanceKm.toFixed(1)} km</div>
              </div>
              <div className="detail-cell">
                <div className="detail-cell__label">Ücret</div>
                <div className="detail-cell__value">{Number(selected.priceSnapshot).toLocaleString('tr-TR')} ₺</div>
              </div>
            </div>

            <MapView height={200} pickup={selected.pickup} destination={selected.destination} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', marginTop: 'var(--s-5)' }}>
              {selected.status === 'open' ? (
                <>
                  <button className="btn btn-primary btn-square" style={{ borderRadius: 'var(--r-lg)' }} disabled={acting} onClick={() => accept(selected)}>
                    {acting ? 'İşleniyor…' : 'İşi kabul et'}
                  </button>
                  <button className="btn btn-danger-ghost btn-sm btn-square" disabled={acting} onClick={() => reject(selected)}>
                    Reddet
                  </button>
                </>
              ) : (
                <button className="btn btn-primary btn-square" style={{ minHeight: 56, fontSize: '1rem', borderRadius: 'var(--r-lg)' }} onClick={() => onOpenJob(selected.id)}>
                  Detay & Rotaya git →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
