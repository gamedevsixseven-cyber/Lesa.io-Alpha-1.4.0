/**
 * Lesa.io - Network-First App Shell Service Worker
 * Ensures iOS Home Screen bookmarks (standalone PWA) always fetch fresh HTML/JS/CSS
 * from GitHub Pages instead of stale cached app files, while keeping offline fallback.
 */

const CACHE_NAME = 'lesaio-shell-v2';
const ASSET_CACHE = 'lesaio-assets-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== ASSET_CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (!req || req.method !== 'GET') return;
    if (req.headers && req.headers.has('range')) return;

    let url;
    try { url = new URL(req.url); } catch (_) { return; }
    if (url.origin !== self.location.origin) return;

    const path = url.pathname.toLowerCase();
    const isShell = req.mode === 'navigate'
        || path.endsWith('/')
        || path.endsWith('.html')
        || path.endsWith('.js')
        || path.endsWith('.css')
        || path.endsWith('.json');
    const isAsset = (path.includes('/assets/') || path.includes('/devteamlogo/') || path.includes('/audio/'))
        && /\.(png|jpg|jpeg|webp|gif|svg)$/.test(path);

    if (isAsset) {
        const isRetry = url.searchParams.has('_mr');
        const cleanUrlObj = new URL(url.href);
        cleanUrlObj.searchParams.delete('_mr');
        const cleanReq = new Request(cleanUrlObj.href);
        event.respondWith(
            caches.open(ASSET_CACHE).then((cache) => {
                const netFetch = () => fetch(req).then((res) => {
                    if (res && res.status === 200 && res.type === 'basic') {
                        cache.put(isRetry ? cleanReq : req, res.clone()).catch(() => {});
                    }
                    return res;
                });
                if (isRetry) {
                    return netFetch().catch(() => cache.match(cleanReq));
                }
                return cache.match(req).then((cached) => {
                    if (cached) {
                        netFetch().catch(() => {});
                        return cached;
                    }
                    return netFetch();
                });
            })
        );
        return;
    }
    if (!isShell) return;

    // Network-first with cache: 'no-store' so iOS standalone WebClips never stay on stale GitHub caches
    event.respondWith(
        fetch(req, { cache: 'no-store' })
            .then((res) => {
                if (res && res.status === 200 && res.type === 'basic') {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
                }
                return res;
            })
            .catch(() => caches.match(req))
    );
});
