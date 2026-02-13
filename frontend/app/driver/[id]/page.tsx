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
  const [followMode, setFollowMode] = useState(true); // По умолчанию включен
  const mapRef = useRef<any>(null);
  const ymapsRef = useRef<any>(null);

  const { userLocation, error: geoError, requestGeolocation } = useGeolocation();
  const { data, loading, updateStatus } = useRoutes(params.id);

  // ✅ ВАЖНО: Всегда передаем userLocation в хук, но управляем центрированием через followMode
  const { mapRef: mapManagerRef, isMapReady } = useMapManager({
    ymaps: ymapsRef.current,
    routes: data?.routes || [],
    userLocation: userLocation, // 👈 Всегда передаем, даже когда followMode=false
    followMode: followMode,     // 👈 Добавляем новый пропс для управления центрированием
    onStatusUpdate: updateStatus,
    getStatusText,
  });

  // Синхронизируем ссылки на карту
  useEffect(() => {
    if (mapManagerRef.current) {
      mapRef.current = mapManagerRef.current;
    }
  }, [mapManagerRef.current]);

  // Функции для зума
  const zoomIn = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.setZoom(currentZoom + 1, { duration: 200 });
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.setZoom(currentZoom - 1, { duration: 200 });
    }
  };

  // Функция для ручного центрирования
  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setCenter([userLocation.lat, userLocation.lon], 13, { duration: 300 });
      setFollowMode(true); // Включаем слежение
    }
  };

  // Запрашиваем геолокацию при загрузке
  useEffect(() => {
    if (ymapsLoaded && isMapElementReady) {
      requestGeolocation();
    }
  }, [ymapsLoaded, isMapElementReady, requestGeolocation]);

  // Логируем состояние для отладки
  useEffect(() => {
    console.log('📍 Состояние:', { 
      followMode, 
      hasLocation: !!userLocation,
      location: userLocation 
    });
  }, [followMode, userLocation]);

  if (loading) {
    return <div className="loading">Загрузка маршрутов...</div>;
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
        padding: '20px'
      }}>
        <h2>Нет данных</h2>
        <button onClick={() => window.location.reload()}>Повторить</button>
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

          {/* Кнопки зума справа по центру */}
          <div style={{
            position: 'fixed',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 1000,
          }}>
            <button
              onClick={zoomIn}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                fontSize: '28px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              }}
            >
              +
            </button>
            <button
              onClick={zoomOut}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                fontSize: '28px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              }}
            >
              –
            </button>
          </div>

          {/* Кнопка слежения */}
          <div style={{
            position: 'fixed',
            right: '20px',
            top: 'calc(50% + 70px)',
            transform: 'translateY(0)',
            zIndex: 1000,
          }}>
            <button
              onClick={() => {
                console.log('🔄 Кнопка нажата, текущий режим:', followMode);
                if (!followMode) {
                  // Включаем слежение и центрируем
                  setFollowMode(true);
                  // Центрируем сразу, не ждем следующего обновления геолокации
                  setTimeout(() => {
                    if (mapRef.current && userLocation) {
                      console.log('🎯 Центрируем на пользователе');
                      mapRef.current.setCenter([userLocation.lat, userLocation.lon], 17, { duration: 300 });
                    } else {
                      console.log('⚠️ Нет данных о местоположении');
                      requestGeolocation(); // Запрашиваем если нет
                    }
                  }, 100);
                } else {
                  // Выключаем слежение
                  setFollowMode(false);
                }
              }}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: followMode ? '#F44336' : '#9E9E9E',
                color: 'white',
                border: followMode ? '3px solid #ffffff' : 'none',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: followMode 
                  ? '0 4px 12px rgba(244, 67, 54, 0.5), 0 0 0 2px rgba(255,255,255,0.5)' 
                  : '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.3s',
                animation: followMode ? 'pulse 2s infinite' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🎯
            </button>
          </div>

          {/* Анимация пульсации */}
          <style jsx>{`
            @keyframes pulse {
              0% {
                box-shadow: 0 4px 12px rgba(244, 67, 54, 0.5), 0 0 0 0 rgba(244, 67, 54, 0.5);
              }
              70% {
                box-shadow: 0 4px 12px rgba(244, 67, 54, 0.5), 0 0 0 15px rgba(244, 67, 54, 0);
              }
              100% {
                box-shadow: 0 4px 12px rgba(244, 67, 54, 0.5), 0 0 0 0 rgba(244, 67, 54, 0);
              }
            }
          `}</style>

          {/* Информация о местоположении */}
          {userLocation && (
            <div style={{
              position: 'fixed',
              top: '100px',
              left: '50%', // 👈 МЕНЯЕМ left: '15px' на left: '50%'
              transform: 'translateX(-50%)', // 👈 ДОБАВЛЯЕМ transform для точного центрирования
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '20px',
              zIndex: 900,
              fontSize: '12px',
              backdropFilter: 'blur(4px)',
              whiteSpace: 'nowrap', // 👈 ДОБАВЛЯЕМ чтобы текст не переносился
            }}>
              📍 {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
              {followMode ? ' 🔴' : ' ⚪'}
            </div>
          )}
        </div>

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
          }}
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
