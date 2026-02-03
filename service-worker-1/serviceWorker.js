const CACHE_NAME = "service-worker-cache-v1";
const OFFLINE_URL = "/service-worker-1/index.html";

const ASSETS_TO_CACHE = [
  OFFLINE_URL,
  "/service-worker-1/styles.css",
  "/service-worker-1/script.js",
];

self.addEventListener("install", (event) => {
  console.log("[serviceWorker.js] Instalacja – zapisuję pliki do Cache API");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );

  // Od razu aktywuj nowego SW, jeśli to możliwe
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[serviceWorker.js] Aktywacja – czyszczenie starego cache");

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Główny handler – proxy między aplikacją a siecią
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // 1. Nawigacje (odświeżenie strony, wpisanie adresu) – strategia network-first z fallbackiem do offline UI
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Jeśli sieć zadziałała, zwracamy odpowiedź z sieci
          return response;
        })
        .catch(() => {
          // Brak internetu – zwróć wersję offline z cache
          return caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  // 2. Statyczne zasoby (CSS, JS) – strategia cache-first z fallbackiem do sieci
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).catch(() => {
        // 3. Fallback UI gdy nie ma ani sieci, ani cache dla danego zasobu
        return new Response(
          "Jesteś offline i ten zasób nie jest dostępny w pamięci podręcznej.",
          {
            status: 503,
            statusText: "Service Unavailable (offline fallback)",
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          },
        );
      });
    }),
  );
});
