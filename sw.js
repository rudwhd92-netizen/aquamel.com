// AQUAMEL V-Shape Scanner — Service Worker v2.14
// v2.04: data/data.json만 stale-while-revalidate (즉시 캐시 반환 + 백그라운드 갱신)
// 다른 자산은 기존 network-first
const CACHE_NAME = 'aquamel-v2.14';
const CACHE_FILES = ['./', './index.html', './sw.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES).catch(()=>{}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // v2.04: data/data.json → stale-while-revalidate (캐시 즉시 반환 + 백그라운드 갱신)
  if (url.pathname.includes('/data/data.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(req, { ignoreSearch: true }).then(cached => {
          const networkPromise = fetch(req).then(res => {
            if (res && res.status === 200) {
              cache.put(req, res.clone()).catch(()=>{});
            }
            return res;
          }).catch(() => null);
          return cached || networkPromise;
        });
      })
    );
    return;
  }

  // 일반 리소스: network-first
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone).catch(()=>{}));
        }
        return res;
      })
      .catch(() => {
        return caches.match(req).then(cached => cached || caches.match('./index.html'));
      })
  );
});
