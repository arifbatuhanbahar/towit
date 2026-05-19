import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, clearTokens } from "../../lib/api";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      clearTokens();
      const res = await api<{ accessToken: string; refreshToken: string }>("/auth/login", {
        method: "POST",
        json: { email, password },
      });
      localStorage.setItem("towit_access", res.accessToken);
      localStorage.setItem("towit_refresh", res.refreshToken);
      const me = await api<{ role: "customer" | "operator" }>("/me");
      localStorage.setItem("towit_role", me.role);
      localStorage.setItem("towit_email", email);
      nav(me.role === "operator" ? "/operator" : "/customer", { replace: true });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Giriş başarısız");
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 6 }}>
          <span style={{ color: "var(--primary)" }}>Tow</span>it
        </div>
        <p className="muted" style={{ margin: 0 }}>Hesabınıza giriş yapın</p>
      </div>

      <div className="card" style={{ padding: "28px 24px" }}>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="login-email">E-posta</label>
            <input
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
              placeholder="ornek@mail.com"
              disabled={busy}
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">Parola</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={busy}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--muted)",
                  fontSize: "0.85rem", padding: "4px"
                }}
              >
                {showPw ? "Gizle" : "Göster"}
              </button>
            </div>
          </div>

          {err ? (
            <div className="error" style={{ marginBottom: 14 }}>
              {err}
            </div>
          ) : null}

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%", padding: "12px" }}>
            {busy ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff",
                  animation: "spin 0.7s linear infinite", display: "inline-block"
                }} />
                Giriş yapılıyor…
              </span>
            ) : "Giriş yap"}
          </button>
        </form>
      </div>

      <p className="muted" style={{ textAlign: "center", marginTop: 16 }}>
        Hesabınız yok mu?{" "}
        <Link to="/register" style={{ fontWeight: 600 }}>Kayıt ol</Link>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
