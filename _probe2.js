/* 探针：renderBoard 3002:48 之谜 */
'use strict';
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync('游戏.html', 'utf8');
const a = html.indexOf('<script>'), b = html.lastIndexOf('</script>');
const src = html.slice(a + 8, b);
const lines = src.split('\n');
console.log('== src 相对 3000-3004 行 ==');
for (let i = 2999; i < 3004; i++) console.log((i + 1) + ': ' + lines[i]);
console.log('== 3002 行 col 48 附近 ==');
console.log(JSON.stringify((lines[3001] || '').slice(30, 80)));

function E() { }
const docListeners = {};
const doc = {
  hidden: false,
  addEventListener(t, f) { (docListeners[t] = docListeners[t] || []).push(f); },
  removeEventListener() { },
  getElementById: () => new E(), querySelector: () => new E(), querySelectorAll: () => [],
  createElement: () => new E(), body: new E(), head: new E(), documentElement: new E()
};
const store = {};
const sb = {
  console, Math, Date, JSON, Promise, setTimeout, clearTimeout, setInterval, clearInterval, parseInt, parseFloat, isNaN, isFinite,
  document: doc,
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  navigator: { userAgent: 'probe' }, location: { protocol: 'http:' },
  Audio: function () { this.play = () => Promise.resolve(); this.pause = () => { }; this.addEventListener = () => { }; },
  requestAnimationFrame: f => setTimeout(() => f(Date.now()), 16)
};
sb.window = sb; sb.globalThis = sb; sb.addEventListener = () => { }; sb.removeEventListener = () => { };
sb.innerWidth = 1280; sb.innerHeight = 800;
sb.matchMedia = () => ({ matches: false, addListener() { }, addEventListener() { } });
sb.getComputedStyle = () => ({ getPropertyValue: () => '' });
vm.createContext(sb);
vm.runInContext(src, sb, { filename: 'g' });
(async () => {
  for (const fn of (docListeners['DOMContentLoaded'] || [])) { try { await fn(); } catch (e) { console.log('handler threw: ' + e.message); } }
  const info = vm.runInContext(`(function(){
    if (typeof S === 'undefined') return 'S undefined';
    return JSON.stringify({keys: Object.keys(S).length, board: typeof S.board, boardLen: S.board && S.board.length, miners: S.miners && S.miners.length, gm: S.gm});
  })()`, sb);
  console.log('== S after init ==');
  console.log(info);
  try { vm.runInContext('renderBoard()', sb); console.log('manual renderBoard OK'); }
  catch (e) { console.log('manual renderBoard fail: ' + e.message); }
})();
