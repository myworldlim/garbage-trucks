//frontend\app\driver\[id]\page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useGeolocation } from './hooks/useGeolocation';
import { useRoutes } from './hooks/useRoutes';
import { useAllPoints } from './hooks/useAllPoints'; // 👈 Новый хук
import { getStatusText, getStatusColor } from './utils/statusHelpers';
import { Route } from '@/types/route';

const MapContainer = dynamic(
  () => import('./components/Map').then(mod => mod.Map),
  { ssr: false, loading: () => <div className="loading">Загрузка карты...</div> }
);

export default function DriverPage() {
  const params = useParams();
  const [showModal, setShowModal] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const mapRef = useRef<any>(null);

  const { userLocation, error: geoError, requestGeolocation } = useGeolocation();
  const { data, loading, updateStatus, refresh, addPointToRoute, removePointFromRoute } = useRoutes(params.id);
  const { points: allPoints, loading: pointsLoading } = useAllPoints(); // 👈 Все точки из БД

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    requestGeolocation();
  }, [requestGeolocation]);

  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lon], 17);
      setFollowMode(true);
    }
  };

  // Создаем Set с ID точек, которые уже есть в маршруте водителя
  const routePointIds = new Set(data?.routes?.map(r => r.point.id) || []);

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
        <button onClick={() => window.location.reload()} className="btn btn-primary">Повторить</button>
      </div>
    );
  }

  return (
    <>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header - без изменений */}
        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <button
            onClick={() => window.history.back()}
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
          <div style={{ textAlign: 'center', flex: 1, margin: '0 15px' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: '600' }}>
              {data?.driver?.name || 'Водитель'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
              {data?.routes?.length || 0} точек
            </p>
          </div>
          <button
            onClick={refresh}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ↻
          </button>
        </div>

        {/* Карта - без изменений */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer
            ref={mapRef}
            routes={data?.routes || []}
            userLocation={userLocation}
            followMode={followMode}
            onStatusUpdate={updateStatus}
            getStatusText={getStatusText}
            getStatusColor={getStatusColor}
          />

          {/* Индикаторы - без изменений */}
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(0,0,0,0.7)',
            padding: '8px 12px',
            borderRadius: '20px',
            zIndex: 900,
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: isOnline ? '#4CAF50' : '#F44336',
              boxShadow: isOnline ? '0 0 8px #4CAF50' : '0 0 8px #F44336',
              transition: 'background 0.3s',
            }} title={isOnline ? 'Онлайн' : 'Оффлайн'} />
            
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: followMode ? '#F44336' : '#9E9E9E',
              boxShadow: followMode ? '0 0 8px #F44336' : 'none',
              transition: 'background 0.3s',
            }} title={followMode ? 'Слежение включено' : 'Слежение выключено'} />
          </div>

          {/* Кнопка слежения */}
          <div style={{
            position: 'fixed',
            right: '20px',
            top: 'calc(50%)',
            zIndex: 1000,
          }}>
            <button
              onClick={() => {
                if (!followMode) {
                  setFollowMode(true);
                  centerOnUser();
                } else {
                  setFollowMode(false);
                }
              }}
              className={`map-control-btn ${followMode ? 'pulse-animation' : ''}`}
              style={{
                background: followMode ? '#F44336' : '#c7c7c7',
                color: 'white',
                border: followMode ? '3px solid #ffffff' : 'none',
              }}
            >
              
            </button>
          </div>
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

        {/* МОДАЛЬНОЕ ОКНО - список ВСЕХ точек */}
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
              padding: '20px',
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                width: '450px',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '20px',
                  borderBottom: '1px solid #ddd',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'sticky',
                  top: 0,
                  background: 'white',
                  zIndex: 1,
                }}
              >
                <h2 style={{ margin: 0 }}>Все точки сбора</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}>
                  ×
                </button>
              </div>
              
              <div style={{ padding: '10px' }}>
                {pointsLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Загрузка точек...</div>
                ) : allPoints.length > 0 ? (
                  allPoints.map((point) => {
                    const isInRoute = routePointIds.has(point.id);
                    
                    return (
                      <div
                        key={point.id}
                        style={{
                          padding: '15px',
                          margin: '10px',
                          background: '#f9f9f9',
                          borderRadius: '8px',
                          borderLeft: `4px solid ${isInRoute ? '#4CAF50' : '#9E9E9E'}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>
                              {point.name}
                            </h3>
                            <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
                              г. {point.city}
                            </p>
                          </div>
                          
                          {/* Статус добавления */}
                          <div
                            style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              background: isInRoute ? '#4CAF50' : '#9E9E9E',
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              marginLeft: '10px',
                            }}
                          >
                            {isInRoute ? 'Добавлено' : 'Не добавлено'}
                          </div>
                        </div>

                        {/* Кнопка действия */}
                        <div style={{ marginTop: '15px' }}>
                          {isInRoute ? (
                            <button
                              onClick={async () => {
                                try {
                                  await removePointFromRoute(point.id);
                                } catch (err) {
                                  alert('Ошибка при удалении точки');
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '7px',
                                background: '#a30b00',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#975656'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#a30b00'}
                            >
                              Удалить из маршрута
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await addPointToRoute(point.id);
                                } catch (err) {
                                  alert('Ошибка при добавлении точки');
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '7px',
                                background: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#45A049'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#4CAF50'}
                            >
                              Добавить в маршрут
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Нет доступных точек
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