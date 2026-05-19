import { describe, it, expect } from "vitest";
import { ACTIVE_STATUSES, FINAL_STATUSES, statusBadge } from "./jobStatus";

describe("statusBadge", () => {
  it("bilinen statü için label + renkler döner", () => {
    const b = statusBadge("open");
    expect(b.label).toBe("Çekiciye açık");
    expect(b.bg).toBeTruthy();
    expect(b.color).toBeTruthy();
  });

  it("bilinmeyen statüde ham değeri label yapar ve varsayılan rengi kullanır", () => {
    const b = statusBadge("wat");
    expect(b.label).toBe("wat");
    expect(b.bg).toBe("#f1f5f9");
  });
});

describe("status setleri", () => {
  it("aktif ve final kümeleri çakışmaz", () => {
    for (const s of ACTIVE_STATUSES) expect(FINAL_STATUSES.has(s)).toBe(false);
  });
  it("accepted aktif, completed finaldir", () => {
    expect(ACTIVE_STATUSES.has("accepted")).toBe(true);
    expect(FINAL_STATUSES.has("completed")).toBe(true);
  });
});
