import { BreakdownType } from "@prisma/client";

type JobWithOperator = {
  id: string;
  status: string;
  priceSnapshot: { toString(): string } | string | number;
  distanceKm: number;
  createdAt: Date;
  breakdownType: string;
  customerVehicleBrand: string | null;
  customerVehicleModel: string | null;
  customerVehiclePlate: string | null;
  operator: {
    businessName: string;
    vehicleType: string;
    vehicleModel: string;
    vehicleYear: number | null;
  };
};

type JobWithCustomer = {
  id: string;
  status: string;
  priceSnapshot: { toString(): string } | string | number;
  distanceKm: number;
  createdAt: Date;
  breakdownType: string;
  customerEmail: string;
  customerVehicleBrand: string | null;
  customerVehicleModel: string | null;
  customerVehiclePlate: string | null;
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
};

type JobDetailShape = {
  id: string;
  status: string;
  priceSnapshot: { toString(): string } | string | number;
  distanceKm: number;
  cityCode: string;
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  operator: {
    businessName: string;
    vehicleType: string;
    vehicleModel: string;
    vehicleYear: number | null;
    phone: string | null;
  };
  customerEmail: string;
  customerVehicleBrand: string | null;
  customerVehicleModel: string | null;
  customerVehiclePlate: string | null;
  breakdownType: string;
  customerPhone: string | null;
  customerVehicleCategory: string;
  operatorLocation: { lat: number; lng: number; updatedAt: Date | null } | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toDbBreakdown(v: string): BreakdownType {
  return (v === "yakıt" ? "yakit" : v) as BreakdownType;
}

export function toUiBreakdown(v: string): string {
  return v === "yakit" ? "yakıt" : v;
}

export function serializeCustomerJobSummary(job: JobWithOperator) {
  return {
    id: job.id,
    status: job.status,
    priceSnapshot: job.priceSnapshot.toString(),
    distanceKm: job.distanceKm,
    createdAt: job.createdAt,
    breakdownType: toUiBreakdown(job.breakdownType),
    customerVehicleBrand: job.customerVehicleBrand,
    customerVehicleModel: job.customerVehicleModel,
    customerVehiclePlate: job.customerVehiclePlate,
    operator: {
      businessName: job.operator.businessName,
      vehicleType: job.operator.vehicleType,
      vehicleModel: job.operator.vehicleModel,
      vehicleYear: job.operator.vehicleYear,
    },
  };
}

export function serializeOperatorJobSummary(job: JobWithCustomer) {
  return {
    id: job.id,
    status: job.status,
    priceSnapshot: job.priceSnapshot.toString(),
    distanceKm: job.distanceKm,
    createdAt: job.createdAt,
    breakdownType: toUiBreakdown(job.breakdownType),
    customerEmail: job.customerEmail,
    customerVehicleBrand: job.customerVehicleBrand,
    customerVehicleModel: job.customerVehicleModel,
    customerVehiclePlate: job.customerVehiclePlate,
    pickup: job.pickup,
    destination: job.destination,
  };
}

export function serializeJobDetail(job: JobDetailShape) {
  return {
    id: job.id,
    status: job.status,
    priceSnapshot: job.priceSnapshot.toString(),
    distanceKm: job.distanceKm,
    cityCode: job.cityCode,
    pickup: job.pickup,
    destination: job.destination,
    operator: job.operator,
    customerEmail: job.customerEmail,
    customerVehicleBrand: job.customerVehicleBrand,
    customerVehicleModel: job.customerVehicleModel,
    customerVehiclePlate: job.customerVehiclePlate,
    breakdownType: toUiBreakdown(job.breakdownType),
    customerPhone: job.customerPhone,
    customerVehicleCategory: job.customerVehicleCategory,
    operatorLocation: job.operatorLocation,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}
