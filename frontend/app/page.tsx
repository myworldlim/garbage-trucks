'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Driver {
  id: number;
  name: string;
}

export default function Home() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDriverId, setDeletingDriverId] = useState<number | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [newDriverName, setNewDriverName] = useState('');

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    fetch(`${apiUrl}/api/drivers`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setDrivers(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching drivers:', err);
        setLoading(false);
      });
  }, []);

  const handleAddDriver = async () => {
    if (!newDriverName.trim()) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      if (editingDriver) {
        // Редактирование
        const response = await fetch(`${apiUrl}/api/drivers/${editingDriver.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newDriverName }),
        });

        if (!response.ok) throw new Error('Failed to update driver');

        const updatedDriver = await response.json();
        setDrivers(drivers.map(d => d.id === editingDriver.id ? updatedDriver : d));
      } else {
        // Добавление
        const response = await fetch(`${apiUrl}/api/drivers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newDriverName }),
        });

        if (!response.ok) throw new Error('Failed to create driver');

        const newDriver = await response.json();
        setDrivers([...drivers, newDriver]);
      }
      
      setShowModal(false);
      setEditingDriver(null);
      setNewDriverName('');
    } catch (err) {
      console.error('Error saving driver:', err);
      alert('Ошибка сохранения водителя');
    }
  };

  const handleDeleteDriver = async () => {
    if (!deletingDriverId) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/drivers/${deletingDriverId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete driver');

      setDrivers(drivers.filter(d => d.id !== deletingDriverId));
      setShowDeleteModal(false);
      setDeletingDriverId(null);
    } catch (err) {
      console.error('Error deleting driver:', err);
      alert('Ошибка удаления водителя');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '50px', height: '50px' }} />
          <h1 style={{ margin: 0 }}>Garbage Trucks</h1>
        </div>
        <p>Выберите водителя или номер машины</p>
      </div>
      <div className="container">
        {drivers.length === 0 ? (
          <div className="card">
            <p>Нет доступных водителей. Проверьте подключение к серверу.</p>
          </div>
        ) : (
          drivers.map(driver => (
            <div key={driver.id} style={{ position: 'relative' }}>
              <Link href={`/driver/${driver.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ cursor: 'pointer' }}>
                  <h2>{driver.name}</h2>
                  <p style={{ color: '#666', marginTop: '5px' }}>Посмотреть маршрут →</p>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setDeletingDriverId(driver.id);
                  setShowDeleteModal(true);
                }}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '25px',
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
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                ×
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setEditingDriver(driver);
                  setNewDriverName(driver.name);
                  setShowModal(true);
                }}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '25px',
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
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                ✏️
              </button>
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

      {/* Кнопка точек */}
      <button
        onClick={() => router.push('/points')}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#2196F3',
          color: 'white',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          fontWeight: 'bold'
        }}
      >
        Точки
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
              maxWidth: '400px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px' }}>{editingDriver ? 'Редактировать водителя' : 'Добавить водителя'}</h2>
            <input
              type="text"
              placeholder="Имя или номер машины"
              value={newDriverName}
              onChange={(e) => setNewDriverName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAddDriver}
                className="btn"
                style={{
                  flex: 1,
                  background: '#4CAF50',
                  color: 'white',
                  padding: '12px',
                  fontSize: '16px'
                }}
              >
                {editingDriver ? 'Сохранить' : 'Добавить'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingDriver(null);
                  setNewDriverName('');
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
            <h2 style={{ marginBottom: '20px' }}>Удалить водителя?</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>Это действие нельзя отменить. Все маршруты водителя будут удалены.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDeleteDriver}
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
                  setDeletingDriverId(null);
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
