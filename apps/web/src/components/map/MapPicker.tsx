import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "../../lib/mapIcons";
import { reverseGeocode } from "../../lib/geocode";
import type { LatLng } from "../../lib/geo";

export type { LatLng };

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

/** Haritayı dışarıdan gelen center belirgin şekilde değiştiğinde (>0.5°) yeniden odaklar. */
function RecenterOnChange({ center }: { center: LatLng }) {
  const map = useMap();
  const prevRef = useRef<LatLng | null>(null);
  useEffect(() => {
    const prev = prevRef.current;
    if (!prev || Math.abs(prev.lat - center.lat) > 0.5 || Math.abs(prev.lng - center.lng) > 0.5) {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }
    prevRef.current = center;
  }, [map, center]);
  return null;
}

type MapPickerProps = {
  center: LatLng;
  value: LatLng | null;
  onChange: (p: LatLng) => void;
  helperText?: string;
};

export default function MapPicker({ center, value, onChange, helperText }: MapPickerProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [addrLoading, setAddrLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!value) { setAddress(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAddrLoading(true);
    debounceRef.current = setTimeout(() => {
      reverseGeocode(value.lat, value.lng).then((a) => {
        setAddress(a);
        setAddrLoading(false);
      });
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value?.lat, value?.lng]);

  return (
    <div className="map-stack">
      <div className="map-wrap" role="application" aria-label="Harita">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterOnChange center={center} />
          <ClickHandler onPick={onChange} />
          {value ? (
            <Marker
              position={[value.lat, value.lng]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = e.target.getLatLng();
                  onChange({ lat: ll.lat, lng: ll.lng });
                },
              }}
            />
          ) : null}
        </MapContainer>
      </div>
      {value && (address || addrLoading) ? (
        <div style={{
          marginTop: 8, padding: "8px 12px", background: "#f8fafc",
          border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.85rem",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <span style={{ color: "#64748b" }}>📍</span>
          {addrLoading
            ? <span style={{ color: "#94a3b8" }}>Adres aranıyor…</span>
            : <span>{address}</span>
          }
        </div>
      ) : null}
      {helperText ? <p className="map-hint muted">{helperText}</p> : null}
    </div>
  );
}
