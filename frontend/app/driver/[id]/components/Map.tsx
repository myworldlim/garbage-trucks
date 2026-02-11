// C:\Users\Dmitry\Desktop\garbage_ruck\frontend\app\driver\[id]\components\Map.tsx
'use client';

interface MapProps {
  mapId?: string;
  onMapReady?: () => void;
}

export default function Map({ 
  mapId = 'map',
  onMapReady 
}: MapProps) {
  return (
    <div
      id={mapId}
      ref={(el) => {
        if (el) {
          onMapReady?.();
        }
      }}
      style={{ 
        width: '100%', 
        height: 'calc(100vh - 80px)', 
        margin: '0',
        position: 'relative',
      }}
    />
  );
}