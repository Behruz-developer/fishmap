// ═══════════════════════════════════════
// FishMap — Service Worker (oflayn rejim)
// ═══════════════════════════════════════
// Versiyani o'zgartirsangiz eski kesh avtomatik o'chadi.

const VERSION     = 'fishmap-v9';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME     = `${VERSION}-runtime`;

// Ilova "qobig'i" — internetsiz ham to'liq ochilishi uchun
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/config.js',
  './js/utils.js',
  './js/auth.js',
  './js/weather.js',
  './js/map.js',
  './js/spots.js',
  './js/ui.js',
  './js/guides.js',
  './js/stores-tab.js',
  './js/admin.js',
  './js/profile.js',
  './js/app.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  // Tashqi kutubxona — oflaynda ham ilova ishga tushishi uchun
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
];

// ── O'rnatish ─────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Har bir faylni alohida keshlaymiz — bittasi muvaffaqiyatsiz
      // bo'lsa ham qolganlari saqlanib qoladi va SW faollashadi.
      await Promise.allSettled(SHELL.map((url) => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

// ── Faollashtirish: eski keshlarni tozalash ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── So'rovlarni ushlash ───────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Faqat GET keshlanadi
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Supabase API va auth — HECH QACHON keshlanmaydi
  // (eski ma'lumot yoki token ko'rsatib qo'ymasligi uchun)
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('accounts.google.com')) {
    return;
  }

  // Yandex Maps skriptlari va plitkalari — stale-while-revalidate
  // (keshdan darhol ko'rsatiladi, fonda yangilanadi)
  if (url.hostname.includes('yandex')) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME));
    return;
  }

  // Ob-havo — network-first (yangi ma'lumot muhim), kesh zaxira
  if (url.hostname.includes('open-meteo.com')) {
    event.respondWith(networkFirst(req, RUNTIME));
    return;
  }

  // O'z fayllarimiz, shriftlar va CDN'lar — cache-first
  event.respondWith(cacheFirst(req, SHELL_CACHE));
});

// ── Strategiyalar ─────────────────────
async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    // 'opaque' — cross-origin resurslar (shriftlar, CDN skriptlari):
    // status kodini o'qib bo'lmaydi, lekin keshlash mumkin va kerak.
    if (res && (res.type === 'opaque' || res.ok)) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    // Navigatsiya so'rovi bo'lsa — index.html qaytaramiz
    if (req.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function networkFirst(req, cacheName) {
  try {
    const res = await fetch(req);
    if (res && (res.type === 'opaque' || res.ok)) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await caches.match(req);
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);

  const network = fetch(req)
    .then(res => {
      if (res && (res.type === 'opaque' || res.ok)) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);

  return cached || network;
}