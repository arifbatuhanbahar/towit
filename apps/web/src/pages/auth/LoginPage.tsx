import { useState } from 'react';
import { login } from '../../lib/api';
import type { AuthUser } from '../../lib/api';
import { Icon } from '../../components/Icons';
import { ErrorInline } from '../../components/Shared';

interface Props { onLogin: (user: AuthUser) => void; onGoRegister: () => void; }

export default function LoginPage({ onLogin, onGoRegister }: Props) {
  const [email, setEmail]     = useState('');
  const [pwd, setPwd]         = useState('');
  const [show, setShow]       = useState(false);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!email.includes('@')) { setErr('Geçerli bir e-posta girin.'); return; }
    if (!pwd) { setErr('Parola boş olamaz.'); return; }
    setLoading(true);
    try {
      const user = await login(email, pwd);
      onLogin(user);
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(e: string) { setEmail(e); setPwd('demo1234'); }

  return (
    <div className="towit auth-split">
      <div className="auth-hero">
        <div className="auth-icon"><Icon.Tow size={32} /></div>
        <div className="auth-wordmark">Tow<em>it</em><span style={{ color: 'var(--primary)' }}>.</span></div>
        <div className="auth-tagline">Yardım yolda.</div>
      </div>

      <div className="auth-form">
        <div>
          <div className="t-screen" style={{ fontSize: '1.25rem' }}>Hoş geldiniz</div>
          <div className="t-muted" style={{ marginTop: 4 }}>Hesabınıza giriş yapın.</div>
        </div>

        <ErrorInline onClose={() => setErr('')}>{err}</ErrorInline>

        <form className="stack-4" onSubmit={submit}>
          <div className="field">
            <label className="field-label" htmlFor="lg-email">E-posta</label>
            <input id="lg-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="ornek@mail.com" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="lg-pwd">Parola</label>
            <div className="input-wrap">
              <input id="lg-pwd" className="input" type={show ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} autoComplete="current-password" placeholder="••••••••" />
              <button type="button" className="input-icon-btn" aria-label={show ? 'Gizle' : 'Göster'} onClick={() => setShow(s => !s)}><Icon.Eye off={show} size={18} /></button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Giriş yapılıyor…' : 'Giriş yap'}</button>
        </form>

        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 'var(--s-3) var(--s-4)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Demo hesaplar</div>
          {[{ label: 'Müşteri', email: 'musteri@towit.tr' }, { label: 'Çekici şoförü', email: 'sofor@towit.tr' }].map(({ label, email: e }) => (
            <button key={e} type="button" onClick={() => quickLogin(e)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-3)', border: 'none', borderRadius: 'var(--r-sm)', padding: '9px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>{label}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{e}</span>
            </button>
          ))}
        </div>

        <div className="auth-footer-link">Hesabınız yok mu? <button type="button" onClick={onGoRegister}>Kayıt ol →</button></div>
      </div>
    </div>
  );
}
