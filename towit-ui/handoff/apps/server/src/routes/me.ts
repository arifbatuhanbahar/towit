// ─── apps/server/src/routes/me.ts ────────────────────────────────────────────
// CHANGED sections only. Merge into your existing me.ts.
// ─────────────────────────────────────────────────────────────────────────────

// ── Updated GET /me Prisma select ─────────────────────────────────────────────
// In your existing prisma.user.findUnique select, extend operatorProfile:

/*
  operatorProfile: {
    select: {
      id:           true,
      businessName: true,
      serviceRadius: true,
      baseFee:      true,
      perKmFee:     true,
      rating:       true,
      ratingCount:  true,

      // ── NEW ──
      phone:        true,
      vehicleModel: true,
      vehicleYear:  true,
      vehiclePlate: true,
      vehicleType:  true,
      capacityNote: true,
    },
  },
*/

// ── Updated GET /me response type ─────────────────────────────────────────────
// Extend your existing MeResponse / OperatorProfileDto type:

export type OperatorProfileDto = {
  id:            string;
  businessName:  string;
  serviceRadius: number;
  baseFee:       number;
  perKmFee:      number;
  rating:        number;
  ratingCount:   number;

  // ── NEW ──
  phone:         string | null;
  vehicleModel:  string;
  vehicleYear:   number | null;
  vehiclePlate:  string | null;
  vehicleType:   "platform" | "vinclu" | "kanca" | "motorsiklet" | "agir";
  capacityNote:  string | null;
};
