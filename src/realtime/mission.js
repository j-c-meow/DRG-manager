/* ============================================================
   mission.js — one dive: world + entities + wave director +
   objectives + camera. Everything gameplay talks through here.
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M, gfx = DRG.gfx, T = DRG.CFG.TILE, TT = DRG.TT;
  var A = function () { return DRG.assets; };

  DRG.HAZARDS = [
    { lv: 1, name: '危险等级 1', dmgMul: 0.55, hpMul: 0.7, rate: 0.55, quota: 0.7, credit: 0.75, xp: 0.8 },
    { lv: 2, name: '危险等级 2', dmgMul: 0.8, hpMul: 0.9, rate: 0.8, quota: 0.85, credit: 1.0, xp: 1.0 },
    { lv: 3, name: '危险等级 3', dmgMul: 1.0, hpMul: 1.0, rate: 1.0, quota: 1.0, credit: 1.3, xp: 1.3 },
    { lv: 4, name: '危险等级 4', dmgMul: 1.3, hpMul: 1.35, rate: 1.35, quota: 1.15, credit: 1.7, xp: 1.7 },
    { lv: 5, name: '危险等级 5', dmgMul: 1.7, hpMul: 1.8, rate: 1.8, quota: 1.3, credit: 2.2, xp: 2.2 }
  ];

  function Mission(opt) {
    var self = this;
    this.opt = opt;
    this.biome = opt.biome;
    this.hazard = DRG.HAZARDS[M.clamp(opt.haz, 1, 5) - 1];
    this.seed = opt.seed;
    this.state = 'intro';               // intro | play | extract | success | failed
    this.time = 0;
    this.world = new DRG.World({ w: 400, h: 160, seed: opt.seed, biome: opt.biome });

    var st = this.world.start;
    this.player = new DRG.Player(opt.cls, st.tx * T + T / 2, st.ty * T);
    this.bosco = new DRG.Ent.Bosco(this.player.x - 40, this.player.y - 50);
    this.mule = new DRG.Ent.Mule(this.player.x + 70, this.player.y);

    this.enemies = []; this.bullets = []; this.pickups = []; this.flares = []; this.props = [];
    this.fx = new DRG.Particles(1500);
    this.pod = null; this.shield = null; this.muzzle = null;
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
    for (i = 0; i < Math.round(5 * this.hazard.rate) && floors.length; i++) {
      f = floors[rng.int(0, floors.length - 1)];
      if (M.dist(f.tx * T, f.ty * T, this.player.x, this.player.y) < 700) continue;
      this.spawnEnemy('grunt', f.tx * T + T / 2, f.ty * T + T);
    }

    // gentle onboarding: the controls that matter, spread over the first minute
    this.hints = [
      { t: 3.5, text: '按住鼠标右键对着岩壁挖掘 · 绿色晶体是莫尔凯特', col: '#3ad98a' },
      { t: 11, text: '洞穴很黑 — 按 F 扔出照明弹', col: '#ffb03c' },
      { t: 19, text: '矿石会自动进背包 · 走到莫莉 M.U.L.E. 旁按 E 存放（按 T 呼叫她）', col: '#8ad4ff' },
      { t: 27, text: '存够 80 硝石后按 V 呼叫补给舱 · 左键开火，Q 使用职业装备', col: '#ffd76a' },
      { t: 36, text: '贴着墙按空格可以蹬墙跳，爬出自己挖的竖井', col: '#c8a4ff' }
    ];

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
    if (this.objectiveDone) return;
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
  Mission.prototype.spawnWave = function (mul) {
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
      var spot = this.pickSpawnSpot(rng, pick[0] === 'mactera' || pick[0] === 'breeder');
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
  };

  Mission.prototype.pickSpawnSpot = function (rng, flying) {
    var p = this.player, w = this.world;
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
      if (this.shield && this.shield.life <= 0) this.shield = null;

      // interactions
      var I = DRG.input;
      if (I.hit('KeyE')) {
        if (this.pod && this.pod.canBoard(this.player)) this.board();
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
      if (I.hit('KeyR') && this.objectiveDone && !this.podCalled) this.callPod();
      if (I.hit('KeyV')) this.callResupply();
      if (I.hit('KeyT')) {
        this.mule.state = 'called';
        this.mule.lost = 3.2;                       // she will reroute if she cannot walk it
        this.toast('已呼叫 M.U.L.E.（莫莉）过来', '#8ad4ff', 2);
        DRG.audio.sfx('beep');
      }
      if (I.hit('KeyQ') && I.key('ShiftLeft', 'ShiftRight')) this.commandBosco();

      // director
      if (this.state === 'play') {
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
    g.fillStyle = this.biome.fog;
    g.fillRect(0, 0, view.w, view.h);
    var art = A().get(this.biome.art);
    if (art && art.width) {
      var scale = Math.max(view.w / art.width, view.h / art.height) * 1.35;
      var bw = art.width * scale, bh = art.height * scale;
      var px = -((cam.x * 0.22) % bw), py = -M.clamp(cam.y * 0.06, 0, Math.max(0, bh - view.h));
      g.save();
      g.globalAlpha = 0.5;
      for (var bx = px; bx < view.w; bx += bw) g.drawImage(art, bx, py, bw, bh);
      g.globalAlpha = 1;
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.fillRect(0, 0, view.w, view.h);
      g.restore();
    }

    this.world.draw(g, cam);

    /* entities */
    for (i = 0; i < this.pickups.length; i++) this.pickups[i].draw(g, cam);
    for (i = 0; i < this.flares.length; i++) this.flares[i].draw(g, cam);
    for (i = 0; i < this.props.length; i++) this.props[i].draw(g, cam);
    this.mule.draw(g, cam);
    if (this.pod) this.pod.draw(g, cam);
    for (i = 0; i < this.enemies.length; i++) this.enemies[i].draw(g, cam);
    this.bosco.draw(g, cam);
    this.player.draw(g, cam);
    for (i = 0; i < this.bullets.length; i++) this.bullets[i].draw(g, cam);
    this.fx.draw(g, cam);

    /* lighting */
    var ambient = 0.085 + 0.07 * (1 - DRG.opts().darkness);
    DRG.light.begin(view.w, view.h, ambient, this.biome.tint);
    this.player.lights(cam, this);
    this.bosco.lights(cam);
    this.mule.lights(cam);
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
    this.fx.drawText(g, cam);
    this.drawMarkers(g, cam, view);
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
    targets.push({ x: this.mule.x, y: this.mule.y - 20, col: '#8ad4ff', label: 'M.U.L.E.' });
    if (this.pod) targets.push({ x: this.pod.x, y: this.pod.y - 40, col: '#7fff9a', label: '撤离' });
    for (var i = 0; i < this.props.length; i++)
      if (this.props[i] instanceof DRG.Ent.Resupply) targets.push({ x: this.props[i].x, y: this.props[i].y - 20, col: '#ffd76a', label: '补给' });

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
