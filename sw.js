// AQUAMEL V-Shape Scanner — Service Worker v2.55
// v2.55: CACHE_NAME 갱신 → 옛 cache 박멸 강제
//        + index.html / sw.js / .html / data.json은 fetch cache:'reload'로 브라우저 HTTP cache 우회
//        (이전: fetch(req)가 브라우저 HTTP cache의 옛 거를 받아와 stale 무한 반복)
//
// 중요: 이 파일을 index.html과 항상 함께 push할 것.
//       CACHE_NAME 문자열만 변경해도 옛 cache가 자동 박멸되며 새 자원이 받아짐.
const CACHE_NAME = 'aquamel-v2.55-' + '20260529c';
const CACHE_FILES = ['./', './index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES).catch(()=>{}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const c of clients) {
      try { c.postMessage({ type: 'AQ_SW_ACTIVATED', cache: CACHE_NAME }); } catch(e) {}
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// v2.55: 코어 자원 (HTML 문서, data.json, sw.js) 판정
function _isCoreFresh(url) {
  const p = url.pathname;
  if (p.endsWith('.html')) return true;
  if (p === '/' || p.endsWith('/')) return true;
  if (p.endsWith('/sw.js')) return true;
  if (p.includes('/data/data.json')) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // v2.55: 코어 자원은 항상 network-first + HTTP cache 우회 — 옛 잔상 차단
  if (_isCoreFresh(url)) {
    event.respondWith(
      fetch(req, { cache: 'reload' }).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone).catch(()=>{}));
        }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // 일반 자원 (logos, css, etc): network-first + 일반 cache 정책
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
