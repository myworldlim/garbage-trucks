// C:\Users\Dmitry\Desktop\garbage_ruck\frontend\app\driver\[id]\hooks\useMapManager.ts
import { useEffect, useRef, useState } from 'react';

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
  const [isMapReady, setIsMapReady] = useState(false);
  const buildRouteRef = useRef<any>(null); // Добавляем ref для функции

  // Создаём карту ОДИН РАЗ
  useEffect(() => {
    if (!ymaps || !routes.length || mapRef.current) return;

    const mapElement = document.getElementById('map');
    
    if (!mapElement || mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0) {
      const timeoutId = setTimeout(() => {
        window.dispatchEvent(new Event('resize')); // Принудительный ресайз
      }, 100);
      return () => clearTimeout(timeoutId);
    }

    try {
      const defaultCenter: [number, number] = [54.609188, 39.666385];
      const center = userLocation
        ? [userLocation.lat, userLocation.lon]
        : routes[0]?.point
          ? [routes[0].point.latitude, routes[0].point.longitude]
          : defaultCenter;

      const map = new ymaps.Map('map', {
        center: center,
        zoom: 12,
        controls: ['zoomControl', 'geolocationControl', 'trafficControl'],
      });

      mapRef.current = map;
      setIsMapReady(true);
      console.log('✅ Карта создана');

    } catch (error) {
      console.error('❌ Ошибка создания карты:', error);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
        } catch (e) {
          console.warn('Ошибка при удалении карты:', e);
        }
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
  }, [ymaps, routes.length]); // Убираем userLocation из зависимостей

  // Обновляем метки
  useEffect(() => {
    if (!mapRef.current || !ymaps || !routes.length || !isMapReady) return;

    const map = mapRef.current;
    
    // Очищаем старые метки
    try {
      placemarksRef.current.forEach((pm) => {
        try {
          map.geoObjects.remove(pm);
        } catch (e) {}
      });
      placemarksRef.current = [];
    } catch (e) {}

    // Добавляем новые метки
    routes.forEach((route, index) => {
      if (!route.point?.latitude || !route.point?.longitude) return;

      try {
        const placemark = new ymaps.Placemark(
          [route.point.latitude, route.point.longitude],
          {
            balloonContent: `
              <div style="padding: 10px; min-width: 220px;">
                <strong style="font-size: 16px;">#${route.order_number} ${route.point.name}</strong><br/>
                <span style="color: #666; font-size: 13px;">${route.point.address}</span><br/>
                <div style="margin-top: 8px; padding: 5px; background: #f5f5f5; border-radius: 4px;">
                  Статус: <strong style="color: ${getStatusColor(route.status)};">${getStatusText(route.status)}</strong>
                </div>
                <button 
                  onclick="window.buildRoute(${route.point.latitude}, ${route.point.longitude})" 
                  style="
                    margin-top: 12px;
                    padding: 10px 16px;
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    width: 100%;
                  "
                >
                  🚚 Построить маршрут
                </button>
              </div>
            `,
            iconCaption: `${index + 1}`,
          },
          {
            preset: route.status === 'completed' ? 'islands#greenCircleIcon' :
                    route.status === 'in_progress' ? 'islands#blueCircleIcon' :
                    route.status === 'problem' ? 'islands#redCircleIcon' :
                    'islands#yellowCircleIcon',
            balloonCloseButton: true,
          }
        );

        placemarksRef.current.push(placemark);
        map.geoObjects.add(placemark);
      } catch (e) {
        console.warn('Ошибка добавления метки:', e);
      }
    });

    // Добавляем метку пользователя
    if (userLocation?.lat && userLocation?.lon) {
      try {
        const userPm = new ymaps.Placemark(
          [userLocation.lat, userLocation.lon],
          { 
            balloonContent: '📍 Ваше местоположение',
            iconCaption: 'Вы здесь'
          },
          { 
            preset: 'islands#redDotIcon',
          }
        );
        placemarksRef.current.push(userPm);
        map.geoObjects.add(userPm);
        
        // Центрируем карту на пользователе
        map.setCenter([userLocation.lat, userLocation.lon], 13, { duration: 300 });
      } catch (e) {
        console.warn('Ошибка добавления метки пользователя:', e);
      }
    }

  }, [ymaps, routes, userLocation, isMapReady, getStatusText]);

  // Функция построения маршрута - создаём ОДИН РАЗ
  useEffect(() => {
    if (!mapRef.current || !ymaps || !isMapReady) return;

    const buildRoute = (toLat: number, toLon: number) => {
      console.log('🚗 Построение маршрута...', { toLat, toLon });
      
      if (!mapRef.current || !ymaps) {
        console.error('❌ Карта не готова');
        return;
      }

      if (!userLocation) {
        console.error('❌ Нет данных о местоположении');
        alert('Пожалуйста, включите геолокацию');
        return;
      }

      try {
        // Удаляем старый маршрут
        if (multiRouteRef.current) {
          try {
            mapRef.current.geoObjects.remove(multiRouteRef.current);
          } catch (e) {}
          multiRouteRef.current = null;
        }

        console.log('📍 Откуда:', [userLocation.lat, userLocation.lon]);
        console.log('📍 Куда:', [toLat, toLon]);

        // Создаем маршрут
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
            routeActiveStrokeColor: '#2196F3',
            routeActiveStrokeWidth: 6,
          }
        );

        // Обработчики событий
        multiRoute.events.add('routesloaded', () => {
          console.log('✅ Маршрут построен');
          const activeRoute = multiRoute.getActiveRoute();
          if (activeRoute) {
            const distance = activeRoute.properties.get('distance')?.text || '?';
            const duration = activeRoute.properties.get('duration')?.text || '?';
            console.log(`📊 Расстояние: ${distance}, Время: ${duration}`);
          }
        });

        multiRoute.events.add('error', (e: any) => {
          console.error('❌ Ошибка маршрута:', e);
        });

        multiRouteRef.current = multiRoute;
        mapRef.current.geoObjects.add(multiRoute);

      } catch (error) {
        console.error('❌ Ошибка построения маршрута:', error);
      }
    };

    // Сохраняем функцию в ref и в window
    buildRouteRef.current = buildRoute;
    (window as any).buildRoute = buildRoute;
    console.log('✅ Функция buildRoute готова');

    return () => {
      delete (window as any).buildRoute;
    };
  }, [ymaps, isMapReady]); // Убираем userLocation из зависимостей!

  // Отдельный эффект для обновления userLocation в функции маршрута
  useEffect(() => {
    if (buildRouteRef.current && userLocation) {
      // Обновляем функцию с новыми координатами
      const buildRoute = (toLat: number, toLon: number) => {
        console.log('🚗 Построение маршрута (обновленная позиция)...');
        
        if (!mapRef.current || !ymaps || !userLocation) {
          console.error('❌ Данные не готовы');
          return;
        }

        try {
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
            }
          );

          multiRouteRef.current = multiRoute;
          mapRef.current.geoObjects.add(multiRoute);
          
        } catch (error) {
          console.error('❌ Ошибка:', error);
        }
      };

      buildRouteRef.current = buildRoute;
      (window as any).buildRoute = buildRoute;
    }
  }, [userLocation, ymaps]); // Зависимость только от userLocation

  return { mapRef, isMapReady };
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return '#4CAF50';
    case 'in_progress': return '#2196F3';
    case 'pending': return '#FFC107';
    case 'skipped': return '#9E9E9E';
    case 'problem': return '#F44336';
    default: return '#666';
  }
}