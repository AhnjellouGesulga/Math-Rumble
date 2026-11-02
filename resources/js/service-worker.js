const PRECACHE_URLS = __PRECACHE_URLS__;
const HOME_PATH = PRECACHE_URLS[0];
const CACHE_PREFIX = `math-rope-rumble-${encodeURIComponent(HOME_PATH)}-`;
const CACHE_NAME = `${CACHE_PREFIX}__CACHE_VERSION__`;
const ASSET_PATHS = new Set(PRECACHE_URLS.slice(1));

self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            try {
                await cache.addAll(
                    PRECACHE_URLS.map(
                        (url) =>
                            new Request(url, {
                                cache: "reload",
                                credentials: "same-origin",
                            }),
                    ),
                );
            } catch (error) {
                await caches.delete(CACHE_NAME);
                throw error;
            }
        })(),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter(
                        (key) =>
                            key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME,
                    )
                    .map((key) => caches.delete(key)),
            );
            await self.clients.claim();
        })(),
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== self.location.origin) return;
    const isHome = request.mode === "navigate" && url.pathname === HOME_PATH;
    if (!isHome && !ASSET_PATHS.has(url.pathname)) return;

    // Keep the page and its assets on the same build until an update is accepted.
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(
                isHome ? HOME_PATH : url.pathname,
                { ignoreSearch: true },
            );
            return cached || fetch(request);
        })(),
    );
});

self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") {
        event.waitUntil(self.skipWaiting());
    }
    if (event.data?.type === "GET_OFFLINE_STATUS" && event.ports[0]) {
        event.waitUntil(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                const responses = await Promise.all(
                    PRECACHE_URLS.map((url) => cache.match(url)),
                );
                event.ports[0].postMessage({ ready: responses.every(Boolean) });
            })(),
        );
    }
});
