// ─── apps/server/src/routes/jobs.ts ──────────────────────────────────────────
// CHANGED sections only. Merge into your existing jobs.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// ── Updated createJobSchema ───────────────────────────────────────────────────
// Extend your existing createJobSchema:

export const createJobSchema = z.object({
  // … your existing fields (regionId, pickupLat, pickupLng, destLat, destLng, operatorId) …

  // ── NEW ──
  customerVehicleBrand: z.string().max(50).optional(),
  customerVehicleModel: z.string().max(80).optional(),
  customerVehiclePlate: z.string().max(15).optional(),
  breakdownType: z
    .enum(["lastik", "motor", "aku", "yakıt", "kaza", "diger"])
    .default("diger"),
  customerPhone: z.string().max(20).optional(),
});

// ── Updated POST /jobs Prisma create call ─────────────────────────────────────
// In your existing prisma.job.create data block, add:

/*
  data: {
    // … existing fields …
    customerVehicleBrand: data.customerVehicleBrand ?? null,
    customerVehicleModel: data.customerVehicleModel ?? null,
    customerVehiclePlate: data.customerVehiclePlate ?? null,
    breakdownType:        data.breakdownType,
    customerPhone:        data.customerPhone ?? null,
  },
*/

// ── Updated GET /jobs/:id Prisma select ───────────────────────────────────────
// Extend the prisma.job.findUnique select (used by both customer & operator):

/*
  select: {
    // … existing fields …
    customerVehicleBrand: true,
    customerVehicleModel: true,
    customerVehiclePlate: true,
    breakdownType:        true,
    customerPhone:        true,

    operator: {
      select: {
        // … existing operator selects …
        operatorProfile: {
          select: {
            businessName: true,
            vehicleType:  true,
            vehicleModel: true,
            vehicleYear:  true,
            phone:        true,
          },
        },
      },
    },
  },
*/

// ── Access-control note ───────────────────────────────────────────────────────
// customerPhone should only be returned when:
//   - The requesting user is the operator of this job
//   - AND job.status is "accepted" or "en_route"
// Otherwise return null.
//
// operator.operatorProfile.phone should only be returned when:
//   - The requesting user is the customer of this job
//   - AND job.status is "accepted" or "en_route"
// Otherwise return null.

/*
  Example guard (in your GET /jobs/:id handler):

  const canSeeCustomerPhone =
    requester.role === "operator" &&
    job.operatorId === requester.operatorProfile?.id &&
    ["accepted", "en_route"].includes(job.status);

  const canSeeOperatorPhone =
    requester.role === "customer" &&
    job.customerId === requester.id &&
    ["accepted", "en_route"].includes(job.status);

  return {
    ...job,
    customerPhone: canSeeCustomerPhone ? job.customerPhone : null,
    operator: {
      ...job.operator,
      operatorProfile: {
        ...job.operator.operatorProfile,
        phone: canSeeOperatorPhone
          ? job.operator.operatorProfile?.phone
          : null,
      },
    },
  };
*/
