//frontend\app\driver\[id]\page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useGeolocation } from './hooks/useGeolocation';
import { useRoutes } from './hooks/useRoutes';
import { getStatusText, getStatusColor } from './utils/statusHelpers';

const MapContainer = dynamic(
  () => import('./components/Map').then(mod => mod.Map),
  { ssr: false, loading: () => <div className="loading">Загрузка карты...</div> }
);

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
    city: string;
  };
}

export default function DriverPage() {
  const params = useParams();
  const [showModal, setShowModal] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const mapRef = useRef<any>(null);

  const { userLocation, error: geoError, requestGeolocation } = useGeolocation();
  const { data, loading, updateStatus, refresh } = useRoutes(params.id);

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
        {/* Header */}
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

        {/* Карта */}
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

          {/* Индикатор онлайн/оффлайн и слежения - справа вверху */}
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
            {/* Индикатор онлайн/оффлайн */}
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: isOnline ? '#4CAF50' : '#F44336',
              boxShadow: isOnline ? '0 0 8px #4CAF50' : '0 0 8px #F44336',
              transition: 'background 0.3s',
            }} title={isOnline ? 'Онлайн' : 'Оффлайн'} />
            
            {/* Индикатор слежения */}
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

        {/* Модальное окно списка маршрутов */}
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
                width: '400px',
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
                <h2 style={{ margin: 0 }}>Список точек</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: '5px' }}>
                {data?.routes && data.routes.length > 0 ? (
                  data.routes.map((route) => (
                    <div
                      key={route.id}
                      style={{
                        padding: '15px',
                        margin: '10px',
                        background: '#f9f9f9',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${getStatusColor(route.status)}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>#{route.order_number} {route.point.name}</h3>
                          <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>{route.point.address}</p>
                        </div>
                        <div
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            background: getStatusColor(route.status),
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            marginLeft: '10px',
                          }}
                        >
                          {getStatusText(route.status)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => updateStatus(route.id, 'in_progress')}
                          style={{ padding: '5px 10px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          В процессе
                        </button>
                        <button
                          onClick={() => updateStatus(route.id, 'completed')}
                          style={{ padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Завершено
                        </button>
                        <button
                          onClick={() => updateStatus(route.id, 'problem')}
                          style={{ padding: '5px 10px', background: '#F44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Проблема
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Нет точек для отображения</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}