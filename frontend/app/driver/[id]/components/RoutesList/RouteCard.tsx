import { useState } from 'react';
import { getStatusColor, getStatusText } from '../../utils/statusHelpers';

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

interface RouteCardProps {
  route: Route;
  onStatusChange: (routeId: number, status: string) => void;
}

export default function RouteCard({ route, onStatusChange }: RouteCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (status: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await onStatusChange(route.id, status);
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      setIsLoading(false);
    }
    setIsLoading(false);
  };
  return (
    <div
      style={{
        padding: '15px',
        margin: '10px 0',
        background: '#f9f9f9',
        borderRadius: '8px',
        borderLeft: `4px solid ${getStatusColor(route.status)}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '10px',
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>
            #{route.order_number} {route.point.name}
          </h3>
          <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>
            {route.point.address}
          </p>
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
          onClick={() => handleStatusChange('in_progress')}
          disabled={isLoading}
          style={{
            padding: '5px 10px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? 'Загрузка...' : 'В процессе'}
        </button>
        <button
          onClick={() => handleStatusChange('completed')}
          disabled={isLoading}
          style={{
            padding: '5px 10px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? 'Загрузка...' : 'Завершено'}
        </button>
        <button
          onClick={() => handleStatusChange('problem')}
          disabled={isLoading}
          style={{
            padding: '5px 10px',
            background: '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? 'Загрузка...' : 'Проблема'}
        </button>
      </div>
      {error && (
        <div
          style={{
            color: '#F44336',
            fontSize: '12px',
            marginTop: '10px',
            padding: '8px',
            background: '#ffebee',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
