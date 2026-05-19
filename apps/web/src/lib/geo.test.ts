import { describe, it, expect } from "vitest";
import { haversineKm } from "./geo";

describe("haversineKm", () => {
  it("aynı nokta için 0 döner", () => {
    expect(haversineKm({ lat: 41.0, lng: 28.9 }, { lat: 41.0, lng: 28.9 })).toBe(0);
  });

  it("İstanbul - Ankara yaklaşık 350 km", () => {
    const d = haversineKm({ lat: 41.0082, lng: 28.9784 }, { lat: 39.9334, lng: 32.8597 });
    expect(d).toBeGreaterThan(340);
    expect(d).toBeLessThan(360);
  });

  it("simetriktir", () => {
    const a = { lat: 41.0082, lng: 28.9784 };
    const b = { lat: 38.4192, lng: 27.1287 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });
});
