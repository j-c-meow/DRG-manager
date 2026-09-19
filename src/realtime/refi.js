/* ============================================================
   refi.js — 就地精炼（On-Site Refining）
   出生点是精炼单元（大本营）；远处 2~3 口墨菱油井（危险度决定数量）。
   玩家从精炼单元领取管道段（一次一段，携带移速 -20%、锁副手，
   见 player.carryRestriction）→ 到油井按 E 铺设管线 + 安装泵 →
   泵自动抽油（每口泵独立血条；虫潮会啃泵，打坏停摆）→
   对着停摆的泵长按 E 修理（salv 同款手感：松开保留进度）。
   精炼配额（危险度缩放）达标 → 自动召撤离 pod → 胜利；无失败判定。
   素材：泵体/管线为矢量画法（任务许可「管线直接画线段+节点圈」）；
   HUD 图标 public/assets/img/mission_refi.png 为自绘泵图标。
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M, gfx = DRG.gfx, T = DRG.CFG.TILE;

  /* ======================================================== 管道段（可携带实体） */
  function PipeSeg(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.state = 'idle';                        // idle | carried | laid
    this.t = 0; this.dead = false;
    this.kind = 'pipe';
    this.label = '管道段';
    this.slowMul = 0.8;                         // 携带移速 -20%
  }
  PipeSeg.prototype.update = function (dt, m) {
    this.t += dt;
    if (this.state === 'laid') return false;    // 铺进管线后移除
    var p = m.player;
    this.pl = p;
    if (this.state === 'carried') {
      this.x = p.x; this.y = p.y - 56 + Math.sin(this.t * 5) * 2;
      return true;
    }
    this.vy += DRG.CFG.GRAVITY * 0.6 * dt;
    var nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
    if (m.world.solidPx(nx, this.y)) { this.vx *= -0.4; nx = this.x; }
    if (m.world.solidPx(this.x, ny)) { this.vy = 0; this.vx *= 0.6; ny = this.y; }
    this.x = nx; this.y = ny;
    return true;
  };
  PipeSeg.prototype.drop = function (p, m) {
    this.state = 'idle';
    this.x = p.x; this.y = p.y - 10;
    this.vx = (Math.random() - 0.5) * 50; this.vy = -110;
    if (m) m.toast('管道段掉落了——回来按 E 重新扛起', '#ffb03c', 3);
  };
  PipeSeg.prototype.draw = function (g, cam) {
    if (this.state === 'laid') return;
    var sx = this.x - cam.x, sy = this.y - cam.y;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.2 + 0.08 * Math.sin(this.t * 4);
    g.fillStyle = '#6fbde8';
    g.beginPath(); g.arc(sx, sy, 16, 0, 6.283); g.fill();
    g.restore();
    g.save();
    g.translate(sx, sy - 4); g.rotate(Math.sin(this.t * 1.4) * 0.1);
    g.fillStyle = '#4a525e'; g.fillRect(-14, -4, 28, 8);
    g.fillStyle = '#6fbde8'; g.fillRect(-14, -1.5, 28, 3);
    g.fillStyle = '#8ad4ff';
    g.beginPath(); g.arc(-13, 0, 4.4, 0, 6.283); g.fill();
    g.beginPath(); g.arc(13, 0, 4.4, 0, 6.283); g.fill();
    g.restore();
    if (this.state === 'idle' && this.pl && !this.pl.carriedItem &&
        Math.abs(this.pl.x - this.x) < 90 && Math.abs(this.pl.y - this.y) < 80) {
      gfx.text(g, 'E', sx, sy - 30, { size: 13, align: 'center', col: gfx.pulse(this.t, '#6fbde8', '#ffffff', 5), alpha: 0.9 });
    }
  };
  PipeSeg.prototype.lights = function (cam) {
    if (this.state === 'idle') DRG.light.add(this.x - cam.x, this.y - cam.y - 6, 90, 0.4, [111, 189, 232], 0.3);
  };

  /* ======================================================== 精炼单元（大本营） */
  function RefineryUnit(x, groundY) {
    this.x = x; this.y = groundY;
    this.h = 52;
    this.t = 0;
    this.flash = 0;                             // 收到油的闪亮
    this.vatGlow = 0;                           // 液位辉光（随进度上升）
  }
  RefineryUnit.prototype.canTakePipe = function (p) {
    return !p.carriedItem && !p.carriedCan && !p.downed &&
      Math.abs(p.x - this.x) < 92 && Math.abs(p.y - this.y) < 110;
  };
  /** 领取管道段（无限供应：管架就在单元上） */
  RefineryUnit.prototype.takePipe = function (p, m) {
    if (!this.canTakePipe(p)) return false;
    var seg = new PipeSeg(this.x + 26, this.y - 20);
    seg.state = 'carried';
    p.carriedItem = seg;
    p.toolSelected = false;
    m.toast('领到管道段 · 送到油井处按 E 铺设并安装泵', '#6fbde8', 3);
    DRG.audio.sfx('beep');
    return true;
  };
  RefineryUnit.prototype.update = function (dt, m) {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt * 2.4);
    this.vatGlow = M.clamp(m.oilRefined / Math.max(1, m.oilQuota), 0, 1);
    return true;
  };
  RefineryUnit.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var t = this.t;
    g.save();
    g.globalAlpha = 0.3; g.fillStyle = '#000';
    g.beginPath(); g.ellipse(sx, sy + 2, 56, 8, 0, 0, 6.283); g.fill();
    g.restore();

    // 储罐（液位随精炼进度上涨）
    g.fillStyle = '#3c414b';
    g.fillRect(sx - 40, sy - 46, 34, 46);
    g.fillStyle = '#2a3038';
    g.fillRect(sx - 36, sy - 42 + (1 - this.vatGlow) * 36, 26, Math.max(2, this.vatGlow * 36));
    if (this.vatGlow > 0.02) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.5 + 0.2 * Math.sin(t * 3);
      g.fillStyle = '#3ad98a';
      g.fillRect(sx - 36, sy - 42 + (1 - this.vatGlow) * 36, 26, 2.4);
      g.restore();
    }
    g.strokeStyle = '#565d69'; g.lineWidth = 2;
    g.strokeRect(sx - 40, sy - 46, 34, 46);
    g.fillStyle = '#565d69';
    g.fillRect(sx - 44, sy - 50, 42, 5);

    // 主体机房 + 警示条
    g.fillStyle = '#4a525e';
    g.fillRect(sx + 2, sy - 36, 40, 36);
    g.fillStyle = '#ffb03c';
    g.fillRect(sx + 2, sy - 14, 40, 6);
    g.fillStyle = '#23262c';
    for (var i = 0; i < 4; i++) g.fillRect(sx + 6 + i * 10, sy - 14, 5, 6);
    g.fillStyle = '#2a3038';
    g.fillRect(sx + 8, sy - 30, 10, 12);

    // 烟囱 + 工作状态烟
    g.fillStyle = '#565d69';
    g.fillRect(sx + 30, sy - 52, 8, 18);
    if (Math.random() < 0.12) {
      g.save();
      g.globalAlpha = 0.22;
      g.fillStyle = '#9aa4b0';
      g.beginPath(); g.arc(sx + 34 + Math.sin(t) * 3, sy - 56 - (t * 9 % 14), 4, 0, 6.283); g.fill();
      g.restore();
    }

    // 管架（待领的管道段）
    g.fillStyle = '#3c414b';
    g.fillRect(sx - 26, sy - 16, 44, 4);
    g.fillRect(sx - 26, sy - 26, 44, 4);
    for (i = 0; i < 3; i++) {
      g.fillStyle = '#6fbde8';
      g.fillRect(sx - 22 + i * 15, sy - 24, 30, 2.4);
      g.fillRect(sx - 22 + i * 15, sy - 14, 30, 2.4);
    }

    // 状态灯
    g.save();
    g.globalCompositeOperation = 'lighter';
    var blink = 0.4 + 0.35 * Math.sin(t * 4);
    g.globalAlpha = blink;
    g.fillStyle = this.flash > 0.05 ? '#ffffff' : '#3ad98a';
    g.beginPath(); g.arc(sx + 2, sy - 40, 3, 0, 6.283); g.fill();
    g.restore();

    // 标签
    gfx.text(g, '精炼单元', sx, sy - 62, { size: 12, align: 'center', col: '#9ad7ff', alpha: 0.8 });
  };
  RefineryUnit.prototype.lights = function (cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    DRG.light.add(sx, sy - 26, 200, 0.55, [255, 205, 130], 0.26);
    if (this.vatGlow > 0.02) DRG.light.add(sx - 23, sy - 30, 120, 0.3 + this.vatGlow * 0.4, [58, 217, 138], 0.35);
    if (this.flash > 0.05) DRG.light.add(sx, sy - 40, 150, this.flash, [255, 255, 255], 0.4);
  };

  /* ======================================================== 墨菱油井（含泵） */
  var PUMP_REPAIR_TIME = 3;
  function OilWell(x, groundY) {
    this.x = x; this.y = groundY;
    this.t = Math.random() * 10;
    this.state = 'dry';                         // dry | pumping | broken
    this.pumpT = 0;                             // 泵运转相位（动画/节拍）
    this.maxHp = 0; this.hp = 0;
    this.hitFlash = 0;
    this.repairT = 0;
    this.repairing = false;
    this.pipe = null;                           // {x1,y1,x2,y2} 连回精炼单元
    this.flow = 0;                              // 累计产出（管线脉冲用）
    this.smokeT = 0;
  }
  OilWell.REPAIR_TIME = PUMP_REPAIR_TIME;

  /** 铺管 + 装泵（E 携带管道段贴近时） */
  OilWell.prototype.canInstall = function (p) {
    return this.state === 'dry' && !!p.carriedItem && p.carriedItem.kind === 'pipe' && !p.downed &&
      Math.abs(p.x - this.x) < 84 && Math.abs(p.y - this.y) < 100;
  };
  OilWell.prototype.install = function (p, m) {
    if (!this.canInstall(p)) return false;
    p.carriedItem.state = 'laid';
    p.carriedItem = null;
    this.state = 'pumping';
    this.maxHp = this.hp = Math.round(90 * (1 + 0.22 * (m.hazard.lv - 1)));
    this.pumpT = 0;
    this.pipe = { x1: m.refinery.x, y1: m.refinery.y - 30, x2: this.x, y2: this.y - 18 };
    m.fx.burst(this.x, this.y - 20, 18, { col: ['#6fbde8', '#c8ecff', '#ffd76a'], speed: 200, life: 0.55, kind: 1 });
    m.fx.text(this.x, this.y - 74, '泵已启动', '#6fbde8', 15);
    DRG.audio.sfx('deposit');
    DRG.audio.clipOf(['rns_1', 'rns_2', 'rns_3'], 0.55, true);
    m.spawnWaveAt(this.x, this.y, 0.9);         // 泵的轰鸣引来第一波虫
    m.toast('管线接通 · 泵开始抽油！小心虫子啃泵', '#6fbde8', 4);
    return true;
  };

  OilWell.prototype.hurt = function (dmg, m, fromX) {
    if (this.state !== 'pumping') return;       // 停摆的泵不再吃伤害
    this.hp -= dmg;
    this.hitFlash = 1;
    m.fx.burst(this.x + (Math.random() - 0.5) * 26, this.y - 22, 4, { col: ['#ffd08a', '#8a929e'], speed: 150, life: 0.3, kind: 1 });
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'broken';
      this.repairT = 0;
      m.explode(this.x, this.y - 20, 60, 0, 0);
      m.toast('泵被虫子打坏了！长按 E 修理', '#ff5a4a', 4);
      DRG.audio.sfx('alarm');
    }
  };

  OilWell.prototype.canRepair = function (p) {
    return this.state === 'broken' && !p.downed &&
      Math.abs(p.x - this.x) < 96 && Math.abs(p.y - this.y) < 110;
  };
  /** 长按修理：每帧由 mission.refiDirector 调用（松开保留进度） */
  OilWell.prototype.repair = function (dt, holding, m) {
    if (this.state !== 'broken') return false;
    this.repairing = !!holding;
    if (!holding) return true;
    this.repairT += dt;
    if (Math.random() < dt * 20) {
      m.fx.burst(this.x + (Math.random() - 0.5) * 40, this.y - 14 - Math.random() * 22, 2, {
        col: ['#ffd76a', '#fff2c0'], speed: 140, life: 0.32, size: 2.2, kind: 1
      });
    }
    if (Math.random() < dt * 9) DRG.audio.sfx('pick', m.panOf(this.x), 0.8);
    if (this.repairT >= PUMP_REPAIR_TIME) {
      this.state = 'pumping';
      this.hp = this.maxHp;
      this.repairing = false;
      m.fx.text(this.x, this.y - 74, '泵修复', '#7fff9a', 15);
      DRG.audio.clipOf(['rns_4', 'rns_5'], 0.5, true);
      return false;
    }
    return true;
  };
  OilWell.prototype.repairFrac = function () {
    return M.clamp(this.repairT / PUMP_REPAIR_TIME, 0, 1);
  };

  OilWell.prototype.update = function (dt, m) {
    this.t += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 3);
    if (this.state === 'pumping') {
      this.pumpT += dt;
      this.flow += dt;
      // 抽油：泵独立产出，汇总进精炼单元（管线脉冲为纯视觉）
      m.addOil(dt * 0.25, this);
      if (Math.random() < dt * 5) {
        m.fx.spawn({ x: this.x + (Math.random() - 0.5) * 16, y: this.y - 40, vx: (Math.random() - 0.5) * 14, vy: -34, life: 0.5, size: 2, col: '#3ad98a', kind: 4, glow: 14 });
      }
    } else if (this.state === 'broken') {
      this.smokeT += dt;
      if (Math.random() < dt * 8) {
        m.fx.spawn({ x: this.x + (Math.random() - 0.5) * 24, y: this.y - 30, vx: (Math.random() - 0.5) * 20, vy: -50, life: 1.1, size: 5, col: '#3a3a3a', kind: 2, grav: -0.05 });
      }
      if (Math.random() < dt * 3) {
        m.fx.spawn({ x: this.x + (Math.random() - 0.5) * 18, y: this.y - 24, vx: 0, vy: 0, life: 0.16, size: 2.4, col: '#ffd76a', kind: 4, glow: 24 });
      }
    }
    return true;
  };

  OilWell.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var t = this.t;

    // 井台底座 + 墨菱油渗坑
    g.save();
    g.globalAlpha = 0.3; g.fillStyle = '#000';
    g.beginPath(); g.ellipse(sx, sy + 2, 34, 7, 0, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(58,217,138,0.16)';
    g.beginPath(); g.ellipse(sx + 14, sy - 1, 16, 4.6, 0, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(58,217,138,0.3)';
    g.beginPath(); g.ellipse(sx + 14, sy - 1, 8, 2.4, 0, 0, 6.283); g.fill();
    g.restore();

    // 井口立管 + 阀门
    g.fillStyle = '#3c414b';
    g.fillRect(sx + 16, sy - 34, 7, 34);
    g.fillStyle = '#565d69';
    g.fillRect(sx + 12, sy - 38, 15, 5);
    g.strokeStyle = this.state === 'pumping' ? '#3ad98a' : '#7f8a96';
    g.lineWidth = 2.4;
    g.beginPath(); g.arc(sx + 19.5, sy - 44, 5, 0, 6.283); g.stroke();
    g.beginPath(); g.moveTo(sx + 14.5, sy - 44); g.lineTo(sx + 24.5, sy - 44); g.stroke();

    // 游梁式抽油机（ pumping 时摆动，broken 停摆歪斜）
    var beamAng = 0;
    if (this.state === 'pumping') beamAng = Math.sin(this.pumpT * 3.2) * 0.3;
    else if (this.state === 'broken') beamAng = 0.34;
    // 支架
    g.fillStyle = '#4a525e';
    g.beginPath();
    g.moveTo(sx - 14, sy); g.lineTo(sx - 4, sy - 34); g.lineTo(sx + 4, sy - 34); g.lineTo(sx + 14, sy);
    g.closePath(); g.fill();
    // 游梁
    g.save();
    g.translate(sx, sy - 34);
    g.rotate(beamAng);
    g.fillStyle = '#c47a16';
    g.fillRect(-30, -5, 60, 8);
    g.fillStyle = '#e09a2e';
    g.fillRect(-30, -5, 60, 3);
    // 驴头
    g.fillStyle = '#8a929e';
    g.fillRect(24, -11, 9, 14);
    g.restore();
    // 配重
    g.save();
    g.translate(sx, sy - 34); g.rotate(beamAng);
    var cwx = -28;
    g.fillStyle = '#565d69';
    g.beginPath(); g.arc(cwx, 6, 8, 0, 6.283); g.fill();
    g.fillStyle = '#3c414b';
    g.beginPath(); g.arc(cwx, 6, 4, 0, 6.283); g.fill();
    g.restore();

    // 受击闪白
    if (this.hitFlash > 0.02) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = this.hitFlash * 0.4;
      g.fillStyle = '#ffffff';
      g.fillRect(sx - 30, sy - 46, 62, 46);
      g.restore();
    }

    // 泵血条
    if (this.state === 'pumping' && this.hp < this.maxHp) {
      gfx.bar(g, sx - 24, sy - 58, 48, 5, this.hp / this.maxHp,
        this.hp / this.maxHp > 0.35 ? '#ffb03c' : gfx.pulse(t, '#ff4a3a', '#ff9a6a', 9));
    }

    // 状态提示
    if (this.state === 'dry') {
      gfx.text(g, '油井 · 未装泵', sx, sy - 66, { size: 12, align: 'center', col: '#ffd76a', alpha: 0.85 });
    } else if (this.state === 'broken') {
      gfx.text(g, '泵停摆', sx, sy - 66, { size: 12, align: 'center', col: gfx.pulse(t, '#ff4a3a', '#ffb0a0', 8) });
      if (this.repairT > 0.02) {
        gfx.ring(g, sx, sy - 88, 16, this.repairFrac(), '#7fff9a', 4);
        gfx.text(g, (this.repairing ? '修理中 ' : '修理进度 ') + Math.round(this.repairFrac() * 100) + '%' + (this.repairing ? '' : '（长按 E 继续）'),
          sx, sy - 112, { size: 12, align: 'center', col: this.repairing ? '#7fff9a' : '#cfd8e0' });
      } else {
        gfx.text(g, '长按 E 修理', sx, sy - 88 + Math.sin(t * 5) * 2, { size: 12, align: 'center', col: gfx.pulse(t, '#7fff9a', '#ffffff', 6), alpha: 0.85 });
      }
    }
  };
  OilWell.prototype.lights = function (cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    if (this.state === 'pumping') {
      DRG.light.add(sx, sy - 30, 150, 0.5, [255, 205, 130], 0.3);
      DRG.light.add(sx + 14, sy - 4, 90, 0.45, [58, 217, 138], 0.4);
    } else if (this.state === 'broken') {
      DRG.light.add(sx, sy - 24, 110, 0.3 + Math.random() * 0.25, [255, 90, 60], 0.45);
    } else {
      DRG.light.add(sx, sy - 20, 90, 0.28, [255, 215, 106], 0.3);
    }
    if (this.repairing) DRG.light.add(sx, sy - 22, 150, 0.5 + Math.random() * 0.3, [255, 215, 106], 0.4);
  };
  /** 未装泵的油井：细光柱附加通道（远处可见，salv 信标同款思路） */
  OilWell.prototype.beam = function (g, cam) {
    if (this.state !== 'dry') return;
    var sx = this.x - cam.x;
    var top = -40, hgt = (this.y - cam.y) - top;
    var w = 9 + Math.sin(this.t * 2.6) * 2;
    g.save();
    g.globalCompositeOperation = 'lighter';
    var grd = g.createLinearGradient(sx - w, 0, sx + w, 0);
    grd.addColorStop(0, 'rgba(111,189,232,0)');
    grd.addColorStop(0.5, 'rgba(140,214,255,0.26)');
    grd.addColorStop(1, 'rgba(111,189,232,0)');
    g.fillStyle = grd;
    g.fillRect(sx - w, top, w * 2, hgt);
    g.restore();
  };

  DRG.PipeSeg = PipeSeg;
  DRG.RefineryUnit = RefineryUnit;
  DRG.OilWell = OilWell;
  DRG.REFI = {
    PUMP_RATE: 0.25,                            // 每口泵产油速率（单位/秒）
    REPAIR_TIME: PUMP_REPAIR_TIME,
    /** 配额：危险度缩放（haz1=6 … haz5=18） */
    quotaOf: function (lv) { return 6 + (lv - 1) * 3; },
    /** 油井数量：危险度决定（lv1-2=2 口，lv3+=3 口） */
    wellCount: function (lv) { return lv >= 3 ? 3 : 2; }
  };
})(window);
