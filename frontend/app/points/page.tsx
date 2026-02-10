'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Point {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  drivers?: string[];
}

interface Driver {
  id: number;
  name: string;
}

export default function PointsPage() {
  const router = useRouter();
  const [points, setPoints] = useState<Point[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPointId, setDeletingPointId] = useState<number | null>(null);
  const [editingPoint, setEditingPoint] = useState<Point | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [newPoint, setNewPoint] = useState({
    name: '',
    address: '',
    coordinates: '',
    city: 'Рязань'
  });

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    // Загружаем точки
    fetch(`${apiUrl}/api/points`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setPoints(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching points:', err);
        setLoading(false);
      });

    // Загружаем водителей
    fetch(`${apiUrl}/api/drivers`)
      .then(res => res.json())
      .then(data => setDrivers(data || []))
      .catch(err => console.error('Error fetching drivers:', err));
  }, []);

  const handleAddPoint = async () => {
    if (!newPoint.name.trim() || !newPoint.coordinates.trim()) {
      alert('Заполните название и координаты');
      return;
    }

    const coords = newPoint.coordinates.split(',').map(c => c.trim());
    if (coords.length !== 2) {
      alert('Неверный формат координат. Используйте: 54.6269, 39.7464');
      return;
    }

    const latitude = parseFloat(coords[0]);
    const longitude = parseFloat(coords[1]);

    if (isNaN(latitude) || isNaN(longitude)) {
      alert('Координаты должны быть числами');
      return;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      if (editingPoint) {
        // Редактирование
        const response = await fetch(`${apiUrl}/api/points/${editingPoint.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newPoint.name,
            address: newPoint.address || `Точка ${newPoint.name}`,
            latitude: latitude,
            longitude: longitude,
            city: newPoint.city,
            driver_ids: selectedDrivers
          }),
        });

        if (!response.ok) throw new Error('Failed to update point');

        // Перезагружаем все точки
        const pointsResponse = await fetch(`${apiUrl}/api/points`);
        if (pointsResponse.ok) {
          const updatedPoints = await pointsResponse.json();
          setPoints(updatedPoints || []);
        }
      } else {
        // Добавление
        const response = await fetch(`${apiUrl}/api/points`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newPoint.name,
            address: newPoint.address || `Точка ${newPoint.name}`,
            latitude: latitude,
            longitude: longitude,
            city: newPoint.city,
            driver_ids: selectedDrivers
          }),
        });

        if (!response.ok) throw new Error('Failed to create point');

        // Перезагружаем все точки
        const pointsResponse = await fetch(`${apiUrl}/api/points`);
        if (pointsResponse.ok) {
          const updatedPoints = await pointsResponse.json();
          setPoints(updatedPoints || []);
        }
      }
      
      setShowModal(false);
      setEditingPoint(null);
      setSelectedDrivers([]);
      setNewPoint({ name: '', address: '', coordinates: '', city: 'Рязань' });
    } catch (err) {
      console.error('Error saving point:', err);
      alert('Ошибка сохранения точки');
    }
  };

  const handleEditPoint = async (point: Point) => {
    setEditingPoint(point);
    setNewPoint({
      name: point.name,
      address: point.address,
      coordinates: `${point.latitude}, ${point.longitude}`,
      city: point.city
    });
    
    // Загружаем водителей для этой точки
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/routes?point_id=${point.id}`);
      if (response.ok) {
        const routes = await response.json();
        const driverIds = (routes || []).map((r: any) => r.driver_id);
        setSelectedDrivers(driverIds);
      } else {
        setSelectedDrivers([]);
      }
    } catch (err) {
      console.error('Error fetching point drivers:', err);
      setSelectedDrivers([]);
    }
    
    setShowModal(true);
  };

  const fetchAddressFromCoordinates = async (coordinates: string) => {
    const coords = coordinates.split(',').map(c => c.trim());
    if (coords.length !== 2) return;

    const latitude = parseFloat(coords[0]);
    const longitude = parseFloat(coords[1]);

    if (isNaN(latitude) || isNaN(longitude)) return;

    try {
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=8deea7af-f681-4ac6-96b6-c6f2d7ac1ec7&geocode=${longitude},${latitude}&format=json&lang=ru_RU`
      );
      const data = await response.json();
      
      const geoObject = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
      if (geoObject) {
        const address = geoObject.metaDataProperty?.GeocoderMetaData?.text || '';
        setNewPoint(prev => ({ ...prev, address }));
      }
    } catch (err) {
      console.error('Error fetching address:', err);
    }
  };

  const handleDeletePoint = async () => {
    if (!deletingPointId) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/points/${deletingPointId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete point');

      setPoints(points.filter(p => p.id !== deletingPointId));
      setShowDeleteModal(false);
      setDeletingPointId(null);
    } catch (err) {
      console.error('Error deleting point:', err);
      alert('Ошибка удаления точки');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div className="header">
        <button onClick={() => router.back()} style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '35px', height: '35px' }} />
          <h1 style={{ margin: 0, fontSize: '24px' }}>Точки сбора</h1>
        </div>
        <p>{points.length} точек</p>
      </div>
      <div className="container">
        {points.length === 0 ? (
          <div className="card">
            <p>Нет точек сбора</p>
          </div>
        ) : (
          points.map(point => (
            <div key={point.id} className="card" style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setDeletingPointId(point.id);
                  setShowDeleteModal(true);
                }}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
              <button
                onClick={() => handleEditPoint(point)}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✏️
              </button>
              <h3>{point.name}</h3>
              <p style={{ color: '#666', margin: '5px 0' }}>{point.address}</p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                📍 {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
              </p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                🏙️ {point.city}
              </p>
              {point.drivers && point.drivers.length > 0 && (
                <p style={{ fontSize: '14px', color: '#4CAF50', marginTop: '5px', fontWeight: 'bold' }}>
                  👤 Водители: {point.drivers.join(', ')}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Кнопка добавления */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          fontSize: '32px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        +
      </button>

      {/* Модальное окно */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px' }}>{editingPoint ? 'Редактировать точку' : 'Добавить точку сбора'}</h2>
            <input
              type="text"
              placeholder="Название *"
              value={newPoint.name}
              onChange={(e) => setNewPoint({...newPoint, name: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                marginBottom: '15px',
                boxSizing: 'border-box'
              }}
            />
            <input
              type="text"
              placeholder="Адрес заполняется по координатам"
              value={newPoint.address}
              onChange={(e) => setNewPoint({...newPoint, address: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                marginBottom: '15px',
                boxSizing: 'border-box'
              }}
            />
            <input
              type="text"
              placeholder="Координаты (54.6269, 39.7464)"
              value={newPoint.coordinates}
              onChange={(e) => setNewPoint({...newPoint, coordinates: e.target.value})}
              onBlur={(e) => {
                if (e.target.value.trim() && !newPoint.address) {
                  fetchAddressFromCoordinates(e.target.value);
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                marginBottom: '15px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Водители (необязательно)</label>
              <div style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                {drivers.map(driver => (
                  <label key={driver.id} style={{ display: 'block', padding: '5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedDrivers.includes(driver.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDrivers([...selectedDrivers, driver.id]);
                        } else {
                          setSelectedDrivers(selectedDrivers.filter(id => id !== driver.id));
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    {driver.name}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAddPoint}
                className="btn"
                style={{
                  flex: 1,
                  background: '#4CAF50',
                  color: 'white',
                  padding: '12px',
                  fontSize: '16px'
                }}
              >
                {editingPoint ? 'Сохранить' : 'Добавить'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPoint(null);
                  setSelectedDrivers([]);
                  setNewPoint({ name: '', address: '', coordinates: '', city: 'Рязань' });
                }}
                className="btn"
                style={{
                  flex: 1,
                  background: '#9E9E9E',
                  color: 'white',
                  padding: '12px',
                  fontSize: '16px'
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно удаления */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px' }}>Удалить точку?</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>Это действие нельзя отменить.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDeletePoint}
                className="btn"
                style={{
                  flex: 1,
                  background: '#F44336',
                  color: 'white',
                  padding: '12px',
                  fontSize: '16px'
                }}
              >
                Удалить
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingPointId(null);
                }}
                className="btn"
                style={{
                  flex: 1,
                  background: '#9E9E9E',
                  color: 'white',
                  padding: '12px',
                  fontSize: '16px'
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
