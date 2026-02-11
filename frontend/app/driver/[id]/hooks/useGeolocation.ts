// C:\Users\Dmitry\Desktop\garbage_ruck\frontend\app\driver\[id]\hooks\useGeolocation.ts
import { useEffect, useState, useCallback } from 'react';

export const useGeolocation = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setUserLocation({
        lat: 54.609188,
        lon: 39.666385,
      });
      setError('Geolocation not supported');
      return;
    }

    setIsWatching(true);

    // Сначала получаем одноразовую позицию
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setError(null);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setUserLocation({
          lat: 54.609188,
          lon: 39.666385,
        });
        setError(error.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Затем начинаем отслеживание
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setError(null);
      },
      (error) => {
        console.warn('Watch error:', error.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return watchId;
  }, []);

  useEffect(() => {
    let watchId: number;

    if (isWatching) {
      watchId = requestGeolocation() as number;
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      setIsWatching(false);
    };
  }, [isWatching, requestGeolocation]);

  return { userLocation, error, requestGeolocation: () => setIsWatching(true) };
};