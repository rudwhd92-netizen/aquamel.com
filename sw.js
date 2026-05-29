// AQUAMEL V-Shape Scanner — Service Worker v2.36-r3
// 옛 SW + 옛 cache 강제 폐기 (install skipWaiting + activate broadcast reload)
const CACHE_NAME = 'aquamel-v2.36-r3-' + '20260529';
const CACHE_FILES = ['./', './index.html'];  // sw.js는 일부러 precache 안 함 (자기 자신 stuck 방지)

self.addEventListener('install', (event) => {
  // 즉시 active 전환 — 옛 SW의 waiting 단계 건너뛰기
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES).catch(()=>{}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 옛 cache 모두 박멸
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    // 모든 client(=열려있는 페이지)를 자기 control 하에 두기
    await self.clients.claim();
    // 모든 client에게 reload 명령 broadcast (각 페이지가 sessionStorage 가드로 1회만 실행)
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const c of clients) {
      try { c.postMessage({ type: 'AQ_SW_ACTIVATED', cache: CACHE_NAME }); } catch(e) {}
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

  // data.json은 항상 network-first — 옛 cached 잔상 차단
  if (url.pathname.includes('/data/data.json')) {
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone).catch(()=>{}));
        }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }

  // 일반 자원: network-first, network 실패 시 cache fallback
  event.respondWith(
    fetch(req).then(res => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone).catch(()=>{}));
      }
      return res;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
  );
});
