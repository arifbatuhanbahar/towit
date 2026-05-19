import { describe, expect, it } from "vitest";
import { haversineKm, isValidLatLng } from "./geo.js";

describe("haversineKm", () => {
  it("İstanbul–Ankara yaklaşık mesafe (±50 km)", () => {
    const istanbul = { lat: 41.0082, lng: 28.9784 };
    const ankara = { lat: 39.9334, lng: 32.8597 };
    const km = haversineKm(istanbul, ankara);
    expect(km).toBeGreaterThan(300);
    expect(km).toBeLessThan(400);
  });
});

describe("isValidLatLng", () => {
  it("geçerli koordinatları kabul eder", () => {
    expect(isValidLatLng(0, 0)).toBe(true);
    expect(isValidLatLng(41, 29)).toBe(true);
  });
  it("geçersizleri reddeder", () => {
    expect(isValidLatLng(200, 0)).toBe(false);
    expect(isValidLatLng(NaN, 0)).toBe(false);
  });
});
