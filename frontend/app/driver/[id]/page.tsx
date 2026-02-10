'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';

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

interface Driver {
  id: number;
  name: string;
}

interface RoutesResponse {
  driver: Driver;
  routes: Route[];
}

export default function DriverPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<RoutesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [showModal, setShowModal] = useState(false);
  const mapRef = useRef<any>(null);
  const ymapsRef = useRef<any>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    fetch(`${apiUrl}/api/routes?driver_id=${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(responseData => {
        setData(responseData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching routes:', err);
        setLoading(false);
      });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Устанавливаем центр Рязани по умолчанию
          setUserLocation({
            lat: 54.609188,
            lon: 39.666385
          });
        }
      );
    } else {
      // Если геолокация не поддерживается, используем центр Рязани
      setUserLocation({
        lat: 54.609188,
        lon: 39.666385
      });
    }
  }, [params.id]);

  const initMap = () => {
    if (!ymapsRef.current || !data || !data.routes || data.routes.length === 0) return;

    const ymaps = ymapsRef.current;
    const center = data.routes[0] ? [data.routes[0].point.latitude, data.routes[0].point.longitude] : [54.6269, 39.7464];
    
    const map = new ymaps.Map('map', {
      center: center,
      zoom: 12,
      controls: ['zoomControl', 'geolocationControl']
    });

    data.routes.forEach((route, index) => {
      const placemark = new ymaps.Placemark(
        [route.point.latitude, route.point.longitude],
        {
          balloonContent: `
            <strong>#${route.order_number} ${route.point.name}</strong><br/>
            ${route.point.address}<br/>
            Статус: ${getStatusText(route.status)}<br/>
            <button onclick="buildRoute(${route.point.latitude}, ${route.point.longitude})" style="margin-top: 10px; padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Проложить маршрут</button>
          `,
          iconCaption: `${index + 1}`
        },
        {
          preset: route.status === 'completed' ? 'islands#greenCircleIcon' : 
                  route.status === 'in_progress' ? 'islands#blueCircleIcon' : 
                  route.status === 'problem' ? 'islands#redCircleIcon' : 'islands#yellowCircleIcon'
        }
      );
      map.geoObjects.add(placemark);
    });

    if (userLocation) {
      const userPlacemark = new ymaps.Placemark(
        [userLocation.lat, userLocation.lon],
        { balloonContent: 'Вы здесь' },
        { preset: 'islands#redCircleIcon' }
      );
      map.geoObjects.add(userPlacemark);
    }

    // Функция построения маршрута
    (window as any).buildRoute = (toLat: number, toLon: number) => {
      if (!userLocation) {
        alert('Геолокация недоступна');
        return;
      }

      if (!mapRef.current || !ymapsRef.current) {
        alert('Карта не загружена');
        return;
      }

      // Удаляем старый маршрут если есть
      mapRef.current.geoObjects.each((obj: any) => {
        if (obj.geometry && obj.geometry.getType() === 'LineString') {
          mapRef.current.geoObjects.remove(obj);
        }
      });

      const multiRoute = new ymapsRef.current.multiRouter.MultiRoute({
        referencePoints: [
          [userLocation.lat, userLocation.lon],
          [toLat, toLon]
        ],
        params: {
          routingMode: 'auto'
        }
      }, {
        boundsAutoApply: true,
        wayPointStartIconColor: '#FF0000',
        wayPointFinishIconColor: '#4CAF50',
        routeActiveStrokeColor: '#0000FF',
        routeActiveStrokeWidth: 4
      });

      mapRef.current.geoObjects.add(multiRoute);
    };

    mapRef.current = map;
  };

  const updateStatus = async (routeId: number, status: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      await fetch(`${apiUrl}/api/routes/status?route_id=${routeId}&status=${status}`, {
        method: 'POST',
      });
      if (data) {
        setData({
          ...data,
          routes: data.routes.map(r => r.id === routeId ? { ...r, status } : r)
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#2196F3';
      case 'pending': return '#FFC107';
      case 'skipped': return '#9E9E9E';
      case 'problem': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершено';
      case 'in_progress': return 'В процессе';
      case 'pending': return 'Ожидает';
      case 'skipped': return 'Пропущено';
      case 'problem': return 'Проблема';
      default: return status;
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!data) {
    return <div className="loading">Нет данных</div>;
  }

  return (
    <>
      <Script 
        src="https://api-maps.yandex.ru/2.1/?apikey=8deea7af-f681-4ac6-96b6-c6f2d7ac1ec7&lang=ru_RU"
        onLoad={() => {
          (window as any).ymaps.ready(() => {
            ymapsRef.current = (window as any).ymaps;
            initMap();
          });
        }}
      />
      <div>
<div 
  className="header" 
  style={{
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: 'white',
  }}
>
  <button
    onClick={() => router.back()}
    style={{
      background: 'rgba(255,255,255,0.2)',
      border: 'none',
      color: 'white',
      fontSize: '26px',
      cursor: 'pointer',
      borderRadius: '50%',
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    ←
  </button>

  <div style={{ textAlign: 'center' }}>
    <h2 style={{ margin: '0 0 2px 0', fontSize: '1.35rem' }}>
      {data?.driver?.name || 'Водитель'}
    </h2>
    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.85 }}>
      {data?.routes?.length || 0} точек
    </p>
  </div>

  {/* Кнопка-иконка обновить */}
  <button
    onClick={() => window.location.reload()}
    title="Обновить данные"
    style={{
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '22px',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    ↻
  </button>
</div>
        
        <div id="map" style={{ width: '100%', height: 'calc(100vh - 80px)', margin: '0' }}></div>
        
        {/* Кнопка списка точек */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          📋
        </button>

        {/* Модальное окно со списком точек */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              zIndex: 2000,
              padding: '20px'
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                width: '400px',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                <h2 style={{ margin: 0 }}>Список точек</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: '5px' }}>
                {data?.routes && data.routes.length > 0 ? (
                  data.routes.map(route => (
                    <div key={route.id} style={{ padding: '15px', margin: '10px 0', background: '#f9f9f9', borderRadius: '8px', borderLeft: `4px solid ${getStatusColor(route.status)}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>#{route.order_number} {route.point.name}</h3>
                          <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>{route.point.address}</p>
                        </div>
                        <div style={{ padding: '3px 10px', borderRadius: '12px', background: getStatusColor(route.status), color: 'white', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                          {getStatusText(route.status)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button onClick={() => updateStatus(route.id, 'in_progress')} style={{ padding: '5px 10px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>В процессе</button>
                        <button onClick={() => updateStatus(route.id, 'completed')} style={{ padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>Завершено</button>
                        <button onClick={() => updateStatus(route.id, 'problem')} style={{ padding: '5px 10px', background: '#F44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>Проблема</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Нет точек для отображения
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
