import { Router } from "express";
import { z } from "zod";
import { VehicleType } from "@prisma/client";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { sendError } from "../lib/errors.js";
import { isValidLatLng } from "../services/geo.js";
import { searchOperatorsForCustomer } from "../services/operatorSearch.js";

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
    void cityCode;
    if (!isValidLatLng(pickup.lat, pickup.lng) || !isValidLatLng(destination.lat, destination.lng)) {
      return sendError(res, 400, "INVALID_COORDINATES", "Çekim veya varış koordinatları geçersiz");
    }

    const result = await searchOperatorsForCustomer({
      pickup,
      destination,
      sort,
      customerVehicleCategory,
    });

    return res.json(result);
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

const UNICODE_REPLACEMENT_CHAR = "\uFFFD";

function hasReplacementChar(value: unknown): boolean {
  return typeof value === "string" && value.includes(UNICODE_REPLACEMENT_CHAR);
}

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
    const textFields: Array<[string, unknown]> = [
      ["businessName", d.businessName],
      ["vehicleInfo", d.vehicleInfo],
      ["phone", d.phone],
      ["vehicleModel", d.vehicleModel],
      ["vehiclePlate", d.vehiclePlate],
      ["capacityNote", d.capacityNote],
    ];
    const invalidField = textFields.find(([, value]) => hasReplacementChar(value));
    if (invalidField) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Metinde bozuk karakter algılandı. Lütfen ilgili alanı yeniden girin.",
        { field: invalidField[0] }
      );
    }

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
