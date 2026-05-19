import { haversineKm } from "./geo.js";

type LatLng = { lat: number; lng: number };

/** Google Distance Matrix; anahtar yoksa veya hata olursa null döner. */
export async function drivingDistanceKmGoogle(
  origin: LatLng,
  destination: LatLng
): Promise<number | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", `${origin.lat},${origin.lng}`);
  url.searchParams.set("destinations", `${destination.lat},${destination.lng}`);
  url.searchParams.set("units", "metric");
  url.searchParams.set("key", key);

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status: string;
    rows?: { elements?: { status: string; distance?: { value: number } }[] }[];
  };
  if (data.status !== "OK" || !data.rows?.[0]?.elements?.[0]) return null;
  const el = data.rows[0].elements[0];
  if (el.status !== "OK" || !el.distance) return null;
  return el.distance.value / 1000;
}

/**
 * Önce Google Distance Matrix dener; başarısız olursa haversine ile düz hat
 * mesafesine düşer. Böylece anahtarsız ortamda da çalışır.
 */
export async function resolveDrivingOrHaversineKm(
  origin: LatLng,
  destination: LatLng
): Promise<{ km: number; source: "google" | "haversine" }> {
  const g = await drivingDistanceKmGoogle(origin, destination);
  if (g != null && g > 0) return { km: g, source: "google" };
  return { km: haversineKm(origin, destination), source: "haversine" };
}
