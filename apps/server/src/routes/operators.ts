import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { sendError } from "../lib/errors.js";
import { isValidLatLng, haversineKm } from "../services/geo.js";
import { resolveDrivingOrHaversineKm } from "../services/distance.js";
import { previewPrice } from "../services/pricing.js";

export const operatorsRouter = Router();

const point = z.object({
  lat: z.number(),
  lng: z.number(),
});

const searchSchema = z.object({
  cityCode: z.string().length(2),
  pickup: point,
  destination: point,
  sort: z.enum(["price", "distance"]).default("price"),
});

operatorsRouter.post(
  "/search",
  requireAuth,
  requireRole("customer"),
  async (req: AuthedRequest, res) => {
    const parsed = searchSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz istek gövdesi", parsed.error.flatten());
    }
    const { cityCode, pickup, destination, sort } = parsed.data;
    if (!isValidLatLng(pickup.lat, pickup.lng) || !isValidLatLng(destination.lat, destination.lng)) {
      return sendError(res, 400, "INVALID_COORDINATES", "Çekim veya varış koordinatları geçersiz");
    }

    const { km: jobDistanceKm } = await resolveDrivingOrHaversineKm(pickup, destination);

    const ops = await prisma.operatorProfile.findMany({
      where: { isActive: true, tariff: { isNot: null } },
      include: { tariff: true, user: true },
    });

    type Row = {
      operatorProfileId: string;
      businessName: string;
      vehicleInfo: string;
      serviceCenterLat: number;
      serviceCenterLng: number;
      distanceToPickupKm: number;
      previewTotal: string;
      baseFee: string;
      perKmFee: string;
      jobDistanceKm: number;
      rating: number | null;
      ratingCount: number;
    };
    const rows: Row[] = [];

    // Uygun operatörlerin ortalama puanlarını tek sorguda topla
    const candidateIds = ops.filter((o) => o.tariff).map((o) => o.id);
    const ratings = candidateIds.length
      ? await prisma.review.groupBy({
          by: ["operatorId"],
          where: { operatorId: { in: candidateIds } },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : [];
    const ratingMap = new Map(
      ratings.map((r) => [r.operatorId, { avg: r._avg.rating, count: r._count._all }])
    );

    for (const op of ops) {
      if (!op.tariff) continue;
      const distToPickup = haversineKm(
        { lat: op.serviceCenterLat, lng: op.serviceCenterLng },
        pickup
      );
      if (distToPickup > op.serviceRadiusKm) continue;
      const total = previewPrice(op.tariff.baseFee, op.tariff.perKmFee, jobDistanceKm);
      const r = ratingMap.get(op.id);
      rows.push({
        operatorProfileId: op.id,
        businessName: op.businessName,
        vehicleInfo: op.vehicleInfo,
        serviceCenterLat: op.serviceCenterLat,
        serviceCenterLng: op.serviceCenterLng,
        distanceToPickupKm: distToPickup,
        previewTotal: total.toFixed(2),
        baseFee: op.tariff.baseFee.toString(),
        perKmFee: op.tariff.perKmFee.toString(),
        jobDistanceKm,
        rating: r?.avg ? Number(r.avg.toFixed(2)) : null,
        ratingCount: r?.count ?? 0,
      });
    }

    rows.sort((a, b) => {
      if (sort === "price") return Number(a.previewTotal) - Number(b.previewTotal);
      return a.distanceToPickupKm - b.distanceToPickupKm;
    });

    return res.json({
      sort,
      jobDistanceKm,
      operators: rows,
    });
  }
);

const profileSchema = z.object({
  businessName: z.string().min(2).max(120),
  vehicleInfo: z.string().min(1).max(240),
  serviceCenterLat: z.number(),
  serviceCenterLng: z.number(),
  serviceRadiusKm: z.number().min(1).max(500).default(50),
  isActive: z.boolean().default(true),
  tariff: z.object({
    baseFee: z.union([z.number().nonnegative(), z.string()]),
    perKmFee: z.union([z.number().nonnegative(), z.string()]),
  }),
});

operatorsRouter.put(
  "/me",
  requireAuth,
  requireRole("operator"),
  async (req: AuthedRequest, res) => {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz istek gövdesi", parsed.error.flatten());
    }
    const d = parsed.data;
    if (!isValidLatLng(d.serviceCenterLat, d.serviceCenterLng)) {
      return sendError(res, 400, "INVALID_COORDINATES", "Hizmet merkezi koordinatları geçersiz");
    }

    const baseFeeStr = typeof d.tariff.baseFee === "number" ? String(d.tariff.baseFee) : d.tariff.baseFee;
    const perKmStr = typeof d.tariff.perKmFee === "number" ? String(d.tariff.perKmFee) : d.tariff.perKmFee;

    const profile = await prisma.operatorProfile.update({
      where: { userId: req.user!.id },
      data: {
        businessName: d.businessName,
        vehicleInfo: d.vehicleInfo,
        serviceCenterLat: d.serviceCenterLat,
        serviceCenterLng: d.serviceCenterLng,
        serviceRadiusKm: d.serviceRadiusKm,
        isActive: d.isActive,
        tariff: { update: { baseFee: baseFeeStr, perKmFee: perKmStr } },
      },
      include: { tariff: true },
    });

    return res.json({
      id: profile.id,
      businessName: profile.businessName,
      vehicleInfo: profile.vehicleInfo,
      serviceCenterLat: profile.serviceCenterLat,
      serviceCenterLng: profile.serviceCenterLng,
      serviceRadiusKm: profile.serviceRadiusKm,
      isActive: profile.isActive,
      tariff: profile.tariff
        ? { baseFee: profile.tariff.baseFee.toString(), perKmFee: profile.tariff.perKmFee.toString() }
        : null,
    });
  }
);
