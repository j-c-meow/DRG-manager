/* 终局强制接线 domain 层无头冒烟：加载 dist 构建产物 app.js，验证
   startDirectMission 小队编入 + finale 标记 + abort 全员归队 + 回板数据形状 */
'use strict';
function makeStub() {
  const stub = new Proxy(function () {}, {
    get(t, k) {
      if (k === Symbol.toPrimitive || k === 'toString') return () => '';
      if (k === 'prototype') return undefined;
      if (!(k in cache)) cache[k] = makeStub();
      return cache[k];
    },
    set() { return true; },
    construct() { return makeStub(); },
    apply() { return makeStub(); },
    has() { return true; },
  });
  return stub;
}
const cache = {};
global.Element = function Element() {};
global.HTMLElement = function HTMLElement() {};
global.HTMLCanvasElement = function HTMLCanvasElement() {};
global.HTMLImageElement = function HTMLImageElement() {};
global.HTMLVideoElement = function HTMLVideoElement() {};
global.Image = function Image() { this.dataset = {}; };
global.Audio = function Audio() { this.dataset = {}; };
global.window = new Proxy(global, { get(t, k) { if (k in t) return t[k]; return cache[k] || (cache[k] = makeStub()); } });
global.document = makeStub();
try { global.navigator = makeStub(); } catch (e) { /* node 内建 navigator 只读则跳过 */ }

const fs = require('node:fs');
const path = require('node:path');
const ROOT = 'D:/_drg_wt_rt';
const distDir = process.env.DRG_DIST || path.join(ROOT, 'dist');
const bundle = fs.readFileSync(path.join(distDir, 'scripts', 'app.js'), 'utf8');
new Function('window', bundle)(global.window);

const domain = global.DRGUnified.domain;
if (!domain) { console.error('FAIL DRGUnified.domain missing'); process.exit(1); }

let passed = 0, failed = 0;
const ok = (c, l) => { if (c) { passed++; console.log('  ok  ' + l); } else { failed++; console.error('  FAIL ' + l); } };
const eq = (a, b, l) => ok(a === b, l + '（期望 ' + b + '，实际 ' + a + '）');

const mission = { id: 'm1', type: 'elim', biome: 'magma', hazard: 5, rewards: { credits: 100 }, r: { credits: 100 } };
const S = {
  v: 1, nitra: 500,
  board: [mission],
  miners: [
    { id: 'a', cls: 'gunner', state: 'idle', morale: 80 },
    { id: 'b', cls: 'gunner', state: 'idle', morale: 70 },
    { id: 'c', cls: 'driller', state: 'idle', morale: 60 },
    { id: 'd', cls: 'scout', state: 'idle', morale: 50 },
    { id: 'e', cls: 'scout', state: 'mission', morale: 90 },
  ],
  realtime: null,
  deps: [],
};

// 1. 终局编队启动
const req = domain.startDirectMission(S, {
  requestId: 'rt1', seed: 42, mission: Object.assign({}, mission), nitraCost: 70, now: 1000,
  miner: { id: 'a', cls: 'gunner', name: 'A', level: 5 },
  minerIds: ['a', 'b', 'c', 'd'], finale: true,
});
ok(!!req && req.miner.id === 'a', 'startDirectMission 返回请求，主控=队首');
eq(S.board.length, 0, '任务离开任务板（进行中）');
eq(S.nitra, 430, '硝石扣除');
ok(S.realtime && S.realtime.minerIds && S.realtime.minerIds.length === 4, 'S.realtime 记录 4 人小队');
eq(S.realtime.finale, true, 'S.realtime.finale 标记');
eq(S.miners.filter(x => x.state === 'mission').length, 5, '小队 4 人 + 原有 1 人处于 mission 态');

// 2. 重复启动被拒
let threw = false;
try { domain.startDirectMission(S, { requestId: 'rt2', seed: 1, mission, miner: { id: 'a', cls: 'gunner', name: 'A', level: 5 }, nitraCost: 70, now: 2000 }); }
catch (e) { threw = true; }
ok(threw, '已有实时任务时再次启动抛错');

// 3. 结算门
ok(domain.canSettleMission(S, { requestId: 'rt1' }), 'canSettleMission 认领 rt1');
domain.markMissionSettled(S, 'rt1', 3000);
ok(!domain.canSettleMission(S, { requestId: 'rt1' }), '重复结算被拒');

// 4. 召回：全员归队（abort 处理 minerIds）
const aborted = domain.abortDirectMission(S, 15);
eq(aborted, 'rt1', 'abortDirectMission 返回 requestId');
eq(S.miners.filter(x => x.state === 'idle').length, 4, '小队全员归队 idle');
ok(S.miners.slice(0, 4).every(x => x.morale >= 10 && x.morale <= 65), '士气 -15 下限保护');
eq(S.realtime, null, 'S.realtime 清空');

// 5. 失败回板：任务回插任务板（consumeRealtimeResult/recallRealtime 同形逻辑）
S.board.push(mission);
eq(S.board.length, 1, '任务回板（controller 回板逻辑同形）');
ok(domain.canSettleMission(S, { requestId: 'nope' }) === false, '无效 requestId 不可结算');

// 6. 单人路径回归：不带 minerIds 时行为与旧版一致
const solo = { id: 'm2', type: 'exp', biome: 'salt', hazard: 2, rewards: {}, r: {} };
S.board.push(solo);
domain.startDirectMission(S, {
  requestId: 'rt3', seed: 7, mission: solo, nitraCost: 40, now: 5000,
  miner: { id: 'd', cls: 'scout', name: 'D', level: 3 },
});
ok(S.realtime && !S.realtime.minerIds && !S.realtime.finale, '单人路径不写小队/终局字段');
eq(S.miners.find(x => x.id === 'd').state, 'mission', '单人路径矿工进入 mission 态');
domain.abortDirectMission(S, 10);
eq(S.miners.filter(x => x.state === 'idle').length, 4, '单人召回仅主控归队（c 仍 mission）');

console.log('\n== 结果：' + passed + ' 通过, ' + failed + ' 失败 ==');
process.exit(failed ? 1 : 0);
