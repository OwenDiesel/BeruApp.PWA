const CACHE_NAME = 'beruapp-pwa-v21';
const APP_SHELL = [
  './', './index.html', './styles.css', './improvements.css', './app.js', './enhancements.js', './unit-preferences.js', './calculations.js', './manifest.webmanifest',
  './assets/beruapp-logo.png', './assets/beruseal-logo.png', './assets/target-logo.png', './assets/target.ico', './assets/asset-3.webp',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/target-icon-192.png', './assets/icons/target-icon-512.png',
  './assets/diagrams/elbow-diagram.png', './assets/diagrams/flange-diagram.png',
  './source_information/pipes.json', './source_information/flanges.json', './source_information/wps.json', './source_information/compounds.json',
  './source_information/engineering_calcs.json', './source_information/asme_table_1a.json', './source_information/source-data.js',
  './source_information/references/90-elbow-long-radius.pdf', './source_information/references/material-guide.pdf', './source_information/references/SANS347%20Cat.txt'
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))); });
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil((async () => { const keys=await caches.keys(); await Promise.all(keys.filter(key=>key.startsWith('beruapp-pwa-') && key!==CACHE_NAME).map(key=>caches.delete(key))); await self.clients.claim(); })());
});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache=await caches.open(CACHE_NAME);
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),5000);
    try {
      const response=await fetch(event.request,{cache:'no-store',signal:controller.signal});
      if(response.ok) { event.waitUntil(cache.put(event.request,response.clone())); return response; }
      return await cache.match(event.request) || response;
    } catch {
      return await cache.match(event.request) || (event.request.mode==='navigate' ? await cache.match('./index.html') : null) || new Response('Unavailable offline',{status:503,headers:{'Content-Type':'text/plain'}});
    } finally { clearTimeout(timer); }
  })());
});
