import { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "../../lib/mapIcons";
import { destIcon, operatorHqIcon, pickupIcon } from "../../lib/mapIcons";
import { api } from "../../lib/api";
import type { LatLng } from "../../lib/geo";

export type { LatLng };

type RouteResult = {
  points: LatLng[];
  distanceKm: number;
  durationMinutes: number;
  source: string;
};

function FitAll({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const b = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(b, { padding: [40, 40], maxZoom: 14, animate: false });
  }, [map, points]);
  return null;
}

async function fetchRoute(from: LatLng, to: LatLng): Promise<RouteResult | null> {
  const qs = `?fromLat=${from.lat}&fromLng=${from.lng}&toLat=${to.lat}&toLng=${to.lng}`;
  return api<RouteResult>(`/directions${qs}`).catch(() => null);
}

type Props = {
  operatorCenter: LatLng;
  pickup: LatLng;
  destination: LatLng;
  jobDistanceKm: number;
  distanceToPickupKm: number;
  previewTotal: string;
  onConfirm?: () => void;
  busy?: boolean;
  confirmLabel?: string;
};

export default function OperatorPreviewMap({
  operatorCenter,
  pickup,
  destination,
  jobDistanceKm,
  distanceToPickupKm,
  previewTotal,
  onConfirm,
  busy = false,
  confirmLabel = "Bu çekiciyi seç ve devam et",
}: Props) {
  const [toPickup, setToPickup] = useState<RouteResult | null>(null);
  const [jobRoute, setJobRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      fetchRoute(operatorCenter, pickup),
      fetchRoute(pickup, destination),
    ]).then(([r1, r2]) => {
      if (!alive) return;
      setToPickup(r1);
      setJobRoute(r2);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [operatorCenter.lat, operatorCenter.lng, pickup.lat, pickup.lng, destination.lat, destination.lng]);

  const allPoints: LatLng[] = [
    ...(toPickup?.points ?? []),
    ...(jobRoute?.points ?? []),
    operatorCenter,
    pickup,
    destination,
  ];
  const toPickupPos: [number, number][] = toPickup?.points.map((p) => [p.lat, p.lng]) ?? [];
  const jobRoutePos: [number, number][] = jobRoute?.points.map((p) => [p.lat, p.lng]) ?? [];

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
        <StatCard bg="#f5f3ff" border="#ddd6fe" label="Çekicinin uzaklığı" value={`~${distanceToPickupKm.toFixed(1)} km`} sub={toPickup ? `~${toPickup.durationMinutes} dk` : undefined} />
        <StatCard bg="#eff6ff" border="#bfdbfe" label="Yolculuk mesafesi" value={`${jobDistanceKm.toFixed(1)} km`} sub={jobRoute ? `~${jobRoute.durationMinutes} dk` : undefined} />
        <StatCard bg="#f0fdf4" border="#bbf7d0" label="Tahmini ücret" value={`${previewTotal} ₺`} />
      </div>

      <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <MapContainer
          center={[pickup.lat, pickup.lng]}
          zoom={12}
          style={{ height: 260, width: "100%" }}
          scrollWheelZoom={false}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {toPickupPos.length >= 2 ? (
            <Polyline positions={toPickupPos} pathOptions={{ color: "#7c3aed", weight: 5, opacity: 0.8, dashArray: "8,4" }} />
          ) : null}
          {jobRoutePos.length >= 2 ? (
            <Polyline positions={jobRoutePos} pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.9 }} />
          ) : null}
          <Marker position={[operatorCenter.lat, operatorCenter.lng]} icon={operatorHqIcon} title="Çekici konumu" />
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} title="Çekim noktası" />
          <Marker position={[destination.lat, destination.lng]} icon={destIcon} title="Varış noktası" />
          {allPoints.length >= 2 && !loading ? <FitAll points={allPoints} /> : null}
        </MapContainer>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        <Legend color="#7c3aed" shape="line" label="Çekici → çekim" />
        <Legend color="#2563eb" shape="line" label="Çekim → varış" />
        <Legend color="#7c3aed" shape="square" label="Çekici merkezi" />
        <Legend color="#16a34a" shape="circle" label="Çekim" />
        <Legend color="#dc2626" shape="circle" label="Varış" />
      </div>

      {loading ? <p className="muted" style={{ marginTop: 8, fontSize: "0.85rem" }}>Rotalar hesaplanıyor…</p> : null}

      {onConfirm ? (
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 14, width: "100%" }}
          onClick={onConfirm}
          disabled={busy}
        >
          {confirmLabel}
        </button>
      ) : null}
    </div>
  );
}

function StatCard({ bg, border, label, value, sub }: { bg: string; border: string; label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 10px" }}>
      <div className="muted" style={{ fontSize: "0.72rem", marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: "1rem" }}>{value}</div>
      {sub ? <div className="muted" style={{ fontSize: "0.72rem" }}>{sub}</div> : null}
    </div>
  );
}

function Legend({ color, shape, label }: { color: string; shape: "line" | "square" | "circle"; label: string }) {
  const style: React.CSSProperties =
    shape === "line"
      ? { display: "inline-block", width: 16, height: 3, background: color, borderRadius: 2 }
      : shape === "square"
        ? { display: "inline-block", width: 10, height: 10, borderRadius: 2, background: color }
        : { display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: color };
  return (
    <span className="muted" style={{ fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 5 }}>
      <span style={style} />
      {label}
    </span>
  );
}
