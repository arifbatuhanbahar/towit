import { describe, expect, it } from "vitest";
import { decodePolyline } from "./directions.js";

describe("decodePolyline", () => {
  it("kısa polyline çözer", () => {
    const pts = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(pts.length).toBeGreaterThan(1);
    expect(pts[0].lat).toBeCloseTo(38.5, 1);
    expect(pts[0].lng).toBeCloseTo(-120.2, 1);
  });
});
