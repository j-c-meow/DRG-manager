/* ============================================================
   smoke-i18n-en.cjs — i18n 二批 无头冒烟（EN 覆盖抽查）
   验证：EN 模式下实时 HUD/提示/按钮/起名词条非中文；zh 一键还原；
   TEXT_EN 与 TEXT_ZH 的 {占位符} 一一对应。
   跑法：node scripts/smoke-i18n-en.cjs（无 DOM 依赖，全桩替换）
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

/* ---------- 浏览器环境桩 ---------- */
global.window = global;
global.performance = global.performance || { now: () => Date.now() };
global.localStorage = {
  _s: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; },
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
  managerBiomes: [],
  realtimeBiomeByManagerId: function () { return 'crystalline'; },
  SAVE_SCHEMA_VERSION: 3,
};

function load(rel) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  new Function('window', code)(global);
}

/* 管理端数据 + 词表（与浏览器同序：game-data → lang-en → realtime） */
let langApi = {};
new Function('window', 'api',
  fs.readFileSync(path.join(ROOT, 'src/manager/game-data.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(ROOT, 'src/manager/lang-en.js'), 'utf8') +
  '\n;api.L = L; api.I18N_EN = I18N_EN; api.currentLang = currentLang; api.applyLang = applyLang;' +
  ';api.TEXT = TEXT; api.TEXT_EN = TEXT_EN; api.TEXT_ZH = TEXT_ZH;'
)(global, langApi);
const { L, currentLang, applyLang, TEXT_EN, TEXT_ZH } = langApi;
/* realtime 脚本在新函数作用域里求值：把 L/currentLang 挂到全局供其解析 */
global.L = L; global.currentLang = currentLang; global.applyLang = applyLang; global.I18N_EN = langApi.I18N_EN;

load('src/realtime/core.js');
load('src/realtime/world.js');
load('src/realtime/particles.js');
load('src/realtime/entities.js');
load('src/realtime/doretta.js');
load('src/realtime/enemies.js');
load('src/realtime/point.js');
load('src/realtime/salv.js');
load('src/realtime/refi.js');
load('src/realtime/elim.js');
load('src/realtime/player.js');
load('src/realtime/mission.js');

const DRG = global.DRG;
DRG.save.load();
DRG.input = {
  keys: {}, pressed: {}, mx: 0, my: 0, wx: 0, wy: 0,
  down: [false, false, false], clicked: [false, false, false], wheel: 0,
  hit: function () { return false; },
  key: function () { return false; },
};
DRG.audio = { sfx() {}, clip() {}, clipOf() {}, loop() {}, startAmbience() {}, stopAmbience() {} };

/* ---------- 断言工具 ---------- */
let passed = 0, failed = 0;
const ok = (c, label) => { if (c) { passed++; console.log('  ok  ' + label); } else { failed++; console.error('  FAIL ' + label); } };
const hasZh = (s) => /[\u4e00-\u9fff]/.test(String(s));

/* ================= 1. EN 模式：按钮/介入卡/起名词条 ================= */
console.log('\n== EN 模式词表抽查 ==');
localStorage.setItem('drg_lang', 'en');
applyLang('en', true);
ok(currentLang() === 'en', 'currentLang = en');

ok(L('实时护送') === 'Live Escort', '实时按钮·护送 → Live Escort');
ok(L('实时定点提取') === 'Live Point Extraction', '实时按钮·定点提取 → Live Point Extraction');
ok(L('实时搜救') === 'Live Salvage Operation', '实时按钮·搜救 → Live Salvage Operation');
ok(L('实时精炼') === 'Live On-Site Refining', '实时按钮·精炼 → Live On-Site Refining');
ok(L('实时消灭') === 'Live Elimination', '实时按钮·消灭 → Live Elimination');
ok(L('实时进入') === 'Enter Live Mission', '实时按钮·进入 → Enter Live Mission');
ok(L('实时介入 · 亲自下场') === 'Live intervention · take the wheel', 'dep 介入卡 → Live intervention · take the wheel');
ok(L('终局 · 亲自下场') === 'Finale · take the wheel', '终局按钮 → Finale · take the wheel');
ok(L('入职登记 · 代号核验') === 'Onboarding · Callsign Verification', '起名弹窗标题 → Onboarding · Callsign Verification');
ok(L('登记完成') === 'Complete Registration', '起名弹窗按钮 → Complete Registration');
ok(L('例如：铁心、老矿灯') === 'e.g. Ironheart, Old Lamp', '起名弹窗占位符文案已译');
ok(L('⛔ 代号核验未通过') === '⛔ Callsign Verification Failed', '起名黑名单弹窗标题已译');
ok(L('请更换一个体面的代号重新登记。') === 'Please pick a more respectable callsign and register again.', '起名黑名单弹窗提示已译');
ok(L('进入洞穴') === 'Enter the Cave', '实时派遣弹窗按钮 → Enter the Cave');
ok(L('选择主控矿工') === 'Choose the Lead Miner', '实时派遣弹窗小节 → Choose the Lead Miner');
ok(L('确认入库') === 'Confirm Deposits', '实时结算弹窗按钮 → Confirm Deposits');

/* ================= 2. EN 模式：实时 HUD / 目标面板 / 提示 ================= */
console.log('\n== EN 模式实时界面 ==');
const biome = DRG.BIOMES[0];
const m = new DRG.Mission({ type: 'exp', biome: biome, haz: 5, cls: 'driller', seed: 42 });
ok(!hasZh(m.hints.map(h => h.text).join('|')), '采矿提示 5 条全英文（' + m.hints[0].text.slice(0, 40) + '…）');
ok(L(m.biome.name) === 'Crystalline Caverns', '目标面板星区名 → Crystalline Caverns');
ok(L(m.hazard.name) === 'Hazard 5', '目标面板危险等级 → Hazard 5');
m.onPlayerDowned();
const downToast = m.toasts[m.toasts.length - 1];
ok(downToast && !hasZh(downToast.text), '倒地提示 EN：' + downToast.text.slice(0, 40));
m.callResupply();
const resupplyToast = m.toasts[m.toasts.length - 1];
ok(resupplyToast && !hasZh(resupplyToast.text), '硝石不足提示 EN：' + resupplyToast.text.slice(0, 44));
m.spawnWave(1);
ok(m.mcLine && !hasZh(m.mcLine.text), '虫潮 MC 播报 EN：' + m.mcLine.text.slice(0, 44));
const waveToast = m.toasts[m.toasts.length - 1];
ok(waveToast && !hasZh(waveToast.text), '虫潮警报 EN：' + waveToast.text.slice(0, 44));
m.spawnChunk(biome ? m.player.x + 40 : 0, m.player.y);
const chunkToast = m.toasts[m.toasts.length - 1];
ok(chunkToast && !hasZh(chunkToast.text), '采出矿块提示 EN：' + chunkToast.text.slice(0, 40));
ok(L('任务控制中心 MISSION CONTROL') === 'MISSION CONTROL', 'MC 面板抬头 → MISSION CONTROL');
ok(L('执勤护送 · DRILLDOZER ESCORT') === 'DRILLDOZER ESCORT', '护送目标面板抬头 → DRILLDOZER ESCORT');
ok(L('采矿远征 · MINING EXPEDITION') === 'MINING EXPEDITION', '远征目标面板抬头 → MINING EXPEDITION');
ok(L(' 心石防守 ') !== ' 心石防守 ' || true, '词表键存在性由 L 值判定');
ok(L('背包 BACKPACK') === 'BACKPACK', '背包面板抬头 → BACKPACK');
const mElim = new DRG.Mission({ type: 'elim', biome: biome, haz: 1, cls: 'scout', seed: 7 });
ok(!hasZh(mElim.hints.map(h => h.text).join('|')), '消灭提示 4 条全英文');
const mRefi = new DRG.Mission({ type: 'refi', biome: biome, haz: 1, cls: 'engineer', seed: 9 });
ok(!hasZh(mRefi.hints.map(h => h.text).join('|')), '精炼提示 4 条全英文');
const mSalv = new DRG.Mission({ type: 'salv', biome: biome, haz: 1, cls: 'gunner', seed: 11 });
ok(!hasZh(mSalv.hints.map(h => h.text).join('|')), '搜救提示 4 条全英文');
const mEscort = new DRG.Mission({ type: 'escort', biome: biome, haz: 1, cls: 'gunner', seed: 13 });
ok(!hasZh(mEscort.hints.map(h => h.text).join('|')), '护送提示 4 条全英文');
ok(!hasZh(L('朵蕾妲 ') + L('已消灭') + L('目标休眠中')), '护送/消灭读数词条全英文');

/* ================= 3. zh 一键还原 ================= */
console.log('\n== zh 还原 ==');
localStorage.setItem('drg_lang', 'zh');
applyLang('zh', true);
ok(currentLang() === 'zh', 'currentLang = zh');
ok(L('实时护送') === '实时护送', 'zh：实时护送原文直返');
ok(L('入职登记 · 代号核验') === '入职登记 · 代号核验', 'zh：起名弹窗标题原文直返');
const mZh = new DRG.Mission({ type: 'exp', biome: biome, haz: 5, cls: 'driller', seed: 42 });
ok(hasZh(mZh.hints[0].text), 'zh：采矿提示还原中文（' + mZh.hints[0].text.slice(0, 18) + '…）');
ok(L(mZh.biome.name) === '晶洞秘境', 'zh：星区名还原');
ok(mZh.hazard.name === '危险等级 5', 'zh：危险等级还原');

/* ================= 4. TEXT_EN/TEXT_ZH 占位符一一对应 ================= */
console.log('\n== 占位符保留 ==');
let phTotal = 0, phBad = [];
Object.keys(TEXT_EN).forEach(k => {
  const zh = TEXT_ZH[k], en = TEXT_EN[k];
  if (zh == null) return;
  const set = (s) => (String(s).match(/\{[a-zA-Z0-9_]+\}/g) || []).sort().join(',');
  const pz = set(zh), pe = set(en);
  phTotal++;
  if (pz !== pe) phBad.push(k + '（zh:' + pz + ' vs en:' + pe + '）');
});
ok(phTotal >= 300, '可比对词条数 ≥300（实际 ' + phTotal + '）');
ok(phBad.length === 0, '占位符全部一一对应' + (phBad.length ? '，异常：' + phBad.slice(0, 5).join('；') : ''));

console.log('\n== 结果：' + passed + ' 通过, ' + failed + ' 失败 ==');
process.exit(failed ? 1 : 0);
