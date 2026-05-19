import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { previewPrice } from "./pricing.js";

describe("previewPrice", () => {
  it("taban + km * birim ücret", () => {
    const base = new Prisma.Decimal("500");
    const perKm = new Prisma.Decimal("10");
    const total = previewPrice(base, perKm, 12.5);
    expect(total.toFixed(2)).toBe("625.00");
  });
});
