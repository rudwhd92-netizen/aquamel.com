// AQUAMEL V-Shape Scanner — Service Worker v1.98
// Network-first 전략으로 항상 최신 버전 우선. 오프라인 fallback만 캐시 사용.
const CACHE_NAME = 'aquamel-v1.98';
const CACHE_FILES = ['./', './index.html', './sw.js'];

self.addEventListener('install', (event) => {
  // 새 SW 즉시 설치 (이전 SW가 페이지 제어 중이어도)
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES).catch(()=>{}))
  );
});

self.addEventListener('activate', (event) => {
  // 이전 버전 캐시 정리
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())  // 즉시 모든 클라이언트 제어
  );
});

// 메시지: SKIP_WAITING (페이지에서 새 SW 즉시 활성화 요청)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch 전략: Network-first (항상 최신 우선, 실패 시 캐시 fallback)
//   index.html 같은 페이지 리소스는 캐시되더라도 매번 네트워크 시도 → 새 버전 자동 반영
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // GET 요청만 캐싱
  if (req.method !== 'GET') return;
  // 외부 도메인 (CDN) 캐시 안함
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        // 성공 시 캐시에도 저장 (다음 오프라인 대비)
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone).catch(()=>{}));
        }
        return res;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시 fallback
        return caches.match(req).then(cached => cached || caches.match('./index.html'));
      })
  );
});
