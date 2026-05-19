import { Link, useNavigate } from "react-router-dom";
import { logoutLocal } from "../../lib/auth";

type Props = {
  /** Oturumdaki gerçek rol */
  sessionRole: "customer" | "operator";
  /** Kullanıcıya önerilen panel */
  suggestedPath: "/customer" | "/operator";
  suggestedLabel: string;
};

export default function CrossRoleCard({ sessionRole, suggestedPath, suggestedLabel }: Props) {
  const navigate = useNavigate();
  const roleLabel = sessionRole === "operator" ? "çekici" : "müşteri";

  function logout() {
    logoutLocal();
    navigate("/login", { replace: true });
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Bu panel bu hesap için değil</h2>
      <p className="muted">
        Şu an <strong>{roleLabel}</strong> hesabıyla giriş yaptınız. Seçtiğiniz bağlantı diğer rolün ekranına aittir; aynı oturumla açılamaz.
      </p>
      <div className="row" style={{ marginTop: 16, flexWrap: "wrap" }}>
        <Link to={suggestedPath} className="btn btn-primary" replace={true}>
          {suggestedLabel}
        </Link>
        <button type="button" className="btn btn-secondary" onClick={logout}>
          Çıkış yap (diğer hesapla giriş)
        </button>
      </div>
    </div>
  );
}
