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
  const ymapsRef = useRef<any>(null);

  // Use custom hooks
  const userLocation = useGeolocation();
  const { data, loading, updateStatus } = useRoutes(params.id);

  // Initialize map manager
  useMapManager({
    ymaps: ymapsRef.current,
    routes: data?.routes || [],
    userLocation,
    onStatusUpdate: updateStatus,
    getStatusText,
  });

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
          });
        }}
      />
      <div>
        <DriverHeader
          driverName={data?.driver?.name || 'Водитель'}
          routeCount={data?.routes?.length || 0}
        />

        <Map />

        {/* Routes list button */}
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

        {/* Current location info */}
        {/* {userLocation && (
          <div
            style={{
              position: 'fixed',
              top: '80px',
              left: '15px',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '10px 15px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 900,
              fontSize: '12px',
              color: '#333',
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

        {/* Routes list modal */}
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
