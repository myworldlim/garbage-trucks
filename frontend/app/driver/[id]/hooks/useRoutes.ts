import { useEffect, useState, useCallback } from 'react';
import { Route } from '@/types/route';

interface Driver {
  id: number;
  name: string;
}

interface RoutesResponse {
  driver: Driver;
  routes: Route[];
}

export const useRoutes = (driverId: string | string[] | undefined) => {
  const [data, setData] = useState<RoutesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!driverId) return;
    
    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/routes?driver_id=${driverId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetchData();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  const updateStatus = async (routeId: number, status: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(
        `${apiUrl}/api/routes/status?route_id=${routeId}&status=${status}`,
        { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error updating status: ${response.status} ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Оптимистичное обновление UI
      if (data) {
        setData({
          ...data,
          routes: data.routes.map((r) => 
            r.id === routeId ? { ...r, status } : r
          ),
        });
      }
      
      // Обновляем данные с сервера для синхронизации
      await fetchData();
      
    } catch (err) {
      console.error('Error updating status:', err);
      throw err;
    }
  };

  const refresh = () => {
    if (navigator.onLine) {
      fetchData();
    }
  };

  return { data, loading, error, updateStatus, refresh };
};