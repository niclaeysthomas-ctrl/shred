// SHRED — service worker : network-first avec repli cache.
// Le réseau d'abord (les mises à jour arrivent immédiatement), le cache
// en secours (l'app reste 100 % hors-ligne). Cache-first nous servait des
// versions périmées après chaque déploiement.
const CACHE = "shred-v9";
const ASSETS = [
  "./",
  "./index.html",
  "./data-guitar.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() =>
      caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match("./index.html"))
    )
  );
});
