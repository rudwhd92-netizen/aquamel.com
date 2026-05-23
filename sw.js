// AQUAMEL Service Worker — PWA 풀 설치(WebAPK) 요건 충족 + 오프라인 캐시 폴백
// Chrome이 이 파일을 발견하면 "바로가기"가 아닌 진짜 앱으로 설치합니다.

const CACHE = 'aquamel-v1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.add('./'))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Network-first: 항상 최신을 받되, 오프라인이면 캐시 사용
  e.respondWith(
    fetch(e.request)
      .catch(() => caches.match(e.request) || caches.match('./'))
  );
});
