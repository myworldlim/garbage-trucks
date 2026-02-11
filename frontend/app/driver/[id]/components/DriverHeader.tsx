// C:\Users\Dmitry\Desktop\garbage_ruck\frontend\app\driver\[id]\components\DriverHeader.tsx
'use client';

import { useRouter } from 'next/navigation';

interface DriverHeaderProps {
  driverName: string;
  routeCount: number;
  lastUpdate?: string; // Добавляем опциональное время последнего обновления
}

export default function DriverHeader({
  driverName,
  routeCount,
  lastUpdate,
}: DriverHeaderProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
    // Или если используете SWR/React Query:
    // mutate();
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  return (
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
        onClick={() => router.back()}
        aria-label="Назад"
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
          transition: 'background 0.3s',
          outline: 'none',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
      >
        ←
      </button>

      <div style={{ 
        textAlign: 'center',
        flex: 1,
        margin: '0 15px'
      }}>
        <h2 style={{ 
          margin: '0 0 4px 0', 
          fontSize: '1.5rem',
          fontWeight: '600',
          lineHeight: '1.2'
        }}>
          {driverName || 'Водитель'}
        </h2>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '0.95rem', 
            opacity: 0.9,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ fontSize: '18px' }}>📍</span> 
            {routeCount} {getRouteWord(routeCount)}
          </p>
          {lastUpdate && (
            <p style={{ 
              margin: 0, 
              fontSize: '0.85rem', 
              opacity: 0.8,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ fontSize: '14px' }}>🕐</span>
              {formatTime(lastUpdate)}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        aria-label="Обновить данные"
        title="Обновить маршруты"
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: isRefreshing ? 'not-allowed' : 'pointer',
          padding: '10px',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.3s, transform 0.3s',
          animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
          outline: 'none',
        }}
        onMouseEnter={(e) => !isRefreshing && (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
        onMouseLeave={(e) => !isRefreshing && (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
      >
        ↻
      </button>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Вспомогательная функция для склонения слова "точка"
function getRouteWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'точек';
  }
  if (lastDigit === 1) {
    return 'точка';
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'точки';
  }
  return 'точек';
}

// Добавляем useState, если его нет
import { useState } from 'react';