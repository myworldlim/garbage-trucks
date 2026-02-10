interface MapProps {
  // mapId?: string;
}

export default function Map({ 
  // mapId = 'map' 
}: MapProps) {
  return (
    <div
      // id={mapId}
      style={{ width: '100%', height: 'calc(100vh - 80px)', margin: '0' }}
    />
  );
}
