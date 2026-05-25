import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import type { ReactNode } from 'react';
import L from 'leaflet';

// ── Custom SVG div-icons (no broken PNG paths) ────────────────────────────────
function svgIcon(svg: string, size = 32) {
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const pickupIcon = svgIcon(`
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="10" fill="#000" stroke="#22c55e" stroke-width="2.5"/>
    <circle cx="16" cy="16" r="5" fill="#22c55e"/>
  </svg>`);

const destIcon = svgIcon(`
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="10" fill="#000" stroke="#ef4444" stroke-width="2.5"/>
    <circle cx="16" cy="16" r="5" fill="#ef4444"/>
  </svg>`);

const liveIcon = svgIcon(`
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="13" fill="#f59e0b" fill-opacity="0.18"/>
    <circle cx="16" cy="16" r="9" fill="#000" stroke="#f59e0b" stroke-width="2.5"/>
    <circle cx="16" cy="16" r="4" fill="#f59e0b"/>
  </svg>`, 36);

const centerIcon = svgIcon(`
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="13" fill="#f59e0b" fill-opacity="0.12"/>
    <circle cx="16" cy="16" r="9" fill="#000" stroke="#f59e0b" stroke-width="2.5"/>
    <circle cx="16" cy="16" r="4" fill="#f59e0b"/>
  </svg>`, 36);

function ClickToSelect({ enabled, onSelect }: { enabled: boolean; onSelect?: (point: LatLng) => void }) {
  useMapEvents({
    click(event) {
      if (!enabled || !onSelect) return;
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function FitRoute({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);
  return null;
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface LatLng { lat: number; lng: number; }

interface MapViewProps {
  height?: number | string;
  pickup?: LatLng | null;
  destination?: LatLng | null;
  operatorLocation?: LatLng | null;
  routePoints?: LatLng[] | null;
  center?: LatLng;
  chip?: ReactNode;
  interactive?: boolean;
  onSelectLocation?: (point: LatLng) => void;
}

const ISTANBUL: LatLng = { lat: 41.0082, lng: 28.9784 };

// ── MapView ───────────────────────────────────────────────────────────────────
export default function MapView({
  height = 240,
  pickup,
  destination,
  operatorLocation,
  routePoints,
  center,
  chip,
  interactive = false,
  onSelectLocation,
}: MapViewProps) {
  const [route, setRoute] = useState<{
    from: LatLng;
    to: LatLng;
    points: [number, number][];
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (routePoints && routePoints.length >= 2) {
      return;
    }
    if (!pickup || !destination) {
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const pickupLat = pickup.lat;
    const pickupLng = pickup.lng;
    const destinationLat = destination.lat;
    const destinationLng = destination.lng;

    const url = `https://router.project-osrm.org/route/v1/driving/${pickupLng},${pickupLat};${destinationLng},${destinationLat}?overview=full&geometries=geojson`;

    fetch(url, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => {
        if (d.routes?.[0]?.geometry?.coordinates) {
          const coords: [number, number][] = d.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          setRoute({
            from: { lat: pickupLat, lng: pickupLng },
            to: { lat: destinationLat, lng: destinationLng },
            points: coords,
          });
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) {
          setRoute({
            from: { lat: pickupLat, lng: pickupLng },
            to: { lat: destinationLat, lng: destinationLng },
            points: [[pickupLat, pickupLng], [destinationLat, destinationLng]],
          });
        }
      });

    return () => ctrl.abort();
  }, [pickup, destination, routePoints]);

  const mapCenter = center ?? pickup ?? destination ?? ISTANBUL;
  const hasRoute = Boolean(routePoints?.length || (pickup && destination));
  const routeLine = useMemo(() => {
    if (routePoints && routePoints.length >= 2) {
      return routePoints.map((p) => [p.lat, p.lng] as [number, number]);
    }
    if (!pickup || !destination) return null;
    if (
      route &&
      route.from.lat === pickup.lat &&
      route.from.lng === pickup.lng &&
      route.to.lat === destination.lat &&
      route.to.lng === destination.lng
    ) {
      return route.points;
    }
    return [[pickup.lat, pickup.lng], [destination.lat, destination.lng]] as [number, number][];
  }, [routePoints, route, pickup, destination]);

  return (
    <div style={{ height, borderRadius: 'var(--r-md)', overflow: 'hidden', position: 'relative' }} className="map-real">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={pickup && destination ? 11 : 12}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ClickToSelect enabled={interactive} onSelect={onSelectLocation} />

        {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
        {destination && <Marker position={[destination.lat, destination.lng]} icon={destIcon} />}
        {operatorLocation && <Marker position={[operatorLocation.lat, operatorLocation.lng]} icon={liveIcon} />}
        {center && !pickup && <Marker position={[center.lat, center.lng]} icon={centerIcon} />}

        {routeLine && (
          <>
            <Polyline positions={routeLine} color="#f59e0b" weight={4} opacity={0.9} />
            <Polyline positions={routeLine} color="#f59e0b" weight={12} opacity={0.15} />
          </>
        )}

        {hasRoute && routeLine && <FitRoute points={routeLine} />}
      </MapContainer>

      {chip && <div className="map__chip">{chip}</div>}
    </div>
  );
}
