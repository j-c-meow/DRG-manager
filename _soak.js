/* =========================================================
 * 夜间无头试玩 harness（B · 2026-09-16，临时脚本，08:00 后可删）
 * 原理：vm 沙箱 + DOM stub 跑 游戏.html 逻辑层，试玩机器人压缩时间
 * 连续派遣/切模式/深潜/KPI/升级/离线补算/存读档，异常写 _soak_log.jsonl
 * 用法：node _soak.js [--smoke]   （--smoke = 跑 25 秒自检）
 * ========================================================= */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = __dirname;
const html = fs.readFileSync(path.join(ROOT, '游戏.html'), 'utf8');
const a = html.indexOf('<script>');
const b = html.lastIndexOf('</script>');
if (a < 0 || b < 0) { console.error('script 提取失败'); process.exit(1); }
const gameSrc = html.slice(a + '<script>'.length, b);

/* ---------- deadline ---------- */
let deadline = new Date();
if (process.argv.includes('--smoke')) { deadline = new Date(Date.now() + 25 * 1000); }
else { deadline.setHours(7, 45, 0, 0); if (deadline.getTime() < Date.now()) deadline = new Date(Date.now() + 60 * 1000); }

/* ---------- DOM / browser stubs ---------- */
function mkEl(id) {
  const target = function () { };
  target.__id = id;
  target.style = {};
  target.dataset = {};
  target.classList = { add() { }, remove() { }, toggle() { }, contains() { return false; } };
  target.addEventListener = function () { };
  target.removeEventListener = function () { };
  target.appendChild = function () { return mkEl('child'); };
  target.removeChild = function () { };
  target.remove = function () { };
  target.querySelector = function () { return mkEl('q'); };
  target.querySelectorAll = function () { return []; };
  target.closest = function () { return mkEl('c'); };
  target.focus = function () { }; target.blur = function () { };
  target.getBoundingClientRect = function () { return { left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }; };
  target.innerHTML = ''; target.textContent = ''; target.value = ''; target.checked = false; target.disabled = false;
  return new Proxy(target, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => '';
      if (p in t) return t[p];
      return function () { };
    },
    set(t, p, v) { t[p] = v; return true; }
  });
}
const docListeners = {};
const documentStub = {
  hidden: false,
  addEventListener(type, fn) { (docListeners[type] = docListeners[type] || []).push(fn); },
  removeEventListener() { },
  getElementById(id) { return mkEl(id); },
  querySelector() { return mkEl('q'); },
  querySelectorAll() { return []; },
  createElement() { return mkEl('new'); },
  body: mkEl('body'), head: mkEl('head'), documentElement: mkEl('html')
};
const store = new Map();
const lsStub = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
  key: i => [...store.keys()][i] ?? null,
  get length() { return store.size; }
};
class AudioStub {
  constructor() { this.volume = 1; this.loop = false; this.paused = true; this.src = ''; }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  addEventListener() { } removeEventListener() { }
}
const sandbox = {
  console, Math, Date, JSON, Promise, Number, String, Array, Object, RegExp, Error, parseInt, parseFloat, isNaN, isFinite,
  setTimeout, clearTimeout, setInterval, clearInterval, setImmediate,
  performance: { now: () => Date.now() },
  requestAnimationFrame: fn => setTimeout(() => fn(Date.now()), 16),
  Audio: AudioStub,
  document: documentStub,
  localStorage: lsStub,
  navigator: { userAgent: 'SoakBot/1.0', language: 'zh-CN' },
  location: { protocol: 'http:', href: 'http://localhost:8765/游戏.html', reload() { } },
  history: { replaceState() { }, pushState() { } },
  alert() { }, confirm() { return true; }, prompt() { return null; },
  __fire: async (type) => { for (const fn of (docListeners[type] || [])) await fn(); }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.addEventListener = function () { }; sandbox.removeEventListener = function () { };
sandbox.innerWidth = 1280; sandbox.innerHeight = 800;
sandbox.matchMedia = () => ({ matches: false, addEventListener() { }, addListener() { } });
sandbox.getComputedStyle = () => ({ getPropertyValue: () => '' });
sandbox.devicePixelRatio = 1; sandbox.scroll = function () { }; sandbox.scrollTo = function () { };
vm.createContext(sandbox);

/* ---------- 日志 ---------- */
const LOG = path.join(ROOT, '_soak_log.jsonl');
const SUMMARY = path.join(ROOT, '_soak_summary.json');
try { fs.unlinkSync(LOG); } catch (e) { }
function emit(obj) {
  try { fs.appendFileSync(LOG, JSON.stringify(obj) + '\n'); } catch (e) { }
  console.log(JSON.stringify(obj));
}
const errCount = {};
function report(kind, key, detail) {
  errCount[key] = (errCount[key] || 0) + 1;
  if (errCount[key] <= 5) emit({ kind: 'err', errorKind: kind, key, detail: String(detail).slice(0, 600), simDay: sandbox.S ? gameDay() : -1, gm: sandbox.S ? S.gm : -1 });
}

process.on('uncaughtException', e => report('uncaught', (e && e.message || 'unknown').slice(0, 80), e && e.stack));
process.on('unhandledRejection', e => report('rejection', String(e && (e.message || e)).slice(0, 80), e && e.stack));

/* ---------- 载入游戏 ---------- */
try { vm.runInContext(gameSrc, sandbox, { filename: '游戏.html#main' }); }
catch (e) { emit({ kind: 'fatal', where: 'script-load', detail: String(e.stack || e).slice(0, 1200) }); process.exit(1); }

/* ---------- 试玩机器人（与游戏同沙箱的第二段脚本） ---------- */
const driver = `
(async () => {
  const HOST = sandbox_host;
  try { await __fire('DOMContentLoaded'); } catch (e) { HOST.report('init', 'DOMContentLoaded', e && e.stack); }
  if (window.__initErr) { HOST.report('init', 'window.__initErr', window.__initErr); HOST.finish('init-error'); return; }
  if (typeof S === 'undefined' || !S) { HOST.report('init', 'no-S', 'S 未初始化'); HOST.finish('no-S'); return; }
  HOST.log({ kind: 'info', msg: 'game booted', day: gameDay(), gm: S.gm, mode: S.mode });

  const smoke = HOST.smoke;
  let phase = 'fresh';          // fresh=白手开局体验 → doCheat 后 full=满配后期压测
  let step = 0, sinceCheat = 0, sinceSave = 0, sinceOffline = 0, modeTimer = 0;
  const irnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  function invariants() {
    const bad = (key, detail) => HOST.report('invariant', key, detail + ' | day=' + gameDay());
    const nums = { credits: S.credits, nitra: S.nitra, morkite: S.morkite, moil: S.moil, gold: S.gold, kpiDone: S.kpi.done, kpiQuota: S.kpi.quota, gm: S.gm };
    for (const k in nums) if (!isFinite(nums[k])) bad('NaN-' + k, k + '=' + nums[k]);
    if (S.nitra < -0.5) bad('nitra-negative', 'nitra=' + S.nitra);
    if (S.kpi.quota <= 0) bad('kpi-quota', 'quota=' + S.kpi.quota);
    if (S.mode !== 'idle' && S.mode !== 'rush') bad('mode', S.mode);
    for (const m of S.miners) {
      if (!['idle', 'mission', 'med'].includes(m.state)) bad('miner-state', m.cls + ':' + m.state);
      if (!isFinite(m.xp) || !isFinite(m.lv) || !isFinite(m.morale)) bad('miner-NaN', m.cls + ' xp=' + m.xp + ' lv=' + m.lv);
      if (m.state === 'med' && m.medUntil < S.gm - 1) bad('med-stuck', m.cls + ' medUntil=' + m.medUntil + ' gm=' + S.gm);
    }
    for (const d of S.deps) {
      if ((d.done || 0) > d.dur + 0.001) bad('dep-overrun', d.id + ' done=' + d.done + ' dur=' + d.dur);
      if (!d.isDive && d.mode !== 'idle' && d.mode !== 'rush') bad('dep-mode', (d.mode === undefined ? 'undefined(非深潜派遣缺 mode 字段)' : d.mode));
      if (!d.minerIds || d.minerIds.length < 1 || d.minerIds.length > 4) bad('dep-squad', JSON.stringify(d.minerIds));
    }
  }

  function tryDo(name, fn) { try { return fn(); } catch (e) { HOST.report('bot', name, e && e.stack); } }

  function botStep() {
    step++; sinceCheat++; sinceSave++; sinceOffline++; modeTimer++;
    if (S.autoUntil !== undefined) S.autoUntil = Date.now() + 3600e3;   // 挂机券常驻（每 2000 步故意断一拍测到期弹窗）
    if (phase === 'fresh' && (S.stats.missions >= 12 || S.gm > 480 + 6 * 1440)) { tryDo('doCheat', () => doCheat('soak')); phase = 'full'; HOST.log({ kind: 'info', msg: 'doCheat applied → full phase', day: gameDay(), missions: S.stats.missions }); }

    // 新鲜期兜底：autoPlayStep 只在 ≥2 空闲时派单，开局单人时由机器人直接派（真实发现：挂机券开局单人永不自动派遣）
    if (phase === 'fresh') {
      tryDo('fresh-dispatch', () => {
        S.miners.filter(m => m.state === 'idle' && m.morale >= 25).forEach(m => {
          if (S.deps.some(d => d.minerIds.includes(m.id))) return;
          const cands = S.board.filter(t => { const c = Math.round(60 * 1 * (t.min / 240)); return c <= S.nitra; });
          if (!cands.length) return;
          const pick0 = cands.sort((x, y) => x.hazard - y.hazard)[0];
          doDispatch(pick0, [m.id], m.cls === mtypeById(pick0.type).best ? 1 : 0, '0');
        });
      });
    }

    // 模式机器人：挂机为主，硝石足时切急行冲一阵；偶尔中途切换测在途健壮性
    if (modeTimer > 120) {
      modeTimer = 0;
      if (S.mode === 'idle' && S.nitra > 900) { S.mode = 'rush'; HOST.log({ kind: 'info', msg: 'mode→rush', day: gameDay(), nitra: Math.floor(S.nitra) }); }
      else if (S.mode === 'rush' && S.nitra < 350) { S.mode = 'idle'; HOST.log({ kind: 'info', msg: 'mode→idle', day: gameDay(), nitra: Math.floor(S.nitra) }); }
    }
    if (Math.random() < 0.01) { tryDo('mid-mission-toggle', () => { S.mode = S.mode === 'rush' ? 'idle' : 'rush'; }); }

    tryDo('autoPlayStep', () => autoPlayStep());

    if (S.mode === 'idle' && typeof startDiveStage === 'function' && S.dive) {
      tryDo('dive', () => { for (const variant of ['normal', 'elite']) { ensureDiveWeek(); const dv = S.dive[variant]; if (dv && !dv.done && dv.stage < 3) startDiveStage(variant, dv.stage); } });
    }
    if (S.kpi.done >= S.kpi.quota) tryDo('claimKPI', () => claimKPI());
    tryDo('upgradeRig', () => upgradeRig());
    if (phase === 'full' && Math.random() < 0.005) {
      tryDo('market', () => { const ks = TRADEABLES.map(t => t.k); const k = ks[irnd(0, ks.length - 1)]; if (Math.random() < 0.5) marketBuy(k, 5); else marketSell(k, 5); });
    }
    tryDo('licUpgrade', () => { if (phase === 'full' && Math.random() < 0.02) { const cs = Object.keys(CLASSES); buyLicense(cs[irnd(0, cs.length - 1)]); } });

    // 压缩时间推进
    const chunk = (S.mode === 'rush') ? 60 : 150;
    tryDo('worldAdvance', () => worldAdvance(chunk, false));

    // 存读档迁移演练
    if (sinceSave > 600) { sinceSave = 0; tryDo('save/load', () => { save(); const ok = load(); if (!ok) HOST.report('invariant', 'load-false', 'save 后 load 返回 false'); }); }
    // 离线补算演练
    if (sinceOffline > 2500) { sinceOffline = 0; tryDo('offline', () => { S.lastReal = Date.now() - irnd(2, 48) * 3600e3; catchUpTick(); }); }
    // 到期弹窗演练（故意断券一拍）
    if (step % 2000 === 1000) S.autoUntil = Date.now() - 1;

    invariants();
    if (step % 500 === 0) HOST.log({ kind: 'snapshot', step, day: gameDay(), gm: Math.floor(S.gm), mode: S.mode, credits: Math.floor(S.credits), nitra: Math.floor(S.nitra), missions: S.stats.missions, miners: S.miners.map(m => m.cls[0] + ':' + m.state[0] + m.lv).join(','), deps: S.deps.length, errs: HOST.totalErrs() });
  }

  const t0 = Date.now();
  while (Date.now() < HOST.deadline) {
    try { botStep(); } catch (e) { HOST.report('loop', 'botStep', e && e.stack); }
    await new Promise(r => setTimeout(r, smoke ? 10 : 50));
  }
  HOST.finish('deadline', { steps: step, day: gameDay(), gm: Math.floor(S.gm), mode: S.mode, credits: Math.floor(S.credits), nitra: Math.floor(S.nitra), missions: S.stats.missions, miners: S.miners.length, deps: S.deps.length, rigLv: S.rigLv, blanks: S.blanks, diveNormal: S.dive.normal.stage, kpiTerm: S.kpi.term });
})();
`;

/* ---------- host 桥 ---------- */
let totalErrs = 0;
const errCount2 = {};
const host = {
  smoke: process.argv.includes('--smoke'),
  deadline: deadline.getTime(),
  report(kind, key, detail) {
    totalErrs++;
    errCount2[key] = (errCount2[key] || 0) + 1;
    if (errCount2[key] > 6) return;
    const text = String(detail || '');
    const loc = (text.match(/#main:(\d+)/) || [])[1];
    emit({ kind: 'err', errorKind: kind, key, line: loc, detail: text.slice(0, 600) });
  },
  log(o) { emit(o); },
  totalErrs() { return totalErrs; },
  finish(reason, st) {
    const summary = {
      ended: new Date().toISOString(), reason, totalErrs,
      errKeys: errCount2, saveBytes: (lsStub.getItem('drg_mgr_v02') || '').length,
      final: st || null
    };
    fs.writeFileSync(SUMMARY, JSON.stringify(summary, null, 2));
    emit({ kind: 'fatal', where: 'finish', detail: JSON.stringify(summary) });
    setTimeout(() => process.exit(0), 200);
  }
};
sandbox.sandbox_host = host;

/* 运行 driver */
try { vm.runInContext(driver, sandbox, { filename: 'soak-driver' }); }
catch (e) { emit({ kind: 'fatal', where: 'driver-load', detail: String(e.stack || e).slice(0, 1200) }); process.exit(1); }
