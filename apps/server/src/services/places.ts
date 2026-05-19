type LatLng = { lat: number; lng: number };

export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
};

/**
 * Google Places Autocomplete (Legacy) — sunucu tarafında proxy yapar.
 * API anahtarı yoksa veya giriş çok kısaysa boş liste döner.
 */
export async function placesAutocomplete(
  input: string,
  _cityCode: string
): Promise<PlaceSuggestion[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || input.trim().length < 2) return [];

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("language", "tr");
  url.searchParams.set("components", "country:tr");
  url.searchParams.set("key", key);

  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    status: string;
    predictions?: {
      place_id: string;
      description: string;
      structured_formatting?: { main_text: string; secondary_text?: string };
    }[];
  };
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return [];
  return (data.predictions ?? []).slice(0, 8).map((p) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text,
    secondaryText: p.structured_formatting?.secondary_text,
  }));
}

/** Bir `placeId` için enlem/boylam çözer. */
export async function placeDetailsLatLng(placeId: string): Promise<LatLng | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "geometry/location");
  url.searchParams.set("key", key);
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status: string;
    result?: { geometry?: { location?: { lat: number; lng: number } } };
  };
  if (data.status !== "OK" || !data.result?.geometry?.location) return null;
  const loc = data.result.geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}
