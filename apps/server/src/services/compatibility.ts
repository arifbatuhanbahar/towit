import { VehicleType } from "@prisma/client";

export const COMPAT: Record<string, VehicleType[]> = {
  otomobil:     ["platform", "vinclu", "kanca", "ahtapot"],
  motorsiklet:  ["motorsiklet", "platform"],
  hafif_ticari: ["platform", "vinclu", "ahtapot"],
  agir_vasita:  ["agir"],
};
