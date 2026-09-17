/* 17号钻台 Service Worker（B 备料 v1.0）
   —— 缓存优先、版本化；A 在 游戏.html 里用以下三行注册即可：
   if ('serviceWorker' in navigator && location.protocol !== 'file:')
     navigator.serviceWorker.register('sw.js');
   注意：file:// 协议与微信 webview 内不生效（自动跳过，不影响游戏）。
*/
const CACHE = 'drg-rig-v5';           // F3 修复（09-16）：v2 曾横跨 v1.4~v1.9.1 六版未变，回头玩家被钉死旧版。发版规则：每次打包必 +1
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
  const url = e.request.url;
  const isHTML = url.endsWith('/游戏.html') || url.endsWith('/index.html') || url.endsWith('/');
  if (isHTML) {
    /* F3 根治：HTML 网络优先——新版先到，断网才回落缓存，免疫忘改版本号 */
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(h => h || caches.match('./游戏.html')))
    );
    return;
  }
  /* 其余资源：缓存优先 + 后台静默更新 */
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
