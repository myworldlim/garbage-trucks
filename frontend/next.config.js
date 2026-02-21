const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',

  // Важно: для стратегий с networkTimeoutSeconds используем ТОЛЬКО NetworkFirst
  runtimeCaching: [
    // 1. OSM тайлы — CacheFirst (самое важное для оффлайн-карты)
    {
      urlPattern: ({ url }) =>
        url.hostname.includes('tile.openstreetmap.org') ||
        url.hostname.includes('a.tile.openstreetmap.org') ||
        url.hostname.includes('b.tile.openstreetmap.org') ||
        url.hostname.includes('c.tile.openstreetmap.org') ||
        url.hostname.includes('tile.opentopomap.org') ||
        url.pathname.match(/\/tile\/\d+\/\d+\/\d+\.\w+/i),
      handler: 'CacheFirst',
      options: {
        cacheName: 'osm-tiles-cache',
        expiration: {
          maxEntries: 8000,               // уменьшено с 20000, чтобы не превысить квоту
          maxAgeSeconds: 90 * 24 * 60 * 60, // 90 дней
          purgeOnQuotaError: true,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // 2. OSRM роутинг — NetworkFirst (с таймаутом 10 сек)
    {
      urlPattern: ({ url }) =>
        url.hostname.includes('router.project-osrm.org') ||
        url.pathname.includes('/route/v1/'),
      handler: 'NetworkFirst',           // ← ИСПРАВЛЕНО: было StaleWhileRevalidate
      options: {
        cacheName: 'osrm-routes-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 24 * 60 * 60,   // 1 сутки
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // 3. API-запросы — NetworkFirst (с таймаутом)
    {
      urlPattern: /\/api\//,
      handler: 'NetworkFirst',           // ← ИСПРАВЛЕНО: было StaleWhileRevalidate
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60,        // 1 час
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // 4. Навигация (HTML-страницы) — NetworkFirst с fallback
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
        },
      },
    },

    // 5. Статические файлы Next.js (_next/static/)
    {
      urlPattern: /^https?:\/\/[^/]+\/_next\/static\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-assets',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },

    // 6. Изображения, иконки, шрифты
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
  images: {
    unoptimized: true, // для Leaflet и PWA часто нужно
  },

  // Если понадобятся rewrites — можно вернуть
  // async rewrites() {
  //   return [];
  // },
});