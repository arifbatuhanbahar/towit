// auth.jsx — LoginPage + RegisterPage  (split layout, no card wrapper)

const { useState: useAuthState } = React;

function pwScore(s) {
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

// ─────────────────────────────────────────────────────────────
// LoginPage
// ─────────────────────────────────────────────────────────────
function LoginPage({ onLogin, onGoRegister }) {
  const [email, setEmail] = useAuthState('');
  const [pwd, setPwd] = useAuthState('');
  const [show, setShow] = useAuthState(false);
  const [err, setErr] = useAuthState('');
  const [loading, setLoading] = useAuthState(false);

  function submit(e) {
    e.preventDefault();
    setErr('');
    if (!email.includes('@')) {setErr('Geçerli bir e-posta girin.');return;}
    if (pwd.length < 1) {setErr('Parola boş olamaz.');return;}
    setLoading(true);
    setTimeout(() => {setLoading(false);onLogin && onLogin(email);}, 600);
  }

  function quickLogin(e) {setEmail(e);setPwd('demo1234');}

  return (
    <div className="towit auth-split">
      {/* ── Hero ─────────────────────────────────────── */}
      <div className="auth-hero">
        <div className="auth-icon"><Icon.Tow size={32} /></div>
        <div className="auth-wordmark">Tow<em>it</em><span style={{ color: 'var(--primary)' }}>.</span></div>
        <div className="auth-tagline">Yardım yolda.</div>
      </div>

      {/* ── Form ─────────────────────────────────────── */}
      <div className="auth-form">
        <div>
          <div className="t-screen" style={{ fontSize: '1.25rem' }}>Hoş geldiniz</div>
          <div className="t-muted" style={{ marginTop: 4 }}>Hesabınıza giriş yapın.</div>
        </div>

        <ErrorInline onClose={() => setErr('')}>{err}</ErrorInline>

        <form className="stack-4" onSubmit={submit}>
          <div className="field">
            <label className="field-label" htmlFor="lg-email">E-posta</label>
            <input id="lg-email" className="input" type="email" inputMode="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" placeholder="ornek@mail.com" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="lg-pwd">Parola</label>
            <div className="input-wrap">
              <input id="lg-pwd" className="input"
              type={show ? 'text' : 'password'}
              value={pwd} onChange={(e) => setPwd(e.target.value)}
              autoComplete="current-password" placeholder="••••••••" />
              <button type="button" className="input-icon-btn"
              aria-label={show ? 'Gizle' : 'Göster'}
              onClick={() => setShow((s) => !s)}>
                <Icon.Eye off={show} size={18} />
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 'var(--s-3) var(--s-4)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
            Demo hesaplar
          </div>
          {[
          { icon: 'car',   label: 'Müşteri',        email: 'musteri@towit.tr' },
          { icon: 'truck', label: 'Çekici şoförü', email: 'sofor@towit.tr' }].
          map(({ icon, label, email: e }) =>
          <button key={e} type="button" onClick={() => quickLogin(e)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--surface-3)', border: 'none', borderRadius: 'var(--r-sm)',
            padding: '9px 12px', cursor: 'pointer', fontFamily: 'inherit'
          }}>
              <span style={{display:'flex', alignItems:'center', gap:10}}>
                <span style={{color:'var(--text-muted)', display:'inline-flex'}}>
                  {icon === 'car' ? <Icon.Car size={16}/> : <Icon.Tow size={16}/>}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>{label}</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{e}</span>
            </button>
          )}
        </div>

        <div className="auth-footer-link">
          Hesabınız yok mu?{' '}
          <button type="button" onClick={onGoRegister}>Kayıt ol →</button>
        </div>
      </div>
    </div>);

}

// ─────────────────────────────────────────────────────────────
// RegisterPage
// ─────────────────────────────────────────────────────────────
function RegisterPage({ onRegister, onGoLogin }) {
  const [role, setRole] = useAuthState('customer');
  const [email, setEmail] = useAuthState('');
  const [pwd, setPwd] = useAuthState('');
  const [show, setShow] = useAuthState(false);
  const [err, setErr] = useAuthState('');
  const [kvkk, setKvkk] = useAuthState(false);

  const score = pwScore(pwd);

  function submit(e) {
    e.preventDefault();
    setErr('');
    if (!email.includes('@')) {setErr('Geçerli bir e-posta girin.');return;}
    if (pwd.length < 6) {setErr('Parola en az 6 karakter olmalı.');return;}
    onRegister && onRegister({ role, email });
  }

  return (
    <div className="towit auth-split">
      {/* ── Hero (shorter for register) ──────────────── */}
      <div className="auth-hero" style={{ flex: '0 0 32%' }}>
        <div className="auth-wordmark" style={{ fontSize: '2.75rem' }}>
          Tow<em>it</em><span style={{ color: 'var(--primary)' }}>.</span>
        </div>
        <div className="auth-tagline">Hemen başlayın.</div>
      </div>

      {/* ── Form ─────────────────────────────────────── */}
      <div className="auth-form" style={{ gap: 'var(--s-4)' }}>
        <div>
          <div className="t-screen" style={{ fontSize: '1.25rem' }}>Hesap oluştur</div>
        </div>

        <ErrorInline onClose={() => setErr('')}>{err}</ErrorInline>

        <form className="stack-4" onSubmit={submit}>
          {/* Role select */}
          <div className="stack-2">
            <span className="field-label">Hesap türü</span>
            <div className="role-grid">
              <button type="button"
              className={'role-card ' + (role === 'customer' ? 'is-selected' : '')}
              onClick={() => setRole('customer')}>
                <div className="role-card__icon" style={{color:'var(--text-muted)'}}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M5 17H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1l2-4h8l2 4h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="7.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.6"/>
                    <circle cx="16.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M7.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="role-card__title">Araç sahibiyim</div>
                <div className="role-card__sub">Çekici çağırırım</div>
              </button>
              <button type="button"
              className={'role-card ' + (role === 'operator' ? 'is-selected' : '')}
              onClick={() => setRole('operator')}>
                <div className="role-card__icon" style={{color:'var(--text-muted)'}}>
                  <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                    <path d="M1 18h2m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m0 0h10m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m0 0h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    <path d="M1 18V8a2 2 0 0 1 2-2h11v12M14 9h6l4 5v4M24 14h-4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"/>
                    <path d="M14 6l8-3 4 6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="role-card__title">Çekici işletiyorum</div>
                <div className="role-card__sub">İş alırım</div>
              </button>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="rg-email">E-posta</label>
            <input id="rg-email" className="input" type="email" inputMode="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@mail.com" />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="rg-pwd">Parola</label>
            <div className="input-wrap">
              <input id="rg-pwd" className="input"
              type={show ? 'text' : 'password'}
              value={pwd} onChange={(e) => setPwd(e.target.value)}
              placeholder="En az 6 karakter" />
              <button type="button" className="input-icon-btn"
              aria-label={show ? 'Gizle' : 'Göster'}
              onClick={() => setShow((s) => !s)}>
                <Icon.Eye off={show} size={18} />
              </button>
            </div>
            <div className="pw-strength">
              <div className="pw-strength__track">
                <div className="pw-strength__fill"
                style={{ width: pwd ? `${score.pct}%` : '0%', background: pwd ? score.color : 'transparent' }} />
              </div>
              {pwd && <div className="pw-strength__label" style={{ color: score.color }}>Parola: {score.label}</div>}
            </div>
          </div>

          {/* KVKK consent */}
          <label style={{display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', padding:'8px 0'}}>
            <input type="checkbox" checked={kvkk} onChange={e => setKvkk(e.target.checked)}
                   style={{
                     width:18, height:18, marginTop:2, accentColor:'var(--primary)',
                     flexShrink:0, cursor:'pointer',
                   }} />
            <span style={{fontSize:'0.8125rem', color:'var(--text-muted)', lineHeight:1.5}}>
              <a href="#" style={{color:'var(--text)',textDecoration:'underline',textDecorationColor:'var(--text-faint)'}}>KVKK aydınlatma metnini</a> ve <a href="#" style={{color:'var(--text)',textDecoration:'underline',textDecorationColor:'var(--text-faint)'}}>gizlilik politikasını</a> okudum, kabul ediyorum.
            </span>
          </label>

          <button type="submit" className="btn btn-primary" disabled={!kvkk}>
            {role === 'customer' ? 'Müşteri hesabı oluştur' : 'Çekici hesabı oluştur'}
          </button>
        </form>

        <div className="auth-footer-link">
          Zaten hesabın var mı?{' '}
          <button type="button" onClick={onGoLogin}>Giriş yap →</button>
        </div>
      </div>
    </div>);

}

Object.assign(window, { LoginPage, RegisterPage, pwScore });