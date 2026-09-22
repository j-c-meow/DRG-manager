/* ============================================================
   smoke-i18n-data.cjs — i18n 三批 数据层渲染泄漏扫描
   EN 模式下渲染主要视图，扫描生成 HTML 里的中文字符：
   数据层中文名（星区/矿物/职业/武器/任务类型/事件名等）必须经
   L()/词表翻译为英文，零泄漏才算收尾完成。
   跑法：node scripts/smoke-i18n-data.cjs
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');

/* ---------- 浏览器环境桩（与 smoke-boot-chain 同款 fake 元素） ---------- */
function fakeEl(key){
  return {
    _key: key, dataset: {}, style: {}, innerHTML: '', textContent: '', value: '', hidden: false,
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    addEventListener(){}, removeEventListener(){},
    querySelector(){ return fakeEl(key + '>q'); },
    querySelectorAll(){ return []; },
    appendChild(){ return fakeEl(key + '>c'); },
    remove(){}, focus(){}, click(){}, closest(){ return null; }, contains(){ return false; },
    setAttribute(){}, getAttribute(){ return null; },
  };
}
const EL = {};
const elFor = (k) => EL[k] || (EL[k] = fakeEl(k));
global.window = global;
global.performance = global.performance || { now: () => Date.now() };
global.addEventListener = global.addEventListener || function(){};
global.localStorage = {
  _s: {},
  getItem(k){ return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; },
  setItem(k, v){ this._s[k] = String(v); },
  removeItem(k){ delete this._s[k]; },
};
global.document = {
  body: elFor('#body'), documentElement: elFor('#html'), hidden: false, readyState: 'complete',
  querySelector(sel){ return elFor(sel); },
  getElementById(id){ return elFor('#' + id); },
  addEventListener(){}, removeEventListener(){},
  createElement(){ return fakeEl('new'); },
  querySelectorAll(){ return []; },
};
global.DRG_SHARED = {
  realtimeHazards: [
    { lv: 1, name: '危险等级 1', dmgMul: 0.55, hpMul: 0.7, rate: 0.55, quota: 0.7, credit: 0.75, xp: 0.8 },
    { lv: 2, name: '危险等级 2', dmgMul: 0.8, hpMul: 0.9, rate: 0.8, quota: 0.85, credit: 1.0, xp: 1.0 },
    { lv: 3, name: '危险等级 3', dmgMul: 1.0, hpMul: 1.0, rate: 1.0, quota: 1.0, credit: 1.3, xp: 1.3 },
    { lv: 4, name: '危险等级 4', dmgMul: 1.3, hpMul: 1.35, rate: 1.35, quota: 1.15, credit: 1.7, xp: 1.7 },
    { lv: 5, name: '危险等级 5', dmgMul: 1.7, hpMul: 1.8, rate: 1.8, quota: 1.3, credit: 2.2, xp: 2.2 },
  ],
  realtimeBiomes: [
    { id: 'crystalline', name: '晶洞秘境', en: 'Crystalline Caverns', art: 'biome_crystalline', dirt: '#4b5a78', rock: '#33415a', hard: '#8b93a8', glow: '#7fd4ff', fog: '#0b1220', crystals: 1.6, tint: 2 },
  ],
  managerBiomes: [
    { id: 'crystal', name: '水晶洞穴', tier: 1, pair: ['乌玛石', '铜矿'] },
    { id: 'salt', name: '盐坑', tier: 1, pair: ['容和石', '吸铁石'] },
    { id: 'fungus', name: '霉菌沼泽', tier: 2, pair: ['铜矿', '蜂母石'] },
    { id: 'sand', name: '飞沙走廊', tier: 2, pair: ['乌玛石', '吸铁石'] },
    { id: 'rad', name: '放射性禁区', tier: 3, pair: ['妙绝珠', '乌玛石'] },
    { id: 'bio', name: '密林丛原', tier: 3, pair: ['铜矿', '玉石'] },
    { id: 'glacial', name: '冰封岩层', tier: 4, pair: ['玉石', '妙绝珠'] },
    { id: 'bough', name: '藤络树洞', tier: 4, pair: ['蜂母石', '吸铁石'] },
    { id: 'magma', name: '熔岩之心', tier: 5, pair: ['吸铁石', '玉石'] },
    { id: 'azure', name: '蔚蓝花甸', tier: 5, pair: ['妙绝珠', '玉石'] },
    { id: 'ossuary', name: '栖骨深渊', tier: 5, pair: ['容和石', '蜂母石'] },
  ],
  realtimeBiomeByManagerId: function (id) { return ({ crystal:'crystalline', salt:'salt', fungus:'fungus', sand:'sandblasted', rad:'radioactive', bio:'biozone', glacial:'glacial', bough:'bough', magma:'magma', azure:'azure', ossuary:'crystalline' })[id] || 'crystalline'; },
  SAVE_SCHEMA_VERSION: 3,
};
global.DRGUnified = { domain: {
  migrateSave(){}, startDirectMission(){ throw new Error('not needed'); }, abortDirectMission(){ return null; },
  canSettleMission(){ return false; }, markMissionSettled(){}, consumeRealtimeResult(){ return null; },
} };
/* 定时器冻结：无头环境主循环不跑 */
global.setInterval = () => 0;
global.setTimeout = () => 0;
global.clearInterval = () => {};
global.clearTimeout = () => {};
global.requestAnimationFrame = global.requestAnimationFrame || function(){ return 0; };
global.cancelAnimationFrame = global.cancelAnimationFrame || function(){};

/* ---------- 按浏览器同序拼接管理层脚本 ---------- */
const FILES = [
  'src/manager/game-data.js',
  'src/manager/lang-en.js',
  'src/manager/state.js',
  'src/manager/missions.js',
  'src/manager/realtime-controller.js',
  'src/manager/ui.js',
  'src/manager/main.js',
];
const code = FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n')
  + '\n;globalThis.__T = { renderAll, renderBoard, renderHeader, showMemorial, showIdleReport, applyLang, currentLang,'
  + ' startEvent, startMemeEvent, MEME_EVENTS,'
  + ' S_get: () => S, S_set: v => { S = v; }, newGame, save, genBoard, doDispatchSafe: (m, ids) => { try { doDispatch(m, ids, 0, "0"); } catch (e) { return String(e); } return null; } };';
new Function('window', code)(global);

const T = global.__T;
let passed = 0, failed = 0;
const ok = (c, l) => { if(c){ passed++; console.log('  ok  ' + l); } else { failed++; console.error('  FAIL ' + l); } };

/* ---------- EN 模式 + 造一份有进度的档 ---------- */
localStorage.setItem('drg_lang', 'en');
T.applyLang('en', true);          /* 与浏览器切语言路径一致：TEXT 整体切到 EN（消除 TEXT.* 测试伪影） */
T.newGame();
const S = T.S_get();
S.flags.prologueDone = true;
S.flags.nameChosen = true;
S.managerName = 'QA';
S.credits = 99999; S.nitra = 999;
S.unlocked = { kpi: true, bar: true, market: true, med: true, gear: true };
S.miners.push({ id: 'mx1', cls: 'gunner', num: 1, state: 'idle', morale: 80, lv: 3, stars: 1, mAcc: 0 });
T.genBoard();

/* ---------- 渲染 + 收集 CJK 泄漏 ---------- */
const CJK = /[\u4e00-\u9fff]/;
let renderErr = null;
const views = [];
function tryRender(name, fn) {
  try { fn(); views.push(name); } catch (e) { renderErr = renderErr || (name + ': ' + (e && e.message || e)); }
}
tryRender('renderAll', () => T.renderAll());
tryRender('renderBoard', () => T.renderBoard());
tryRender('renderHeader', () => T.renderHeader());
tryRender('showMemorial', () => T.showMemorial());
tryRender('memorial-weapons', () => { S.memorialTab = 1; T.showMemorial(); });
tryRender('memorial-trinkets', () => { S.memorialTab = 2; T.showMemorial(); });
tryRender('memorial-achv', () => { S.memorialTab = 3; T.showMemorial(); });
tryRender('idleReport', () => T.showIdleReport());
/* 事件弹窗：五类基础事件 + 社区梗事件槽（数据层渲染的另一大头） */
const evDep = {
  id: 'dep_i18n', mid: 'mk_i18n', m: { id: 'mk_i18n', type: 'exp', biome: 'salt', hazard: 3, r: {}, rewards: {} },
  cls: 'mixed', fitN: 1, hc: 1, minerIds: [S.miners[0].id], modEff: {}, drinkShield: 0, morkiteBuff: 0,
  start: S.gm, dur: 100, done: 10, evt1: false, evt2: false, paused: null, bonus: 1,
  rareBoost: 0, xpPer: 0, autoEvents: false, mode: 'idle', nitraSpent: 0,
};
for (const ev of ['swarm', 'rich', 'leech', 'break', 'elite']) {
  evDep.paused = null;
  tryRender('event-' + ev, () => T.startEvent(evDep, ev));
}
evDep.paused = null;
tryRender('meme-event', () => T.startMemeEvent(evDep, T.MEME_EVENTS.pool[0].id));

const leaks = new Map();   // 片段 -> {src, ctx}
for (const key of Object.keys(EL)) {
  const html = String(EL[key].innerHTML || '') + ' ' + String(EL[key].textContent || '');
  if (!CJK.test(html)) continue;
  const parts = html.split(/(<[^>]*>)/);
  let flat = '';
  const spans = [];
  for (const p of parts) {
    if (/^<[^>]*>$/.test(p)) { flat += '\u0001'; continue; }
    spans.push([flat.length, p]);
    flat += p;
  }
  for (const [start, txt] of spans) {
    const t2 = txt.trim();
    if (!CJK.test(t2)) continue;
    const sig = t2.slice(0, 60);
    if (!leaks.has(sig)) leaks.set(sig, EL[key]._key + ' ‹…' + flat.slice(Math.max(0, start - 30), start + t2.length + 30).replace(/\u0001/g, '¦') + '…›');
  }
}
console.log('\n== EN 模式数据层渲染泄漏扫描 ==');
ok(!renderErr, '渲染全程无异常' + (renderErr ? '（首错 ' + renderErr + '）' : ''));
ok(views.length >= 4, '渲染视图已执行（' + views.join(', ') + '）');
if (leaks.size) {
  console.log('  -- CJK 泄漏 ' + leaks.size + ' 处（片段 | 来源元素与上下文）--');
  let i = 0;
  for (const [frag, src] of leaks) {
    console.log('  · ' + frag + '\n      ' + src);
    if (++i >= 40) { console.log('  …（仅列前 40）'); break; }
  }
}
ok(leaks.size === 0, 'EN 模式渲染输出零中文泄漏（实际 ' + leaks.size + ' 处）');

console.log('\n== 结果：' + passed + ' 通过, ' + failed + ' 失败 ==');
process.exit(failed ? 1 : 0);
