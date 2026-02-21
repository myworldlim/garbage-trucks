const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // 1. OSM тайлы - CacheFirst (самое важное для оффлайн-карты)
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
          maxEntries: 20000,
          maxAgeSeconds: 90 * 24 * 60 * 60,
          purgeOnQuotaError: true,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // 2. OSRM роутинг - StaleWhileRevalidate
    {
      urlPattern: ({ url }) =>
        url.hostname.includes('router.project-osrm.org') ||
        url.pathname.includes('/route/v1/'),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'osrm-routes-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // 3. API-запросы — StaleWhileRevalidate
    {
      urlPattern: /\/api\//,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // 4. Статические файлы Next.js
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
    // 5. Изображения, иконки, шрифты
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
    unoptimized: true,
  },
  // Разрешаем внешние изображения для Leaflet
  async rewrites() {
    return [];
  },
});