import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { sendError } from "../lib/errors.js";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      operatorProfile: { include: { tariff: true } },
      customerProfile: true,
    },
  });
  if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Kullanıcı yok" } });

  return res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    // Müşteri profili (yalnızca müşteriler için)
    customerProfile: user.role === "customer"
      ? {
          name:              user.customerProfile?.name ?? "",
          phone:             user.customerProfile?.phone ?? null,
          savedVehicleBrand: user.customerProfile?.savedVehicleBrand ?? null,
          savedVehicleModel: user.customerProfile?.savedVehicleModel ?? null,
          savedVehiclePlate: user.customerProfile?.savedVehiclePlate ?? null,
        }
      : null,
    // Operatör profili (yalnızca operatörler için)
    operatorProfile: user.operatorProfile
      ? {
          id:               user.operatorProfile.id,
          businessName:     user.operatorProfile.businessName,
          vehicleInfo:      user.operatorProfile.vehicleInfo,
          vehicleType:      user.operatorProfile.vehicleType,
          vehicleModel:     user.operatorProfile.vehicleModel,
          vehicleYear:      user.operatorProfile.vehicleYear,
          vehiclePlate:     user.operatorProfile.vehiclePlate,
          capacityNote:     user.operatorProfile.capacityNote,
          phone:            user.operatorProfile.phone,
          serviceCenterLat: user.operatorProfile.serviceCenterLat,
          serviceCenterLng: user.operatorProfile.serviceCenterLng,
          serviceRadiusKm:  user.operatorProfile.serviceRadiusKm,
          isActive:         user.operatorProfile.isActive,
          tariff: user.operatorProfile.tariff
            ? {
                baseFee:  user.operatorProfile.tariff.baseFee.toString(),
                perKmFee: user.operatorProfile.tariff.perKmFee.toString(),
              }
            : null,
        }
      : null,
  });
});

const customerProfileSchema = z.object({
  name:              z.string().max(120).optional().default(""),
  phone:             z.string().max(20).optional().nullable(),
  savedVehicleBrand: z.string().max(50).optional().nullable(),
  savedVehicleModel: z.string().max(80).optional().nullable(),
  savedVehiclePlate: z.string().max(15).optional().nullable(),
});

// Müşteri profili güncelle (oluşturmak için de kullanılır)
meRouter.put("/", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "customer") {
    return sendError(res, 403, "FORBIDDEN", "Bu endpoint yalnızca müşteri hesapları içindir");
  }

  const parsed = customerProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz istek gövdesi", parsed.error.flatten());
  }
  const d = parsed.data;

  const profile = await prisma.customerProfile.upsert({
    where:  { userId: req.user!.id },
    create: {
      userId:            req.user!.id,
      name:              d.name,
      phone:             d.phone ?? null,
      savedVehicleBrand: d.savedVehicleBrand ?? null,
      savedVehicleModel: d.savedVehicleModel ?? null,
      savedVehiclePlate: d.savedVehiclePlate
        ? d.savedVehiclePlate.toUpperCase()
        : null,
    },
    update: {
      name:              d.name,
      phone:             d.phone ?? null,
      savedVehicleBrand: d.savedVehicleBrand ?? null,
      savedVehicleModel: d.savedVehicleModel ?? null,
      savedVehiclePlate: d.savedVehiclePlate
        ? d.savedVehiclePlate.toUpperCase()
        : null,
    },
  });

  return res.json({
    name:              profile.name,
    phone:             profile.phone,
    savedVehicleBrand: profile.savedVehicleBrand,
    savedVehicleModel: profile.savedVehicleModel,
    savedVehiclePlate: profile.savedVehiclePlate,
  });
});
