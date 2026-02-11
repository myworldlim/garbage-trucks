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
  const placemarksRef = useRef<any[]>([]);
  const multiRouteRef = useRef<any>(null);

  // Очистка ТОЛЬКО меток (placemarks), НЕ трогаем маршрут
  const clearPlacemarks = () => {
    if (!mapRef.current) return;

    placemarksRef.current.forEach((pm) => {
      mapRef.current.geoObjects.remove(pm);
    });
    placemarksRef.current = [];
  };

  // Создаём карту один раз
  useEffect(() => {
    if (!ymaps || !routes.length || mapRef.current) return;

    const defaultCenter: [number, number] = [54.6269, 39.7464];

    const center = userLocation
      ? [userLocation.lat, userLocation.lon]
      : routes[0]?.point
        ? [routes[0].point.latitude, routes[0].point.longitude]
        : defaultCenter;

    const map = new ymaps.Map('map', {
      center: center,
      zoom: 12,
      controls: ['zoomControl', 'geolocationControl'],
      behaviors: [
        'drag',
        'scrollZoom',
        'dblClickZoom',
        'multiTouch',
        'pinchZoom',
        'inertia',           // плавное затухание после свайпа
      ],
    });

    const trafficControl = new ymaps.control.TrafficControl({ state: true });
    map.controls.add(trafficControl);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [ymaps, routes.length]);

  // Обновляем только метки и центр (маршрут не трогаем)
  useEffect(() => {
    if (!mapRef.current || !ymaps || !routes.length) return;

    clearPlacemarks();

    const map = mapRef.current;

    // Центрируем карту
    if (userLocation) {
      map.setCenter([userLocation.lat, userLocation.lon], 13, { duration: 400 });
    } else if (routes[0]?.point) {
      map.setCenter([routes[0].point.latitude, routes[0].point.longitude], 12);
    }

    // Добавляем метки маршрутов
    routes.forEach((route, index) => {
      const placemark = new ymaps.Placemark(
        [route.point.latitude, route.point.longitude],
        {
          balloonContent: `
            <strong>#${route.order_number} ${route.point.name}</strong><br/>
            ${route.point.address}<br/>
            Статус: ${getStatusText(route.status)}<br/>
            <button onclick="buildRoute(${route.point.latitude}, ${route.point.longitude}, ${index})" style="margin-top:10px;padding:5px 10px;background:#4CAF50;color:white;border:none;border-radius:5px;cursor:pointer;">Проложить маршрут</button>
          `,
          iconCaption: `${index + 1}`,
        },
        {
          preset:
            route.status === 'completed' ? 'islands#greenCircleIcon' :
            route.status === 'in_progress' ? 'islands#blueCircleIcon' :
            route.status === 'problem' ? 'islands#redCircleIcon' :
            'islands#yellowCircleIcon',
        }
      );

      placemarksRef.current.push(placemark);
      map.geoObjects.add(placemark);
    });

    // Метка текущего положения
    if (userLocation) {
      const userPm = new ymaps.Placemark(
        [userLocation.lat, userLocation.lon],
        { balloonContent: 'Ваше местоположение' },
        { preset: 'islands#redDotIcon' }
      );
      placemarksRef.current.push(userPm);
      map.geoObjects.add(userPm);
    }
  }, [ymaps, routes, userLocation, getStatusText]);

  // Функция построения маршрута — очищаем только предыдущий маршрут
  useEffect(() => {
    if (!mapRef.current || !ymaps || !userLocation) return;

    (window as any).buildRoute = (toLat: number, toLon: number, routeIndex?: number) => {
      console.log("Строим маршрут до точки", routeIndex);

      // Удаляем только старый маршрут (не трогаем метки)
      if (multiRouteRef.current) {
        mapRef.current.geoObjects.remove(multiRouteRef.current);
        multiRouteRef.current = null;
      }

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
          routeActiveStrokeWidth: 6,
        }
      );

      multiRouteRef.current = multiRoute;
      mapRef.current.geoObjects.add(multiRoute);

      // Логируем результат
      multiRoute.events.add('routesloaded', () => {
        console.log("Маршрут успешно загружен");
        const active = multiRoute.getActiveRoute();
        if (active) {
          const dist = active.properties.get('distance')?.text || '';
          const time = active.properties.get('duration')?.text || '';
          console.log(`Дистанция: ${dist}, Время: ${time}`);
        }
      });

      multiRoute.events.add('error', (e: any) => {
        console.error("Ошибка маршрута:", e);
      });
    };
  }, [ymaps, userLocation]);

  return mapRef;
};