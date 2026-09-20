/* ============================================================
   smoke-boot-chain.cjs — 开局弹窗链（语言→序章→起名）无头冒烟
   验证 A 会话修复：boot 期间 window.__bootChain 生效时——
     1) startEvent/startMemeEvent 挂起事件但不挂弹窗（dep 保持 paused 自愈）
     2) worldAdvance 在线推进遇到 paused dep 不重挂弹窗（原互顶元凶：每秒顶掉语言选择器）
     3) 链解除（__bootChain=false）后弹窗恢复挂载
     4) 离线结算路径永不弹事件弹窗（回归保护）
     5) autoPlayStep 挂机收益到期报告在链期间让位、链后补弹
   跑法：node scripts/smoke-boot-chain.cjs（无 DOM 依赖，真实 fake 元素观测弹窗状态）
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');

/* ---------- 浏览器环境桩：fake 元素可观测（innerHTML/style.display/dataset） ---------- */
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
  body: elFor('#body'), documentElement: elFor('#html'), hidden: false, readyState: 'loading',
  querySelector(sel){ return elFor(sel); },
  getElementById(id){ return elFor('#' + id); },
  addEventListener(){}, removeEventListener(){},
  createElement(){ return fakeEl('new'); },
};
try { if(!global.navigator.userAgent) global.navigator = { userAgent: 'node' }; } catch(e) { /* node 内建 navigator 只读则保留原值 */ }
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
/* DRGUnified 来自构建产物 app.js（unified TS 编译域层）：本套件只测管理层弹窗调度，域层按需空桩 */
global.DRGUnified = { domain: {
  migrateSave(){}, startDirectMission(){ throw new Error('not needed'); }, abortDirectMission(){ return null; },
  canSettleMission(){ return false; }, markMissionSettled(){}, consumeRealtimeResult(){ return null; },
} };
global.location = global.location || { reload(){} };
global.matchMedia = global.matchMedia || function(){ return { matches: false, addEventListener(){} }; };
global.requestAnimationFrame = global.requestAnimationFrame || function(){ return 0; };
global.cancelAnimationFrame = global.cancelAnimationFrame || function(){};
/* 定时器冻结：main.js 顶层 setInterval（主循环）在无头环境不跑，避免真实 tick 干扰断言 */
global.setInterval = () => 0;
global.setTimeout = () => 0;
global.clearInterval = () => {};
global.clearTimeout = () => {};

/* ---------- 按浏览器同序拼接管理层脚本（共享全局词法作用域，等价多 <script>） ---------- */
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
  + '\n;globalThis.__BOOT_T = { startEvent, startMemeEvent, worldAdvance, autoPlayStep, closeModal,'
  + ' MEME_EVENTS, S_get: () => S, S_set: v => { S = v; }, newGame };';
new Function('window', code)(global);

const T = global.__BOOT_T;
if(!T || !T.startEvent){ console.error('FAIL __BOOT_T 导出缺失'); process.exit(1); }

/* ---------- 断言工具 ---------- */
let passed = 0, failed = 0;
const ok = (c, l) => { if(c){ passed++; console.log('  ok  ' + l); } else { failed++; console.error('  FAIL ' + l); } };
const modal = () => elFor('#modal');
const modalBox = () => elFor('#modal-box');
const modalOpen = () => modal().style.display === 'flex';
const resetModal = () => { modal().style.display = 'none'; delete modalBox().dataset.dep; };

/* ---------- 造档：真实 newGame + 手工 paused dep ---------- */
T.newGame();
const S = T.S_get();
S.flags.prologueDone = true;
S.flags.nameChosen = true;
localStorage.setItem('drg_lang', 'zh');
const m1 = S.miners[0];
const dep = {
  id: 'dep_t1', mid: 'mk1', m: { id:'mk1', type:'exp', biome:'crystal', hazard:1, r:{}, rewards:{} },
  cls:'mixed', fitN:1, hc:1, minerIds:[m1.id], modEff:{}, drinkShield:0, morkiteBuff:0,
  start:S.gm, dur:100, done:20, evt1:true, evt2:false, evt3:false, paused:null, bonus:1,
  rareBoost:0, xpPer:0, autoEvents:false, mode:'idle', nitraSpent:0,
};
S.deps = [dep];

/* ================= 1. 链期间：startEvent 挂起但不弹 ================= */
console.log('\n== 1. __bootChain=true：startEvent 让位 ==');
window.__bootChain = true;
resetModal();
T.startEvent(dep, 'swarm');
ok(!!dep.paused, 'startEvent 照常置 paused（自愈数据在）');
ok(!modalOpen(), '开局链期间不挂事件弹窗（modal 未开）');
ok(modalBox().dataset.dep === undefined, 'modal-box 未打 dep 标记');

/* ================= 2. 链期间：worldAdvance 在线不重挂（原互顶元凶） ================= */
console.log('\n== 2. __bootChain=true：worldAdvance 在线推进不重挂 ==');
resetModal();
T.worldAdvance(1, false);
ok(!modalOpen(), '链期间每秒推进不重挂事件弹窗');
ok(!!dep.paused, 'dep 仍 paused 等待链结束');

/* ================= 3. 链期间：meme 事件同样让位 ================= */
console.log('\n== 3. __bootChain=true：startMemeEvent 让位 ==');
const dep2 = Object.assign({}, dep, { id:'dep_t2', paused:null });
S.deps = [dep2];
const memeId = T.MEME_EVENTS.pool[0].id;
T.startMemeEvent(dep2, memeId);
ok(!!dep2.paused, 'startMemeEvent 照常置 paused');
ok(!modalOpen(), '链期间 meme 事件不挂弹窗');

/* ================= 4. 链期间：挂机到期报告让位；链后补弹 ================= */
console.log('\n== 4. 挂机收益到期报告：链期间让位，链后补弹 ==');
S.deps = [];
S.autoUntil = Date.now() - 1000;
S._idleReportShown = false;
S.idleReport = { credits: 10, missions: 1, morkite: 0, moil: 0, nitra: 0, rare:{}, events: 0, med: 0 };
window.__bootChain = true;
resetModal();
T.autoPlayStep();
ok(!modalOpen(), '链期间挂机到期报告不弹');
ok(S._idleReportShown !== true, '未消费 _idleReportShown（链后可补弹）');
window.__bootChain = false;
T.autoPlayStep();
ok(modalOpen(), '链解除后挂机报告补弹');
ok(S._idleReportShown === true, '补弹后置 _idleReportShown');

/* ================= 5. 链解除：worldAdvance 在线重挂事件弹窗 ================= */
console.log('\n== 5. __bootChain=false：在线推进恢复挂事件弹窗 ==');
S.autoUntil = 0;
S.deps = [dep];
resetModal();
T.worldAdvance(1, false);
ok(modalOpen(), '链解除后 paused dep 弹窗恢复挂载');
ok(modalBox().dataset.dep === 'dep_t1', '弹窗标记对应 dep');

/* ================= 6. 离线路径回归：永不弹事件弹窗 ================= */
console.log('\n== 6. 离线结算回归（offline=true 永不弹） ==');
const dep3 = Object.assign({}, dep, { id:'dep_t3', paused:null });
S.deps = [dep3];
T.startEvent(dep3, 'swarm');   /* 离线期间事件照常挂起数据 */
resetModal();
window.__bootChain = false;
T.worldAdvance(2, true);
ok(!modalOpen(), '离线推进不弹事件弹窗（既有行为保持）');
ok(!!dep3.paused, '离线推进后 dep 仍 paused（不丢事件）');

/* ================= 7. 链解除后 startEvent 直接挂弹（新事件即时可见） ================= */
console.log('\n== 7. __bootChain=false：startEvent 即时挂弹 ==');
resetModal();
const dep4 = Object.assign({}, dep, { id:'dep_t4', paused:null });
T.startEvent(dep4, 'swarm');
ok(modalOpen(), '非链期新事件弹窗即时挂载');
ok(modalBox().dataset.dep === 'dep_t4', '弹窗标记对应新 dep');

console.log('\n== 结果：' + passed + ' 通过, ' + failed + ' 失败 ==');
process.exit(failed ? 1 : 0);
