import { Link, useLocation, useNavigate } from "react-router-dom";
import { getStoredEmail, getStoredRole, isAuthenticated, logoutLocal } from "../../lib/auth";

export default function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuth = isAuthenticated();
  const role = getStoredRole();
  const email = getStoredEmail();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  function logout() {
    logoutLocal();
    navigate("/login", { replace: true });
  }

  return (
    <header className="app-header">
      <Link to="/" className="brand">
        <span style={{ color: "var(--primary)" }}>Tow</span>it
      </Link>

      <nav className="nav-links" style={{ flex: 1, justifyContent: "center" }}>
        {isAuth && !isAuthPage && (
          <Link
            to={role === "operator" ? "/operator" : "/customer"}
            className="nav-link nav-link--active"
          >
            {role === "operator" ? "Çekici paneli" : "Müşteri paneli"}
          </Link>
        )}
      </nav>

      <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
        {isAuth && !isAuthPage ? (
          <>
            {email ? (
              <span
                className="muted header-email"
                style={{ fontSize: "0.82rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                title={email}
              >
                {email}
              </span>
            ) : null}
            <span
              style={{
                display: "inline-flex", alignItems: "center", padding: "3px 10px",
                borderRadius: 20, fontSize: "0.75rem", fontWeight: 700,
                background: role === "operator" ? "#ede9fe" : "#dbeafe",
                color: role === "operator" ? "#5b21b6" : "#1e40af",
              }}
            >
              {role === "operator" ? "Çekici" : "Müşteri"}
            </span>
            <button type="button" className="btn btn-ghost" onClick={logout} style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
              Çıkış
            </button>
          </>
        ) : isAuthPage ? null : (
          <>
            <Link to="/login" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>Giriş</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>Kayıt ol</Link>
          </>
        )}
      </div>
    </header>
  );
}
