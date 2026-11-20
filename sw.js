// Service worker du quiz 日本語 : fonctionne hors ligne une fois ouvert une première fois.
const VERSION = 'nihongo-v1';
const CDN = /^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png']).catch(() => {})));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = req.url;
  if (req.method !== 'GET' || url.startsWith('https://api.github.com')) return;
  if (CDN.test(url)) {   // bibliothèques et dictionnaire japonais : gardés en cache pour toujours
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const r = await fetch(req); if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r;
    }));
    return;
  }
  if (new URL(url).origin === self.location.origin) {   // le quiz : version en ligne d'abord, cache si hors ligne
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  }
});
