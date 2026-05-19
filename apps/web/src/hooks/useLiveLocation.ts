import { useEffect, useState } from "react";
import type { LatLng } from "../lib/geo";

type Options = {
  /** Takip aktif mi? false olursa izleyici durur ve pozisyon temizlenmez. */
  enabled: boolean;
  /** Opsiyonel: her yeni konum aldığında tetiklenir. */
  onPosition?: (pos: LatLng) => void;
};

type Result = {
  pos: LatLng | null;
  error: string | null;
};

/**
 * Tarayıcının `geolocation.watchPosition` API'sini React hook olarak sarar.
 * Yüksek hassasiyet ister, yaşlanmış konumu en fazla 5 sn tolere eder.
 */
export function useLiveLocation({ enabled, onPosition }: Options): Result {
  const [pos, setPos] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!navigator.geolocation) {
      setError("Tarayıcı konum paylaşımını desteklemiyor.");
      return;
    }

    setError(null);
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const next = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(next);
        onPosition?.(next);
      },
      () => setError("Canlı konum alınamadı."),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [enabled, onPosition]);

  return { pos, error };
}
