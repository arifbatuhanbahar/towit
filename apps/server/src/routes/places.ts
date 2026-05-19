import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { placesAutocomplete, placeDetailsLatLng } from "../services/places.js";
import { sendError } from "../lib/errors.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validateBody, getBody } from "../middleware/validate.js";

export const placesRouter = Router();

/** NFR-05: dış sağlayıcının kotasını korumak için IP başına dakikada 60 çağrı. */
const placesLimiter = rateLimit({ windowMs: 60_000, max: 60 });

const suggestSchema = z.object({
  query: z.string().min(2).max(200),
  cityCode: z.string().length(2).optional(),
});

placesRouter.post(
  "/suggest",
  placesLimiter,
  requireAuth,
  requireRole("customer"),
  validateBody(suggestSchema),
  async (req: AuthedRequest, res) => {
    const { query, cityCode } = getBody<typeof suggestSchema>(req);
    const suggestions = await placesAutocomplete(query, cityCode ?? "");
    return res.json({ suggestions });
  }
);

const resolveSchema = z.object({
  placeId: z.string().min(3),
});

placesRouter.post(
  "/resolve",
  placesLimiter,
  requireAuth,
  requireRole("customer"),
  validateBody(resolveSchema),
  async (req: AuthedRequest, res) => {
    const { placeId } = getBody<typeof resolveSchema>(req);
    const loc = await placeDetailsLatLng(placeId);
    if (!loc) {
      return sendError(res, 404, "NOT_FOUND", "Konum çözülemedi (API anahtarı veya placeId)");
    }
    return res.json({ lat: loc.lat, lng: loc.lng });
  }
);
