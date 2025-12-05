const CACHE_NAME = "ai-photo-studio-v1";

// NOTE: Your folder structure = /bds-app/public/...
// So assets must be cached with /bds-app prefix.
const ASSETS_TO_CACHE = [
  "/bds-app/public/",
  "/bds-app/public/index.html",
  "/bds-app/public/signin.html",
  "/bds-app/public/signup.html",
  "/bds-app/public/reset.html",
  "/bds-app/public/reset-success.html",
  "/bds-app/public/editor.html",
  "/bds-app/public/editor-output.html",
  "/bds-app/public/gallery.html",
  "/bds-app/public/gallery-view.html",
  "/bds-app/public/account.html",
  "/bds-app/public/payment-success.html",
  "/bds-app/public/payment-cancel.html",
  "/bds-app/public/subscription-expired.html",
  "/bds-app/public/offline.html",
  "/bds-app/public/404.html",

  // CSS + JS
  "/bds-app/public/styles.css",
  "/bds-app/public/profile.css",
  "/bds-app/public/editor.js",
  "/bds-app/public/premium-check.js",

  // Manifest + icons
  "/bds-app/public/manifest.webmanifest",
  "/bds-app/public/logo192.png",
  "/bds-app/public/logo512.png"
];

// INSTALL — cache everything above
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ACTIVATE — remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH — API bypass, offline support
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Use cache first
      if (cachedResponse) return cachedResponse;

      // Otherwise try network → fallback to offline
      return fetch(event.request).catch(() => {
        return caches.match("/bds-app/public/offline.html");
      });
    })
  );
});
