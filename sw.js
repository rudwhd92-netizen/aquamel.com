// AQUAMEL V-Shape Scanner — Service Worker v2.22
// v2.21: 모든 정적 자원 stale-while-revalidate (두 번째 방문부터 거의 즉시 응답)
//   · 캐시 우선 반환 (수십 ms) + 백그라운드에서 최신 갱신
//   · 이미지는 cache-first (변경 적음, 응답 우선)
//   · data.json도 SWR (10분 cron 갱신에 맞춰 자연스럽게)
const CACHE_NAME = 'aquamel-v2.22';
const PRECACHE_FILES = [
  './',
  './index.html',
  './sw.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Install: 정적 자원 사전 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_FILES).catch(()=>{}))
  );
  self.skipWaiting();
});

// Activate: 옛 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// SWR — 캐시 즉시 반환 + 백그라운드 갱신
async function staleWhileRevalidate(req, cache, ignoreSearch = false) {
  const cached = await cache.match(req, { ignoreSearch });
  const fetchPromise = fetch(req).then(res => {
    if (res && res.status === 200) cache.put(req, res.clone()).catch(()=>{});
    return res;
  }).catch(() => null);
  return cached || (await fetchPromise) || new Response('', { status: 503 });
}

// Cache-first — 변경 적은 자원 (이미지 등)
async function cacheFirst(req, cache) {
  const cached = await cache.match(req);
  if (cached) {
    fetch(req).then(res => {
      if (res && res.status === 200) cache.put(req, res.clone()).catch(()=>{});
    }).catch(()=>{});
    return cached;
  }
  const res = await fetch(req);
  if (res && res.status === 200) cache.put(req, res.clone()).catch(()=>{});
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 외부 origin (jsdelivr CDN, Apps Script) — pass-through
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const path = url.pathname;

    if (path.includes('/data/data.json')) {
      return staleWhileRevalidate(req, cache, true);
    }
    if (/\.(png|jpe?g|svg|webp|gif|ico)$/i.test(path)) {
      return cacheFirst(req, cache);
    }
    if (/\.(html|json|js|css)$/i.test(path) || path === '/' || path.endsWith('/')) {
      return staleWhileRevalidate(req, cache);
    }
    return staleWhileRevalidate(req, cache);
  })());
});
