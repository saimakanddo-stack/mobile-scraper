// Mobile Tools - Service Worker
// Provides offline support and caching for PWA

const CACHE_NAME = 'mobile-scraper-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/themes.css',
    '/css/mobile.css',
    '/js/app.js',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png',
    '/manifest.json'
];

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((err) => {
                console.error('[SW] Cache failed:', err);
            })
    );
    
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
    );
    
    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch Event - Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }
    
    // Cache-first strategy for static assets
    if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    return response || fetch(request).then((fetchResponse) => {
                        return caches.open(STATIC_CACHE).then((cache) => {
                            cache.put(request, fetchResponse.clone());
                            return fetchResponse;
                        });
                    });
                })
                .catch(() => {
                    // Offline fallback
                    if (request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                })
        );
    } else {
        // Network-first strategy for dynamic content
        event.respondWith(
            fetch(request)
                .then((response) => {
                    return caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    return caches.match(request);
                })
        );
    }
});

// Background Sync (for failed scraping requests)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-scraped-data') {
        event.waitUntil(
            // Sync logic will be implemented in Phase 3
            Promise.resolve()
        );
    }
});

// Push Notifications (for scraping completion)
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Mobile Scraper';
    const options = {
        body: data.body || 'Scraping completed!',
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/icon-192.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        actions: [
            {
                action: 'view',
                title: 'View Results'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message Handler (for communication with main app)
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => caches.delete(name))
                );
            })
        );
    }
});

console.log('[SW] Service Worker loaded');
