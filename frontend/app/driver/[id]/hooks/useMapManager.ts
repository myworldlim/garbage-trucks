// //frontend\app\driver\[id]\hooks\useMapManager.ts
// import { useEffect, useRef, useState } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// // Фикс для иконок Leaflet в Next.js
// const fixLeafletIcons = () => {
//   delete (L.Icon.Default.prototype as any)._getIconUrl;
//   L.Icon.Default.mergeOptions({
//     iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
//     iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
//     shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
//   });
// };

// interface Route {
//   id: number;
//   order_number: number;
//   scheduled_at: string;
//   status: string;
//   point: {
//     name: string;
//     address: string;
//     latitude: number;
//     longitude: number;
//   };
// }

// interface UseMapManagerProps {
//   routes: Route[];
//   userLocation: { lat: number; lon: number } | null;
//   followMode: boolean;
//   onStatusUpdate?: (routeId: number, status: string) => void;
//   getStatusText: (status: string) => string;
//   getStatusColor: (status: string) => string;
// }

// // Компонент для обновления вида карты
// function MapUpdater({ 
//   userLocation, 
//   followMode,
//   routes 
// }: { 
//   userLocation: { lat: number; lon: number } | null;
//   followMode: boolean;
//   routes: Route[];
// }) {
//   const map = useMap();
//   const lastLocationRef = useRef<{ lat: number; lon: number } | null>(null);

//   useEffect(() => {
//     if (!userLocation || !followMode) return;

//     const locationChanged = !lastLocationRef.current ||
//       Math.abs(lastLocationRef.current.lat - userLocation.lat) > 0.0001 ||
//       Math.abs(lastLocationRef.current.lon - userLocation.lon) > 0.0001;

//     if (locationChanged) {
//       map.flyTo([userLocation.lat, userLocation.lon], 17, { duration: 0.5 });
//       lastLocationRef.current = userLocation;
//     }
//   }, [userLocation, followMode, map]);

//   // Центрируем на всех точках при первой загрузке
//   useEffect(() => {
//     if (routes.length > 0 && !userLocation) {
//       const bounds = routes.map(r => [r.point.latitude, r.point.longitude] as [number, number]);
//       map.fitBounds(bounds, { padding: [50, 50] });
//     }
//   }, [routes, map, userLocation]);

//   return null;
// }

// export const useMapManager = ({
//   routes,
//   userLocation,
//   followMode,
//   onStatusUpdate,
//   getStatusText,
//   getStatusColor,
// }: UseMapManagerProps) => {
//   const [isMapReady, setIsMapReady] = useState(false);
//   const mapRef = useRef<L.Map | null>(null);

//   useEffect(() => {
//     fixLeafletIcons();
//   }, []);

//   const MapComponent = () => {
//     const defaultCenter: [number, number] = [54.70, 39.79];
//     const center = userLocation
//       ? [userLocation.lat, userLocation.lon]
//       : routes.length > 0
//       ? [routes[0].point.latitude, routes[0].point.longitude]
//       : defaultCenter;

//     return (
//       <MapContainer
//         center={center}
//         zoom={12}
//         style={{ width: '100%', height: '100%' }}
//         whenCreated={(mapInstance) => {
//           mapRef.current = mapInstance;
//           setIsMapReady(true);
//         }}
//       >
//         {/* OSM тайлы */}
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           maxZoom={19}
//         />

//         {/* Обновление вида карты */}
//         <MapUpdater 
//           userLocation={userLocation} 
//           followMode={followMode}
//           routes={routes}
//         />

//         {/* Метки точек маршрута */}
//         {routes.map((route, index) => (
//           <Marker
//             key={route.id}
//             position={[route.point.latitude, route.point.longitude]}
//           >
//             <Popup>
//               <div style={{ minWidth: '200px' }}>
//                 <strong style={{ fontSize: '16px' }}>
//                   #{route.order_number} {route.point.name}
//                 </strong>
//                 <br />
//                 <span style={{ color: '#666', fontSize: '13px' }}>
//                   {route.point.address}
//                 </span>
//                 <div style={{ marginTop: '8px' }}>
//                   Статус:{' '}
//                   <strong style={{ color: getStatusColor(route.status) }}>
//                     {getStatusText(route.status)}
//                   </strong>
//                 </div>
//               </div>
//             </Popup>
//           </Marker>
//         ))}

//         {/* Метка пользователя */}
//         {userLocation && (
//           <Marker
//             position={[userLocation.lat, userLocation.lon]}
//             icon={new L.Icon({
//               iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
//               iconSize: [25, 41],
//               iconAnchor: [12, 41],
//               popupAnchor: [1, -34],
//             })}
//           >
//             <Popup>📍 Ваше местоположение</Popup>
//           </Marker>
//         )}
//       </MapContainer>
//     );
//   };

//   return { MapComponent, isMapReady, mapRef };
// };