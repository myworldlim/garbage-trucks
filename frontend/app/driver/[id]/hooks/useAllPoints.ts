import { useEffect, useState, useCallback } from 'react';

interface Point {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
}

export const useAllPoints = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async () => {
    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/points`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPoints(data);
    } catch (err) {
      console.error('Error fetching points:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  return { points, loading, error, refresh: fetchPoints };
};