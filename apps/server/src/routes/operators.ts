import { Router } from "express";
import { z } from "zod";
import { VehicleType } from "@prisma/client";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { sendError } from "../lib/errors.js";
import { isValidLatLng, haversineKm } from "../services/geo.js";
import { resolveDrivingOrHaversineKm } from "../services/distance.js";
import { previewPrice } from "../services/pricing.js";
import { COMPAT } from "../services/compatibility.js";

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
  customerVehicleCategory: z
    .enum(["otomobil", "motorsiklet", "hafif_ticari", "agir_vasita"])
    .optional(),
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
    const { cityCode, pickup, destination, sort, customerVehicleCategory } = parsed.data;
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
      vehicleType: string;
      vehicleModel: string;
      vehicleYear: number | null;
      vehiclePlate: string | null;
      capacityNote: string | null;
      serviceCenterLat: number;
      serviceCenterLng: number;
      distanceToPickupKm: number;
      etaMinutes: number;
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
      // Araç kategorisi verilmişse uyumsuz çekicileri listeden çıkar
      if (customerVehicleCategory) {
        const allowed = COMPAT[customerVehicleCategory] ?? [];
        if (!allowed.includes(op.vehicleType)) continue;
      }
      const total = previewPrice(op.tariff.baseFee, op.tariff.perKmFee, jobDistanceKm);
      const r = ratingMap.get(op.id);
      // Şehir içi ortalama 40 km/h ile tahmini varış süresi
      const etaMinutes = Math.max(1, Math.ceil((distToPickup / 40) * 60));
      rows.push({
        operatorProfileId: op.id,
        businessName: op.businessName,
        vehicleInfo: op.vehicleInfo,
        vehicleType: op.vehicleType,
        vehicleModel: op.vehicleModel,
        vehicleYear: op.vehicleYear,
        vehiclePlate: op.vehiclePlate,
        capacityNote: op.capacityNote,
        serviceCenterLat: op.serviceCenterLat,
        serviceCenterLng: op.serviceCenterLng,
        distanceToPickupKm: distToPickup,
        etaMinutes,
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
  businessName:     z.string().max(120).optional(),
  // vehicleInfo is auto-derived; accept if provided for backwards compat
  vehicleInfo:      z.string().max(240).optional(),
  serviceCenterLat: z.number().optional(),
  serviceCenterLng: z.number().optional(),
  serviceRadiusKm:  z.number().min(1).max(500).optional().default(25),
  isActive:         z.boolean().optional().default(true),
  // Accept tariff nested OR flat baseFee/perKmFee
  tariff: z.object({
    baseFee:  z.union([z.number().nonnegative(), z.string()]),
    perKmFee: z.union([z.number().nonnegative(), z.string()]),
  }).optional(),
  baseFee:  z.union([z.number().nonnegative(), z.string()]).optional(),
  perKmFee: z.union([z.number().nonnegative(), z.string()]).optional(),
  // Vehicle details
  phone:        z.string().max(20).optional().nullable(),
  vehicleType:  z.enum(["platform", "vinclu", "kanca", "ahtapot", "motorsiklet", "agir"]).optional().default("platform"),
  vehicleModel: z.string().max(120).optional().default(""),
  vehicleYear:  z.number().int().min(1990).max(2030).optional().nullable(),
  vehiclePlate: z.string().max(15).optional().nullable(),
  capacityNote: z.string().max(200).optional().nullable(),
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

    // Resolve tariff: accept nested tariff OR flat baseFee/perKmFee
    const rawBase   = d.tariff?.baseFee  ?? d.baseFee  ?? 350;
    const rawPerKm  = d.tariff?.perKmFee ?? d.perKmFee ?? 18;
    const baseFeeStr = String(rawBase);
    const perKmStr   = String(rawPerKm);

    // Fetch existing profile to preserve fields the frontend doesn't send
    const existing = await prisma.operatorProfile.findUnique({ where: { userId: req.user!.id } });

    const serviceCenterLat = d.serviceCenterLat ?? existing?.serviceCenterLat ?? 41.0082;
    const serviceCenterLng = d.serviceCenterLng ?? existing?.serviceCenterLng ?? 28.9784;
    if (!isValidLatLng(serviceCenterLat, serviceCenterLng)) {
      return sendError(res, 400, "INVALID_COORDINATES", "Hizmet merkezi koordinatları geçersiz");
    }

    const vehicleType  = d.vehicleType  ?? existing?.vehicleType  ?? "platform";
    const vehicleModel = d.vehicleModel ?? existing?.vehicleModel ?? "";
    const businessName = d.businessName ?? existing?.businessName ?? "Çekicim";
    const vehicleInfoDerived = (`${vehicleType} ${vehicleModel}`.trim()) || vehicleType;
    const vehicleInfo = d.vehicleInfo ?? (existing?.vehicleInfo ?? vehicleInfoDerived);

    const profileData = {
      businessName,
      vehicleInfo,
      serviceCenterLat,
      serviceCenterLng,
      serviceRadiusKm: d.serviceRadiusKm,
      isActive:        d.isActive,
      phone:           d.phone        ?? null,
      vehicleType:     vehicleType    as VehicleType,
      vehicleModel,
      vehicleYear:     d.vehicleYear  ?? null,
      vehiclePlate:    d.vehiclePlate ?? null,
      capacityNote:    d.capacityNote ?? null,
    };

    const profile = await prisma.operatorProfile.upsert({
      where:  { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        ...profileData,
        tariff: { create: { baseFee: baseFeeStr, perKmFee: perKmStr } },
      },
      update: {
        ...profileData,
        tariff: {
          upsert: {
            create: { baseFee: baseFeeStr, perKmFee: perKmStr },
            update: { baseFee: baseFeeStr, perKmFee: perKmStr },
          },
        },
      },
      include: { tariff: true },
    });

    return res.json({
      id:               profile.id,
      businessName:     profile.businessName,
      vehicleInfo:      profile.vehicleInfo,
      vehicleType:      profile.vehicleType,
      vehicleModel:     profile.vehicleModel,
      vehicleYear:      profile.vehicleYear,
      vehiclePlate:     profile.vehiclePlate,
      capacityNote:     profile.capacityNote,
      serviceCenterLat: profile.serviceCenterLat,
      serviceCenterLng: profile.serviceCenterLng,
      serviceRadiusKm:  profile.serviceRadiusKm,
      isActive:         profile.isActive,
      tariff: profile.tariff
        ? { baseFee: profile.tariff.baseFee.toString(), perKmFee: profile.tariff.perKmFee.toString() }
        : null,
    });
  }
);
