// Kill-switch service worker.
// Replaces a previously-deployed PWA service worker that was caching stale
// chunks and intercepting auth redirects, causing the login page to refresh
// in a loop. On install/activate it deletes all caches and unregisters
// itself, then forces every controlled client to reload once so the next
// navigation hits the network cleanly.
self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
            await self.registration.unregister();
            const clients = await self.clients.matchAll({ type: "window" });
            for (const client of clients) {
                try {
                    client.navigate(client.url);
                } catch {
                    // ignore — client may not be controllable
                }
            }
        })()
    );
});

self.addEventListener("fetch", () => {
    // Pass through to network — do not serve anything from cache.
});
