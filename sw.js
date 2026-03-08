const CACHE_NAME = 'ai-lotto-v3';
const ASSETS = [
    './',
    './index.html',
    './css/mobile.css',
    './js/logic.js',
    './js/engine.js',
    './js/lotto-db.json',
    './manifest.json'
];

// 서비스 워커 설치 및 즉시 활성화 대기 (Skip Waiting)
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

// 기존 캐시 삭제 및 즉시 클라이언트 제어 시작
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim())
    );
});

// 오프라인 상태일 때 캐시된 리소스 반환 (네트워크 우선 접근)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
