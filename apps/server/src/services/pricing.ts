import { Prisma } from "@prisma/client";

export function previewPrice(
  baseFee: Prisma.Decimal,
  perKmFee: Prisma.Decimal,
  distanceKm: number
): Prisma.Decimal {
  const base = new Prisma.Decimal(baseFee);
  const perKm = new Prisma.Decimal(perKmFee);
  const km = new Prisma.Decimal(distanceKm.toFixed(3));
  return base.add(perKm.mul(km));
}
