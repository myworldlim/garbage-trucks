import { useEffect, useState } from 'react';

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

export const useRoutes = (driverId: string | string[] | undefined) => {
  const [data, setData] = useState<RoutesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    fetch(`${apiUrl}/api/routes?driver_id=${driverId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((responseData) => {
        setData(responseData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching routes:', err);
        setLoading(false);
      });
  }, [driverId]);

  const updateStatus = async (routeId: number, status: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(
        `${apiUrl}/api/routes/status?route_id=${routeId}&status=${status}`,
        {
          method: 'POST',
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error updating status: ${response.status} ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (data) {
        setData({
          ...data,
          routes: data.routes.map((r) => (r.id === routeId ? { ...r, status } : r)),
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      throw err; // Re-throw для обработки в компоненте
    }
  };

  return { data, loading, updateStatus };
};
