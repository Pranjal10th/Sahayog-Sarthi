import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker default icon resolution issue in Next.js/Webpack
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function BookingMap({ workerLocation, customerLocation, polylinePath }) {
  const center = workerLocation?.lat ? [workerLocation.lat, workerLocation.lng] : customerLocation;
  return (
    <MapContainer center={center} zoom={14} style={{ width: '100%', height: '100%', zIndex: 1 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={customerLocation}></Marker>
      {workerLocation?.lat && (
        <>
          <Marker position={[workerLocation.lat, workerLocation.lng]}></Marker>
          <Polyline positions={polylinePath} color="#2563eb" weight={4} dashArray="5, 10" />
          <ChangeMapView center={[workerLocation.lat, workerLocation.lng]} />
        </>
      )}
    </MapContainer>
  );
}
