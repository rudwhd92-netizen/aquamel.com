// AQUAMEL V-Shape Scanner — Service Worker v2.23
// v2.23: 캐시 우선 → 네트워크 우선으로 회귀
//   · HTML/CSS/JS/JSON: network-first (항상 새 버전 시도 → 사용자가 push 후 즉시 반영)
//   · sw.js 자체: cache 안 함 (가장 빠른 SW 갱신)
//   · 이미지: cache-first (변경 거의 없으니 속도 우선)
//   · data.json: stale-while-revalidate (10분 cron 갱신에 맞춰 속도 + 신선도)
//
//   activate 시 모든 윈도우 강제 reload — 새 sw.js 설치되면 자동으로 새 페이지로 갱신
//   ⇒ 사용자는 index.html + sw.js만 GitHub에 push하면 끝. 캐시 클리어 X.
const CACHE_NAME = 'aquamel-v2.23';

self.addEventListener('install', (event) => {
  self.skipWaiting();  // 새 SW 즉시 waiting → active 전환
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1) 옛 캐시 모두 정리
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    // 2) 모든 클라이언트(탭) 즉시 control
    await self.clients.claim();
    // 3) 모든 윈도우 강제 reload — 자동 새 버전 적용 (캐시 클리어 불필요)
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        try { client.navigate(client.url); } catch (e) {}
      }
    } catch (e) {}
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

  // 1) sw.js 자체는 절대 캐시 X — 브라우저에 항상 새 버전 fetch 시도
  if (path.endsWith('/sw.js')) {
    event.respondWith(fetch(req).catch(() => new Response('', { status: 503 })));
    return;
  }

  // 2) data.json — SWR (속도 + 신선도. 10분 cron 갱신과 자연스럽게)
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

  // 3) 이미지 (로고, 국기 등) — cache-first (변경 드물고 다수 — 속도 우선)
  if (/\.(png|jpe?g|svg|webp|gif|ico)$/i.test(path)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) {
        // 백그라운드 갱신
        fetch(req).then(res => {
          if (res && res.status === 200) cache.put(req, res.clone()).catch(()=>{});
        }).catch(()=>{});
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res && res.status === 200) cache.put(req, res.clone()).catch(()=>{});
        return res;
      } catch (e) {
        return new Response('', { status: 503 });
      }
    })());
    return;
  }

  // 4) index.html, manifest, css, 그 외 js, json — NETWORK-FIRST
  //    항상 새 버전 시도 → 사용자가 push하면 즉시 반영. 네트워크 실패 시에만 캐시.
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
