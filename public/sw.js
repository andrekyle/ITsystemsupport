/* ITSS Learn service worker — offline support for the installed (PWA) app.
 *
 * Strategy:
 *  - navigations: network-first, falling back to the cached shell when offline
 *  - static assets (js/css/fonts/images/pdf): stale-while-revalidate
 *  - never caches Supabase or other cross-origin API calls
 */
const VERSION = "itss-v2";
const SHELL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll([SHELL])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const ASSET_RE = /\.(?:js|css|woff2?|ttf|png|jpe?g|webp|gif|svg|ico|pdf|webmanifest)$/;

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch API/cloud calls

  // app navigations: try the network, fall back to the cached shell offline
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(SHELL, copy));
          return res;
        })
        .catch(() => caches.match(SHELL))
    );
    return;
  }

  // static assets: serve from cache, refresh in the background
  if (ASSET_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetched = fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    );
  }
});
// deploy trigger: 2026-08-16T18:38:59+02:00
