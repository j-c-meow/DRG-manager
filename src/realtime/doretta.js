/* ============================================================
   doretta.js — 执勤护送（推车）：朵蕾妲掘进机 + 燃料罐拾取物
   官方 locres 台词锚点见 docs/实时护送小游戏设计.md；
   素材 public/assets/realtime/{doretta,fuel_canister}.png 由
   umodel 导出 HUD_Radar_Icon_Drilldozer / hudIcon_FuelCannister_Filled
   两张官方 UI 图标像素化处理而来（见 commit 说明）。
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M, gfx = DRG.gfx, T = DRG.CFG.TILE;
  var A = function () { return DRG.assets || { img: {}, get: function () { return null; } }; };

  /* ---------------- 运行时加载非图集素材（public/assets/realtime/*.png） ---------------- */
  function ensureSprite(key, path) {
    if (!DRG.assets || !root.Image) return;     // 无头环境/素材系统未就绪时走矢量回退
    if (A().img[key]) return;
    if (!A()._extraLoading) A()._extraLoading = {};
    if (A()._extraLoading[key]) return;
    A()._extraLoading[key] = true;
    var im = new Image();
    im.decoding = 'async';
    im.onload = function () { A().img[key] = im; };
    var url = new URL(path, document.baseURI);
    var meta = document.querySelector('meta[name="drg-build-version"]');
    if (meta) url.searchParams.set('v', meta.content);
    im.src = url.href;
  }
  DRG.loadEscortSprites = function () {
    ensureSprite('doretta', 'assets/realtime/doretta.png');
    ensureSprite('fuel_canister', 'assets/realtime/fuel_canister.png');
  };
  function spr(key) {
    var img = A().get(key);
    return img && img.width > 2 ? img : null;   // 未加载完时回退矢量画法
  }

  /* ======================================================== 朵蕾妲 */
  function Doretta(track, maxHp) {
    this.track = track;
    this.x = track.x0;
    this.y = track.ty * T;                 // 脚底 = 轨道床表面
    this.w = 108; this.h = 64;             // 碰撞/绘制尺寸
    this.face = 1;
    this.t = 0;
    this.maxHp = maxHp; this.hp = maxHp;
    this.state = 'run';                    // run | waitFuel | fueling | hold | done | dead
    this.stationIdx = 0;                   // 下一个检查点下标
    this.fuelIn = 0;                       // 当前检查点已加的罐数（0/1）
    this.fuelT = 0;
    this.respawnT = 0;
    this.progress = 0;
    this.dead = false;
    this.hitFlash = 0; this.atkCd = 3; this.critCd = 0;
  }
  Doretta.SPEED = 62;                      // 基础掘进速度（px/s，恒定）

  Doretta.prototype.fuelPort = function () {
    return { x: this.x - this.w * 0.42, y: this.y - this.h * 0.72 };
  };

  Doretta.prototype.update = function (dt, m) {
    this.t += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 3);
    this.atkCd -= dt; this.critCd -= dt;
    if (this.dead) {                       // 残骸冒烟
      if (Math.random() < dt * 7) m.fx.spawn({ x: this.x + (Math.random() - .5) * 70, y: this.y - 20, vx: (Math.random() - .5) * 24, vy: -46, life: 1.2, size: 6, col: '#3a3a3a', kind: 2, grav: -0.06 });
      this.progress = M.clamp((this.x - this.track.x0) / (this.track.x1 - this.track.x0), 0, 1);
      return true;
    }
    if (this.hp / this.maxHp < 0.3 && this.critCd <= 0) {
      this.critCd = 16;
      m.mc(L('朵蕾妲这样撑不下去的！'));
      m.toast(L('警告：朵蕾妲血量危急！'), '#ff5a4a', 4);
      DRG.audio.sfx('alarm');
    }

    switch (this.state) {
      case 'run': this.updateRun(dt, m); break;
      case 'waitFuel': this.updateWaitFuel(dt, m); break;
      case 'fueling':
        this.fuelT -= dt;
        if (Math.random() < dt * 20) m.fx.spawn({ x: this.fuelPort().x, y: this.fuelPort().y, vx: (Math.random() - .5) * 40, vy: -60, life: .5, size: 2.4, col: '#ffd76a', kind: 4, glow: 16 });
        if (this.fuelT <= 0) this.finishFuel(m);
        break;
      case 'hold':                         // 心石防守倒计时由 mission 驱动
        if (Math.random() < dt * 3) m.fx.spawn({ x: this.x + 52, y: this.y - 58 + Math.sin(this.t * 3) * 4, vx: (Math.random() - .5) * 20, vy: -34, life: .8, size: 2.6, col: '#ff7adf', kind: 4, glow: 22 });
        break;
    }
    this.progress = M.clamp((this.x - this.track.x0) / (this.track.x1 - this.track.x0), 0, 1);
    m.world.markExplored(this.x, this.y - 24, 230);
    return true;
  };

  Doretta.prototype.updateRun = function (dt, m) {
    var speed = Doretta.SPEED;
    var fx = this.x + this.w * 0.44, fy = this.y - this.h * 0.42;
    // 掘进头啃掉挡路的一切（岩柱/塌方都会被她磨开）
    m.world.digCircle(fx + 8, fy, 26, 1500 * dt, m.tileFx);
    m.world.digCircle(fx, fy - 16, 20, 900 * dt, m.tileFx);
    this.x += speed * dt;
    if (Math.random() < dt * 34) {
      m.fx.spawn({ x: fx, y: fy + (Math.random() - .5) * 22, vx: -60 - Math.random() * 120, vy: (Math.random() - .6) * 130, life: .45, size: 3, col: ['#ffd08a', '#c9b18a', '#ff8a3a'][(Math.random() * 3) | 0], kind: 1, grav: 0.25 });
    }
    if (Math.random() < dt * 2) m.shake(1.1, 0.07);
    if (Math.random() < dt * 4) DRG.audio.sfx('thruster', m.panOf(this.x), 0.45);

    var st = this.track.stations;
    if (this.stationIdx < st.length && this.x >= st[this.stationIdx]) {
      this.x = st[this.stationIdx];
      this.enterWaitFuel(m);
    } else if (this.x >= this.track.endX) {
      this.x = this.track.endX;
      this.state = 'hold';
      m.onDorettaArrived();
    }
  };

  Doretta.prototype.enterWaitFuel = function (m) {
    this.state = 'waitFuel';
    this.fuelIn = 0;
    this.respawnT = 6;
    m.mc(L('Canister ready for re-fueling! 燃料罐已准备好重新供油！'));
    m.toast(L('朵蕾妲停车加油 · 走近燃料罐按 E 拾起，再靠近油箱口按 E 加入'), '#ffd76a', 5);
    DRG.audio.sfx('beep');
    this.spawnCanister(m);
  };

  Doretta.prototype.spawnCanister = function (m) {
    var can = new DRG.FuelCanister(this.x - this.w * 0.85, this.y - 26);
    m.props.push(can);
    m.fx.burst(can.x, can.y, 10, { col: ['#ffd76a', '#fff2c0'], speed: 130, life: 0.5, kind: 1 });
    return can;
  };

  Doretta.prototype.updateWaitFuel = function (dt, m) {
    if (this.fuelIn > 0) return;
    // 保险：罐子万一掉进缝里/被炸没了，几秒后补刷一个
    var live = m.props.some(function (pr) { return pr instanceof DRG.FuelCanister && pr.state === 'idle'; });
    if (!live) {
      this.respawnT -= dt;
      if (this.respawnT <= 0) { this.respawnT = 6; this.spawnCanister(m); m.toast(L('补充燃料罐已投放'), '#ffd76a', 2.5); }
    }
  };

  Doretta.prototype.canFuel = function (p) {
    if (this.dead || this.state !== 'waitFuel' || !p.carriedCan) return false;
    var port = this.fuelPort();
    return Math.abs(p.x - port.x) < 70 && Math.abs(p.y - port.y) < 96;
  };

  Doretta.prototype.addFuel = function (m) {
    var p = m.player, can = p.carriedCan;
    if (!can) return false;
    p.carriedCan = null;
    can.state = 'spent';
    this.fuelIn = 1;
    this.state = 'fueling';
    this.fuelT = 2.6;
    m.mc(L('Canister placed! 燃料罐已放置！'));
    m.fx.text(this.x, this.y - this.h - 14, L('+ 燃料罐'), '#ffd76a', 16);
    DRG.audio.sfx('deposit');
    return true;
  };

  Doretta.prototype.finishFuel = function (m) {
    this.state = 'run';
    this.stationIdx++;
    m.mc(L('所有燃料罐已装满！掘进机已准备好继续执行任务！'));
    m.toast(L('加油完成 · 朵蕾妲恢复推进'), '#7fff9a', 3);
    DRG.audio.clipOf(['dwarf_resupply_1', 'dwarf_resupply_2'], 0.8, true);
    m.stats.credits += 70 * m.hazard.credit;
    m.stats.xp += 70 * m.hazard.xp;
  };

  Doretta.prototype.hurt = function (dmg, m, fromX) {
    if (this.dead || this.state === 'done') return;
    this.hp -= dmg;
    this.hitFlash = 1;
    var y = this.y - this.h * 0.5;
    m.fx.burst(fromX || this.x, y, 5, { col: ['#ff8a5a', '#ffd08a', '#c8d0e0'], speed: 170, life: 0.35, kind: 1 });
    if (this.atkCd <= 0) {
      this.atkCd = 14;
      m.mc(L('Doretta is under attack! 朵蕾妲在遭受攻击！'));
      DRG.audio.sfx('alarm');
      m.shake(5, 0.2);
    }
    if (this.hp <= 0) {
      this.hp = 0; this.dead = true; this.state = 'dead';
      m.explode(this.x, y, 120, 0, 0);
      m.onDorettaDestroyed();
    }
  };

  Doretta.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var img = spr('doretta');
    var moving = this.state === 'run';

    // shadow
    g.save();
    g.globalAlpha = 0.3; g.fillStyle = '#000';
    g.beginPath(); g.ellipse(sx, sy + 2, this.w * 0.5, 6, 0, 0, 6.283); g.fill();
    g.restore();

    // treads
    g.save();
    g.fillStyle = '#23262c';
    g.fillRect(sx - this.w * 0.46, sy - 10, this.w * 0.92, 11);
    g.fillStyle = '#3c414b';
    for (var wi = 0; wi < 4; wi++) {
      var wx = sx - this.w * 0.34 + wi * this.w * 0.23;
      g.beginPath(); g.arc(wx, sy - 4.5, 4.4, 0, 6.283); g.fill();
      g.fillStyle = '#565d69';
      g.beginPath(); g.arc(wx + (moving ? ((this.t * 160) % 6) - 3 : 0), sy - 4.5, 1.8, 0, 6.283); g.fill();
      g.fillStyle = '#3c414b';
    }
    g.restore();

    if (this.dead) {
      if (img) gfx.sprite(g, img, sx, sy - 22, this.h * 0.62, { rot: -0.16, alpha: 0.85 });
      else this.drawFallback(g, sx, sy, true);
      gfx.bar(g, sx - 30, sy - this.h - 14, 60, 5, 0, '#ff5a4a');
      return;
    }

    if (img) gfx.sprite(g, img, sx, sy - 12 - this.h * 0.5, this.h);
    else this.drawFallback(g, sx, sy, false);

    if (this.hitFlash > 0.02 && img) {
      gfx.spriteTint(g, img, sx, sy - 12 - this.h * 0.5, this.h, '#ff3a2a', this.hitFlash * 0.75, false);
    }

    // drill glow while chewing
    if (moving) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.5 + Math.sin(this.t * 26) * 0.25;
      g.fillStyle = '#ffd08a';
      g.beginPath(); g.arc(sx + this.w * 0.52, sy - this.h * 0.42, 9, 0, 6.283); g.fill();
      g.restore();
    }

    // hp bar
    var frac = this.hp / this.maxHp;
    if (frac < 1) {
      gfx.bar(g, sx - 48, sy - this.h - 18, 96, 7, frac, frac > 0.3 ? '#ffb03c' : gfx.pulse(this.t, '#ff4a3a', '#ff9a6a', 9), { grad: true });
    }

    // fuel state icon
    var icon = spr('fuel_canister');
    if (icon && (this.state === 'waitFuel' || this.state === 'fueling')) {
      var bobY = Math.sin(this.t * 5) * 3;
      g.save();
      g.globalAlpha = this.state === 'fueling' ? 1 : 0.75;
      gfx.sprite(g, icon, sx + 34, sy - this.h - 22 + bobY, 26);
      g.restore();
    }

    // heart stone while defending
    if (this.state === 'hold') {
      var hx = sx + 52, hy = sy - this.h - 8 + Math.sin(this.t * 3) * 4;
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.75;
      g.fillStyle = '#ff7adf';
      g.beginPath();
      g.moveTo(hx, hy - 12); g.lineTo(hx + 8, hy); g.lineTo(hx, hy + 12); g.lineTo(hx - 8, hy);
      g.closePath(); g.fill();
      g.restore();
    }
  };

  Doretta.prototype.drawFallback = function (g, sx, sy, wreck) {
    g.save();
    if (wreck) g.rotate(-0.16);
    g.fillStyle = wreck ? '#5a4a30' : '#c47a16';
    g.fillRect(sx - this.w * 0.42, sy - this.h * 0.8, this.w * 0.6, this.h * 0.68);
    g.fillStyle = wreck ? '#3c3c46' : '#a8bace';
    g.beginPath();
    g.moveTo(sx + this.w * 0.18, sy - this.h * 0.8);
    g.lineTo(sx + this.w * 0.54, sy - this.h * 0.42);
    g.lineTo(sx + this.w * 0.18, sy - this.h * 0.06);
    g.closePath(); g.fill();
    g.restore();
  };

  Doretta.prototype.lights = function (cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    if (!this.dead) {
      if (this.state === 'run') DRG.light.addCone(sx + this.w * 0.4, sy - this.h * 0.42, 0, 1.15, 420, 1.0, [255, 240, 205]);
      DRG.light.add(sx, sy - this.h * 0.5, 240, 0.7, [255, 205, 130], 0.28);
      if (this.state === 'fueling') DRG.light.add(sx - this.w * 0.42, sy - this.h * 0.7, 130, 0.8, [255, 215, 106], 0.4);
      if (this.state === 'hold') DRG.light.add(sx + 52, sy - this.h - 8, 170, 0.9, [255, 122, 223], 0.45);
    }
    if (this.hitFlash > 0.05) DRG.light.add(sx, sy - this.h * 0.5, 190, this.hitFlash, [255, 80, 50], 0.5);
  };

  /* ======================================================== 燃料罐拾取物 */
  function FuelCanister(x, y) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 40; this.vy = -60;
    this.state = 'idle';                   // idle | carried | spent
    this.t = 0; this.dead = false;
  }
  FuelCanister.prototype.update = function (dt, m) {
    this.t += dt;
    if (this.state === 'spent') return false;
    var p = m.player;
    if (this.state === 'carried') {
      this.x = p.x; this.y = p.y - 54 + Math.sin(this.t * 6) * 2;
      return true;
    }
    this.vy += DRG.CFG.GRAVITY * 0.6 * dt;
    var nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
    if (m.world.solidPx(nx, this.y)) { this.vx *= -0.4; nx = this.x; }
    if (m.world.solidPx(this.x, ny)) { this.vy = 0; this.vx *= 0.6; ny = this.y; }
    this.x = nx; this.y = ny;
    return true;
  };
  FuelCanister.prototype.draw = function (g, cam) {
    if (this.state === 'spent') return;
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var img = spr('fuel_canister');
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.3 + 0.12 * Math.sin(this.t * 5);
    g.fillStyle = '#ffd76a';
    g.beginPath(); g.arc(sx, sy, 16, 0, 6.283); g.fill();
    g.restore();
    if (img) gfx.sprite(g, img, sx, sy - 14, 30);
    else {
      g.save();
      g.fillStyle = '#ffd76a'; g.fillRect(sx - 7, sy - 20, 14, 26);
      g.fillStyle = '#d64834'; g.fillRect(sx - 7, sy - 12, 14, 6);
      g.restore();
    }
    if (this.state === 'idle') {
      var a = M.clamp(Math.min(this.t * 2, 1), 0, 1);
      gfx.text(g, 'E', sx, sy - 38, { size: 13, align: 'center', col: gfx.pulse(this.t, '#ffd76a', '#ffffff', 5), alpha: 0.9 * a });
    }
  };
  FuelCanister.prototype.lights = function (cam) {
    if (this.state !== 'spent') DRG.light.add(this.x - cam.x, this.y - cam.y - 14, 110, 0.5, [255, 215, 106], 0.35);
  };

  DRG.Doretta = Doretta;
  DRG.FuelCanister = FuelCanister;
})(window);
