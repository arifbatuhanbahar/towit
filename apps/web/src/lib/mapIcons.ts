import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultLeafletIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultLeafletIcon;

function circleDivIcon(color: string, size = 20) {
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function squareDivIcon(color: string, size = 20) {
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:4px;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export const pickupIcon = circleDivIcon("#16a34a", 22);
export const destIcon = circleDivIcon("#dc2626", 22);
export const operatorLiveIcon = circleDivIcon("#f97316", 22);
export const operatorHqIcon = squareDivIcon("#7c3aed", 20);

/** Nabız atan mavi operatör işaretçisi — canlı navigasyon için. */
export const operatorPulsingIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:32px;height:32px">
    <div style="position:absolute;inset:0;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 12px rgba(37,99,235,.6)"></div>
    <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(37,99,235,.2);animation:pulse 1.8s ease-out infinite"></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
