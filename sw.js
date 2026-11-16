// Arcade service worker. It sits at the site root, so it covers the hub and every game (/<game>/): the Arcade
// installs as one app, and anything already played opens offline.
// ponytail: network-first, so online players always get the latest deploy and the cache is only the offline
// fallback. Ceiling: a game never opened online isn't there offline; precache its files if that ever matters.
const CACHE = 'arcade';
// Only our own pages and the CDNs games load code and fonts from. Everything else (sign-in, leaderboards)
// goes straight to the network, never to the cache.
const CACHED_HOSTS = [location.host, 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !CACHED_HOSTS.includes(new URL(req.url).host)) return;
  e.respondWith(fetch(req).then(res => {
    if (res.status === 200 || res.type === 'opaque') {
      const copy = res.clone();
      e.waitUntil(caches.open(CACHE).then(c => c.put(req, copy)));
    }
    return res;
  }).catch(async () => (await caches.match(req)) || (req.mode === 'navigate' && await caches.match('/')) || Response.error()));
});
