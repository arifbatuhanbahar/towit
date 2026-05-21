import { useState } from 'react';
import { register } from '../../lib/api';
import type { AuthUser } from '../../lib/api';
import { Icon } from '../../components/Icons';
import { ErrorInline } from '../../components/Shared';

interface Props { onRegister: (user: AuthUser) => void; onGoLogin: () => void; }

function pwScore(s: string) {
  let n = 0;
  if (s.length >= 6) n++;
  if (s.length >= 10) n++;
  if (/[A-Z]/.test(s) && /[a-z]/.test(s)) n++;
  if (/\d/.test(s)) n++;
  if (/[^\w\s]/.test(s)) n++;
  if (n <= 1) return { label: 'Zayıf', color: 'var(--danger)', pct: 28 };
  if (n <= 3) return { label: 'Orta', color: '#fbbf24', pct: 62 };
  return { label: 'Güçlü', color: 'var(--success)', pct: 100 };
}

export default function RegisterPage({ onRegister, onGoLogin }: Props) {
  const [role, setRole]   = useState<'customer' | 'operator'>('customer');
  const [email, setEmail] = useState('');
  const [pwd, setPwd]     = useState('');
  const [show, setShow]   = useState(false);
  const [kvkk, setKvkk]  = useState(false);
  const [err, setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  const score = pwScore(pwd);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!email.includes('@')) { setErr('Geçerli bir e-posta girin.'); return; }
    if (pwd.length < 6) { setErr('Parola en az 6 karakter olmalı.'); return; }
    setLoading(true);
    try {
      const user = await register(email, pwd, role);
      onRegister(user);
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="towit auth-split">
      <div className="auth-hero" style={{ flex: '0 0 32%' }}>
        <div className="auth-wordmark" style={{ fontSize: '2.75rem' }}>Tow<em>it</em><span style={{ color: 'var(--primary)' }}>.</span></div>
        <div className="auth-tagline">Hemen başlayın.</div>
      </div>

      <div className="auth-form" style={{ gap: 'var(--s-4)' }}>
        <div className="t-screen" style={{ fontSize: '1.25rem' }}>Hesap oluştur</div>
        <ErrorInline onClose={() => setErr('')}>{err}</ErrorInline>

        <form className="stack-4" onSubmit={submit}>
          <div className="stack-2">
            <span className="field-label">Hesap türü</span>
            <div className="role-grid">
              {(['customer', 'operator'] as const).map(r => (
                <button key={r} type="button" className={`role-card${role === r ? ' is-selected' : ''}`} onClick={() => setRole(r)}>
                  <div className="role-card__icon" style={{ color: 'var(--text-muted)' }}>
                    {r === 'customer'
                      ? <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 17H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1l2-4h8l2 4h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.6"/><circle cx="16.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.6"/></svg>
                      : <svg width="32" height="24" viewBox="0 0 32 24" fill="none"><path d="M1 18h2m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m0 0h10m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m0 0h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M1 18V8a2 2 0 0 1 2-2h11v12M14 9h6l4 5v4M24 14h-4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"/></svg>
                    }
                  </div>
                  <div className="role-card__title">{r === 'customer' ? 'Araç sahibiyim' : 'Çekici işletiyorum'}</div>
                  <div className="role-card__sub">{r === 'customer' ? 'Çekici çağırırım' : 'İş alırım'}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="rg-email">E-posta</label>
            <input id="rg-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@mail.com" />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="rg-pwd">Parola</label>
            <div className="input-wrap">
              <input id="rg-pwd" className="input" type={show ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} placeholder="En az 6 karakter" />
              <button type="button" className="input-icon-btn" onClick={() => setShow(s => !s)}><Icon.Eye off={show} size={18} /></button>
            </div>
            <div className="pw-strength">
              <div className="pw-strength__track">
                <div className="pw-strength__fill" style={{ width: pwd ? `${score.pct}%` : '0%', background: pwd ? score.color : 'transparent' }} />
              </div>
              {pwd && <div className="pw-strength__label" style={{ color: score.color }}>Parola: {score.label}</div>}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '8px 0' }}>
            <input type="checkbox" checked={kvkk} onChange={e => setKvkk(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--primary)', flexShrink: 0, cursor: 'pointer' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>KVKK aydınlatma metnini okudum, kabul ediyorum.</span>
          </label>

          <button type="submit" className="btn btn-primary" disabled={!kvkk || loading}>
            {loading ? 'Oluşturuluyor…' : role === 'customer' ? 'Müşteri hesabı oluştur' : 'Çekici hesabı oluştur'}
          </button>
        </form>

        <div className="auth-footer-link">Zaten hesabın var mı? <button type="button" onClick={onGoLogin}>Giriş yap →</button></div>
      </div>
    </div>
  );
}
