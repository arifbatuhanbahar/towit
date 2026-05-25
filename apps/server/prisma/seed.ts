import { PrismaClient, Role, VehicleType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo1234";
const DEMO_CUSTOMER_EMAIL = process.env.DEMO_CUSTOMER_EMAIL ?? "musteri@towit.tr";
const DEMO_OPERATOR_EMAIL = process.env.DEMO_OPERATOR_EMAIL ?? "sofor@towit.tr";

async function upsertDemoCustomer(passwordHash: string) {
  const customer = await prisma.user.upsert({
    where: { email: DEMO_CUSTOMER_EMAIL },
    update: {
      passwordHash,
      role: Role.customer,
    },
    create: {
      email: DEMO_CUSTOMER_EMAIL,
      passwordHash,
      role: Role.customer,
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: customer.id },
    update: {
      name: "Demo Musteri",
      phone: "+905551112233",
      savedVehicleBrand: "Renault",
      savedVehicleModel: "Clio",
      savedVehiclePlate: "34 DEMO 01",
    },
    create: {
      userId: customer.id,
      name: "Demo Musteri",
      phone: "+905551112233",
      savedVehicleBrand: "Renault",
      savedVehicleModel: "Clio",
      savedVehiclePlate: "34 DEMO 01",
    },
  });
}

async function upsertDemoOperator(passwordHash: string) {
  const operator = await prisma.user.upsert({
    where: { email: DEMO_OPERATOR_EMAIL },
    update: {
      passwordHash,
      role: Role.operator,
    },
    create: {
      email: DEMO_OPERATOR_EMAIL,
      passwordHash,
      role: Role.operator,
    },
  });

  const profile = await prisma.operatorProfile.upsert({
    where: { userId: operator.id },
    update: {
      businessName: "Towit Demo Cekici",
      vehicleInfo: "Platform cekici",
      phone: "+905559998877",
      vehicleType: VehicleType.platform,
      vehicleModel: "Ford Transit",
      vehicleYear: 2022,
      vehiclePlate: "34 DEMO 34",
      capacityNote: "Maks. 2.5 ton",
      serviceCenterLat: 41.0082,
      serviceCenterLng: 28.9784,
      serviceRadiusKm: 30,
      isActive: true,
    },
    create: {
      userId: operator.id,
      businessName: "Towit Demo Cekici",
      vehicleInfo: "Platform cekici",
      phone: "+905559998877",
      vehicleType: VehicleType.platform,
      vehicleModel: "Ford Transit",
      vehicleYear: 2022,
      vehiclePlate: "34 DEMO 34",
      capacityNote: "Maks. 2.5 ton",
      serviceCenterLat: 41.0082,
      serviceCenterLng: 28.9784,
      serviceRadiusKm: 30,
      isActive: true,
    },
  });

  await prisma.tariff.upsert({
    where: { operatorId: profile.id },
    update: {
      baseFee: "350",
      perKmFee: "24",
    },
    create: {
      operatorId: profile.id,
      baseFee: "350",
      perKmFee: "24",
    },
  });
}

async function main() {
  const passwordHash = await hash(DEMO_PASSWORD, 10);

  await upsertDemoCustomer(passwordHash);
  await upsertDemoOperator(passwordHash);

  console.log(
    `Demo hesaplar hazir: ${DEMO_CUSTOMER_EMAIL}, ${DEMO_OPERATOR_EMAIL} (sifre: ${DEMO_PASSWORD})`
  );
}

main()
  .catch((error) => {
    console.error("Demo seed hatasi:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
