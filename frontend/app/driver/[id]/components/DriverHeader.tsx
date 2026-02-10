import { useRouter } from 'next/navigation';

interface DriverHeaderProps {
  driverName: string;
  routeCount: number;
}

export default function DriverHeader({
  driverName,
  routeCount,
}: DriverHeaderProps) {
  const router = useRouter();

  return (
    <div
      className="header"
      style={{
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'white',
      }}
    >
      <button
        onClick={() => router.back()}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          fontSize: '26px',
          cursor: 'pointer',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ←
      </button>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 2px 0', fontSize: '1.35rem' }}>
          {driverName || 'Водитель'}
        </h2>
        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.85 }}>
          {routeCount} точек
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        title="Обновить данные"
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '22px',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ↻
      </button>
    </div>
  );
}
