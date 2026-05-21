-- Migration: 20260521000000_vehicle_details
-- Adds vehicle/breakdown details to OperatorProfile and Job models.
-- All new columns are nullable or have DEFAULT values → zero downtime.

-- ── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE "VehicleType" AS ENUM (
  'platform',
  'vinclu',
  'kanca',
  'motorsiklet',
  'agir'
);

CREATE TYPE "BreakdownType" AS ENUM (
  'lastik',
  'motor',
  'aku',
  'yakıt',
  'kaza',
  'diger'
);

-- ── OperatorProfile additions ───────────────────────────────────────────────

ALTER TABLE "OperatorProfile"
  ADD COLUMN "phone"         TEXT,
  ADD COLUMN "vehicleModel"  TEXT         NOT NULL DEFAULT '',
  ADD COLUMN "vehicleYear"   INTEGER,
  ADD COLUMN "vehiclePlate"  TEXT,
  ADD COLUMN "vehicleType"   "VehicleType" NOT NULL DEFAULT 'platform',
  ADD COLUMN "capacityNote"  TEXT;

-- ── Job additions ───────────────────────────────────────────────────────────

ALTER TABLE "Job"
  ADD COLUMN "customerVehicleBrand" TEXT,
  ADD COLUMN "customerVehicleModel" TEXT,
  ADD COLUMN "customerVehiclePlate" TEXT,
  ADD COLUMN "breakdownType"        "BreakdownType" NOT NULL DEFAULT 'diger',
  ADD COLUMN "customerPhone"        TEXT;
