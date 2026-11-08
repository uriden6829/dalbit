// Service worker: network-first for the app (so updates show up as soon as she's online),
// cache fallback for offline, cache-first for fonts. BUILD is rewritten by tools/build.mjs.
const BUILD = '5af0b07fdbc6';
const CACHE = `dalbit-${BUILD}`;
const VOICE_CACHE = 'voice-clips-1';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      const list = await (await fetch('files.json', { cache: 'no-store' })).json();
      await cache.addAll(list.files);
    } catch { /* offline install: runtime caching fills in later */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('dalbit-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 5000))]);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (hit) return hit;
    if (req.mode === 'navigate') return (await cache.match('./')) || (await cache.match('index.html'));
    throw new Error('offline');
  }
}

async function cacheFirst(req, name = CACHE) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') { e.respondWith(cacheFirst(req)); return; }
  if (url.origin !== self.location.origin) return;
  // Studio voice clips never change (the name is a hash of voice + text), so they live in their own cache
  // that survives app updates: once a line has been heard, it plays offline.
  // Fetched by URL (no Range header) so the cache always holds the whole file, never a 206 piece.
  if (url.pathname.includes('/voice/clips/')) { e.respondWith(cacheFirst(new Request(req.url), VOICE_CACHE)); return; }
  e.respondWith(networkFirst(req));
});
