'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLngExpression, Map as LeafletMap } from 'leaflet';

// Фикс иконок Leaflet (только на клиенте)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface Route {
  id: number;
  order_number: number;
  status: string;
  point: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
}

interface MapProps {
  routes: Route[];
  userLocation: { lat: number; lon: number } | null;
  followMode: boolean;
  onStatusUpdate?: (routeId: number, status: string) => void;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
}

// Внутренний компонент, где можно безопасно использовать useMap()
function MapInner({
  routes,
  userLocation,
  followMode,
  getStatusText,
  getStatusColor,
  forwardedRef,
}: {
  routes: Route[];
  userLocation: { lat: number; lon: number } | null;
  followMode: boolean;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
  forwardedRef: React.ForwardedRef<LeafletMap | null>;
}) {
  const map = useMap(); // Теперь это безопасно — внутри MapContainer

  // Сохраняем ref на карту
  useEffect(() => {
    if (forwardedRef) {
      if (typeof forwardedRef === 'function') {
        forwardedRef(map);
      } else {
        forwardedRef.current = map;
      }
    }
  }, [map, forwardedRef]);

  // Следим за позицией пользователя
  const lastLocationRef = useRef<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!userLocation || !followMode) return;

    const locationChanged =
      !lastLocationRef.current ||
      Math.abs(lastLocationRef.current.lat - userLocation.lat) > 0.0001 ||
      Math.abs(lastLocationRef.current.lon - userLocation.lon) > 0.0001;

    if (locationChanged) {
      map.flyTo([userLocation.lat, userLocation.lon], 17, { duration: 0.5 });
      lastLocationRef.current = userLocation;
    }
  }, [userLocation, followMode, map]);

  const getCustomIcon = (status: string) => {
    const color = getStatusColor(status);
    return new L.DivIcon({
      className: 'custom-marker',
      html: `<div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      "></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const defaultCenter: LatLngExpression = [54.7, 39.79] as const;

  const center: LatLngExpression = userLocation
    ? [userLocation.lat, userLocation.lon] as const
    : routes.length > 0
    ? [routes[0].point.latitude, routes[0].point.longitude] as const
    : defaultCenter;

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {routes.map((route) => (
        <Marker
          key={route.id}
          position={[route.point.latitude, route.point.longitude] as const}
          icon={getCustomIcon(route.status)}
        >
          <Popup>
            <div style={{ minWidth: '220px' }}>
              <strong style={{ fontSize: '16px' }}>
                #{route.order_number} {route.point.name}
              </strong>
              <br />
              <span style={{ color: '#666', fontSize: '13px' }}>
                {route.point.address}
              </span>
              <div style={{ marginTop: '8px', padding: '5px', background: '#f5f5f5', borderRadius: '4px' }}>
                Статус:{' '}
                <strong style={{ color: getStatusColor(route.status) }}>
                  {getStatusText(route.status)}
                </strong>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lon] as const}
          icon={
            new L.DivIcon({
              className: 'user-marker',
              html: `<div style="
                background: #F44336;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
              "></div>
              <style>
                @keyframes pulse {
                  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7); }
                  70% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
                  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
                }
              </style>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })
          }
        >
        </Marker>
      )}
    </>
  );
}

// Корневой компонент
export const Map = forwardRef<LeafletMap | null, MapProps>(
  ({ routes, userLocation, followMode, getStatusText, getStatusColor }, ref) => {
    const defaultCenter: LatLngExpression = [54.7, 39.79] as const;

    const center: LatLngExpression = userLocation
      ? [userLocation.lat, userLocation.lon] as const
      : routes.length > 0
      ? [routes[0].point.latitude, routes[0].point.longitude] as const
      : defaultCenter;

    return (
      <MapContainer
        center={center}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
      >
        <MapInner
          routes={routes}
          userLocation={userLocation}
          followMode={followMode}
          getStatusText={getStatusText}
          getStatusColor={getStatusColor}
          forwardedRef={ref}
        />
      </MapContainer>
    );
  }
);

Map.displayName = 'Map';