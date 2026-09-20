/* ============================================================
   smoke-refi-elim.cjs — 就地精炼 / 消灭任务 无头冒烟
   纯逻辑验证：refi 铺泵/抽油/啃泵修理；elim 破茧/阶段转换/弱点击杀/
   倒地失败；终局强制接线（domain 小队/回板）纯函数断言。
   跑法：node scripts/smoke-refi-elim.cjs（无 DOM 依赖，全桩替换）
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

/* ---------- 浏览器环境桩 ---------- */
global.window = global;
global.performance = global.performance || { now: () => Date.now() };

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
};

function load(rel) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  new Function('window', code)(global);
}
global.DRG = global.window.DRG || {};
/* i18n：与浏览器同序，lang-en.js 先于 realtime 脚本加载（无头环境 TEXT 给空壳：
   zh 模式 L() 原文直返不查表，词条逻辑不受影响） */
global.TEXT = global.TEXT || {};
new Function('window',
  fs.readFileSync(path.join(ROOT, 'src/manager/lang-en.js'), 'utf8') +
  '\n;window.L = L; window.I18N_EN = I18N_EN; window.currentLang = currentLang; window.applyLang = applyLang;'
)(global);
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

let inputHeldKeyE = false;
DRG.input = {
  keys: {}, pressed: {}, mx: 0, my: 0, wx: 0, wy: 0,
  down: [false, false, false], clicked: [false, false, false], wheel: 0,
  hit: function () { return false; },
  key: function () { return inputHeldKeyE; },
};
DRG.audio = { sfx() {}, clip() {}, clipOf() {}, loop() {}, startAmbience() {}, stopAmbience() {} };

/* ---------- 断言工具 ---------- */
let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log('  ok  ' + label); }
  else { failed++; console.error('  FAIL ' + label); }
}
function eq(a, b, label) { ok(a === b, label + '（期望 ' + b + '，实际 ' + a + '）'); }

function pumpingWells(m) { return m.wells.filter(function (w) { return w.state === 'pumping'; }); }

/* ================= 就地精炼 refi（haz5 → 3 井 / 配额 18） ================= */
console.log('\n== refi 就地精炼 ==');
const biome = DRG.BIOMES[0];
const m = new DRG.Mission({ type: 'refi', biome: biome, haz: 5, cls: 'engineer', seed: 2024 });
m.state = 'play';
ok(!!DRG.REFI, 'DRG.REFI 常量表已注册');
eq(m.wells.length, 3, 'haz5 油井数量 = 3');
eq(m.oilQuota, 18, 'haz5 配额 = 6+(5-1)*3 = 18');
ok(!!m.refinery, '精炼单元存在');
ok(m.world.w === 440 && m.world.h === 170, 'refi 地图尺寸（440x170）');
const wellsFar = m.wells.every(function (w) { return DRG.M.dist(w.x, w.y, m.player.x, m.player.y) > 400; });
ok(wellsFar, '油井都离出生点足够远（管线要拉）');
ok(m.wells.every(function (w) { return w.state === 'dry'; }), '开局油井均未装泵');

// 领取管道段 + 携带限副手
m.player.x = m.refinery.x; m.player.y = m.refinery.y;
ok(m.refiInteract(), '精炼单元旁 E 领取管道段');
ok(m.player.carriedItem && m.player.carriedItem.kind === 'pipe', '管道段头顶携带');
const lock = DRG.carryRestriction(m.player);
ok(!!lock && lock.slot === 1 && Math.abs(lock.slowMul - 0.8) < 1e-9, '携带管道段：锁副手 + 移速 -20%');
DRG.input.pressed['Digit1'] = true;
m.player.update(0.016, m);
delete DRG.input.pressed['Digit1'];
eq(m.player.cur, 1, '携带中按 1 仍被强制在副手槽');

// 铺管装泵
const well0 = m.wells[0];
m.player.x = well0.x; m.player.y = well0.y;
ok(well0.canInstall(m.player), '贴近油井可铺管装泵');
const enemiesBefore = m.enemies.length;
ok(well0.install(m.player, m), 'E 铺设管线 + 安装泵');
eq(m.player.carriedItem, null, '管道段被铺进管线');
ok(!!well0.pipe && Math.abs(well0.pipe.x1 - m.refinery.x) < 1e-6, '管线连回精炼单元');
eq(well0.state, 'pumping', '泵启动（pumping）');
ok(m.enemies.length > enemiesBefore, '装泵引来一小波虫潮');

// 抽油汇总
const oil0 = m.oilRefined;
well0.update(2.0, m);
m.refinery.update(0.016, m);
ok(m.oilRefined > oil0, '泵自动抽油汇入精炼单元（速率 ' + DRG.REFI.PUMP_RATE + '/s）');
ok(m.refinery.vatGlow > 0, '精炼单元液位辉光随进度上升');

// 虫潮啃泵：目标权重 + 伤害
const bug = m.spawnEnemy('grunt', well0.x + 30, well0.y);
bug._preyBias = 0.1;
const prey = m.refiPrey(bug);
ok(!!prey && prey.pump === well0, 'refiPrey：运转中的泵优先成为虫潮目标');
const hp0 = well0.hp;
well0.hurt(30, m, well0.x - 10);
eq(well0.hp, hp0 - 30, '虫咬泵掉血');
well0.hurt(99999, m, well0.x);
eq(well0.state, 'broken', '泵血尽 → 停摆（broken）');
const oil1 = m.oilRefined;
well0.update(2.0, m);
eq(m.oilRefined, oil1, '停摆的泵不再产油');
well0.hurt(50, m, well0.x);
eq(well0.state, 'broken', '停摆的泵不再吃伤害（可无限修，无失败判定）');

// 长按修理（松开保留进度，salv 同款手感）
m.player.x = well0.x; m.player.y = well0.y;
inputHeldKeyE = true;
m.refiDirector(1.0);
ok(well0.repairing && well0.repairT > 0, '长按 E 修理进行中');
inputHeldKeyE = false;
m.refiDirector(1.0); m.refiDirector(1.0);
ok(Math.abs(well0.repairT - 1.0) < 1e-6, '松开 2s：修理进度保留不回退');
inputHeldKeyE = true;
m.refiDirector(1.0); m.refiDirector(1.05);
eq(well0.state, 'pumping', '累计长按 3 秒 → 泵修复重启');
eq(well0.hp, well0.maxHp, '修复后血量回满');
inputHeldKeyE = false;

// 配额达标 → 自动召 pod
m.addOil(999, well0);
eq(m.oilRefined, m.oilQuota, '产油封顶在配额');
ok(m.objectiveDone && m.podCalled && m.state === 'extract' && !!m.pod, '配额达成自动召唤撤离 pod');
m.pod.state = 'landed';
m.board();
eq(m.state, 'success', '登舱 → success');

// 低危险度数量分支
const m1r = new DRG.Mission({ type: 'refi', biome: biome, haz: 1, cls: 'driller', seed: 88 });
m1r.state = 'play';
eq(m1r.wells.length, 2, 'haz1 油井数量 = 2');
eq(m1r.oilQuota, 6, 'haz1 配额 = 6');

// 倒地掉落管道段
const m2r = new DRG.Mission({ type: 'refi', biome: biome, haz: 2, cls: 'scout', seed: 99 });
m2r.state = 'play';
m2r.player.x = m2r.refinery.x; m2r.player.y = m2r.refinery.y;
m2r.refiInteract();
const seg = m2r.player.carriedItem;
ok(!!seg && seg.kind === 'pipe', '倒地前正在携带管道段');
m2r.player.goDown(m2r);
ok(m2r.player.carriedItem === null && seg.state === 'idle', '倒地：管道段掉落原地（可重拾）');

/* ================= 消灭任务 elim（无畏机甲） ================= */
console.log('\n== elim 消灭任务 ==');
const m3 = new DRG.Mission({ type: 'elim', biome: biome, haz: 5, cls: 'gunner', seed: 777777 });
m3.state = 'play';
ok(m3.world.mode === 'elim' && m3.world.w === 240 && m3.world.h === 150, 'elim 竞技场地图（240x150, mode=elim）');
ok(!!m3.world.elimArena && !!m3.cocoon, '中央茧台坐标 + 虫茧存在');
ok(m3.world.solidPx(m3.cocoon.x, m3.cocoon.y + 4), '虫茧立在实心茧台上');
ok(DRG.M.dist(m3.cocoon.x, m3.cocoon.y, m3.player.x, m3.player.y) > 500, '茧台离出生点足够远');
eq(m3.enemies.length, 0, '开局没有敌对虫（压力全在破茧后）');

// 长按破茧
m3.player.x = m3.cocoon.x; m3.player.y = m3.cocoon.y;
inputHeldKeyE = true;
m3.elimDirector(1.0);
ok(m3.cocoon.breaking && m3.cocoon.breakT > 0, '长按 E 破茧进行中');
inputHeldKeyE = false;
m3.elimDirector(0.5);
ok(Math.abs(m3.cocoon.breakT - 1.0) < 1e-6, '松开 0.5s：破茧进度保留');
inputHeldKeyE = true;
m3.elimDirector(1.05);
eq(m3.cocoon.state, 'broken', '累计长按 2 秒 → 破茧');
inputHeldKeyE = false;
ok(!!m3.boss && m3.boss.isDread, '无畏机甲出场');
ok(m3.enemies.indexOf(m3.boss) >= 0, 'Boss 在通用敌人列表（子弹/爆炸可命中）');
eq(m3.boss.maxHp, DRG.ELIM.bossHp(5), 'haz5 Boss 血量 = 1200+4*450 = 3000');
ok(m3.enemies.length > 1, '破茧惊动虫潮');

// 出场动画结束后才可受击
m3.boss.emergeT = 0;
const boss = m3.boss;
const wp = boss.weakPos();
const hpB = boss.hp;
m3.damageEnemy(boss, 100, wp.x, wp.y);
eq(boss.hp, hpB - 300, '打弱点 ×3 伤害（100 → 300）');
m3.damageEnemy(boss, 100, boss.x, boss.y - 10);
eq(boss.hp, hpB - 335, '打装甲 ×0.35（100 → 35）');

// 弱点换位
const idx0 = boss.weakIdx;
boss.weakT = boss.weakInterval;
boss.update(0.02, m3);
ok(boss.weakIdx !== idx0 || boss.weakSlots.length === 1, '弱点随时间换位');

// 阶段转换（<50% 狂暴）
boss.hp = boss.maxHp * 0.5;
m3.damageEnemy(boss, 10, boss.x, boss.y - 10);
eq(boss.phase, 2, '血量过半 → 阶段 2 狂暴');
eq(boss.weakInterval, 4.5, '狂暴：弱点换位更快（4.5s）');

// 击杀 → 胜利
m3.damageEnemy(boss, 99999, wp.x, wp.y);
ok(boss.dead, '血尽 → Boss 死亡');
eq(m3.state, 'success', 'complete(win=true) 管道：mission.state=success');

// haz1 血量曲线
const m4 = new DRG.Mission({ type: 'elim', biome: biome, haz: 1, cls: 'scout', seed: 31 });
m4.state = 'play';
m4.cocoon.state = 'broken';
m4.boss = new DRG.Dreadnought(m4.cocoon.x, m4.cocoon.y - 6, DRG.ELIM.bossHp(1));
m4.enemies.push(m4.boss);
eq(m4.boss.maxHp, 1200, 'haz1 Boss 血量 = 1200');

// 倒地失败管道（沿用 BOSCO 救援/流血机制）
const m5 = new DRG.Mission({ type: 'elim', biome: biome, haz: 3, cls: 'scout', seed: 55 });
m5.state = 'play';
m5.player.goDown(m5);
m5.player.bleed = 0.01;
m5.player.update(0.02, m5);
eq(m5.state, 'failed', '倒地流血殆尽 → complete(win=false) 管道');

/* ================= 回归：exp/point/salv 不受影响 ================= */
console.log('\n== 回归 ==');
const m6 = new DRG.Mission({ type: 'exp', biome: biome, haz: 3, cls: 'scout', seed: 9 });
m6.state = 'play';
eq(m6.world.w, 400, 'exp 地图尺寸不变');
ok(m6.wells.length === 0 && !m6.refinery && !m6.cocoon && !m6.boss, 'exp 不生成 refi/elim 实体');
const m7 = new DRG.Mission({ type: 'point', biome: biome, haz: 2, cls: 'scout', seed: 12 });
m7.state = 'play';
eq(m7.beacons.length, 3, 'point 信标数量不变');
const m8 = new DRG.Mission({ type: 'salv', biome: biome, haz: 2, cls: 'gunner', seed: 13 });
m8.state = 'play';
eq(m8.salvBeacons.length, 4, 'salv 信标数量不变');
const m9 = new DRG.Mission({ type: 'escort', biome: biome, haz: 2, cls: 'gunner', seed: 14 });
ok(!!m9.doretta, 'escort 朵蕾妲不变');
ok(m9.refiPrey(m9.enemies[0] || { x: 0, y: 0, _preyBias: 1 }) === null, '非 refi 局 refiPrey 恒 null');

console.log('\n== 结果：' + passed + ' 通过, ' + failed + ' 失败 ==');
process.exit(failed ? 1 : 0);
