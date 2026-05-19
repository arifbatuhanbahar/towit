import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendError } from "../lib/errors.js";
import { isValidLatLng } from "../services/geo.js";
import { routeBetween } from "../services/directions.js";
import { rateLimit } from "../middleware/rateLimit.js";

export const directionsRouter = Router();

/** Rota önizleme çağrıları dakikada 90 ile sınırlı — harita sağlayıcı kotasını korur. */
const directionsLimiter = rateLimit({ windowMs: 60_000, max: 90 });

/**
 * GET /directions?fromLat=&fromLng=&toLat=&toLng=
 * Müşteri ve operatör için rota önizlemesi. Gerçek yol ağını (ORS/Google) kullanır.
 */
directionsRouter.get("/", directionsLimiter, requireAuth, async (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.query;

  const parsedFromLat = Number(String(fromLat).replace(",", "."));
  const parsedFromLng = Number(String(fromLng).replace(",", "."));
  const parsedToLat = Number(String(toLat).replace(",", "."));
  const parsedToLng = Number(String(toLng).replace(",", "."));

  if (
    !Number.isFinite(parsedFromLat) ||
    !Number.isFinite(parsedFromLng) ||
    !Number.isFinite(parsedToLat) ||
    !Number.isFinite(parsedToLng)
  ) {
    return sendError(res, 400, "VALIDATION_ERROR", "fromLat, fromLng, toLat, toLng sayısal olmalıdır");
  }

  if (
    !isValidLatLng(parsedFromLat, parsedFromLng) ||
    !isValidLatLng(parsedToLat, parsedToLng)
  ) {
    return sendError(res, 400, "INVALID_COORDINATES", "Koordinatlar geçersiz");
  }

  const origin = { lat: parsedFromLat, lng: parsedFromLng };
  const destination = { lat: parsedToLat, lng: parsedToLng };

  const route = await routeBetween(origin, destination);

  return res.json({
    points: route.points,
    distanceMeters: route.distanceMeters,
    distanceKm: Number((route.distanceMeters / 1000).toFixed(2)),
    durationSeconds: route.durationSeconds,
    durationMinutes: Math.max(1, Math.ceil(route.durationSeconds / 60)),
    source: route.source,
  });
});
