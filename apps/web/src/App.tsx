import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppHeader from "./components/layout/AppHeader";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import CustomerPage from "./pages/customer/CustomerPage";
import CustomerJobPage from "./pages/customer/CustomerJobPage";
import OperatorPage from "./pages/operator/OperatorPage";
import OperatorJobPage from "./pages/operator/OperatorJobPage";
import OperatorRoutePage from "./pages/operator/OperatorRoutePage";
import { getStoredRole, isAuthenticated } from "./lib/auth";

function HomeRedirect() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <Navigate to={getStoredRole() === "operator" ? "/operator" : "/customer"} replace />;
}

export default function App() {
  const location = useLocation();
  const narrow = location.pathname === "/login" || location.pathname === "/register";
  const wideRoute = location.pathname.includes("/operator/jobs/") && location.pathname.endsWith("/rota");

  return (
    <div className="app-root">
      <AppHeader />

      <main className={`page-shell ${narrow ? "page-shell--narrow" : ""} ${wideRoute ? "page-shell--route" : ""}`}>
        <div key={location.pathname} className="page-transition">
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/customer" element={<CustomerPage />} />
            <Route path="/customer/jobs/:id" element={<CustomerJobPage />} />
            <Route path="/operator" element={<OperatorPage />} />
            <Route path="/operator/jobs/:id/rota" element={<OperatorRoutePage />} />
            <Route path="/operator/jobs/:id" element={<OperatorJobPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <p className="disclaimer">
        Gösterilen tutarlar tahminidir; rota ve trafik değişiminde fark oluşabilir.
      </p>
    </div>
  );
}
