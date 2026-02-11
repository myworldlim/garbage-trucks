// C:\Users\Dmitry\Desktop\garbage_ruck\frontend\app\driver\[id]\page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Script from 'next/script';
import { DriverHeader, Map, RoutesList } from './components';
import { useGeolocation, useRoutes, useMapManager } from './hooks';
import { getStatusText } from './utils/statusHelpers';

export default function DriverPage() {
  const params = useParams();
  const [showModal, setShowModal] = useState(false);
  const [ymapsLoaded, setYmapsLoaded] = useState(false);
  const [isMapElementReady, setIsMapElementReady] = useState(false);
  const ymapsRef = useRef<any>(null);

  // Геолокация - не запрашивается автоматически
  const { userLocation, error: geoError, requestGeolocation } = useGeolocation();
  const { data, loading, updateStatus } = useRoutes(params.id);

  // Запрашиваем геолокацию при загрузке карты
  useEffect(() => {
    if (ymapsLoaded && isMapElementReady) {
      requestGeolocation();
    }
  }, [ymapsLoaded, isMapElementReady, requestGeolocation]);

  const { isMapReady } = useMapManager({
    ymaps: ymapsRef.current,
    routes: data?.routes || [],
    userLocation,
    onStatusUpdate: updateStatus,
    getStatusText,
  });

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f5f5',
        fontSize: '18px',
        color: '#333'
      }}>
        Загрузка маршрутов...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f5f5',
        fontSize: '18px',
        color: '#666',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h2>Нет данных</h2>
        <p>Не удалось загрузить маршруты для водителя</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://api-maps.yandex.ru/2.1/?apikey=8deea7af-f681-4ac6-96b6-c6f2d7ac1ec7&lang=ru_RU"
        onLoad={() => {
          if ((window as any).ymaps) {
            (window as any).ymaps.ready(() => {
              ymapsRef.current = (window as any).ymaps;
              setYmapsLoaded(true);
            });
          }
        }}
      />
      
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <DriverHeader
          driverName={data?.driver?.name || 'Водитель'}
          routeCount={data?.routes?.length || 0}
        />

        <div style={{ flex: 1, position: 'relative' }}>
          <Map 
            mapId="map" 
            onMapReady={() => setIsMapElementReady(true)}
          />
        </div>

        {/* Информация о местоположении */}
        {/* {userLocation && (
          <div
            style={{
              position: 'fixed',
              bottom: '100px',
              left: '15px',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '10px 15px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 900,
              fontSize: '12px',
              color: '#333',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
              📍 Ваше местоположение
            </div>
            <div>
              {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
            </div>
          </div>
        )} */}

        {/* Кнопка запроса геолокации, если ещё не запрошена */}
        {!userLocation && !geoError && (
          <button
            onClick={requestGeolocation}
            style={{
              position: 'fixed',
              bottom: '100px',
              right: '30px',
              padding: '12px 20px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 900,
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>📍</span> Включить геолокацию
          </button>
        )}

        {/* Кнопка списка маршрутов */}
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
            zIndex: 1000,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          📋
        </button>

        <RoutesList
          routes={data?.routes || []}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onStatusChange={updateStatus}
        />
      </div>
    </>
  );
}