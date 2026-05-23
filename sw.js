// AQUAMEL Service Worker — PWA 풀 설치(WebAPK) 요건 충족 + 오프라인 캐시 폴백
// Chrome이 이 파일을 발견하면 "바로가기"가 아닌 진짜 앱으로 설치합니다.
//
// v1.23 변경:
//   - cross-origin 요청(Apps Script 등)은 SW가 가로채지 않고 브라우저에 그대로 위임
//     iOS WKWebView 환경에서 JSONP 호출이 차단되던 문제 해결

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

  // cross-origin 요청은 SW가 절대 건드리지 않음
  // (Apps Script, googleusercontent 등 외부 호출 보호)
  const reqUrl = new URL(e.request.url);
  if (reqUrl.origin !== self.location.origin) return;

  // same-origin GET만 network-first + 캐시 폴백
  e.respondWith(
    fetch(e.request)
      .catch(() => caches.match(e.request) || caches.match('./'))
  );
});
