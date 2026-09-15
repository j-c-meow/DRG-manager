/* 17号钻台 Service Worker（B 备料 v1.0）
   —— 缓存优先、版本化；A 在 游戏.html 里用以下三行注册即可：
   if ('serviceWorker' in navigator && location.protocol !== 'file:')
     navigator.serviceWorker.register('sw.js');
   注意：file:// 协议与微信 webview 内不生效（自动跳过，不影响游戏）。
*/
const CACHE = 'drg-rig-v2';           // 每次发新版把 v1 改成 v2，旧缓存自动清理
const ASSETS = [
  './',
  './游戏.html',
  './manifest.webmanifest',
  './assets/pwa/icon-192.png',
  './assets/pwa/icon-512.png',
  './assets/pwa/apple-touch-icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match('./游戏.html')))
  );
});
