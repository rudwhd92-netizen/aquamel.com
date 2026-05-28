// AQUAMEL V-Shape Scanner — Service Worker v2.24
// v2.24: NUCLEAR — install 시 옛 캐시 모조리 정리, activate 시 모든 탭 강제 reload
//   사용자가 index + sw만 push하면 자동으로 새 버전 적용 (캐시 클리어 작업 불필요)
const CACHE_NAME = 'aquamel-v2.24';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    // 옛 캐시 전부 삭제 — 이름이 무엇이든 모두
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    // 모든 열려있는 탭/PWA에 강제 reload — 새 버전 자동 적용
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      try { client.navigate(client.url); } catch (e) {}
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  // sw.js — 항상 network only (브라우저 SW 갱신 가장 빠름)
  if (path.endsWith('/sw.js')) {
    event.respondWith(fetch(req, { cache: 'no-store' }).catch(() => new Response('', { status: 503 })));
    return;
  }

  // data.json — SWR (10분 cron 갱신, 속도 우선)
  if (path.includes('/data/data.json')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req, { ignoreSearch: true });
      const networkPromise = fetch(req).then(res => {
        if (res && res.status === 200) cache.put(req, res.clone()).catch(()=>{});
        return res;
      }).catch(() => null);
      return cached || (await networkPromise) || new Response('', { status: 503 });
    })());
    return;
  }

  // 이미지 — cache-first
  if (/\.(png|jpe?g|svg|webp|gif|ico)$/i.test(path)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) {
        fetch(req).then(res => {
          if (res && res.status === 200) cache.put(req, res.clone()).catch(()=>{});
        }).catch(()=>{});
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res && res.status === 200) cache.put(req, res.clone()).catch(()=>{});
        return res;
      } catch (e) { return new Response('', { status: 503 }); }
    })());
    return;
  }

  // index.html, html/css/js/json — NETWORK-FIRST (사용자 push 즉시 반영)
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone()).catch(()=>{});
      }
      return res;
    } catch (e) {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      return cached || cache.match('./index.html') || new Response('', { status: 503 });
    }
  })());
});
