// AQUAMEL V-Shape Scanner — Service Worker v2.60
// v2.55: CACHE_NAME 갱신 → 옛 cache 박멸 강제
//        + index.html / sw.js / .html / data.json은 fetch cache:'reload'로 브라우저 HTTP cache 우회
// v2.60: CACHE_NAME을 register URL의 ?v= query에서 자동 추출
//        → index.html의 AQ_PWA_VERSION 한 줄만 변경하면 sw.js byte 변경 없이도 일부 브라우저는 자동 SW 갱신
//        → 모든 브라우저 호환을 위해 SW 자체 fetch handler가 항상 network-first(cache:'reload')
//          이므로 sw.js byte 변경 없어도 새 index.html이 사용자에게 도달
//
// 중요: 이 파일은 사실상 한 번 deploy되면 byte 변경 없이도 동작 가능 (network-first).
//       단 fetch 정책 자체를 바꿀 때만 sw.js를 재배포.

// v2.60: register URL ?v= query에서 version 추출 + fallback
const _swVersion = (() => {
  try {
    const m = self.location.search.match(/[?&]v=([^&]+)/);
    return m ? m[1] : '2.60-fallback';
  } catch (e) { return '2.60-fallback'; }
})();
const CACHE_NAME = 'aquamel-v' + _swVersion;
const CACHE_FILES = ['./', './index.html'];

self.addEventListener('install', (event) => {
  console.log('[SW] install', CACHE_NAME);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES).catch(()=>{}))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] activate', CACHE_NAME);
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
      console.log('[SW] 옛 cache 박멸:', k);
      return caches.delete(k);
    }));
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

// 코어 자원 (HTML 문서, data.json, sw.js) 판정
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

  // 코어 자원은 항상 network-first + HTTP cache 우회 (옛 잔상 차단)
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
