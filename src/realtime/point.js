/* ============================================================
   point.js — 定点提取（Point Extraction）
   3 个发光信标富矿点：光柱 + 光晕（远处可见）；
   走近信标按住攻击钻采大矿结（进度环 + 碎屑粒子）→ 采出矿块；
   矿块头顶携带（移速 -10%、只能副手射击，见 player.carryRestriction），
   莫莉处按 E 入库 +1 并触发一小波虫潮（mission.pointInteract）。
   素材 public/assets/realtime/aquarq.png 由 umodel 导出官方
   Icons_Resources_Outline_Aquarq UI 图标像素化而来；信标光柱为矢量。
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M, gfx = DRG.gfx, T = DRG.CFG.TILE;
  var A = function () { return DRG.assets || { img: {}, get: function () { return null; } }; };

  /* ---------------- 运行时加载非图集素材（与 doretta.js 同一模式） ---------------- */
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
  DRG.loadPointSprites = function () {
    ensureSprite('aquarq', 'assets/realtime/aquarq.png');
  };
  function spr(key) {
    var img = A().get(key);
    return img && img.width > 2 ? img : null;   // 未加载完时回退矢量画法
  }

  var DRILL_TIME = 3.2;                         // 单次钻采耗时（秒）

  /* ======================================================== 富矿信标（含大矿结） */
  function PointBeacon(x, groundY, chunkYield) {
    this.x = x; this.y = groundY;
    this.chunkYield = chunkYield;
    this.chunksLeft = chunkYield;
    this.state = 'active';                      // active | depleted
    this.drillT = 0;                            // 当前钻采进度
    this.drilling = false;                      // 本帧是否被钻（粒子/音效用）
    this.t = Math.random() * 10;
  }

  PointBeacon.prototype.update = function (dt, m) {
    this.t += dt;
    this.pl = m.player;
    this.near = !!this.pl && !this.pl.carriedItem && !this.pl.downed &&
      Math.abs(this.pl.x - this.x) < 150 && Math.abs(this.pl.y - this.y) < 120;
    return true;
  };

  PointBeacon.prototype.canDrill = function (p) {
    if (this.state !== 'active' || this.chunksLeft <= 0) return false;
    if (p.carriedItem || p.downed) return false;
    return Math.abs(p.x - this.x) < 78 && Math.abs(p.y - this.y) < 96;
  };

  /** 按住攻击期间每帧调用（player.js 的钻采拦截） */
  PointBeacon.prototype.drill = function (dt, m) {
    if (this.state !== 'active') return false;
    this.drilling = true;
    this.drillT += dt;
    var ex = this.x, ey = this.y - 22;
    if (Math.random() < dt * 26) {
      m.fx.burst(ex, ey, 2, {
        col: ['#7fd4ff', '#c8ecff', '#4a9ad8'], speed: 190, life: 0.45, size: 2.6,
        ang: -2.6 + Math.random() * 1.2, spread: 0.9, kind: 1
      });
    }
    if (Math.random() < dt * 12) DRG.audio.sfx('pick', m.panOf(this.x), 0.7 + Math.random() * 0.2);
    m.shake(0.9, 0.05);
    if (this.drillT >= DRILL_TIME) {
      this.drillT = 0;
      this.chunksLeft--;
      m.spawnChunk(this.x, this.y - 18);
      if (this.chunksLeft <= 0) {
        this.state = 'depleted';
        m.toast('这处富矿点采完了', '#9aa4b0', 2);
      } else {
        m.toast('矿结里还有矿块：剩余 ' + this.chunksLeft, '#7fd4ff', 2);
      }
      DRG.audio.clipOf(['rns_4', 'rns_5'], 0.5, true);
      return false;
    }
    return true;
  };

  PointBeacon.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var t = this.t + this.drillT * 9;
    var active = this.state === 'active';
    var img = spr('aquarq');

    // base plinth
    g.save();
    g.fillStyle = '#2a3038';
    g.beginPath(); g.ellipse(sx, sy, 26, 8, 0, 0, 6.283); g.fill();
    g.fillStyle = '#3a424e';
    g.fillRect(sx - 18, sy - 8, 36, 8);
    g.restore();

    // crystal cluster（数量随剩余矿块递减）
    var crystals = active ? Math.max(1, Math.min(3, this.chunksLeft)) : 0;
    for (var i = 0; i < crystals; i++) {
      var ox = (i - 1) * 14, h = i === 1 ? 42 : 30;
      var bob = Math.sin(t * 2.2 + i * 1.7) * 1.6;
      if (img) {
        gfx.sprite(g, img, sx + ox, sy - 12 - h / 2 + bob, h, { rot: (i - 1) * 0.14 });
      } else {
        g.save();
        g.fillStyle = i === 1 ? '#9adcff' : '#5fb2e8';
        g.beginPath();
        g.moveTo(sx + ox, sy - 10 - h + bob);
        g.lineTo(sx + ox + 9, sy - 12 + bob);
        g.lineTo(sx + ox, sy - 8 + bob);
        g.lineTo(sx + ox - 9, sy - 12 + bob);
        g.closePath(); g.fill();
        g.restore();
      }
    }
    if (!active) {                              // 采空的灰白矿壳
      g.save();
      g.globalAlpha = 0.55;
      g.fillStyle = '#5d6772';
      g.beginPath(); g.ellipse(sx, sy - 10, 14, 10, 0, 0, 6.283); g.fill();
      g.restore();
    }

    // drill progress ring
    if (active && this.drillT > 0.04) {
      var frac = M.clamp(this.drillT / DRILL_TIME, 0, 1);
      gfx.ring(g, sx, sy - 62, 15, frac, '#7fd4ff', 4);
      gfx.text(g, Math.round(frac * 100) + '%', sx, sy - 84, { size: 12, align: 'center', col: '#c8ecff' });
    }
    // approach hint
    if (active && this.drillT <= 0.04 && this.near) {
      gfx.text(g, '按住左键 钻采矿结', sx, sy - 66 + Math.sin(t * 5) * 2,
        { size: 12, align: 'center', col: gfx.pulse(t, '#7fd4ff', '#ffffff', 6), alpha: 0.85 });
    }
  };

  /** 光柱：在照明之后的附加通道里画（punch through the dark） */
  PointBeacon.prototype.beam = function (g, cam, view) {
    if (this.state !== 'active') return;
    var sx = this.x - cam.x;
    var t = this.t + this.drillT * 9;
    var top = -40, hgt = (this.y - cam.y) - top;
    var w = 15 + Math.sin(t * 2.4) * 3;
    g.save();
    g.globalCompositeOperation = 'lighter';
    var grd = g.createLinearGradient(sx - w, 0, sx + w, 0);
    grd.addColorStop(0, 'rgba(110,200,255,0)');
    grd.addColorStop(0.5, 'rgba(150,220,255,0.34)');
    grd.addColorStop(1, 'rgba(110,200,255,0)');
    g.fillStyle = grd;
    g.fillRect(sx - w, top, w * 2, hgt);
    // core
    var grd2 = g.createLinearGradient(sx - 4, 0, sx + 4, 0);
    grd2.addColorStop(0, 'rgba(220,245,255,0)');
    grd2.addColorStop(0.5, 'rgba(230,248,255,0.5)');
    grd2.addColorStop(1, 'rgba(220,245,255,0)');
    g.fillStyle = grd2;
    g.fillRect(sx - 4, top, 8, hgt);
    // base halo
    var halo = g.createRadialGradient(sx, this.y - cam.y - 14, 0, sx, this.y - cam.y - 14, 70);
    halo.addColorStop(0, 'rgba(160,225,255,0.5)');
    halo.addColorStop(1, 'rgba(160,225,255,0)');
    g.fillStyle = halo;
    g.beginPath(); g.arc(sx, this.y - cam.y - 14, 70, 0, 6.283); g.fill();
    g.restore();
  };

  PointBeacon.prototype.lights = function (cam) {
    if (this.state !== 'active') return;
    var boost = this.drilling ? 1.6 : 1;
    this.drilling = false;
    DRG.light.add(this.x - cam.x, this.y - cam.y - 20, 190 * boost, 0.75, [120, 205, 255], 0.4);
  };

  /* ======================================================== 矿块（可携带实体） */
  function OreChunk(x, y) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 50; this.vy = -90;
    this.state = 'idle';                        // idle | carried | spent
    this.t = 0; this.dead = false;
    this.kind = 'chunk';
    this.label = '矿块';
    this.slowMul = 0.9;                         // 携带移速 -10%
  }
  OreChunk.prototype.update = function (dt, m) {
    this.t += dt;
    if (this.state === 'spent') return false;
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
  /** 掉落（倒地/死亡）：原地可重拾 */
  OreChunk.prototype.drop = function (p, m) {
    this.state = 'idle';
    this.x = p.x; this.y = p.y - 10;
    this.vx = (Math.random() - 0.5) * 60; this.vy = -120;
    if (m) m.toast('矿块掉落了——回来按 E 重新拾起', '#ffb03c', 3);
  };
  OreChunk.prototype.draw = function (g, cam) {
    if (this.state === 'spent') return;
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var img = spr('aquarq');
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.3 + 0.1 * Math.sin(this.t * 4);
    g.fillStyle = '#7fd4ff';
    g.beginPath(); g.arc(sx, sy, 15, 0, 6.283); g.fill();
    g.restore();
    if (img) gfx.sprite(g, img, sx, sy - 4, 30, { rot: Math.sin(this.t * 1.8) * 0.2 });
    else {
      g.save();
      g.fillStyle = '#6fbde8';
      g.beginPath();
      g.moveTo(sx, sy - 16); g.lineTo(sx + 10, sy - 2); g.lineTo(sx + 4, sy + 10); g.lineTo(sx - 8, sy + 8); g.lineTo(sx - 10, sy - 4);
      g.closePath(); g.fill();
      g.restore();
    }
    if (this.state === 'idle' && this.pl && !this.pl.carriedItem &&
        Math.abs(this.pl.x - this.x) < 90 && Math.abs(this.pl.y - this.y) < 80) {
      gfx.text(g, 'E', sx, sy - 30, { size: 13, align: 'center', col: gfx.pulse(this.t, '#7fd4ff', '#ffffff', 5), alpha: 0.9 });
    }
  };
  OreChunk.prototype.lights = function (cam) {
    if (this.state !== 'spent') DRG.light.add(this.x - cam.x, this.y - cam.y - 8, 120, 0.55, [120, 205, 255], 0.4);
  };

  DRG.PointBeacon = PointBeacon;
  DRG.OreChunk = OreChunk;
  DRG.POINT = { DRILL_TIME: DRILL_TIME };
})(window);
