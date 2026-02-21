//frontend\app\driver\[id]\hooks\useGeolocation.ts
import { useState, useCallback } from 'react';

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
        setError(error.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      }
    );

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

  return { userLocation, error, requestGeolocation };
};