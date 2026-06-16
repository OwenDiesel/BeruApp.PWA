const CACHE_NAME = "beruapp-pwa-v6";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/beruapp-logo.png",
  "./assets/beruseal-logo.png",
  "./assets/target-logo.png",
  "./assets/target.ico",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/diagrams/elbow-diagram.png",
  "./assets/diagrams/flange-diagram.png",
  "./source_information/pipes.json",
  "./source_information/source-data.js",
  "./source_information/flanges.json",
  "./source_information/wps.json",
  "./source_information/compounds.json",
  "./source_information/engineering_calcs.json",
  "./source_information/asme_table_1a.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request, { cache: "no-store" }).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request))
  );
});
