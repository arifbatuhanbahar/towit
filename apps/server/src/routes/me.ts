import { Router } from "express";
import { prisma } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { operatorProfile: { include: { tariff: true } } },
  });
  if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Kullanıcı yok" } });
  return res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    operatorProfile: user.operatorProfile
      ? {
          id: user.operatorProfile.id,
          businessName: user.operatorProfile.businessName,
          vehicleInfo: user.operatorProfile.vehicleInfo,
          serviceCenterLat: user.operatorProfile.serviceCenterLat,
          serviceCenterLng: user.operatorProfile.serviceCenterLng,
          serviceRadiusKm: user.operatorProfile.serviceRadiusKm,
          isActive: user.operatorProfile.isActive,
          tariff: user.operatorProfile.tariff
            ? {
                baseFee: user.operatorProfile.tariff.baseFee.toString(),
                perKmFee: user.operatorProfile.tariff.perKmFee.toString(),
              }
            : null,
        }
      : null,
  });
});
