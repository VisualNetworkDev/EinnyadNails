const CLEANUP_VERSION = 'einnyadnails-web-cleanup-v21';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => /^einnyadnails/i.test(key)).map(key => caches.delete(key)));

    const pages = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await self.clients.claim().catch(() => undefined);
    await self.registration.unregister().catch(() => undefined);
    await Promise.all(pages.map(client => client.navigate(client.url).catch(() => undefined)));
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'version') event.source.postMessage(CLEANUP_VERSION);
});

// Cleanup-only endpoint. It replaces the old PWA service worker, deletes the
// old EinnyadNails caches, reloads open pages once, then unregisters itself.
