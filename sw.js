const CACHE_NAME = 'wow-planner-v1';
const APP_SHELL = [
    './',
    './index.html',
    './manifest.json'
];

// Установка Service Worker и кэширование основных файлов
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

// Активация и очистка старого кэша
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) return caches.delete(name);
                })
            );
        })
    );
    self.clients.claim();
});

// Перехват запросов (Стратегия: Сначала кэш, потом сеть)
self.addEventListener('fetch', (event) => {
    // Решение проблемы Opaque Responses для Tailwind CDN
    if (event.request.url.includes('cdn.tailwindcss.com')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request, { mode: 'no-cors' }).then((response) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                });
            })
        );
        return;
    }

    // Для остальных запросов (HTML, скрипты)
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                // Если нет сети, возвращаем HTML из кэша
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
