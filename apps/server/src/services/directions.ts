import { haversineKm } from "./geo.js";
import { logger } from "../lib/logger.js";

export type LatLng = { lat: number; lng: number };

// ---------------------------------------------------------------------------
// ORS rate limiter + rota önbelleği
// Ücretsiz plan: 40 istek/dk. Biz 35'te fren yapıyoruz; altındaysa önbellek
// dolduğu için zaten istek gitmez.
// ---------------------------------------------------------------------------

/** ~111 m hassasiyetle koordinatı yuvarlar → önbellek anahtarı */
function roundCoord(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function orsCacheKey(origin: LatLng, dest: LatLng): string {
  return `${roundCoord(origin.lat)},${roundCoord(origin.lng)}->${roundCoord(dest.lat)},${roundCoord(dest.lng)}`;
}

type CacheEntry = { result: RouteResult; expiresAt: number };
const orsCache = new Map<string, CacheEntry>();
const ORS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 dk

/** Son 60 saniyedeki istek zamanları — rate limit takibi */
const orsTimestamps: number[] = [];
const ORS_RATE_LIMIT = 35; // 40'ın altında güvenli marj

function orsCanRequest(): boolean {
  const now = Date.now();
  while (orsTimestamps.length > 0 && orsTimestamps[0] < now - 60_000) {
    orsTimestamps.shift();
  }
  return orsTimestamps.length < ORS_RATE_LIMIT;
}

function orsRecordRequest(): void {
  orsTimestamps.push(Date.now());
}

/** Google encoded polyline → koordinat listesi */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

/** Son çare: düz hat + ortalama hızla süre */
const FALLBACK_SPEED_KMH = 42;

export type RouteResult = {
  points: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  /** google: Directions+trafik; osrm: ORS yol ağı; straight: tahmini düz çizgi */
  source: "google" | "osrm" | "straight";
};

type GoogleLeg = {
  distance?: { value: number };
  duration?: { value: number };
  duration_in_traffic?: { value: number };
};

async function tryGoogleDirections(origin: LatLng, destination: LatLng): Promise<RouteResult | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const buildUrl = (withTraffic: boolean) => {
    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
    url.searchParams.set("destination", `${destination.lat},${destination.lng}`);
    url.searchParams.set("mode", "driving");
    url.searchParams.set("language", "tr");
    url.searchParams.set("region", "tr");
    url.searchParams.set("key", key);
    if (withTraffic) {
      url.searchParams.set("departure_time", "now");
      url.searchParams.set("traffic_model", "best_guess");
    }
    return url;
  };

  const parse = (data: {
    status: string;
    routes?: {
      overview_polyline?: { points?: string } | string;
      legs?: GoogleLeg[];
    }[];
  }): RouteResult | null => {
    if (data.status !== "OK" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    const leg = route.legs?.[0];
    const op = route.overview_polyline;
    const encoded = typeof op === "string" ? op : op?.points;
    if (!leg?.distance || !leg.duration || !encoded) return null;
    const points = decodePolyline(encoded);
    if (points.length < 2) return null;
    const dTraffic = leg.duration_in_traffic?.value;
    const durationSeconds =
      dTraffic != null && dTraffic > 0 ? dTraffic : leg.duration.value;
    return {
      points,
      distanceMeters: leg.distance.value,
      durationSeconds,
      source: "google",
    };
  };

  type DirJson = {
    status: string;
    routes?: {
      overview_polyline?: { points?: string } | string;
      legs?: GoogleLeg[];
    }[];
  };

  const fetchJson = async (withTraffic: boolean): Promise<DirJson | null> => {
    const res = await fetch(buildUrl(withTraffic), { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null;
    return (await res.json()) as DirJson;
  };

  const withTraffic = await fetchJson(true);
  if (withTraffic) {
    const parsed = parse(withTraffic);
    if (parsed) return parsed;
    if (withTraffic.status === "INVALID_REQUEST") {
      const noTraffic = await fetchJson(false);
      if (noTraffic) {
        const parsed2 = parse(noTraffic);
        if (parsed2) return parsed2;
      }
    }
  }

  return null;
}

/**
 * OpenRouteService — gerçek yol ağı üzerinden geometri + süre.
 * Ücretsiz plan: 40 istek/dk, 2000 istek/gün.
 * ORS_API_KEY ortam değişkeni yoksa bu adım atlanır.
 */
async function tryOrsRoute(origin: LatLng, destination: LatLng): Promise<RouteResult | null> {
  const key = process.env.ORS_API_KEY?.trim();
  if (!key) return null;

  // Önbellekte var mı?
  const cacheKey = orsCacheKey(origin, destination);
  const cached = orsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  if (!orsCanRequest()) {
    logger.warn("ORS rate-limit reached, skipping request");
    return null;
  }

  const url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

  try {
    orsRecordRequest();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json, application/geo+json",
        Authorization: key,
      },
      body: JSON.stringify({
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat],
        ],
        radiuses: [-1, -1],
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      logger.error("ORS HTTP error", { status: res.status });
      return null;
    }

    const data = (await res.json()) as {
      features?: {
        geometry?: { coordinates?: [number, number][] };
        properties?: { summary?: { distance?: number; duration?: number } };
      }[];
    };

    const feature = data.features?.[0];
    const coords = feature?.geometry?.coordinates;
    const summary = feature?.properties?.summary;
    if (!coords || coords.length < 2 || !summary) return null;

    const result: RouteResult = {
      points: coords.map(([lng, lat]) => ({ lat, lng })),
      distanceMeters: summary.distance ?? 0,
      durationSeconds: Math.max(1, Math.round(summary.duration ?? 0)),
      source: "osrm",
    };

    orsCache.set(cacheKey, { result, expiresAt: Date.now() + ORS_CACHE_TTL_MS });
    if (orsCache.size > 500) {
      const now = Date.now();
      for (const [k, v] of orsCache) {
        if (v.expiresAt < now) orsCache.delete(k);
      }
    }

    return result;
  } catch (err) {
    logger.error("ORS request failed", { err: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

/**
 * Public OSRM demo servisi — anahtarsız yol geometrisi sağlar.
 * Kısa süreli yedek amaçlı kullanılır; kota/erişilebilirlik garantisi yoktur.
 */
async function tryPublicOsrmRoute(origin: LatLng, destination: LatLng): Promise<RouteResult | null> {
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
  );
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: { coordinates?: [number, number][] };
      }>;
    };
    const route = data.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (data.code !== "Ok" || !coords || coords.length < 2) return null;

    return {
      points: coords.map(([lng, lat]) => ({ lat, lng })),
      distanceMeters: Math.max(0, route?.distance ?? 0),
      durationSeconds: Math.max(1, Math.round(route?.duration ?? 0)),
      source: "osrm",
    };
  } catch (err) {
    logger.warn("Public OSRM request failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

function straightLineRoute(origin: LatLng, destination: LatLng): RouteResult {
  const km = haversineKm(origin, destination);
  const distanceMeters = km * 1000;
  const durationSeconds = Math.max(60, Math.round((km / FALLBACK_SPEED_KMH) * 3600));
  return {
    points: [origin, destination],
    distanceMeters,
    durationSeconds,
    source: "straight",
  };
}

/**
 * İki nokta arasında rota: Google, ORS, public OSRM, son çare düz hat.
 */
export async function routeBetween(origin: LatLng, destination: LatLng): Promise<RouteResult> {
  try {
    const g = await tryGoogleDirections(origin, destination);
    if (g) return g;
  } catch {
    /* ağ / kota — sonraki kaynağa düş */
  }

  try {
    const o = await tryOrsRoute(origin, destination);
    if (o && o.points.length >= 2 && o.distanceMeters > 0) return o;
  } catch {
    /* ORS erişilemez */
  }

  try {
    const publicOsrm = await tryPublicOsrmRoute(origin, destination);
    if (publicOsrm && publicOsrm.points.length >= 2 && publicOsrm.distanceMeters > 0) return publicOsrm;
  } catch {
    /* public OSRM erişilemez */
  }

  return straightLineRoute(origin, destination);
}
