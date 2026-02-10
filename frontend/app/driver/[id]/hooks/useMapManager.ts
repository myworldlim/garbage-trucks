import { useEffect, useRef } from 'react';
import { formatDuration } from '../utils/formatters';

interface Route {
  id: number;
  order_number: number;
  scheduled_at: string;
  status: string;
  point: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
}

interface UseMapManagerProps {
  ymaps: any;
  routes: Route[];
  userLocation: { lat: number; lon: number } | null;
  onStatusUpdate?: (routeId: number, status: string) => void;
  getStatusText: (status: string) => string;
}

export const useMapManager = ({
  ymaps,
  routes,
  userLocation,
  onStatusUpdate,
  getStatusText,
}: UseMapManagerProps) => {
  const mapRef = useRef<any>(null);

  const initMap = () => {
    if (!ymaps || !routes || routes.length === 0) return;

    const center = userLocation
      ? [userLocation.lat, userLocation.lon]
      : routes[0]
      ? [routes[0].point.latitude, routes[0].point.longitude]
      : [54.6269, 39.7464];

    const map = new ymaps.Map('map', {
      center: center,
      zoom: 12,
      controls: ['zoomControl', 'geolocationControl'],
      behaviors: ['drag', 'scrollZoom'],
    });

    // Add traffic control
    const trafficControl = new ymaps.control.TrafficControl({
      state: true,
    });
    map.controls.add(trafficControl);

    // Add route placemarks
    routes.forEach((route, index) => {
      const placemark = new ymaps.Placemark(
        [route.point.latitude, route.point.longitude],
        {
          balloonContent: `
            <strong>#${route.order_number} ${route.point.name}</strong><br/>
            ${route.point.address}<br/>
            Статус: ${getStatusText(route.status)}<br/>
            <button onclick="buildRoute(${route.point.latitude}, ${route.point.longitude}, ${index})" style="margin-top: 10px; padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Проложить маршрут</button>
          `,
          iconCaption: `${index + 1}`,
        },
        {
          preset:
            route.status === 'completed'
              ? 'islands#greenCircleIcon'
              : route.status === 'in_progress'
              ? 'islands#blueCircleIcon'
              : route.status === 'problem'
              ? 'islands#redCircleIcon'
              : 'islands#yellowCircleIcon',
        }
      );
      map.geoObjects.add(placemark);
    });

    // Add user location placemark
    if (userLocation) {
      const userPlacemark = new ymaps.Placemark(
        [userLocation.lat, userLocation.lon],
        { balloonContent: 'Ваше текущее местоположение' },
        { preset: 'islands#redDotIcon' }
      );
      map.geoObjects.add(userPlacemark);
    }

    // Build route function
    (window as any).buildRoute = (
      toLat: number,
      toLon: number,
      routeIndex: number
    ) => {
      if (!userLocation) {
        alert('Геолокация недоступна. Используется приблизительное местоположение.');
        return;
      }

      if (!mapRef.current || !ymaps) {
        alert('Карта не загружена');
        return;
      }

      // Remove old routes
      mapRef.current.geoObjects.each((obj: any) => {
        if (
          obj.geometry &&
          (obj.geometry.getType() === 'LineString' || obj.getRoute)
        ) {
          mapRef.current.geoObjects.remove(obj);
        }
      });

      // Create multi-route with traffic awareness
      const multiRoute = new ymaps.multiRouter.MultiRoute(
        {
          referencePoints: [
            [userLocation.lat, userLocation.lon],
            [toLat, toLon],
          ],
          params: {
            routingMode: 'auto',
            avoidTrafficJams: true,
          },
        },
        {
          boundsAutoApply: true,
          wayPointStartIconColor: '#FF0000',
          wayPointFinishIconColor: '#4CAF50',
          routeActiveStrokeColor: '#0000FF',
          routeActiveStrokeWidth: 4,
          routeStrokeColor: '#CCCCCC',
          routeStrokeWidth: 3,
          routeActiveStrokeOpacity: 0.8,
        }
      );

      mapRef.current.geoObjects.add(multiRoute);

      // Handle route loaded event
      multiRoute.events.add(['routesloaded', 'routesfailed'], () => {
        const activeRoute = multiRoute.getActiveRoute();
        if (activeRoute) {
          const duration = activeRoute.properties.get('duration');
          const distance = activeRoute.properties.get('distance');

          if (duration || distance) {
            const durationText = duration ? formatDuration(duration.value) : '';
            const distanceText = distance
              ? (distance.value / 1000).toFixed(1) + ' км'
              : '';

            const infoText = `${durationText}${
              durationText && distanceText ? ', ' : ''
            }${distanceText}`;
            console.log(`Маршрут: ${infoText}`);

            if (infoText) {
              alert(
                `Расстояние: ${distanceText}\nВремя в пути: ${durationText}`
              );
            }
          }
        }
      });
    };

    mapRef.current = map;
  };

  useEffect(() => {
    if (ymaps && routes && routes.length > 0) {
      initMap();
    }
  }, [ymaps, routes, userLocation]);

  return mapRef;
};
