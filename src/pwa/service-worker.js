const CACHE = 'drg-rig-v13';
const ASSETS = [
  './',
  './index.html',
  './realtime/index.html',
  './styles/manager.css',
  './scripts/manager/game-data.js',
  './scripts/manager/state.js',
  './scripts/manager/missions.js',
  './scripts/manager/realtime-bridge.js',
  './scripts/manager/ui.js',
  './scripts/manager/main.js',
  './manifest.webmanifest',
  './assets/pwa/icon-192.png',
  './assets/pwa/icon-512.png',
  './assets/pwa/apple-touch-icon-180.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isHtml = event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if(isHtml){
    event.respondWith(
      fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => {
        const fallback = url.pathname.includes('/realtime/') ? './realtime/index.html' : './index.html';
        return caches.match(event.request).then(hit => hit || caches.match(fallback));
      })
    );
    return;
  }
  const assetDestinations = ['image', 'audio', 'font', 'script', 'style'];
  const isUsable = response => {
    if(!response || !response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    return !(assetDestinations.includes(event.request.destination) && contentType.includes('text/html'));
  };
  const network = fetch(event.request).then(response => {
    if(!isUsable(response)) return response;
    const copy = response.clone();
    return caches.open(CACHE)
      .then(cache => cache.put(event.request, copy))
      .then(() => response);
  });
  event.waitUntil(network.then(() => undefined, () => undefined));
  event.respondWith(
    caches.match(event.request)
      .then(hit => isUsable(hit) ? hit : network)
      .catch(() => network)
  );
});
