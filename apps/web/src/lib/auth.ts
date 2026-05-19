import { clearTokens } from "./api";

export type UserRole = "customer" | "operator";

export function getStoredRole(): UserRole | null {
  const r = localStorage.getItem("towit_role");
  return r === "customer" || r === "operator" ? r : null;
}

export function getStoredEmail(): string | null {
  return localStorage.getItem("towit_email");
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("towit_access");
}

/** Tüm oturum verilerini (token, rol, e-posta) temizler. */
export function logoutLocal(): void {
  clearTokens();
  localStorage.removeItem("towit_role");
  localStorage.removeItem("towit_email");
}
