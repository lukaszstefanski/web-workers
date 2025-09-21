const CACHE_NAME = "form-app";
const DOMAIN_NAME = self.location.origin;
const URLS_TO_CACHE = [
  `${DOMAIN_NAME}/example-3/`,
  `${DOMAIN_NAME}/example-3/index.html`,
  `${DOMAIN_NAME}/example-3/styles.css`,
  `${DOMAIN_NAME}/example-3/script.js`,
];

self.addEventListener("install", (event) => {
  // zapisanie do cache wszystkich plików strony
  console.log("[serviceWorker.js] Instalacja");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener("activate", (event) => {
  // czyszczenie starego cache
  console.log("[serviceWorker.js] Aktywacja");
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
});

self.addEventListener("fetch", (event) => {
  // przechwytywanie zapytań żeby zdecydować czy pobrać dane z sieci czy z cache
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached;
        }

        return new Response("No cache found", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" },
        });
      })
    )
  );
});
