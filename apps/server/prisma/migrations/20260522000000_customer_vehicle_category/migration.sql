-- CreateEnum
CREATE TYPE "CustomerVehicleCategory" AS ENUM ('otomobil','motorsiklet','hafif_ticari','agir_vasita');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "customerVehicleCategory" "CustomerVehicleCategory" NOT NULL DEFAULT 'otomobil';
