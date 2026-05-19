import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, clearTokens } from "../../lib/api";

function passwordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (pw.length < 6) return { level: 0, label: "Çok kısa", color: "#ef4444" };
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const score = (pw.length >= 10 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpecial ? 1 : 0);
  if (score <= 1) return { level: 1, label: "Zayıf", color: "#f97316" };
  if (score <= 2) return { level: 2, label: "Orta", color: "#eab308" };
  return { level: 3, label: "Güçlü", color: "#16a34a" };
}

export default function RegisterPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "operator">("customer");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const pwStrength = password ? passwordStrength(password) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) { setErr("Parola en az 8 karakter olmalıdır."); return; }
    setBusy(true);
    try {
      clearTokens();
      const res = await api<{ accessToken: string; refreshToken: string }>("/auth/register", {
        method: "POST",
        json: { email, password, role },
      });
      localStorage.setItem("towit_access", res.accessToken);
      localStorage.setItem("towit_refresh", res.refreshToken);
      localStorage.setItem("towit_role", role);
      localStorage.setItem("towit_email", email);
      nav(role === "operator" ? "/operator" : "/customer", { replace: true });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Kayıt başarısız");
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 6 }}>
          <span style={{ color: "var(--primary)" }}>Tow</span>it
        </div>
        <p className="muted" style={{ margin: 0 }}>Hesap oluşturun, birkaç dakika sürer</p>
      </div>

      <div className="card" style={{ padding: "28px 24px" }}>
        {/* Rol seçimi — kart tabanlı */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 10px", fontWeight: 600, fontSize: "0.875rem" }}>Ben bir…</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {(["customer", "operator"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  padding: "16px 12px", borderRadius: 12, textAlign: "center",
                  border: `2px solid ${role === r ? "var(--primary)" : "var(--border)"}`,
                  background: role === r ? "var(--primary-soft)" : "#fafafa",
                  cursor: "pointer", transition: "all .15s",
                }}
              >
                <div style={{ fontSize: "1.6rem", marginBottom: 4 }}>
                  {r === "customer" ? "🚗" : "🚛"}
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: role === r ? "var(--primary)" : "var(--text)" }}>
                  {r === "customer" ? "Müşteri" : "Çekici Operatörü"}
                </div>
                <div className="muted" style={{ fontSize: "0.75rem", marginTop: 3 }}>
                  {r === "customer" ? "Çekici talep ederim" : "Çekici hizmeti veririm"}
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="reg-email">E-posta</label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password">Parola (en az 8 karakter)</label>
            <div style={{ position: "relative" }}>
              <input
                id="reg-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
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

            {/* Parola gücü göstergesi */}
            {pwStrength ? (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {([1, 2, 3] as const).map((lvl) => (
                    <div
                      key={lvl}
                      style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: pwStrength.level >= lvl ? pwStrength.color : "#e2e8f0",
                        transition: "background .2s"
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: "0.78rem", color: pwStrength.color, fontWeight: 600 }}>
                  {pwStrength.label}
                </span>
              </div>
            ) : null}
          </div>

          {err ? (
            <div className="error" style={{ marginBottom: 14 }}>{err}</div>
          ) : null}

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%", padding: "12px" }}>
            {busy ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff",
                  animation: "spin 0.7s linear infinite", display: "inline-block"
                }} />
                Hesap oluşturuluyor…
              </span>
            ) : `${role === "customer" ? "Müşteri" : "Çekici"} hesabı oluştur`}
          </button>
        </form>
      </div>

      <p className="muted" style={{ textAlign: "center", marginTop: 16 }}>
        Zaten hesabınız var mı?{" "}
        <Link to="/login" style={{ fontWeight: 600 }}>Giriş yap</Link>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
