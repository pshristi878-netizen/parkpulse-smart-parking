import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

export type MapLot = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  hourly_price: number;
  available?: number;
  total?: number;
};

type Props = {
  lots: MapLot[];
  activeId?: string | null;
  height?: number;
  zoom?: number;
  onSelect?: (id: string) => void;
};

function pillColor(lot: MapLot) {
  if (lot.total === undefined || lot.total === 0) return "#34C759";
  if ((lot.available ?? 0) === 0) return "#e5484d"; // full
  if ((lot.available ?? 0) / lot.total <= 0.2) return "#e5a13a"; // scarce
  return "#34C759"; // plenty
}

function makeIcon(lot: MapLot, active: boolean) {
  const color = pillColor(lot);
  const scale = active ? 1.12 : 1;
  const price = `$${Number(lot.hourly_price).toFixed(0)}`;
  return L.divIcon({
    className: "pp-marker",
    html: `
      <div style="transform:scale(${scale});transform-origin:bottom center;">
        <div style="
          display:flex;align-items:center;gap:4px;
          background:${color};color:#fff;font-weight:700;font-size:12px;
          padding:5px 9px;border-radius:999px;white-space:nowrap;
          box-shadow:0 4px 12px rgba(0,0,0,.25);
          border:2px solid ${active ? "#0b3d24" : "rgba(255,255,255,.9)"};
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        ">
          ${price}/hr
        </div>
        <div style="
          width:0;height:0;margin:0 auto;
          border-left:6px solid transparent;border-right:6px solid transparent;
          border-top:7px solid ${color};
        "></div>
      </div>
    `,
    iconSize: [56, 34],
    iconAnchor: [28, 34],
    popupAnchor: [0, -34],
  });
}

function FitBounds({ lots, activeId }: { lots: MapLot[]; activeId?: string | null }) {
  const map = useMap();
  useEffect(() => {
    const active = lots.find((l) => l.id === activeId);
    if (active) {
      map.setView([active.latitude, active.longitude], 15, { animate: true });
      return;
    }
    if (lots.length === 0) return;
    if (lots.length === 1) {
      map.setView([lots[0].latitude, lots[0].longitude], 14);
      return;
    }
    const bounds = L.latLngBounds(
      lots.map((l) => [l.latitude, l.longitude] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [lots, activeId, map]);
  return null;
}

export default function LotMapClient({
  lots,
  activeId,
  height = 320,
  zoom = 13,
  onSelect,
}: Props) {
  const center = useMemo<[number, number]>(() => {
    if (lots.length > 0) return [lots[0].latitude, lots[0].longitude];
    return [37.7749, -122.4194];
  }, [lots]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height, width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <FitBounds lots={lots} activeId={activeId} />
      {lots.map((lot) => (
        <Marker
          key={lot.id}
          position={[lot.latitude, lot.longitude]}
          icon={makeIcon(lot, lot.id === activeId)}
          eventHandlers={{ click: () => onSelect?.(lot.id) }}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <p style={{ fontWeight: 700, margin: "0 0 2px", fontSize: 14 }}>
                {lot.name}
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 12, color: "#666" }}>
                {lot.address}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                }}
              >
                <span style={{ fontWeight: 700, color: "#0b7a3b" }}>
                  ${Number(lot.hourly_price).toFixed(2)}/hr
                </span>
                {lot.total !== undefined && (
                  <span style={{ color: pillColor(lot), fontWeight: 600 }}>
                    {lot.available ?? 0}/{lot.total} free
                  </span>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
