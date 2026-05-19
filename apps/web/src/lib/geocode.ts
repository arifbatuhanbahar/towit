/** Nominatim reverse geocoding — koordinat → okunabilir adres */

type NominatimResult = {
  display_name?: string;
  address?: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    district?: string;
    county?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

/** Koordinatı kısa, okunabilir adrese çevirir. Hata olursa null döner. */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "tr", "User-Agent": "Towit/1.0" },
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return null;
    const data: NominatimResult = await res.json();
    const a = data.address;
    if (!a) return data.display_name?.split(",").slice(0, 3).join(", ") ?? null;

    const parts: string[] = [];
    if (a.road) parts.push(a.road);
    else if (a.neighbourhood) parts.push(a.neighbourhood);
    const district = a.suburb ?? a.district ?? a.county;
    if (district) parts.push(district);
    const city = a.city ?? a.town ?? a.village ?? a.state;
    if (city && city !== district) parts.push(city);
    return parts.length ? parts.join(", ") : (data.display_name?.split(",").slice(0, 3).join(", ") ?? null);
  } catch {
    return null;
  }
}
