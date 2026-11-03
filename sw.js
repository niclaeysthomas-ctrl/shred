// SHRED — service worker : réseau d'abord, cache en secours (l'app reste utilisable hors-ligne).
const CACHE = "shred-v45-nps";
const ASSETS = [
  "./", "./index.html", "./classic.html", "./manifest.webmanifest", "./css/app.css",
  "./js/app.js", "./js/theory.js", "./js/audio.js", "./js/store.js", "./js/ui.js", "./js/fretboard.js", "./js/quiz.js",
  "./js/content/glossary.js", "./js/content/modes.js", "./js/content/lessons.js", "./js/content/progressions.js", "./js/content/technique.js", "./js/content/chords.js",
  "./js/views/home.js", "./js/views/path.js", "./js/views/labo.js", "./js/views/impro.js", "./js/views/session.js", "./js/views/progress.js", "./js/views/technique.js", "./js/views/compo.js", "./js/quiz2.js", "./js/pitch.js", "./js/content/lessons2.js"
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
