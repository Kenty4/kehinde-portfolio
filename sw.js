// Bump this on every deploy that changes cached files — it's what forces
// old clients to pick up the new version instead of serving stale content forever.
const CACHE_VERSION = "bowen-hub-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// ── Install: pre-cache the app shell ────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── Activate: drop any old cache versions ───────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first for the app shell, falling back to network.
//    This is the same "fail open, never break" philosophy as the
//    backend's Redis cache-aside layer — a cache miss or offline
//    state degrades gracefully instead of erroring out. ──────────
self.addEventListener("fetch", (event) => {
  // Only handle same-origin GET requests — let everything else pass through untouched.
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Stash a copy of successful responses for next time / offline use.
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          // Offline and not cached — for navigations, fall back to the shell page
          // rather than showing the browser's default "no internet" error.
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
