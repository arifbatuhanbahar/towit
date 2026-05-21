import { prisma } from "../lib/db.js";
import { haversineKm } from "./geo.js";
import { resolveDrivingOrHaversineKm } from "./distance.js";
import { previewPrice } from "./pricing.js";
import { COMPAT } from "./compatibility.js";

export type OperatorSearchSort = "price" | "distance";
export type CustomerVehicleCategory = "otomobil" | "motorsiklet" | "hafif_ticari" | "agir_vasita";

export type OperatorSearchInput = {
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  sort: OperatorSearchSort;
  customerVehicleCategory?: CustomerVehicleCategory;
};

export async function searchOperatorsForCustomer({
  pickup,
  destination,
  sort,
  customerVehicleCategory,
}: OperatorSearchInput) {
  const { km: jobDistanceKm } = await resolveDrivingOrHaversineKm(pickup, destination);

  const ops = await prisma.operatorProfile.findMany({
    where: { isActive: true, tariff: { isNot: null } },
    include: { tariff: true, user: true },
  });

  const candidateIds = ops.filter((o) => o.tariff).map((o) => o.id);
  const ratings = candidateIds.length
    ? await prisma.review.groupBy({
        by: ["operatorId"],
        where: { operatorId: { in: candidateIds } },
        _avg: { rating: true },
        _count: { _all: true },
      })
    : [];
  const ratingMap = new Map(ratings.map((r) => [r.operatorId, { avg: r._avg.rating, count: r._count._all }]));

  const rows: Array<{
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
  }> = [];

  for (const op of ops) {
    if (!op.tariff) continue;
    const distToPickup = haversineKm(
      { lat: op.serviceCenterLat, lng: op.serviceCenterLng },
      pickup
    );
    if (distToPickup > op.serviceRadiusKm) continue;
    if (customerVehicleCategory) {
      const allowed = COMPAT[customerVehicleCategory] ?? [];
      if (!allowed.includes(op.vehicleType)) continue;
    }
    const total = previewPrice(op.tariff.baseFee, op.tariff.perKmFee, jobDistanceKm);
    const r = ratingMap.get(op.id);
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

  return { jobDistanceKm, operators: rows, sort };
}
