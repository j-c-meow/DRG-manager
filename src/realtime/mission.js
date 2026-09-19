/* ============================================================
   mission.js — one dive: world + entities + wave director +
   objectives + camera. Everything gameplay talks through here.
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M, gfx = DRG.gfx, T = DRG.CFG.TILE, TT = DRG.TT;
  var A = function () { return DRG.assets; };

  DRG.HAZARDS = DRG_SHARED.realtimeHazards.map(function (hazard) {
    return Object.assign({}, hazard);
  });

  function Mission(opt) {
    var self = this;
    this.opt = opt;
    this.type = opt.type || 'exp';
    this.isEscort = this.type === 'escort';
    this.isPoint = this.type === 'point';       // 定点提取
    this.isSalv = this.type === 'salv';         // 搜救行动
    this.isRefi = this.type === 'refi';         // 就地精炼
    this.biome = opt.biome;
    this.hazard = DRG.HAZARDS[M.clamp(opt.haz, 1, 5) - 1];
    this.seed = opt.seed;
    this.state = 'intro';               // intro | play | extract | success | failed
    this.time = 0;
    this.world = new DRG.World(this.isEscort
      ? { w: 340, h: 96, seed: opt.seed, biome: opt.biome, mode: 'escort' }
      : this.isSalv
        ? { w: 460, h: 180, seed: opt.seed, biome: opt.biome }   // 搜救：更大更暗
        : this.isRefi
          ? { w: 440, h: 170, seed: opt.seed, biome: opt.biome } // 精炼：更大，管线拉得远
          : { w: 400, h: 160, seed: opt.seed, biome: opt.biome });

    var st = this.world.start;
    var spawnX = st.tx * T + T / 2, spawnY = st.ty * T;
    if (this.isEscort) spawnX = this.world.escortTrack.x0 - 84;   // 站在朵蕾妲左后方，别叠在她出生点上
    this.player = new DRG.Player(opt.cls, spawnX, spawnY);
    this.player.carriedCan = null;      // 头顶携带的燃料罐
    this.bosco = new DRG.Ent.Bosco(this.player.x - 40, this.player.y - 50);
    this.mule = new DRG.Ent.Mule(this.player.x + (this.isEscort ? -60 : 70), this.player.y);

    // 执勤护送：朵蕾妲掘进机（血量随危险度缩放：100 + (lv-1)×12%）
    this.doretta = null;
    this.defenseT = 0;                  // 终点心石防守倒计时
    this.defenseWave = 0;
    this.waveMark = 0;                  // 25/50/75% 进度虫潮游标
    if (this.isEscort) {
      if (DRG.loadEscortSprites) DRG.loadEscortSprites();
      this.doretta = new DRG.Doretta(this.world.escortTrack,
        Math.round(100 * (1 + (this.hazard.lv - 1) * 0.12)));
    }

    // 定点提取：3 处富矿信标 + 矿块入库计数（配额 = 3 + (危险度-1)）
    this.beacons = [];
    this.pointQuota = 3 + (this.hazard.lv - 1);
    this.chunksDeposited = 0;
    // 搜救行动：信号信标 ×4 + 矿骡腿 ×4 + 残骸框架 + 长按修复
    this.salvBeacons = [];
    this.wreck = null;
    this.repairWaveT = 0;
    // 就地精炼：精炼单元（出生点）+ 远处油井 ×(危险度决定) + 管线 + 产油汇总
    this.refinery = null;
    this.wells = [];
    this.oilRefined = 0;
    this.oilQuota = DRG.REFI ? DRG.REFI.quotaOf(this.hazard.lv) : 12;

    this.enemies = []; this.bullets = []; this.pickups = []; this.flares = []; this.props = [];
    this.fx = new DRG.Particles(1500);
    this.pod = null; this.shield = null; this.muzzle = null;

    // 点位布置（须在 props 就绪后）：信标 / 矿骡腿 / 残骸
    if (this.isPoint && DRG.PointBeacon) {
      if (DRG.loadPointSprites) DRG.loadPointSprites();
      var rngB = DRG.RNG((this.seed ^ 0xbeac0) | 0);
      var spots = this.pickFarFloors(rngB, 3, 560, 0, 430);
      var yield3 = Math.ceil(this.pointQuota / 3);   // 每处可采矿块数（保证配额可达成）
      if (!spots.length) spots = [{ x: this.player.x + 420, y: this.player.y }];
      for (var bi = 0; bi < spots.length; bi++) this.beacons.push(new DRG.PointBeacon(spots[bi].x, spots[bi].y, yield3));
    }
    if (this.isSalv && DRG.MuleWreck) {
      if (DRG.loadSalvSprites) DRG.loadSalvSprites();
      var rngW = DRG.RNG((this.seed ^ 0xbaadd) | 0);
      var wreckSpots = this.pickFarFloors(rngW, 1, 1000, 0, 0);
      var ws = wreckSpots[0] || { x: this.player.x + 800, y: this.player.y };
      this.wreck = new DRG.MuleWreck(ws.x, ws.y);
      var rngL = DRG.RNG((this.seed ^ 0x1e955) | 0);
      var legSpots = this.pickFarFloors(rngL, 4, 560, 0, 360);
      while (legSpots.length < 4) legSpots.push({ x: this.player.x + 300 + legSpots.length * 180, y: this.player.y });
      for (var li = 0; li < legSpots.length; li++) {
        var leg = new DRG.MuleLeg(legSpots[li].x, legSpots[li].y);
        this.props.push(leg);
        this.salvBeacons.push(new DRG.SalvBeacon(legSpots[li].x, legSpots[li].y, leg));
      }
    }
    if (this.isRefi && DRG.OilWell) {
      var st0 = this.world.start;
      var baseSpot = this.findStandSpotNear(st0.tx * T + 120, st0.ty * T, 7) || { x: st0.tx * T + 120, y: st0.ty * T };
      this.refinery = new DRG.RefineryUnit(baseSpot.x, baseSpot.y);
      var nWells = DRG.REFI ? DRG.REFI.wellCount(this.hazard.lv) : 2;
      var rngO = DRG.RNG((this.seed ^ 0x0115) | 0);
      var wellSpots = this.pickFarFloors(rngO, nWells, 680, 0, 460);
      while (wellSpots.length < nWells) wellSpots.push({ x: this.player.x + 500 + wellSpots.length * 260, y: this.player.y });
      for (var wi = 0; wi < wellSpots.length; wi++) this.wells.push(new DRG.OilWell(wellSpots[wi].x, wellSpots[wi].y));
    }
    this.cam = { x: 0, y: 0, w: 100, h: 100, sx: 0, sy: 0 };
    this.shakeAmt = 0; this.shakeT = 0;
    this.toasts = [];
    this.mcLine = null;

    // objective: morkite quota, scaled by hazard
    this.quota = Math.round(110 * this.hazard.quota);
    this.deposited = { morkite: 0, nitra: 0, gold: 0, crystal: 0 };
    this.nitraBank = 0;
    this.objectiveDone = false;
    this.podCalled = false;
    this.escapeTime = 0;

    this.threat = 0;
    this.waveNo = 0;
    this.nextWave = 55 / this.hazard.rate;
    this.ambientCd = 6;
    this.stats = { mined: {}, kills: 0, deposits: 0, credits: 0, xp: 0, waves: 0, downs: 0, dug: 0 };
    this.glowCache = { t: 0, list: [] };

    // starting fauna: a few lootbugs and idle grunts scattered around
    var rng = DRG.RNG(opt.seed ^ 0x1234);
    var floors = this.world.floors;
    for (var i = 0; i < 12 && floors.length; i++) {
      var f = floors[rng.int(0, floors.length - 1)];
      if (M.dist(f.tx * T, f.ty * T, this.player.x, this.player.y) < 400) continue;
      this.spawnEnemy(rng.chance(0.12) ? 'goldbug' : 'lootbug', f.tx * T + T / 2, f.ty * T + T);
    }
    if (!this.isEscort) for (i = 0; i < Math.round(5 * this.hazard.rate) && floors.length; i++) {
      f = floors[rng.int(0, floors.length - 1)];
      if (M.dist(f.tx * T, f.ty * T, this.player.x, this.player.y) < 700) continue;
      this.spawnEnemy('grunt', f.tx * T + T / 2, f.ty * T + T);
    }   // 护送局不预置敌对虫：压力全部交给 25/50/75% 虫潮导演，避免开局就把朵蕾妲啃穿

    // gentle onboarding: the controls that matter, spread over the first minute
    this.hints = [
      { t: 3.5, text: '按住鼠标右键对着岩壁挖掘 · 绿色晶体是莫尔凯特', col: '#3ad98a' },
      { t: 11, text: '洞穴很黑 — 按 F 扔出照明弹', col: '#ffb03c' },
      { t: 19, text: '矿石会自动进背包 · 走到莫莉 M.U.L.E. 旁按 E 存放（按 T 呼叫她）', col: '#8ad4ff' },
      { t: 27, text: '存够 80 硝石后按 V 呼叫补给舱 · 左键开火，Q 使用职业装备', col: '#ffd76a' },
      { t: 36, text: '贴着墙按空格可以蹬墙跳，爬出自己挖的竖井', col: '#c8a4ff' }
    ];
    if (this.isEscort) {
      this.hints = [
        { t: 3.5, text: '朵蕾妲会自动掘进——跟紧她，别让她孤军奋战', col: '#ffb03c' },
        { t: 11, text: '虫子会优先啃咬朵蕾妲——听到「遭受攻击」警报立刻回防', col: '#ff8a5a' },
        { t: 19, text: '她停车时会放下燃料罐：走近按 E 拾起，再对油箱口按 E 加入', col: '#ffd76a' },
        { t: 27, text: '存够 80 硝石后按 V 呼叫补给舱 · 左键开火，Q 使用职业装备', col: '#8ad4ff' }
      ];
    }
    if (this.isPoint) {
      this.hints = [
        { t: 3.5, text: '定点提取：跟着蓝色光柱找到富矿信标（共 3 处）', col: '#7fd4ff' },
        { t: 11, text: '走近信标按住左键钻采大矿结，采出的矿块顶在头上', col: '#7fd4ff' },
        { t: 19, text: '携带矿块时移速 -10%、只能用副手武器——把它搬回莫莉旁按 E 入库', col: '#ffd76a' },
        { t: 27, text: '每入库 1 块会引来一小波虫潮；集齐 ' + this.pointQuota + ' 块即可撤离', col: '#ff8a5a' }
      ];
    }
    if (this.isSalv) {
      this.hints = [
        { t: 3.5, text: '搜救行动：信号信标指向失联的矿骡腿——跟着 HUD 箭头走', col: '#ffd76a' },
        { t: 11, text: '走近矿骡腿按 E 扛起来：移速 -30%，只能用副手武器', col: '#b0ff7a' },
        { t: 19, text: '把腿搬到矿骡残骸处按 E 安装；每装一条会刷出防御虫', col: '#ff8a5a' },
        { t: 27, text: '四条腿装齐后，对准矿骡长按 E 修复 3 秒（松开保留进度）', col: '#b0ff7a' }
      ];
    }
    if (this.isRefi) {
      this.hints = [
        { t: 3.5, text: '就地精炼：在精炼单元旁按 E 领取管道段（移速 -20%，只能用副手武器）', col: '#6fbde8' },
        { t: 11, text: '跟着蓝色光柱找到墨菱油井——对准油井按 E 铺设管线并安装泵', col: '#6fbde8' },
        { t: 19, text: '泵会自动抽油汇进精炼单元；虫子会专门啃泵——听到警报就回防', col: '#ff8a5a' },
        { t: 27, text: '泵停摆后长按 E 修理（松开保留进度）；集齐 ' + this.oilQuota + ' 单位原油即可撤离', col: '#3ad98a' }
      ];
    }

    this.tileFx = function (type, tx, ty, broken) { self.handleTile(type, tx, ty, broken); };
    DRG.bus.on('pod-landed', function () { });
  }

  /* ---------------- helpers used by entities ---------------- */
  Mission.prototype.panOf = function (x) {
    return M.clamp((x - (this.cam.x + this.cam.w / 2)) / (this.cam.w * 0.6), -1, 1);
  };
  Mission.prototype.shake = function (amt, dur) {
    this.shakeAmt = Math.max(this.shakeAmt, amt * DRG.opts().shake);
    this.shakeT = Math.max(this.shakeT, dur);
  };
  Mission.prototype.toast = function (text, col, dur) {
    this.toasts.push({ text: text, col: col || '#ffd76a', life: dur || 2.6, t: 0 });
    if (this.toasts.length > 5) this.toasts.shift();
  };
  Mission.prototype.mc = function (text, clip) {
    this.mcLine = { text: text, t: 0, life: 5.5 };
    if (clip) DRG.audio.clip(clip, 0.95, true);
  };

  Mission.prototype.hitEnemyAt = function (x, y, r) {
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (e.dead) continue;
      if (Math.abs(x - e.x) < e.w / 2 + r && y > e.y - e.h - r && y < e.y + r) return e;
    }
    return null;
  };

  Mission.prototype.damageEnemy = function (e, dmg, x, y, vx, vy, silent) {
    e.hurt(dmg, this, x);
    if (!silent) {
      this.fx.burst(x || e.x, y || e.y - e.h / 2, 3, { col: ['#8fe08a', '#d8ff9a'], speed: 130, life: 0.3, size: 2.2, kind: 3 });
      if (dmg >= 25) this.fx.text(e.x, e.y - e.h - 8, String(Math.round(dmg)), '#ffe6a0', 12);
    }
    if (vx) { e.vx += M.sign(vx) * Math.min(120, dmg * 1.5); }
  };

  Mission.prototype.explode = function (x, y, radius, dmg, dig) {
    DRG.audio.sfx('explode', this.panOf(x));
    this.shake(radius * 0.16, 0.35);
    this.fx.burst(x, y, 26, { col: ['#fff2c0', '#ffb03c', '#ff6a2a'], speed: 420, life: 0.55, size: 5, kind: 4, glow: 30, grav: 0.2 });
    this.fx.burst(x, y, 12, { col: ['#3a3a3a', '#5a5148'], speed: 150, life: 1.4, size: 8, kind: 2, grav: -0.05 });
    this.fx.spawn({ x: x, y: y, vx: 0, vy: 0, life: 0.4, size: radius / 8, col: '#ffd08a', kind: 5, grav: 0 });
    if (dig) this.world.digCircle(x, y, radius * 0.7, dig * 6, this.tileFx);
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (e.dead) continue;
      var d = M.dist(x, y, e.x, e.y - e.h / 2);
      if (d < radius) {
        e.hurt(dmg * (1 - d / radius * 0.65), this, x);
        e.vx += M.sign(e.x - x) * 220 * (1 - d / radius);
        e.vy -= 180 * (1 - d / radius);
      }
    }
    var p = this.player;
    var pd = M.dist(x, y, p.x, p.y - 12);
    if (pd < radius * 0.9 && !p.downed) {
      p.hurt(dmg * 0.28 * (1 - pd / (radius * 0.9)), this, 'blast');
      p.vx += M.sign(p.x - x) * 260 * (1 - pd / radius);
      p.vy -= 200 * (1 - pd / radius);
    }
    // 爆炸同样波及朵蕾妲（爆裂虫是推车路上最烦的东西）
    if (this.doretta && !this.doretta.dead) {
      var dd = M.dist(x, y, this.doretta.x, this.doretta.y - this.doretta.h * 0.5);
      if (dd < radius) this.doretta.hurt(dmg * 0.5 * (1 - dd / radius), this);
    }
  };

  /** particles + mineral drops whenever a tile is hit or destroyed */
  Mission.prototype.handleTile = function (type, tx, ty, broken) {
    var cx = tx * T + T / 2, cy = ty * T + T / 2;
    var col = type === TT.DIRT ? this.biome.dirt : this.biome.rock;
    var ore = DRG.ORE_OF[type];
    if (broken) {
      this.stats.dug++;
      DRG.audio.sfx('break', this.panOf(cx), 0.82 + Math.random() * 0.4);
      this.fx.burst(cx, cy, ore ? 10 : 7, {
        col: ore ? [DRG.ORE_INFO[ore].color, col, '#fff2c0'] : [col, col, '#e8d8b0'],
        speed: 200, life: 0.6, size: 3.4
      });
      if (ore) {
        var n = ore === 'morkite' ? 3 : (ore === 'nitra' ? 2 : 1);
        for (var i = 0; i < n; i++) this.pickups.push(new DRG.Ent.Pickup(cx, cy, ore, 1));
      }
    } else {
      this.fx.burst(cx, cy, 2, { col: [col], speed: 120, life: 0.3, size: 2.2 });
    }
  };

  Mission.prototype.onTileMined = function () { /* stats hook */ };

  Mission.prototype.spawnEnemy = function (type, x, y) {
    if (this.enemies.length > 90) return null;
    var e = new DRG.Enemy(type, x, y, this.hazard.hpMul);
    this.enemies.push(e);
    return e;
  };

  Mission.prototype.onEnemyKilled = function (e, silent) {
    this.stats.kills++;
    this.stats.credits += e.def.credits * this.hazard.credit;
    this.stats.xp += e.def.xp * this.hazard.xp;
  };

  Mission.prototype.onPlayerDowned = function () {
    this.stats.downs++;
    var cd = this.bosco.reviveCd;
    this.toast(cd > 0
      ? 'BOSCO 复活模块充能中（' + Math.ceil(cd) + 's）— 撑住！'
      : '你被击倒了！BOSCO 正在赶来…', '#ff5a4a', 4);
    DRG.audio.sfx('alarm');
  };

  Mission.prototype.onPlayerDead = function () {
    if (this.state === 'failed' || this.state === 'success') return;
    this.state = 'failed';
    this.failReason = '矮人失去意识 · DWARF DOWN';
    DRG.audio.stopAmbience();
  };
  Mission.prototype.onPlayerRevived = function () {
    if (this.state === 'failed') {
      this.state = 'play';
      this.failReason = null;
      DRG.audio.startAmbience(this.biome.tint);
      this.toast('BOSCO 把你从鬼门关拉了回来 — 继续挖!', '#7ad7ff', 4);
    }
  };

  Mission.prototype.findStandSpotNear = function (x, y, tiles) {
    var tx0 = Math.floor(x / T), ty0 = Math.floor(y / T);
    var max = tiles || 4, loose = null, anyEmpty = null;
    for (var r = 1; r <= max; r++) {
      for (var dy = -r; dy <= r; dy++) {
        for (var dx = -r; dx <= r; dx++) {
          var tx = tx0 + dx, ty = ty0 + dy;
          if (this.world.at(tx, ty) !== TT.EMPTY) continue;
          if (!anyEmpty) anyEmpty = { x: tx * T + T / 2, y: ty * T + T };
          var floorBelow = this.world.at(tx, ty + 1) !== TT.EMPTY;
          if (!floorBelow) continue;
          if (this.world.at(tx, ty - 1) === TT.EMPTY) return { x: tx * T + T / 2, y: ty * T + T };
          if (!loose) loose = { x: tx * T + T / 2, y: ty * T + T };
        }
      }
    }
    return loose || anyEmpty;
  };

  /* ---------------- escort：执勤护送（推车） ---------------- */

  /** 玩家 E 键的护送交互：先加油（若携罐且靠近油箱口），再尝试拾取燃料罐 */
  Mission.prototype.escortInteract = function () {
    if (!this.isEscort || !this.doretta || this.doretta.dead) return false;
    var p = this.player;
    if (this.doretta.canFuel(p)) { this.doretta.addFuel(this); return true; }
    if (p.carriedCan) return false;
    var best = null, bd = 52;
    for (var i = 0; i < this.props.length; i++) {
      var pr = this.props[i];
      if (!(pr instanceof DRG.FuelCanister) || pr.state !== 'idle') continue;
      var d = M.dist(pr.x, pr.y, p.x, p.y);
      if (d < bd) { bd = d; best = pr; }
    }
    if (best) {
      best.state = 'carried';
      p.carriedCan = best;
      this.toast('拾起燃料罐 · 送到朵蕾妲油箱口按 E 加入', '#ffd76a', 2.5);
      DRG.audio.sfx('beep');
      return true;
    }
    return false;
  };

  /** 虫潮目标权重：朵蕾妲 > 玩家（近距离必咬车，远处约 3/4 扑车，其余骚扰玩家） */
  Mission.prototype.escortPrey = function (e) {
    if (!this.isEscort || !this.doretta || this.doretta.dead) return null;
    var d = this.doretta;
    var dd = M.dist(e.x, e.y, d.x, d.y - d.h * 0.4);
    if (dd > 620) return null;
    if (e._preyBias == null) e._preyBias = Math.random();
    return (dd < 320 || e._preyBias < 0.72)
      ? { x: d.x, y: d.y - d.h * 0.4, doretta: d }
      : null;
  };

  /** 朵蕾妲抵达终点：开始 20 秒心石防守（连续两波虫） */
  Mission.prototype.onDorettaArrived = function () {
    this.defenseT = 20;
    this.defenseWave = 0;
    this.mc('完成！奥魔兰心石，我们来了！', 'mc_countdown');
    this.toast('心石防守：守住朵蕾妲 20 秒！', '#ff7adf', 5);
    DRG.audio.sfx('alarm');
  };

  Mission.prototype.onDorettaDestroyed = function () {
    if (this.state === 'failed' || this.state === 'success') return;
    this.state = 'failed';
    this.failReason = '朵蕾妲被摧毁 · DRILLDOZER LOST';
    this.toast('朵蕾妲被摧毁了……任务失败', '#ff5a4a', 5);
    DRG.audio.stopAmbience();
  };

  Mission.prototype.winEscort = function () {
    if (this.state !== 'play' || !this.doretta) return;
    this.doretta.state = 'done';
    this.objectiveDone = true;
    this.state = 'success';
    this.stats.credits += 420 * this.hazard.credit;
    this.stats.xp += 520 * this.hazard.xp;
    this.mc('完成！奥魔兰心石，我们来了！', 'mc_complete_1');
    DRG.audio.clipOf(['salute_1', 'salute_2', 'salute_3'], 0.9, true);
    DRG.audio.stopAmbience();
  };

  /** 护送导演：25/50/75% 进度虫潮 + 零散爬虫 + 终点心石防守 */
  Mission.prototype.escortDirector = function (dt) {
    var d = this.doretta;
    if (!d) return;
    var marks = [0.25, 0.5, 0.75];
    while (this.waveMark < marks.length && d.progress >= marks[this.waveMark]) {
      this.waveMark++;
      this.spawnWave(1.15, true);
    }
    this.ambientCd -= dt;
    if (this.ambientCd <= 0) {
      this.ambientCd = 15 / this.hazard.rate;
      if (this.enemies.length < 24) {
        var rng = DRG.RNG((this.time * 1000) | 0);
        var s = this.pickEscortSpawnSpot(rng);
        if (s) this.spawnEnemy(rng.chance(0.3) ? 'swarmer' : 'grunt', s.x, s.y);
      }
    }
    if (d.state === 'hold' && this.state === 'play') {
      this.defenseT -= dt;
      var waveAt = [17, 7];                 // 剩 17s 与 7s 各压上一波
      while (this.defenseWave < waveAt.length && this.defenseT <= waveAt[this.defenseWave]) {
        this.defenseWave++;
        this.spawnWave(1.35, true);
      }
      if (this.defenseT <= 0) this.winEscort();
    }
  };

  /** 虫子在朵蕾妲附近的地面出生 */
  Mission.prototype.pickEscortSpawnSpot = function (rng) {
    var d = this.doretta, w = this.world;
    for (var i = 0; i < 60; i++) {
      var f = w.floors[rng.int(0, w.floors.length - 1)];
      if (!f) return null;
      var dd = M.dist(f.tx * T, f.ty * T, d.x, d.y);
      if (dd < 240 || dd > 1100) continue;
      return { x: f.tx * T + T / 2, y: f.ty * T + T };
    }
    return null;
  };

  /* ---------------- point / salv：定点提取 + 搜救行动 ---------------- */

  /** 在地板点位里挑 count 个：距出生点 minD~maxD、彼此至少 apart（距离逐轮放宽兜底） */
  Mission.prototype.pickFarFloors = function (rng, count, minD, maxD, apart) {
    var floors = this.world.floors.slice();
    rng.shuffle(floors);
    var sx = this.world.start.tx * T, sy = this.world.start.ty * T;
    var out = [];
    for (var pass = 0; pass < 3 && out.length < count; pass++) {
      var mn = minD / (pass + 1), ap = apart / (pass + 1), mx = pass === 0 ? maxD : 0;
      for (var i = 0; i < floors.length && out.length < count; i++) {
        var f = floors[i], fx = f.tx * T + T / 2, fy = f.ty * T + T;
        var d = M.dist(fx, fy, sx, sy);
        if (d < mn) continue;
        if (mx && d > mx) continue;
        var ok = true;
        for (var j = 0; j < out.length; j++) if (M.dist(fx, fy, out[j].x, out[j].y) < ap) { ok = false; break; }
        if (ok) out.push({ x: fx, y: fy });
      }
    }
    return out;
  };

  /** 玩家按住攻击时命中的可钻采大矿结（定点提取） */
  Mission.prototype.drillVeinAt = function (p) {
    if (!this.isPoint || p.carriedItem || p.downed) return null;
    for (var i = 0; i < this.beacons.length; i++)
      if (this.beacons[i].canDrill(p)) return this.beacons[i];
    return null;
  };

  /** 钻采完成：矿块从矿结里蹦出来 */
  Mission.prototype.spawnChunk = function (x, y) {
    var c = new DRG.OreChunk(x, y);
    this.props.push(c);
    this.fx.burst(x, y, 18, { col: ['#7fd4ff', '#c8ecff', '#ffffff'], speed: 220, life: 0.6, kind: 1 });
    DRG.audio.clipOf(['lootbug', 'rns_5'], 0.5, true);
    this.toast('采出矿块！按 E 扛起来（只能用副手武器）', '#7fd4ff', 3);
    return c;
  };

  /** E 键的定点提取交互：入库 > 拾取矿块 */
  Mission.prototype.pointInteract = function () {
    var p = this.player;
    if (p.carriedItem && p.carriedItem.kind === 'chunk' && this.mule.canDeposit(p)) {
      this.depositChunk(p.carriedItem);
      return true;
    }
    if (!p.carriedItem && !p.carriedCan) {
      var best = null, bd = 56;
      for (var i = 0; i < this.props.length; i++) {
        var pr = this.props[i];
        if (!(pr instanceof DRG.OreChunk) || pr.state !== 'idle') continue;
        var d = M.dist(pr.x, pr.y, p.x, p.y);
        if (d < bd) { bd = d; best = pr; }
      }
      if (best) {
        best.state = 'carried';
        p.carriedItem = best;
        p.toolSelected = false;
        this.toast('扛起矿块 · 搬回莫莉处按 E 入库', '#7fd4ff', 2.5);
        DRG.audio.sfx('beep');
        return true;
      }
    }
    return false;
  };

  /** 矿块入库 +1 → 一小波虫潮 → 配额达成自动召pod */
  Mission.prototype.depositChunk = function (chunk) {
    var p = this.player;
    p.carriedItem = null;
    chunk.state = 'spent';
    this.chunksDeposited++;
    this.deposited.morkite += 1;
    this.stats.deposits++;
    this.stats.credits += 26 * this.hazard.credit;
    this.stats.xp += 30 * this.hazard.xp;
    this.mule.flash = 1;
    this.fx.text(this.mule.x, this.mule.y - 50, '入库 ' + this.chunksDeposited + ' / ' + this.pointQuota, '#7fd4ff', 16);
    DRG.audio.sfx('deposit');
    DRG.audio.clipOf(['rns_4', 'rns_5', 'rns_6'], 0.55, true);
    this.spawnWaveAt(this.mule.x, this.mule.y, 0.85);   // 每入库 1 块触发一小波虫潮
    this.checkObjectivePoint();
  };

  Mission.prototype.checkObjectivePoint = function () {
    if (this.objectiveDone || this.chunksDeposited < this.pointQuota) return;
    this.objectiveDone = true;
    this.mc('定点提取完成！矿块全部入库，撤离飞船正在赶来。', 'mc_objective_1');
    this.toast('配额达成 · 撤离飞船已呼叫', '#7fff9a', 6);
    DRG.audio.clipOf(['salute_1', 'salute_2', 'salute_3'], 0.9, true);
    this.stats.credits += 250 * this.hazard.credit;
    this.stats.xp += 320 * this.hazard.xp;
    this.callPod();
  };

  /** E 键的搜救交互：安装矿骡腿 > 拾起矿骡腿（修复走 salvDirector 的长按） */
  Mission.prototype.salvInteract = function () {
    var p = this.player;
    if (this.wreck && p.carriedItem && p.carriedItem.kind === 'leg' && this.wreck.canInstall(p)) {
      this.wreck.install(p, this);
      this.spawnWaveAt(this.wreck.x, this.wreck.y, 0.9);   // 每装 1 条刷一小波防御虫
      return true;
    }
    if (!p.carriedItem && !p.carriedCan) {
      var best = null, bd = 56;
      for (var i = 0; i < this.props.length; i++) {
        var pr = this.props[i];
        if (!(pr instanceof DRG.MuleLeg) || pr.state !== 'idle') continue;
        var d = M.dist(pr.x, pr.y, p.x, p.y);
        if (d < bd) { bd = d; best = pr; }
      }
      if (best) {
        best.state = 'carried';
        p.carriedItem = best;
        p.toolSelected = false;
        this.toast('扛起矿骡腿 · 送到矿骡残骸处按 E 安装', '#b0ff7a', 2.5);
        DRG.audio.sfx('beep');
        return true;
      }
    }
    return false;
  };

  /** 搜救导演：长按修复（松开保留进度）+ 修复期持续刷防御虫 */
  Mission.prototype.salvDirector = function (dt) {
    var w = this.wreck;
    if (!w || this.state !== 'play') return;
    var p = this.player;
    if (w.state === 'ready') {
      var holding = DRG.input.key('KeyE') && w.canRepair(p);
      w.repair(dt, holding, this);
      if (w.repairing) {
        this.repairWaveT -= dt;
        if (this.repairWaveT <= 0) {
          this.repairWaveT = 6.5 / this.hazard.rate;
          this.spawnWaveAt(w.x, w.y, 0.8);              // 修复期间持续刷虫
          this.toast('防御虫涌向矿骡——顶住！', '#ff5a4a', 2.5);
        }
      }
    }
    if (w.repairing) this.shake(0.6, 0.04);
  };

  /** 修复完成 → 自动呼叫撤离 */
  Mission.prototype.onWreckRepaired = function () {
    if (this.state !== 'play') return;
    this.mc('矿骡修好了！她能自己走回降落区——我们撤！');
    this.toast('矿骡已修复 · 撤离飞船已呼叫', '#7fff9a', 6);
    DRG.audio.clipOf(['salute_1', 'salute_2', 'salute_3'], 0.9, true);
    this.stats.credits += 300 * this.hazard.credit;
    this.stats.xp += 380 * this.hazard.xp;
    this.objectiveDone = true;
    this.callPod();
  };

  /** 小股虫潮：以 (x,y) 为中心（入库/安装/修复的定向压力） */
  Mission.prototype.spawnWaveAt = function (x, y, mul) {
    var spawned = this.spawnWave(mul || 1, false, { x: x, y: y });
    if (!spawned) this.spawnWave(mul || 1);             // 中心附近没地板就退回常规潮
  };

  /* ---------------- refi：就地精炼 ---------------- */

  /** 泵产油汇总：每口泵独立产出，向精炼单元记账 */
  Mission.prototype.addOil = function (amount, well) {
    if (this.state !== 'play' || this.objectiveDone) return;
    var before = this.oilRefined;
    this.oilRefined = Math.min(this.oilQuota, this.oilRefined + amount);
    if (well) well.flow = this.oilRefined;
    if (this.refinery && Math.floor(this.oilRefined) > Math.floor(before)) {
      this.refinery.flash = 1;                          // 一单位原油到账的闪亮
    }
    this.checkObjectiveRefi();
  };

  Mission.prototype.checkObjectiveRefi = function () {
    if (this.objectiveDone || this.oilRefined < this.oilQuota) return;
    this.objectiveDone = true;
    this.mc('精炼配额达成！原油全部入罐，撤离飞船正在赶来。', 'mc_objective_1');
    this.toast('配额达成 · 撤离飞船已呼叫', '#7fff9a', 6);
    DRG.audio.clipOf(['salute_1', 'salute_2', 'salute_3'], 0.9, true);
    this.stats.credits += 280 * this.hazard.credit;
    this.stats.xp += 340 * this.hazard.xp;
    this.callPod();
  };

  /** E 键的就地精炼交互：铺管装泵 > 领取管道段（修泵走 refiDirector 的长按） */
  Mission.prototype.refiInteract = function () {
    var p = this.player, i, well;
    if (p.carriedItem && p.carriedItem.kind === 'pipe') {
      for (i = 0; i < this.wells.length; i++) {
        well = this.wells[i];
        if (well.canInstall(p)) return well.install(p, this);
      }
      return false;
    }
    if (!p.carriedItem && !p.carriedCan && this.refinery && this.refinery.canTakePipe(p)) {
      return this.refinery.takePipe(p, this);
    }
    return false;
  };

  /** 精炼导演：停摆泵的长按修理 + 周期性啃泵虫潮（压力压向泵，不压向玩家） */
  Mission.prototype.refiDirector = function (dt) {
    var p = this.player, i, well;
    for (i = 0; i < this.wells.length; i++) {
      well = this.wells[i];
      if (well.state === 'broken') {
        var holding = DRG.input.key('KeyE') && well.canRepair(p);
        well.repair(dt, holding, this);
      }
    }
    // 泵运营压力：每 26/危险系数 秒对一口运转中的泵刷一小波虫
    this.pumpSiegeT = (this.pumpSiegeT || 14) - dt;
    if (this.pumpSiegeT <= 0) {
      this.pumpSiegeT = 26 / this.hazard.rate;
      var pumping = [];
      for (i = 0; i < this.wells.length; i++) if (this.wells[i].state === 'pumping') pumping.push(this.wells[i]);
      if (pumping.length) {
        var target = pumping[(Math.random() * pumping.length) | 0];
        this.spawnWaveAt(target.x, target.y, 0.85);
        this.toast('警报：虫群扑向油井的泵！', '#ff5a4a', 3);
      }
    }
  };

  /** 虫潮目标权重（enemies.js 调用）：运转中的泵 > 玩家 */
  Mission.prototype.refiPrey = function (e) {
    if (!this.isRefi) return null;
    var best = null, bd = 560;
    for (var i = 0; i < this.wells.length; i++) {
      var well = this.wells[i];
      if (well.state !== 'pumping') continue;
      var d = M.dist(e.x, e.y, well.x, well.y - 20);
      if (d < bd) { bd = d; best = well; }
    }
    if (!best) return null;
    if (e._preyBias == null) e._preyBias = Math.random();
    return (bd < 300 || e._preyBias < 0.7)
      ? { x: best.x, y: best.y - 20, pump: best }
      : null;
  };


  /* ---------------- objectives ---------------- */
  Mission.prototype.deposit = function () {
    var p = this.player, any = 0, credits = 0;
    for (var k in p.carry) {
      var n = p.carry[k];
      if (!n) continue;
      any += n;
      this.deposited[k] += n;
      if (k === 'nitra') this.nitraBank += n;
      credits += n * DRG.ORE_INFO[k].value;
      p.carry[k] = 0;
    }
    if (!any) { this.toast('背包是空的', '#9aa4b0', 1.2); return; }
    this.stats.deposits++;
    this.stats.credits += credits * this.hazard.credit;
    this.mule.flash = 1;
    DRG.audio.sfx('deposit');
    this.fx.text(this.mule.x, this.mule.y - 46, '存入 ' + any + ' 单位', '#7fff9a', 16);
    DRG.audio.clipOf(['rns_4', 'rns_5', 'rns_6'], 0.55, true);
    this.checkObjective();
  };

  Mission.prototype.checkObjective = function () {
    if (this.objectiveDone || this.isEscort || this.isPoint || this.isSalv || this.isRefi || this.isElim) return;
    if (this.deposited.morkite >= this.quota) {
      this.objectiveDone = true;
      this.mc('主要目标完成！莫尔凯特配额已达成，按 R 呼叫撤离飞船。', 'mc_objective_1');
      this.toast('主要目标完成 · 按 R 呼叫飞船', '#7fff9a', 6);
      DRG.audio.clipOf(['salute_1', 'salute_2', 'salute_3'], 0.9, true);
      this.stats.credits += 250 * this.hazard.credit;
      this.stats.xp += 320 * this.hazard.xp;
    }
  };

  Mission.prototype.callResupply = function () {
    if (this.nitraBank < 80) { this.toast('硝石不足：需要 80（当前 ' + Math.floor(this.nitraBank) + '）', '#ff8a5a'); return; }
    var spot = this.findStandSpotNear(this.player.x, this.player.y - 10, 6);
    if (!spot) { this.toast('这里没有空间投放补给舱', '#ff8a5a'); return; }
    this.nitraBank -= 80;
    this.props.push(new DRG.Ent.Resupply(spot.x, spot.y));
    this.mc('补给舱已发射，注意上方。', 'mc_resupply');
    DRG.audio.clipOf(['dwarf_resupply_1', 'dwarf_resupply_2'], 0.9, true);
  };

  Mission.prototype.callPod = function () {
    if (!this.objectiveDone || this.podCalled) return;
    var spot = this.findStandSpotNear(this.player.x, this.player.y - 10, 10) || { x: this.player.x, y: this.player.y };
    this.podCalled = true;
    this.state = 'extract';
    this.escapeTime = 180;
    this.pod = new DRG.Ent.DropPod(spot.x, spot.y);
    this.mc('撤离飞船正在下降！全速返回，虫子已经闻到你了！', 'mc_pod_arrived');
    this.toast('撤离倒计时开始 · 快跑！', '#ff8a3a', 5);
    DRG.audio.sfx('alarm');
    this.spawnWave(2.2);
  };

  Mission.prototype.board = function () {
    if (this.state !== 'extract' || !this.pod || this.pod.state !== 'landed') return;
    this.pod.state = 'launching';
    this.state = 'success';
    this.stats.credits += 400 * this.hazard.credit;
    this.stats.xp += 500 * this.hazard.xp;
    DRG.audio.clipOf(['mc_complete_1', 'mc_complete_2'], 1, true);
    setTimeout(function () { DRG.audio.clipOf(['rns_1', 'rns_2', 'rns_3', 'rns_4'], 1, true); }, 1400);
    DRG.audio.stopAmbience();
  };

  /* ---------------- wave director ---------------- */
  /** center：可选的虫潮中心（spawnWaveAt 用），near=true 时默认绕朵蕾妲 */
  Mission.prototype.spawnWave = function (mul, near, center) {
    mul = mul || 1;
    this.waveNo++;
    this.stats.waves++;
    var haz = this.hazard;
    var alive = 0;
    for (var q = 0; q < this.enemies.length; q++) if (!this.enemies[q].passive) alive++;
    var budget = (7 + this.waveNo * 2.2) * haz.rate * mul * M.clamp(1 - alive / 55, 0.25, 1);
    var pool = [['swarmer', 0.6], ['grunt', 2]];
    if (this.waveNo >= 2 || haz.lv >= 3) pool.push(['exploder', 2.4]);
    if (this.waveNo >= 2) pool.push(['mactera', 3]);
    if (this.waveNo >= 3 || haz.lv >= 4) pool.push(['guard', 4]);
    if (this.waveNo >= 4 && haz.lv >= 3) pool.push(['praetorian', 9]);
    if (this.waveNo >= 5 && haz.lv >= 4) pool.push(['breeder', 8]);

    var rng = DRG.RNG((this.seed + this.waveNo * 977) | 0);
    var spawned = 0, guard = 0;
    while (budget > 0 && guard++ < 200) {
      var pick = pool[rng.int(0, pool.length - 1)];
      if (pick[1] > budget + 1) continue;
      var spot = this.pickSpawnSpot(rng, pick[0] === 'mactera' || pick[0] === 'breeder', near, center);
      if (!spot) break;
      this.spawnEnemy(pick[0], spot.x, spot.y);
      budget -= pick[1];
      spawned++;
    }
    if (spawned) {
      DRG.audio.clipOf(['swarm_detect_1', 'swarm_detect_2'], 0.85, true);
      this.toast('警报：虫潮来袭！(第 ' + this.waveNo + ' 波)', '#ff5a4a', 4);
      this.mc('检测到大量生物信号 — 一大波虫子正在靠近！');
      DRG.audio.sfx('alarm');
    }
    this.nextWave = (this.state === 'extract' ? 26 : 68 + Math.random() * 34) / haz.rate;
    return spawned;
  };

  Mission.prototype.pickSpawnSpot = function (rng, flying, near, center) {
    var p = center || ((near && this.doretta) ? this.doretta : this.player), w = this.world;
    for (var i = 0; i < 90; i++) {
      var f = w.floors[rng.int(0, w.floors.length - 1)];
      if (!f) return null;
      var d = M.dist(f.tx * T, f.ty * T, p.x, p.y);
      if (d < 300 || d > 1500) continue;
      return { x: f.tx * T + T / 2, y: f.ty * T + T - (flying ? 40 : 0) };
    }
    return null;
  };

  /* ---------------- update ---------------- */
  Mission.prototype.update = function (dt, view) {
    var i, list;
    this.time += dt;
    if (this.state === 'intro') {
      // brief drop-in: pod already delivered the dwarf, just settle the camera
      if (this.time > 0.9) { this.state = 'play'; }
    }

    var playing = this.state === 'play' || this.state === 'extract';
    if (playing && this.hints.length && this.time >= this.hints[0].t) {
      var hint = this.hints.shift();
      this.toast(hint.text, hint.col, 6);
    }
    if (playing) {
      this.player.update(dt, this);
      this.bosco.update(dt, this);
      this.mule.update(dt, this);
      if (this.doretta && this.state === 'play') this.doretta.update(dt, this);
      for (i = 0; i < this.beacons.length; i++) this.beacons[i].update(dt, this);
      for (i = 0; i < this.salvBeacons.length; i++) this.salvBeacons[i].update(dt, this);
      if (this.wreck) this.wreck.t += dt;
      if (this.isSalv) this.salvDirector(dt);
      if (this.refinery) this.refinery.update(dt, this);
      for (i = 0; i < this.wells.length; i++) this.wells[i].update(dt, this);
      if (this.shield && this.shield.life <= 0) this.shield = null;

      // interactions
      var I = DRG.input;
      if (I.hit('KeyE')) {
        if (this.pod && this.pod.canBoard(this.player)) this.board();
        else if (this.isEscort && this.escortInteract()) { /* 油罐拾取 / 加油 */ }
        else if (this.isPoint && this.pointInteract()) { /* 矿块入库 / 拾取 */ }
        else if (this.isSalv && this.salvInteract()) { /* 安装 / 拾起矿骡腿 */ }
        else if (this.isRefi && this.refiInteract()) { /* 铺管装泵 / 领取管道段 */ }
        else if (this.mule.canDeposit(this.player)) this.deposit();
        else {
          var used = false;
          for (i = 0; i < this.props.length; i++) {
            var pr = this.props[i];
            if (pr instanceof DRG.Ent.Resupply && pr.canUse(this.player)) {
              pr.uses--;
              var p = this.player;
              p.ammo[0] = DRG.WEAPONS[p.weapons[0]].ammo;
              p.ammo[1] = DRG.WEAPONS[p.weapons[1]].ammo;
              p.mag[0] = DRG.WEAPONS[p.weapons[0]].mag;
              p.mag[1] = DRG.WEAPONS[p.weapons[1]].mag;
              p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.45);
              p.flares = p.maxFlares; p.grenades = p.maxGrenades;
              p.toolCharges = p.cls.tool.charges;
              if (p.cls.extra) p.extraCharges = p.cls.extra.charges;
              this.toast('已补给：弹药 / 装备 / 生命', '#8ad4ff', 3);
              DRG.audio.sfx('uibig');
              used = true;
              break;
            }
          }
          if (!used && this.mule.canDeposit(this.player)) this.deposit();
        }
      }
      if (I.hit('KeyR') && !this.isEscort && this.objectiveDone && !this.podCalled) this.callPod();
      if (I.hit('KeyV')) this.callResupply();
      if (I.hit('KeyT')) {
        this.mule.state = 'called';
        this.mule.lost = 3.2;                       // she will reroute if she cannot walk it
        this.toast('已呼叫 M.U.L.E.（莫莉）过来', '#8ad4ff', 2);
        DRG.audio.sfx('beep');
      }
      if (I.hit('KeyQ') && I.key('ShiftLeft', 'ShiftRight')) this.commandBosco();

      // director
      if (this.isEscort && this.state === 'play') {
        this.escortDirector(dt);
      } else if (this.state === 'play') {
        if (this.isRefi) this.refiDirector(dt);
        this.nextWave -= dt;
        if (this.nextWave <= 0 && this.time > 25) this.spawnWave();
        this.ambientCd -= dt;
        if (this.ambientCd <= 0) {
          this.ambientCd = 16 / this.hazard.rate;
          if (this.enemies.length < 24) {
            var rng = DRG.RNG((this.time * 1000) | 0);
            var s = this.pickSpawnSpot(rng, false);
            if (s) this.spawnEnemy(rng.chance(0.25) ? 'swarmer' : 'grunt', s.x, s.y);
          }
        }
      } else if (this.state === 'extract') {
        this.escapeTime -= dt;
        this.nextWave -= dt;
        if (this.nextWave <= 0) this.spawnWave(1.4);
        if (this.escapeTime <= 0) {
          this.state = 'failed';
          this.failReason = '错过撤离窗口 · LEFT BEHIND';
          if (this.pod) this.pod.state = 'launching';
          DRG.audio.stopAmbience();
        }
        if (this.escapeTime < 11 && Math.floor(this.escapeTime) !== Math.floor(this.escapeTime + dt)) DRG.audio.sfx('beep');
      }
    }

    /* stuck insurance: a dwarf boxed in by unbreakable rock gets relocated */
    if (playing && !this.player.downed) {
      var pl = this.player;
      if (M.dist(pl.x, pl.y, this._lastPx || pl.x, this._lastPy || pl.y) > 34) {
        this._lastPx = pl.x; this._lastPy = pl.y; this._stillT = 0;
      } else {
        this._stillT = (this._stillT || 0) + dt;
        if (this._stillT > 22) {
          this._stillT = 0;
          var esc = this.findStandSpotNear(pl.x, pl.y - 40, 9);
          if (esc && M.dist(esc.x, esc.y, pl.x, pl.y) > 8) {
            pl.x = esc.x; pl.y = esc.y; pl.vx = pl.vy = 0;
            this.world.digCircle(pl.x, pl.y - 16, 34, 400, this.tileFx);
            this.toast('岩层塌方 — 你被推到了一处空腔', '#ffb03c', 3);
          }
        }
      }
    }

    /* forget bugs that wandered far away: keeps swarms and the frame budget sane */
    this.cullTimer = (this.cullTimer || 0) - dt;
    if (this.cullTimer <= 0) {
      this.cullTimer = 4;
      for (i = this.enemies.length - 1; i >= 0; i--) {
        var en = this.enemies[i];
        if (M.dist(en.x, en.y, this.player.x, this.player.y) > 2400) this.enemies.splice(i, 1);
      }
    }

    /* entity lists */
    this.updateList(this.enemies, dt);
    this.updateList(this.bullets, dt);
    this.updateList(this.pickups, dt);
    this.updateList(this.flares, dt);
    this.updateList(this.props, dt);
    if (this.pod) this.pod.update(dt, this);
    this.fx.update(dt, this.world);

    for (i = this.toasts.length - 1; i >= 0; i--) {
      this.toasts[i].t += dt;
      if (this.toasts[i].t > this.toasts[i].life) this.toasts.splice(i, 1);
    }
    if (this.mcLine) { this.mcLine.t += dt; if (this.mcLine.t > this.mcLine.life) this.mcLine = null; }
    if (this.muzzle) { this.muzzle.t -= dt; if (this.muzzle.t <= 0) this.muzzle = null; }

    this.updateCamera(dt, view);
  };

  Mission.prototype.updateList = function (list, dt) {
    for (var i = list.length - 1; i >= 0; i--) {
      var alive = true;
      try { alive = list[i].update(dt, this); } catch (e) { console.error(e); alive = false; }
      if (!alive) list.splice(i, 1);
    }
  };

  Mission.prototype.commandBosco = function () {
    var p = this.player;
    var hit = this.world.ray(p.x, p.y - 18, Math.cos(p.aim), Math.sin(p.aim), 700);
    if (hit.hit && DRG.ORE_OF[this.world.at(hit.tx, hit.ty)]) {
      this.bosco.commandMine(hit.tx, hit.ty);
      this.toast('BOSCO：正在开采标记的矿石', '#7ad7ff', 2);
      DRG.audio.sfx('beep');
    } else {
      this.toast('用准星指向矿石后再按 Shift+Q', '#9aa4b0', 2);
    }
  };

  Mission.prototype.updateCamera = function (dt, view) {
    var cam = this.cam, p = this.player;
    cam.w = view.w; cam.h = view.h;
    var lookX = M.clamp((DRG.input.mx - view.w / 2) * 0.28, -190, 190);
    var lookY = M.clamp((DRG.input.my - view.h / 2) * 0.22, -140, 140);
    var tx = p.x - view.w / 2 + lookX;
    var ty = p.y - 20 - view.h / 2 + lookY;
    cam.x = M.damp(cam.x, tx, 7, dt);
    cam.y = M.damp(cam.y, ty, 7, dt);
    cam.x = M.clamp(cam.x, 0, this.world.w * T - view.w);
    cam.y = M.clamp(cam.y, 0, this.world.h * T - view.h);
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      var a = this.shakeAmt * Math.min(1, this.shakeT * 4);
      cam.sx = (Math.random() - 0.5) * a; cam.sy = (Math.random() - 0.5) * a;
      this.shakeAmt *= (1 - 3 * dt);
    } else { cam.sx = cam.sy = 0; this.shakeAmt = 0; }
    // cursor in world space for aiming
    DRG.input.wx = DRG.input.mx + cam.x; DRG.input.wy = DRG.input.my + cam.y;
  };

  /* ---------------- draw ---------------- */
  Mission.prototype.draw = function (g, view) {
    var cam = { x: Math.round(this.cam.x + this.cam.sx), y: Math.round(this.cam.y + this.cam.sy), w: view.w, h: view.h };
    var i;

    /* parallax cave backdrop */
    var isEscort = this.type === 'escort';
    g.fillStyle = this.biome.fog;
    g.fillRect(0, 0, view.w, view.h);
    var art = A().get(this.biome.art);
    if (art && art.width) {
      var scale = Math.max(view.w / art.width, view.h / art.height) * 1.35;
      var bw = art.width * scale, bh = art.height * scale;
      var px = -((cam.x * 0.22) % bw), py = -M.clamp(cam.y * 0.06, 0, Math.max(0, bh - view.h));
      g.save();
      g.globalAlpha = isEscort ? 0.32 : 0.5;   /* 护送走廊更暗：衬出实体（用户实录：模型发虚） */
      for (var bx = px; bx < view.w; bx += bw) g.drawImage(art, bx, py, bw, bh);
      g.globalAlpha = 1;
      g.fillStyle = 'rgba(0,0,0,' + (isEscort ? 0.58 : 0.45) + ')';
      g.fillRect(0, 0, view.w, view.h);
      g.restore();
    }

    this.world.draw(g, cam);

    /* 精炼管线（画在实体之下：地面线段 + 节点圈 + 流动脉冲） */
    if (this.wells.length) this.drawRefiPipes(g, cam);

    /* entities */
    for (i = 0; i < this.pickups.length; i++) this.pickups[i].draw(g, cam);
    for (i = 0; i < this.flares.length; i++) this.flares[i].draw(g, cam);
    for (i = 0; i < this.props.length; i++) this.props[i].draw(g, cam);
    for (i = 0; i < this.beacons.length; i++) this.beacons[i].draw(g, cam);
    for (i = 0; i < this.salvBeacons.length; i++) this.salvBeacons[i].draw(g, cam);
    if (this.wreck) this.wreck.draw(g, cam);
      if (this.refinery) this.refinery.draw(g, cam);
      for (i = 0; i < this.wells.length; i++) this.wells[i].draw(g, cam);
      this.mule.draw(g, cam);
    if (this.doretta) this.doretta.draw(g, cam);
    if (this.pod) this.pod.draw(g, cam);
    for (i = 0; i < this.enemies.length; i++) this.enemies[i].draw(g, cam);
    this.bosco.draw(g, cam);
    this.player.draw(g, cam);
    if (this.player.carriedCan) this.player.carriedCan.draw(g, cam);   // 头顶燃料罐盖在玩家之上
    if (this.player.carriedItem) this.player.carriedItem.draw(g, cam); // 头顶矿块 / 矿骡腿
    for (i = 0; i < this.bullets.length; i++) this.bullets[i].draw(g, cam);
    this.fx.draw(g, cam);

    /* lighting */
    var ambient = 0.085 + 0.07 * (1 - DRG.opts().darkness);
    if (this.isSalv) ambient *= 0.7;            // 搜救：环境光再压 30%
    DRG.light.begin(view.w, view.h, ambient, this.biome.tint);
    this.player.lights(cam, this);
    this.bosco.lights(cam);
    this.mule.lights(cam);
    if (this.doretta) this.doretta.lights(cam);
    for (i = 0; i < this.beacons.length; i++) this.beacons[i].lights(cam);
    for (i = 0; i < this.salvBeacons.length; i++) this.salvBeacons[i].lights(cam);
    if (this.wreck && this.wreck.lights) this.wreck.lights(cam);
    if (this.refinery) this.refinery.lights(cam);
    for (i = 0; i < this.wells.length; i++) this.wells[i].lights(cam);
    for (i = 0; i < this.flares.length; i++) this.flares[i].lights(cam);
    for (i = 0; i < this.pickups.length; i++) this.pickups[i].lights(cam);
    for (i = 0; i < this.props.length; i++) if (this.props[i].lights) this.props[i].lights(cam);
    for (i = 0; i < this.bullets.length; i++) this.bullets[i].lights(cam);
    for (i = 0; i < this.enemies.length; i++) if (this.enemies[i].lights) this.enemies[i].lights(cam);
    if (this.pod) this.pod.lights(cam);
    this.fx.emitLights(cam);
    this.drawOreGlow(cam);
    DRG.light.end(g, view.w, view.h);

    /* additive extras that should punch through the darkness */
    this.drawBeamPass(g, cam);
    this.fx.drawText(g, cam);
    this.drawMarkers(g, cam, view);
  };

  /** 信标光柱附加通道（point 富矿信标 / salv 信号信标 / refi 未装泵油井）——盖在黑暗之上，远处可见 */
  Mission.prototype.drawBeamPass = function (g, cam) {
    var i;
    if (this.isPoint || this.isSalv) {
      var list = this.isPoint ? this.beacons : this.salvBeacons;
      for (i = 0; i < list.length; i++) list[i].beam(g, cam);
    }
    if (this.isRefi) {
      for (i = 0; i < this.wells.length; i++) if (this.wells[i].beam) this.wells[i].beam(g, cam);
    }
  };

  /** 精炼管线：井→精炼单元的地面线段 + 节点圈 + 泵运转时的流动脉冲（纯视觉） */
  Mission.prototype.drawRefiPipes = function (g, cam) {
    for (var i = 0; i < this.wells.length; i++) {
      var well = this.wells[i];
      if (!well.pipe) continue;
      var p = well.pipe;
      var x1 = p.x1 - cam.x, y1 = p.y1 - cam.y, x2 = p.x2 - cam.x, y2 = p.y2 - cam.y;
      var len = M.dist(p.x1, p.y1, p.x2, p.y2);
      var ang = Math.atan2(y2 - y1, x2 - x1);
      var live = well.state === 'pumping';

      g.save();
      // 外壳
      g.strokeStyle = '#3c414b'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      // 内芯（运转时流动的墨菱油辉光）
      g.strokeStyle = live ? '#3ad98a' : '#565d69'; g.lineWidth = 2.4;
      g.globalAlpha = live ? 0.9 : 0.6;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.restore();

      // 节点圈（每 ~64px 一枚）
      var n = Math.max(1, Math.round(len / 64));
      for (var k = 1; k < n; k++) {
        var nx = x1 + (x2 - x1) * k / n, ny = y1 + (y2 - y1) * k / n;
        g.save();
        g.fillStyle = '#2a3038';
        g.beginPath(); g.arc(nx, ny, 4.6, 0, 6.283); g.fill();
        g.strokeStyle = live ? '#3ad98a' : '#7f8a96'; g.lineWidth = 1.6;
        g.beginPath(); g.arc(nx, ny, 4.6, 0, 6.283); g.stroke();
        g.restore();
      }

      // 流动脉冲：一单位油沿管线滚回精炼单元
      if (live) {
        var prog = (well.flow % 4) / 4;                 // 每 4 秒一脉冲
        var px = x1 + (x2 - x1) * prog, py = y1 + (y2 - y1) * prog;
        g.save();
        g.globalCompositeOperation = 'lighter';
        var grd = g.createRadialGradient(px, py, 0, px, py, 10);
        grd.addColorStop(0, 'rgba(120,255,180,0.95)');
        grd.addColorStop(1, 'rgba(120,255,180,0)');
        g.fillStyle = grd;
        g.beginPath(); g.arc(px, py, 10, 0, 6.283); g.fill();
        g.restore();
      }
    }
  };

  /** exposed mineral tiles twinkle in the dark, DRG's best navigation cue */
  Mission.prototype.drawOreGlow = function (cam) {
    var gc = this.glowCache;
    gc.t -= 1 / 60;
    if (gc.t <= 0) {
      gc.t = 0.25;
      gc.list.length = 0;
      var w = this.world;
      var tx0 = Math.floor(cam.x / T) - 1, tx1 = Math.floor((cam.x + cam.w) / T) + 1;
      var ty0 = Math.floor(cam.y / T) - 1, ty1 = Math.floor((cam.y + cam.h) / T) + 1;
      for (var ty = ty0; ty <= ty1 && gc.list.length < 46; ty++) {
        for (var tx = tx0; tx <= tx1 && gc.list.length < 46; tx++) {
          var t = w.at(tx, ty);
          var ore = DRG.ORE_OF[t];
          if (!ore) continue;
          if (w.at(tx - 1, ty) !== TT.EMPTY && w.at(tx + 1, ty) !== TT.EMPTY &&
              w.at(tx, ty - 1) !== TT.EMPTY && w.at(tx, ty + 1) !== TT.EMPTY) continue;
          gc.list.push({ x: tx * T + T / 2, y: ty * T + T / 2, c: DRG.hexRgb(DRG.ORE_INFO[ore].color) });
        }
      }
    }
    for (var i = 0; i < gc.list.length; i++) {
      var o = gc.list[i];
      var f = 0.36 + 0.1 * Math.sin(this.time * 3 + i);
      DRG.light.add(o.x - cam.x, o.y - cam.y, 74, f, o.c, 0.3);
    }
  };

  /** off-screen objective markers, like the DRG HUD pings */
  Mission.prototype.drawMarkers = function (g, cam, view) {
    var targets = [];
    if (this.doretta) {
      targets.push({ x: this.doretta.x, y: this.doretta.y - 30, col: '#ffb03c', label: '朵蕾妲' });
      if (this.player.carriedCan && !this.doretta.dead)
        targets.push({ x: this.doretta.fuelPort().x, y: this.doretta.fuelPort().y - 14, col: '#ffd76a', label: '油箱口' });
    } else {
      targets.push({ x: this.mule.x, y: this.mule.y - 20, col: '#8ad4ff', label: 'M.U.L.E.' });
      if (this.pod) targets.push({ x: this.pod.x, y: this.pod.y - 40, col: '#7fff9a', label: '撤离' });
      for (var i = 0; i < this.props.length; i++)
        if (this.props[i] instanceof DRG.Ent.Resupply) targets.push({ x: this.props[i].x, y: this.props[i].y - 20, col: '#ffd76a', label: '补给' });
      if (this.isPoint) {
        for (i = 0; i < this.beacons.length; i++) {
          var b = this.beacons[i];
          if (b.state === 'active') targets.push({ x: b.x, y: b.y - 46, col: '#7fd4ff', label: '富矿点' });
        }
      }
      if (this.isSalv && this.wreck) {
        for (i = 0; i < this.props.length; i++) {
          var leg = this.props[i];
          if (leg instanceof DRG.MuleLeg && leg.state === 'idle') targets.push({ x: leg.x, y: leg.y - 26, col: '#b0ff7a', label: '矿骡腿' });
        }
        if (this.wreck.state !== 'repaired' || this.player.carriedItem)
          targets.push({ x: this.wreck.x, y: this.wreck.y - 40, col: '#8ad4ff', label: '矿骡残骸' });
      }
      if (this.isRefi) {
        if (this.refinery) targets.push({ x: this.refinery.x, y: this.refinery.y - 66, col: '#8ad4ff', label: '精炼单元' });
        for (var rw = 0; rw < this.wells.length; rw++) {
          var well = this.wells[rw];
          if (well.state === 'dry') targets.push({ x: well.x, y: well.y - 66, col: '#ffd76a', label: '油井' });
          else if (well.state === 'broken') targets.push({ x: well.x, y: well.y - 66, col: '#ff5a4a', label: '泵停摆' });
        }
      }
    }

    for (i = 0; i < targets.length; i++) {
      var t = targets[i];
      var sx = t.x - cam.x, sy = t.y - cam.y;
      var inside = sx > 24 && sy > 24 && sx < view.w - 24 && sy < view.h - 24;
      g.save();
      if (inside) {
        g.globalAlpha = 0.85;
        g.strokeStyle = t.col; g.lineWidth = 2;
        g.beginPath(); g.moveTo(sx - 7, sy - 12); g.lineTo(sx, sy - 4); g.lineTo(sx + 7, sy - 12); g.stroke();
        gfx.text(g, t.label, sx, sy - 16, { size: 11, align: 'center', col: t.col, alpha: 0.9 });
      } else {
        var cx = view.w / 2, cy = view.h / 2;
        var a = Math.atan2(sy - cy, sx - cx);
        var rx = Math.min(view.w / 2 - 40, Math.abs(Math.cos(a)) > 0.001 ? Math.abs((view.w / 2 - 40) / Math.cos(a)) : 1e9);
        var ry = Math.min(view.h / 2 - 40, Math.abs(Math.sin(a)) > 0.001 ? Math.abs((view.h / 2 - 40) / Math.sin(a)) : 1e9);
        var r = Math.min(rx, ry);
        var mx = cx + Math.cos(a) * r, my = cy + Math.sin(a) * r;
        g.globalAlpha = 0.6;
        g.translate(mx, my); g.rotate(a);
        g.fillStyle = t.col;
        g.beginPath(); g.moveTo(9, 0); g.lineTo(-6, -6); g.lineTo(-6, 6); g.closePath(); g.fill();
      }
      g.restore();
    }
  };

  DRG.Mission = Mission;
})(window);
