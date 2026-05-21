import { describe, expect, it } from "vitest";
import { parseOptionalOrigin } from "./jobRouting.js";

describe("parseOptionalOrigin", () => {
  const fallback = { lat: 41.0, lng: 29.0 };

  it("uses fallback when query has no origin", () => {
    expect(parseOptionalOrigin({}, fallback)).toEqual({ origin: fallback });
  });

  it("parses valid fromLat/fromLng values", () => {
    expect(parseOptionalOrigin({ fromLat: "41.1234", fromLng: "29.9876" }, fallback)).toEqual({
      origin: { lat: 41.1234, lng: 29.9876 },
    });
  });

  it("returns validation error for invalid coordinates", () => {
    expect(parseOptionalOrigin({ fromLat: "200", fromLng: "29.1" }, fallback)).toEqual({
      origin: fallback,
      error: "Başlangıç koordinatları geçersiz",
    });
  });
});
