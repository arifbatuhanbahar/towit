-- AlterTable: operatör canlı konum alanları
ALTER TABLE "Job" ADD COLUMN "operatorLat"   DOUBLE PRECISION,
                  ADD COLUMN "operatorLng"   DOUBLE PRECISION,
                  ADD COLUMN "operatorLocAt" TIMESTAMP(3);
