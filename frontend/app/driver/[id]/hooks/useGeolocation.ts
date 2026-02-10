import { useEffect, useState } from 'react';

export const useGeolocation = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error.code, error.message);
          // Fallback to Ryazan center if error
          setUserLocation((prev) =>
            prev || {
              lat: 54.609188,
              lon: 39.666385,
            }
          );
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 5000,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      // Geolocation not supported
      setUserLocation({
        lat: 54.609188,
        lon: 39.666385,
      });
    }
  }, []);

  return userLocation;
};
