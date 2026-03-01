import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

/** Fixes partial tile rendering when map mounts inside a hidden tab */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const invalidate = () => map.invalidateSize();

    invalidate();
    const timer = setTimeout(invalidate, 150);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) invalidate();
      },
      { threshold: 0.01 }
    );
    observer.observe(container);

    window.addEventListener("resize", invalidate);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);
  return null;
}

interface LocationMapProps {
  latitude: number;
  longitude: number;
}

const LocationMap: React.FC<LocationMapProps> = ({ latitude, longitude }) => {
  const position: [number, number] = [latitude, longitude];

  return (
    <div style={{ height: "300px", width: "100%", marginTop: "1rem" }}>
      <MapContainer
        {...({
          center: position,
          zoom: 13,
          style: { height: "100%", width: "100%" },
          scrollWheelZoom: false,
        } as any)}
      >
        <MapResizer />
        <TileLayer
          {...({
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          } as any)}
        />
        <CircleMarker
          {...({
            center: position,
            radius: 10,
            pathOptions: { color: "#433728" },
          } as any)}
        >
          <Popup>Your approximate location</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
};

export default LocationMap;

