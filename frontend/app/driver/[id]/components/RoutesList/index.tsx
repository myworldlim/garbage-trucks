'use client';

import RouteCard from './RouteCard';

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

interface RoutesListProps {
  routes: Route[];
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (routeId: number, status: string) => void;
}

export default function RoutesList({
  routes,
  isOpen,
  onClose,
  onStatusChange,
}: RoutesListProps) {
  if (!isOpen) return null;

  return (
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
      onClick={onClose}
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
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '5px' }}>
          {routes && routes.length > 0 ? (
            routes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onStatusChange={onStatusChange}
              />
            ))
          ) : (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#666',
              }}
            >
              Нет точек для отображения
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
