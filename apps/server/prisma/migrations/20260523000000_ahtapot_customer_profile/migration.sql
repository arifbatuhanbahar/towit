-- AlterEnum: VehicleType'a ahtapot değeri ekle
ALTER TYPE "VehicleType" ADD VALUE 'ahtapot';

-- CreateTable: Müşteri profili (ad, telefon, kayıtlı araç)
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "savedVehicleBrand" TEXT,
    "savedVehicleModel" TEXT,
    "savedVehiclePlate" TEXT,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
