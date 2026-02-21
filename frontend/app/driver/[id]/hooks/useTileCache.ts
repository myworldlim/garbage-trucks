//frontend\app\driver\[id]\hooks\useTileCache.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { get, set, keys, del } from 'idb-keyval';

interface CacheProgress {
  current: number;
  total: number;
}

interface Point {
  lat: number;
  lon: number;
  name: string;
}

// Конвертация координат в тайлы
const latLonToTile = (lat: number, lon: number, zoom: number) => {
  const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y };
};

// Получение тайлов для области вокруг точки
const getTilesForPoint = (lat: number, lon: number, radiusMeters: number, zoom: number) => {
  const tiles: { x: number; y: number; z: number }[] = [];
  const center = latLonToTile(lat, lon, zoom);
  
  const tilesPerDegree = Math.pow(2, zoom) / 360;
  const radiusInTiles = Math.ceil((radiusMeters / 111000) * tilesPerDegree * 2);
  
  for (let x = center.x - radiusInTiles; x <= center.x + radiusInTiles; x++) {
    for (let y = center.y - radiusInTiles; y <= center.y + radiusInTiles; y++) {
      if (x >= 0 && y >= 0) {
        tiles.push({ x, y, z: zoom });
      }
    }
  }
  
  return tiles;
};

// URL тайла OSM
const getTileUrl = (x: number, y: number, z: number) => {
  const servers = ['a', 'b', 'c'];
  const server = servers[Math.floor(Math.random() * servers.length)];
  return `https://${server}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
};

export const useTileCache = () => {
  const [cacheProgress, setCacheProgress] = useState<CacheProgress | null>(null);
  const [isCaching, setIsCaching] = useState(false);
  const [cachedTilesCount, setCachedTilesCount] = useState(0);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasCachedRef = useRef(false);

  // Проверка онлайн статуса
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Подсчёт закэшированных тайлов
  useEffect(() => {
    const countCachedTiles = async () => {
      try {
        const allKeys = await keys();
        const tileKeys = (allKeys as string[]).filter((key: string) => key.startsWith('tile-'));
        setCachedTilesCount(tileKeys.length);
        hasCachedRef.current = tileKeys.length > 100;
      } catch (err) {
        console.error('Error counting cached tiles:', err);
      }
    };
    countCachedTiles();
  }, [cacheProgress]);

  // Загрузка тайла
  const fetchTile = async (url: string, signal: AbortSignal) => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Failed to fetch tile: ${response.status}`);
    return await response.blob();
  };

  // Кэширование тайлов
  const cacheTile = async (x: number, y: number, z: number, signal: AbortSignal) => {
    const url = getTileUrl(x, y, z);
    const cacheKey = `tile-${z}-${x}-${y}`;
    
    try {
      const cached = await get(cacheKey);
      if (cached) return false;
      
      const blob = await fetchTile(url, signal);
      await set(cacheKey, blob);
      return true;
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw err;
      }
      console.warn(`Failed to cache tile ${z}/${x}/${y}:`, err);
      return false;
    }
  };

  // Начало кэширования
  const startCaching = useCallback(async (points: Point[], radiusMeters: number = 500) => {
    // Не кэшируем если уже есть кэш или нет интернета
    if (hasCachedRef.current) {
      console.log('✅ Кэш уже загружен, пропускаем');
      return;
    }

    if (!navigator.onLine) {
      console.log('⚠️ Нет интернета, кэширование отложено');
      return;
    }

    setIsCaching(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const allTiles = new Set<string>();
      
      const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
      const centerLon = points.reduce((sum, p) => sum + p.lon, 0) / points.length;
      
      // Зум 11-13: вся область
      for (let z = 11; z <= 13; z++) {
        const tiles = getTilesForPoint(centerLat, centerLon, 20000, z);
        tiles.forEach(t => allTiles.add(`${t.z}-${t.x}-${t.y}`));
      }

      // Зум 14-15: дороги между посёлками
      for (let z = 14; z <= 15; z++) {
        points.forEach(p => {
          const tiles = getTilesForPoint(p.lat, p.lon, 2000, z);
          tiles.forEach(t => allTiles.add(`${t.z}-${t.x}-${t.y}`));
        });
      }

      // Зум 16-17: 500м вокруг каждой точки
      for (let z = 16; z <= 17; z++) {
        points.forEach(p => {
          const tiles = getTilesForPoint(p.lat, p.lon, radiusMeters, z);
          tiles.forEach(t => allTiles.add(`${t.z}-${t.x}-${t.y}`));
        });
      }

      const tilesArray = Array.from(allTiles).map(s => {
        const [z, x, y] = s.split('-').map(Number);
        return { x, y, z };
      });

      setCacheProgress({ current: 0, total: tilesArray.length });

      let successCount = 0;
      for (let i = 0; i < tilesArray.length; i++) {
        if (signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }

        const tile = tilesArray[i];
        const cached = await cacheTile(tile.x, tile.y, tile.z, signal);
        if (cached) successCount++;

        setCacheProgress({ current: i + 1, total: tilesArray.length });

        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      console.log(`✅ Закэшировано ${successCount} из ${tilesArray.length} тайлов`);
      hasCachedRef.current = true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Caching error:', err);
      }
    } finally {
      setIsCaching(false);
      setCacheProgress(null);
      abortControllerRef.current = null;
    }
  }, []);

  // Отмена кэширования
  const cancelCaching = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsCaching(false);
    setCacheProgress(null);
  }, []);

  // Очистка кэша
  const clearCache = useCallback(async () => {
    try {
      const allKeys = await keys();
      const tileKeys = (allKeys as string[]).filter((key: string) => key.startsWith('tile-'));
      await Promise.all(tileKeys.map((key: string) => del(key)));
      setCachedTilesCount(0);
      hasCachedRef.current = false;
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }, []);

  return {
    cacheProgress,
    isCaching,
    startCaching,
    cancelCaching,
    clearCache,
    cachedTilesCount,
    isOnline,
  };
};