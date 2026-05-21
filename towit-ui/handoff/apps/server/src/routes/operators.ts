// ─── apps/server/src/routes/operators.ts ─────────────────────────────────────
// CHANGED sections only. Merge into your existing operators.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// ── Updated profileSchema ─────────────────────────────────────────────────────
// Replace / extend your existing profileSchema with these fields:

export const profileSchema = z.object({
  businessName:  z.string().min(1).max(120),
  serviceRadius: z.number().positive(),
  baseFee:       z.number().nonnegative(),
  perKmFee:      z.number().nonnegative(),

  // ── NEW ──
  phone:         z.string().max(20).optional().nullable(),
  vehicleModel:  z.string().min(1).max(120),
  vehicleYear:   z.number().int().min(1990).max(2030).optional().nullable(),
  vehiclePlate:  z.string().max(15).optional().nullable(),
  vehicleType:   z
    .enum(["platform", "vinclu", "kanca", "motorsiklet", "agir"])
    .default("platform"),
  capacityNote:  z.string().max(200).optional().nullable(),
});

// ── Updated /search row type ──────────────────────────────────────────────────
// Add these fields to the Row type returned by your /search endpoint.

type SearchRow = {
  // … your existing fields …
  phone:        string | null;
  vehicleModel: string;
  vehicleYear:  number | null;
  vehiclePlate: string | null;
  vehicleType:  string;
  capacityNote: string | null;
};

// ── Updated Prisma select in /search ─────────────────────────────────────────
// In your existing /search handler, extend the operatorProfile select:

/*
  operatorProfile: {
    select: {
      // … existing selects …
      phone:        true,
      vehicleModel: true,
      vehicleYear:  true,
      vehiclePlate: true,
      vehicleType:  true,
      capacityNote: true,
    },
  },
*/

// ── Updated /profile PUT handler ──────────────────────────────────────────────
// In your existing PUT /profile handler, extend the prisma.operatorProfile.upsert
// data block with the new fields:

/*
  data: {
    // … existing fields …
    phone:        data.phone        ?? null,
    vehicleModel: data.vehicleModel,
    vehicleYear:  data.vehicleYear  ?? null,
    vehiclePlate: data.vehiclePlate ?? null,
    vehicleType:  data.vehicleType,
    capacityNote: data.capacityNote ?? null,
  },
*/
