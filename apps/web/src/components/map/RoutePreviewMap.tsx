import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "../../lib/mapIcons";
import { destIcon } from "../../lib/mapIcons";
import type { LatLng } from "../../lib/geo";

export type { LatLng };

export type RoutePreviewData = {
  points: LatLng[];
  distanceKm: number;
  durationMinutes: number;
  source: string;
};

const SOURCE_LABELS: Record<string, string> = {
  google: "Kaynak: Google Directions",
  osrm: "Kaynak: OpenRouteService",
  straight: "Kaynak: Tahmini düz hat",
};

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15, animate: false });
  }, [map, points]);
  return null;
}

type Props = {
  pickup: LatLng;
  destination: LatLng;
  route: RoutePreviewData | null;
};

export default function RoutePreviewMap({ pickup, destination, route }: Props) {
  const positions: [number, number][] = route?.points.map((p) => [p.lat, p.lng]) ?? [];
  const hasRoute = positions.length >= 2;

  return (
    <div className="map-stack" style={{ marginTop: 16 }}>
      <div className="map-wrap" role="application" aria-label="Rota önizleme haritası">
        <MapContainer
          center={[pickup.lat, pickup.lng]}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasRoute ? (
            <Polyline positions={positions} pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.85 }} />
          ) : null}
          <Marker position={[pickup.lat, pickup.lng]} />
          <Marker position={[destination.lat, destination.lng]} icon={destIcon} />
          {hasRoute ? <FitBounds points={route!.points} /> : null}
        </MapContainer>
      </div>

      {route ? (
        <div className="row" style={{ marginTop: 10, gap: 16, flexWrap: "wrap" }}>
          <span className="muted">
            Tahmini mesafe: <strong style={{ color: "var(--text)" }}>{route.distanceKm} km</strong>
          </span>
          <span className="muted">
            Tahmini süre: <strong style={{ color: "var(--text)" }}>~{route.durationMinutes} dk</strong>
          </span>
          <span className="muted" style={{ fontSize: "0.8rem" }}>
            {SOURCE_LABELS[route.source] ?? route.source}
          </span>
        </div>
      ) : (
        <p className="muted" style={{ marginTop: 8, fontSize: "0.85rem" }}>Rota hesaplanıyor…</p>
      )}
    </div>
  );
}
