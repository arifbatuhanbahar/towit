import { describe, it, expect } from "vitest";
import { getStoredEmail, getStoredRole, isAuthenticated, logoutLocal } from "./auth";

describe("auth storage helpers", () => {
  it("token yokken authenticated değildir", () => {
    expect(isAuthenticated()).toBe(false);
    expect(getStoredRole()).toBeNull();
    expect(getStoredEmail()).toBeNull();
  });

  it("geçerli rol değerini filtreler", () => {
    localStorage.setItem("towit_role", "customer");
    expect(getStoredRole()).toBe("customer");
    localStorage.setItem("towit_role", "garip-rol");
    expect(getStoredRole()).toBeNull();
  });

  it("logoutLocal tüm oturum anahtarlarını siler", () => {
    localStorage.setItem("towit_access", "a");
    localStorage.setItem("towit_refresh", "r");
    localStorage.setItem("towit_role", "operator");
    localStorage.setItem("towit_email", "x@y.z");

    logoutLocal();

    expect(localStorage.getItem("towit_access")).toBeNull();
    expect(localStorage.getItem("towit_refresh")).toBeNull();
    expect(localStorage.getItem("towit_role")).toBeNull();
    expect(localStorage.getItem("towit_email")).toBeNull();
  });
});
