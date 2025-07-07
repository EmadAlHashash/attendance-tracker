const CACHE_NAME = "attendance-cache-v1";
const urlsToCache = [
  "/index.html",
  "/styles/main.css",
  "/scripts/main.js",
  "/manifest.json",
  "/icon/icons.png",
];

// التثبيت
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        console.error('Failed to cache:', error);
      });
    })
  );
});


// التفعيل
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
});

// الاستجابة
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
