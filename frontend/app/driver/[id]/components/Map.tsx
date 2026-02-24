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
    city: string;
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

// Внутренний компонент (где безопасно использовать useMap)
function MapInner({
  routes,
  userLocation,
  followMode,
  onStatusUpdate,
  getStatusText,
  getStatusColor,
}: {
  routes: Route[];
  userLocation: { lat: number; lon: number } | null;
  followMode: boolean;
  onStatusUpdate?: (routeId: number, status: string) => void;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
}) {
  const map = useMap();

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
            <div style={{ minWidth: 'auto', textAlign: 'center' }}>
              <strong style={{ fontSize: '16px', display: 'block', marginBottom: '1px' }}>
                {route.point.name}
              </strong>
              <span style={{ color: '#666', fontSize: '10px', display: 'block', marginBottom: '1px' }}>
                город {route.point.city}
              </span>
              <div style={{ marginBottom: '1px' }}>
                Статус:{' '}
                <strong style={{ color: getStatusColor(route.status) }}>
                  {getStatusText(route.status)}
                </strong>
              </div>
              {/* Две кнопки для изменения статуса */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '3em' }}>
                {/* Кнопка "Завершено" */}
                <button
                  onClick={() => {
                    const newStatus = route.status === 'completed' ? 'pending' : 'completed';
                    onStatusUpdate?.(route.id, newStatus);
                  }}
                  style={{
                    width: '1.5em',
                    height: '1.5em',
                    borderRadius: '50%',
                    background: route.status === 'completed' ? '#81C784' : '#E8F5E9', // светлее/темнее
                    border: '2px solid #4CAF50',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: '#4CAF50',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                  title={route.status === 'completed' ? 'Вернуть в ожидание' : 'Завершено'}
                >
                </button>

                {/* Кнопка "Проблема" */}
                <button
                  onClick={() => {
                    const newStatus = route.status === 'problem' ? 'pending' : 'problem';
                    onStatusUpdate?.(route.id, newStatus);
                  }}
                  style={{
                    width: '1.5em',
                    height: '1.5em',
                    borderRadius: '50%',
                    background: route.status === 'problem' ? '#EF9A9A' : '#FFEBEE',
                    border: '2px solid #F44336',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: '#F44336',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                  title={route.status === 'problem' ? 'Вернуть в ожидание' : 'Проблема'}
                >
                </button>
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
        />
      )}
    </>
  );
}

// Корневой компонент
export const Map = forwardRef<LeafletMap | null, MapProps>(
  ({ routes, userLocation, followMode, onStatusUpdate, getStatusText, getStatusColor }, ref) => {
    const defaultCenter: LatLngExpression = [54.7, 39.79] as const;

    const center: LatLngExpression = userLocation
      ? [userLocation.lat, userLocation.lon] as const
      : routes.length > 0
      ? [routes[0].point.latitude, routes[0].point.longitude] as const
      : defaultCenter;

    const mapRef = useRef<LeafletMap | null>(null);

    // Сохраняем ref на карту (если родитель хочет)
    useEffect(() => {
      if (ref && mapRef.current) {
        if (typeof ref === 'function') {
          ref(mapRef.current);
        } else {
          (ref as React.MutableRefObject<LeafletMap | null>).current = mapRef.current;
        }
      }
    }, [ref]);

    return (
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
      >
        <MapInner
          routes={routes}
          userLocation={userLocation}
          followMode={followMode}
          onStatusUpdate={onStatusUpdate}
          getStatusText={getStatusText}
          getStatusColor={getStatusColor}
        />
      </MapContainer>
    );
  }
);

Map.displayName = 'Map';