import type { ParsedQs } from "qs";
import { isValidLatLng } from "./geo.js";

export function parseOptionalOrigin(
  query: ParsedQs,
  fallback: { lat: number; lng: number }
): { origin: { lat: number; lng: number }; error?: string } {
  const qLat = query.fromLat;
  const qLng = query.fromLng;
  const fromLatStr = Array.isArray(qLat) ? qLat[0] : qLat;
  const fromLngStr = Array.isArray(qLng) ? qLng[0] : qLng;

  if (typeof fromLatStr === "string" && typeof fromLngStr === "string") {
    const lat = Number(fromLatStr.replace(",", "."));
    const lng = Number(fromLngStr.replace(",", "."));
    if (!isValidLatLng(lat, lng)) {
      return { origin: fallback, error: "Başlangıç koordinatları geçersiz" };
    }
    return { origin: { lat, lng } };
  }

  return { origin: fallback };
}
