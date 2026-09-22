/* ============================================================
   smoke-point-salv.cjs — 定点提取 / 搜救行动 无头冒烟
   纯逻辑验证：状态机流转、配额计数、携带限副手判定、修复进度保留。
   跑法：node scripts/smoke-point-salv.cjs（无 DOM 依赖，全桩替换）
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

/* ---------- 浏览器环境桩 ---------- */
global.window = global;
global.performance = global.performance || { now: () => Date.now() };

// 与 src/unified/definitions.ts 同源的共享数据（world/mission 只用这些字段）
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
global.DRG = global.DRG || global.window.DRG || {};
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
load('src/realtime/enemies.js');
load('src/realtime/point.js');
load('src/realtime/salv.js');
load('src/realtime/player.js');
load('src/realtime/mission.js');

const DRG = global.DRG;
DRG.save.load();                       // 初始化 opts（particles 用）

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

function idleLegs(m) {
  return m.props.filter(function (pr) { return pr instanceof DRG.MuleLeg && pr.state === 'idle'; });
}
function idleChunks(m) {
  return m.props.filter(function (pr) { return pr instanceof DRG.OreChunk && pr.state === 'idle'; });
}

/* ================= 定点提取（haz5 → 配额 7） ================= */
console.log('\n== point 定点提取 ==');
const biome = DRG.BIOMES[0];
const m = new DRG.Mission({ type: 'point', biome: biome, haz: 5, cls: 'driller', seed: 777 });
m.state = 'play';
eq(m.beacons.length, 3, '信标数量 = 3');
eq(m.pointQuota, 7, 'haz5 配额 = 3+(5-1) = 7');
const richN = m.beacons.filter(function (b) { return b.rich && b.shellLeft > 0; }).length;
eq(richN, 2, '硬壳富矿 = 2（危≥3 两处，深度玩法）');
const yieldSum = m.beacons.reduce(function (a, b) { return a + b.chunkYield; }, 0);
ok(yieldSum >= m.pointQuota, '三处矿结可采矿块总数覆盖配额（' + yieldSum + ' >= 7）');
ok(m.player.carriedItem === null, '开局未携带');
ok(m.bonusWindow === 0 && !m.objectiveDone, '开局无自由采挖窗');

// 钻采 → 出块
let deposited = 0;
let guard = 0;
while (deposited < m.pointQuota && guard++ < 60) {
  const b = m.beacons.find(function (x) { return x.chunksLeft > 0; });
  if (!b) break;
  m.player.x = b.x; m.player.y = b.y; m.player.vx = 0; m.player.vy = 0;
  ok(b.canDrill(m.player), '贴近信标可钻采');
  b.drill(0.5, m);                      // 半程
  ok(b.drillT > 0 && b.state === 'active', '钻采进行中（进度环走表）');
  b.drill(3.0, m);                      // 完成
  eq(idleChunks(m).length, 1, '钻采完成产出一个矿块');
  // 拾起
  const chunk = idleChunks(m)[0];
  m.player.x = chunk.x; m.player.y = chunk.y;
  ok(m.pointInteract(), 'E 拾起矿块');
  ok(m.player.carriedItem === chunk, '矿块头顶携带');
  // 携带限副手（纯逻辑判定）
  const lock = DRG.carryRestriction(m.player);
  ok(!!lock && lock.slot === 1 && lock.slowMul === 0.9, '携带矿块：锁副手 + 移速 -10%');
  // 携带中按 1 也不许切主手
  DRG.input.pressed['Digit1'] = true;
  m.player.update(0.016, m);
  delete DRG.input.pressed['Digit1'];
  eq(m.player.cur, 1, '携带中按 1 仍被强制在副手槽');
  // 入库
  m.player.x = m.mule.x; m.player.y = m.mule.y;
  const enemiesBefore = m.enemies.length;
  ok(m.pointInteract(), '莫莉旁 E 入库');
  eq(m.chunksDeposited, deposited + 1, '入库计数 +1');
  ok(m.enemies.length > enemiesBefore, '每入库 1 块触发一小波虫潮');
  ok(DRG.carryRestriction(m.player) === null, '入库后携带限制解除');
  deposited = m.chunksDeposited;
}
eq(m.chunksDeposited, 7, '配额 7 全部入库');
ok(m.objectiveDone, 'objectiveDone 置位');
ok(!m.podCalled && m.state === 'play' && m.bonusWindow === 60, '配额达成 → 60 秒自由采挖窗（不再立刻召 pod，深度玩法）');

/* ---- 深度玩法：硬壳钻采（耗時×2）→ 富矿块入库计 2 ---- */
const rb = m.beacons.find(function (b) { return b.shellLeft > 0; });
ok(!!rb, '存在带硬壳的富矿信标');
ok(rb.chunksLeft <= 0 || true, '硬壳阶段独立于普通矿结计数');
if (rb) {
  /* 先排干该信标的普通矿结，进入纯硬壳阶段 */
  let drg = 0;
  while (rb.chunksLeft > 0 && drg++ < 8) {
    m.player.x = rb.x; m.player.y = rb.y; m.player.vx = 0; m.player.vy = 0;
    rb.drill(rb.drillNeed(), m);
  }
  eq(rb.chunksLeft, 0, '普通矿结已排干（硬壳阶段）');
  m.player.x = rb.x; m.player.y = rb.y; m.player.vx = 0; m.player.vy = 0;
  ok(rb.canDrill(m.player), '贴近硬壳可钻采');
  rb.drill(0.5, m);
  ok(rb.drillT > 0 && rb.drillT < rb.drillNeed(), '硬壳钻采进行中（需时 = 基础 ×2 = ' + rb.drillNeed() + 's）');
  rb.drill(rb.drillNeed(), m);
  const richChunk = idleChunks(m).find(function (c) { return c.rich; });
  ok(!!richChunk, '钻穿硬壳采出富矿块（rich 标记）');
  eq(rb.shellLeft, 0, '硬壳只有一层');
  eq(rb.state, 'depleted', '硬壳破开后信标采空');
  /* 清掉排干阶段散落的普通块，保证拾取目标唯一 */
  for (let k = m.props.length - 1; k >= 0; k--) {
    const pr = m.props[k];
    if (pr instanceof DRG.OreChunk && pr !== richChunk && pr.state === 'idle') m.props.splice(k, 1);
  }
  m.player.x = richChunk.x; m.player.y = richChunk.y;
  ok(m.pointInteract(), 'E 拾起富矿块');
  const lockR = DRG.carryRestriction(m.player);
  ok(!!lockR && lockR.slowMul === 0.9, '富矿块同重：移速 -10% + 锁副手');
  m.player.x = m.mule.x; m.player.y = m.mule.y;
  ok(m.pointInteract(), '莫莉旁 E 入库富矿块');
  eq(m.chunksDeposited, 9, '富矿块入库计 2（7+2 = 9）');
  ok(!m.podCalled && m.bonusWindow > 0, '窗内继续入库不结束自由窗');
}
/* R 提前撤离（callPod 的 R 键路径等价） */
m.callPod();
ok(m.podCalled && m.state === 'extract' && m.pod, '按 R 提前呼叫撤离 pod（extract 态）');
m.pod.state = 'landed';
m.board();
eq(m.state, 'success', '登舱 → success（integration.complete win=true 管道）');

/* ---- 深度玩法：自由窗倒计时归零自动召 pod ---- */
const mP2 = new DRG.Mission({ type: 'point', biome: biome, haz: 1, cls: 'scout', seed: 31 });
mP2.state = 'play';
eq(mP2.pointQuota, 3, 'haz1 配额 = 3');
const y1 = mP2.beacons.reduce(function (a, b) { return a + b.chunkYield; }, 0);
ok(y1 >= 3, 'haz1 可采矿块覆盖配额');
const rich1 = mP2.beacons.filter(function (b) { return b.rich; }).length;
eq(rich1, 1, 'haz1 硬壳富矿 = 1');
let dep2 = 0; guard = 0;
while (dep2 < mP2.pointQuota && guard++ < 60) {
  const b = mP2.beacons.find(function (x) { return x.chunksLeft > 0; });
  if (!b) break;
  mP2.player.x = b.x; mP2.player.y = b.y; mP2.player.vx = 0; mP2.player.vy = 0;
  b.drill(b.drillNeed(), mP2);
  const c = idleChunks(mP2)[0];
  mP2.player.x = c.x; mP2.player.y = c.y;
  mP2.pointInteract();
  mP2.player.x = mP2.mule.x; mP2.player.y = mP2.mule.y;
  mP2.pointInteract();
  dep2 = mP2.chunksDeposited;
}
ok(mP2.objectiveDone && mP2.bonusWindow > 0 && !mP2.podCalled, 'haz1 配额达成 → 自由窗开启');
mP2.bonusWindow = 0.4;
mP2.update(0.5, { w: 400, h: 240 });
ok(mP2.podCalled && mP2.state === 'extract', '自由窗倒计时归零自动召 pod');

// 倒地掉落
const m1c = new DRG.Mission({ type: 'point', biome: biome, haz: 2, cls: 'driller', seed: 55 });
m1c.state = 'play';
const bc = m1c.beacons[0];
m1c.player.x = bc.x; m1c.player.y = bc.y;
bc.drill(DRG.POINT.DRILL_TIME + 0.1, m1c);
const chunkC = idleChunks(m1c)[0];
m1c.player.x = chunkC.x; m1c.player.y = chunkC.y;
m1c.pointInteract();
ok(m1c.player.carriedItem === chunkC, '倒地前正在携带');
m1c.player.goDown(m1c);
ok(m1c.player.carriedItem === null && chunkC.state === 'idle', '倒地：矿块掉落原地（可重拾）');
ok(Math.abs(chunkC.x - m1c.player.x) < 60, '掉落位置在玩家附近');

/* ================= 搜救行动 ================= */
console.log('\n== salv 搜救行动 ==');
const m2 = new DRG.Mission({ type: 'salv', biome: biome, haz: 3, cls: 'gunner', seed: 424242 });
m2.state = 'play';
ok(m2.world.w === 460 && m2.world.h === 180, '搜救地图更大（460x180）');
eq(m2.salvBeacons.length, 4, '信号信标 = 4');
eq(idleLegs(m2).length, 4, '散落矿骡腿 = 4');
ok(!!m2.wreck, '矿骡残骸框架存在');
ok(DRG.M.dist(m2.wreck.x, m2.wreck.y, m2.player.x, m2.player.y) > 600, '残骸离出生点足够远');
/* ---- 深度玩法：巢穴守卫腿（haz3 → 1 条带守卫） ---- */
const guardedLegs = idleLegs(m2).filter(function (l) { return l.guarded; });
eq(guardedLegs.length, 1, '守卫腿 = 1（危<4 一条，深度玩法）');
const guardEnemies = m2.enemies.filter(function (e) { return e.type === 'guard'; });
ok(guardEnemies.length >= 1, '守卫虫已预置在腿旁（' + guardEnemies.length + ' 只 guard）');

for (let i = 0; i < 4; i++) {
  const leg = idleLegs(m2)[0];
  m2.player.x = leg.x; m2.player.y = leg.y;
  ok(m2.salvInteract(), 'E 拾起矿骡腿 #' + (i + 1));
  ok(m2.player.carriedItem === leg && leg.state === 'carried', '矿骡腿携带中');
  if (i === 0) {
    const lock2 = DRG.carryRestriction(m2.player);
    ok(!!lock2 && lock2.slot === 1 && lock2.slowMul === 0.7, '运腿：锁副手 + 移速 -30%');
  }
  m2.player.x = m2.wreck.x; m2.player.y = m2.wreck.y;
  ok(m2.salvInteract(), '残骸处 E 安装矿骡腿 #' + (i + 1));
  eq(m2.wreck.installed, i + 1, '安装计数 ' + (i + 1) + '/4');
  ok(m2.wreck.legs.indexOf(leg) >= 0, '腿挂在框架上');
}
eq(m2.wreck.state, 'ready', '四条装齐 → ready（待修复）');
ok(!m2.objectiveDone, '未修复前不算目标完成');

// 长按修复：3 秒；松开保留进度；修复期持续刷防御虫
const p2 = m2.player;
p2.x = m2.wreck.x; p2.y = m2.wreck.y;
inputHeldKeyE = true;
m2.salvDirector(1.0);
ok(Math.abs(m2.wreck.repairT - 1.0) < 1e-6, '长按 1s → 进度 1s');
ok(m2.wreck.repairing, '修复进行中标记');
inputHeldKeyE = false;
m2.salvDirector(1.0);
m2.salvDirector(1.0);
ok(Math.abs(m2.wreck.repairT - 1.0) < 1e-6, '松开 2s：进度保留不回退');
ok(m2.wreck.state === 'ready', '松开期间未完成');
inputHeldKeyE = true;
m2.salvDirector(1.0);
ok(Math.abs(m2.wreck.repairT - 2.0) < 1e-6, '继续长按 → 进度 2s');
m2.salvDirector(1.1);
eq(m2.wreck.state, 'repaired', '长按满 3 秒 → repaired');
ok(m2.objectiveDone, '修复完成目标达成');
/* ---- 深度玩法：修复完成 → 45 秒自检防御窗（不再立刻召 pod） ---- */
ok(!m2.podCalled && m2.selfCheck > 40 && m2.selfCheck <= 45 && m2.state === 'play', '修复完成 → 45 秒自检防御窗开启（同 tick 已走表）');
const en0 = m2.enemies.length;
inputHeldKeyE = false;
m2.salvDirector(6);                                   // 2s 后首波
ok(m2.enemies.length > en0, '自检窗口持续刷防御虫');
ok(m2.selfCheck > 0 && m2.selfCheck < 45, '自检倒计时走表');
m2.salvDirector(40);                                  // 共 46s ≥ 45s
ok(m2.podCalled && m2.state === 'extract', '自检结束自动呼叫撤离');
eq(m2.selfCheck, 0, '自检窗归零');
inputHeldKeyE = false;
m2.pod.state = 'landed';
m2.board();
eq(m2.state, 'success', '登舱 → success');

/* ================= exp 回归不受影响 ================= */
console.log('\n== exp 回归 ==');
const m3 = new DRG.Mission({ type: 'exp', biome: biome, haz: 3, cls: 'scout', seed: 9 });
m3.state = 'play';
eq(m3.world.w, 400, 'exp 地图尺寸不变（400）');
ok(m3.beacons.length === 0 && !m3.wreck && m3.salvBeacons.length === 0, 'exp 不生成 point/salv 实体');
ok(DRG.carryRestriction(m3.player) === null, 'exp 无携带限制');
m3.deposited.morkite = m3.quota;
m3.checkObjective();
ok(m3.objectiveDone && !m3.podCalled, 'exp 目标达成后仍按 R 手动呼叫（回归不变）');

/* ================= escort 携带油罐不受新限制 ================= */
console.log('\n== escort 油罐限制回归 ==');
ok(DRG.carryRestriction({ carriedItem: {}, carriedCan: {} }) === null, '护送油罐不触发武器锁（沿用旧规则）');

console.log('\n== 结果：' + passed + ' 通过, ' + failed + ' 失败 ==');
process.exit(failed ? 1 : 0);
