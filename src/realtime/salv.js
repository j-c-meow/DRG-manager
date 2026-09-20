/* ============================================================
   salv.js — 搜救行动（Salvage Operation）
   信号信标（HUD 指向 + 距离读数）指引 4 条散落的矿骡腿；
   E 拾起（移速 -30%、只能副手，见 player.carryRestriction）→
   矿骡残骸框架处 E 安装（每装 1 条刷一小波防御虫，mission.salvDirector）；
   4 条装齐后对准矿骡长按 E 修复 3 秒（进度环，松开保留进度）。
   素材 public/assets/realtime/mule_leg.png 由 umodel 导出官方
   Icon_Salvage__Mini_Mule_Leg UI 图标像素化而来；残骸复用 obj_molly。
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M, gfx = DRG.gfx, T = DRG.CFG.TILE;
  var A = function () { return DRG.assets || { img: {}, get: function () { return null; } }; };

  function ensureSprite(key, path) {
    if (!DRG.assets || !root.Image) return;
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
  DRG.loadSalvSprites = function () {
    ensureSprite('mule_leg', 'assets/realtime/mule_leg.png');
  };
  function spr(key) {
    var img = A().get(key);
    return img && img.width > 2 ? img : null;
  }

  /* ======================================================== 信号信标（指引矿骡腿） */
  function SalvBeacon(x, groundY, leg) {
    this.x = x; this.y = groundY;
    this.leg = leg;                             // 绑定的矿骡腿
    this.t = Math.random() * 10;
  }
  SalvBeacon.prototype.update = function (dt, m) {
    this.t += dt;
    if (Math.random() < dt * 6) {
      m.fx.spawn({ x: this.x, y: this.y - 46, vx: (Math.random() - .5) * 14, vy: -26, life: .7, size: 2, col: '#ffd76a', kind: 4, glow: 16 });
    }
    return true;
  };
  SalvBeacon.prototype.beam = function (g, cam) {
    if (!this.leg || this.leg.state !== 'idle') return;   // 腿被拾起后信标熄灭
    var sx = this.x - cam.x;
    var top = -40, hgt = (this.y - cam.y) - top;
    var w = 11 + Math.sin(this.t * 2.8) * 2;
    g.save();
    g.globalCompositeOperation = 'lighter';
    var grd = g.createLinearGradient(sx - w, 0, sx + w, 0);
    grd.addColorStop(0, 'rgba(255,205,100,0)');
    grd.addColorStop(0.5, 'rgba(255,215,106,0.3)');
    grd.addColorStop(1, 'rgba(255,205,100,0)');
    g.fillStyle = grd;
    g.fillRect(sx - w, top, w * 2, hgt);
    g.restore();
  };
  SalvBeacon.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    g.save();
    g.strokeStyle = '#4a525e'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx, sy - 44); g.stroke();
    g.strokeStyle = '#5d6772'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(sx, sy - 30); g.lineTo(sx - 9, sy - 44); g.moveTo(sx, sy - 30); g.lineTo(sx + 9, sy - 44); g.stroke();
    g.fillStyle = '#2a3038';
    g.beginPath(); g.ellipse(sx, sy, 12, 4, 0, 0, 6.283); g.fill();
    g.restore();
    // blinking head（腿拾走后半亮慢闪）
    var on = this.leg && this.leg.state === 'idle';
    var blink = on ? (0.55 + 0.45 * Math.sin(this.t * 5)) : (0.14 + 0.1 * Math.sin(this.t * 1.6));
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = blink;
    g.fillStyle = '#ffd76a';
    g.beginPath(); g.arc(sx, sy - 48, 4.2, 0, 6.283); g.fill();
    g.restore();
  };
  SalvBeacon.prototype.lights = function (cam) {
    var on = this.leg && this.leg.state === 'idle';
    DRG.light.add(this.x - cam.x, this.y - cam.y - 46, on ? 150 : 60, on ? 0.7 : 0.2, [255, 215, 106], 0.35);
  };

  /* ======================================================== 矿骡腿（可携带实体） */
  function MuleLeg(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.state = 'idle';                        // idle | carried | installed
    this.t = 0; this.dead = false;
    this.kind = 'leg';
    this.label = '矿骡腿';
    this.slowMul = 0.7;                         // 携带移速 -30%
  }
  MuleLeg.prototype.update = function (dt, m) {
    this.t += dt;
    if (this.state === 'installed') return true;
    var p = m.player;
    this.pl = p;
    if (this.state === 'carried') {
      this.x = p.x; this.y = p.y - 58 + Math.sin(this.t * 5) * 2;
      return true;
    }
    this.vy += DRG.CFG.GRAVITY * 0.6 * dt;
    var nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
    if (m.world.solidPx(nx, this.y)) { this.vx *= -0.4; nx = this.x; }
    if (m.world.solidPx(this.x, ny)) { this.vy = 0; this.vx *= 0.6; ny = this.y; }
    this.x = nx; this.y = ny;
    return true;
  };
  MuleLeg.prototype.drop = function (p, m) {
    this.state = 'idle';
    this.x = p.x; this.y = p.y - 10;
    this.vx = (Math.random() - 0.5) * 50; this.vy = -110;
    if (m) m.toast(L('矿骡腿掉落了——回来按 E 重新扛起'), '#ffb03c', 3);
  };
  MuleLeg.prototype.draw = function (g, cam) {
    if (this.state === 'installed') return;
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var img = spr('mule_leg');
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.22 + 0.08 * Math.sin(this.t * 4);
    g.fillStyle = '#b0ff7a';
    g.beginPath(); g.arc(sx, sy, 16, 0, 6.283); g.fill();
    g.restore();
    if (img) gfx.sprite(g, img, sx, sy - 4, 34, { rot: Math.sin(this.t * 1.6) * 0.12 });
    else {
      g.save();
      g.fillStyle = '#9ed44f';
      g.fillRect(sx - 5, sy - 18, 10, 30);
      g.fillStyle = '#6f9a3a';
      g.fillRect(sx - 8, sy + 8, 16, 6);
      g.restore();
    }
    if (this.state === 'idle' && this.pl && !this.pl.carriedItem &&
        Math.abs(this.pl.x - this.x) < 90 && Math.abs(this.pl.y - this.y) < 80) {
      gfx.text(g, 'E', sx, sy - 32, { size: 13, align: 'center', col: gfx.pulse(this.t, '#b0ff7a', '#ffffff', 5), alpha: 0.9 });
    }
  };
  MuleLeg.prototype.lights = function (cam) {
    if (this.state === 'idle') DRG.light.add(this.x - cam.x, this.y - cam.y - 8, 90, 0.4, [176, 255, 122], 0.3);
  };

  /* ======================================================== 矿骡残骸框架（安装 + 长按修复） */
  function MuleWreck(x, groundY) {
    this.x = x; this.y = groundY;
    this.h = 30;
    this.installed = 0;                         // 已装上的腿数
    this.legs = [];                             // 装上的腿实体（画在框架上）
    this.repairT = 0;                           // 修复进度（秒）
    this.repairing = false;                     // 本帧是否在修（粒子/HUD 用）
    this.state = 'await';                       // await | ready | repaired
    this.t = 0;
  }
  MuleWreck.REPAIR_TIME = 3;

  MuleWreck.prototype.canInstall = function (p) {
    return this.state !== 'repaired' && !!p.carriedItem && p.carriedItem.kind === 'leg' &&
      Math.abs(p.x - this.x) < 86 && Math.abs(p.y - this.y) < 100;
  };
  MuleWreck.prototype.install = function (p, m) {
    var leg = p.carriedItem;
    if (!this.canInstall(p)) return false;
    leg.state = 'installed';
    p.carriedItem = null;
    this.installed++;
    this.legs.push(leg);
    m.fx.burst(this.x, this.y - 26, 16, { col: ['#b0ff7a', '#e8ffd0', '#ffd76a'], speed: 190, life: 0.5, kind: 1 });
    m.fx.text(this.x, this.y - 70, L('矿骡腿 ') + this.installed + '/4', '#b0ff7a', 16);
    DRG.audio.sfx('deposit');
    DRG.audio.clipOf(['rns_1', 'rns_2', 'rns_3'], 0.6, true);
    if (this.installed >= 4) {
      this.state = 'ready';
      m.mc(L('所有矿骡腿都已装上！现在修复她——长按互动键，我们会送她回家的！'));
      m.toast(L('四条腿装齐 · 对准矿骡长按 E 修复（松开保留进度）'), '#b0ff7a', 6);
    } else {
      m.toast(L('矿骡腿已安装（') + this.installed + L('/4）· 防御虫来袭！'), '#ff8a5a', 3);
    }
    return true;
  };
  MuleWreck.prototype.canRepair = function (p) {
    return this.state === 'ready' && !p.downed &&
      Math.abs(p.x - this.x) < 110 && Math.abs(p.y - this.y) < 110;
  };
  /** 长按修复：每帧由 mission.salvDirector 调用（holding = 互动键按住且在范围内） */
  MuleWreck.prototype.repair = function (dt, holding, m) {
    if (this.state !== 'ready') return false;
    this.repairing = !!holding;
    if (!holding) return true;                  // 松开保留进度
    this.repairT += dt;
    if (Math.random() < dt * 22) {
      m.fx.burst(this.x + (Math.random() - .5) * 60, this.y - 10 - Math.random() * 30, 2, {
        col: ['#ffd76a', '#fff2c0', '#ff9a5a'], speed: 150, life: 0.35, size: 2.2, kind: 1
      });
    }
    if (Math.random() < dt * 10) DRG.audio.sfx('pick', m.panOf(this.x), 0.8);
    if (this.repairT >= MuleWreck.REPAIR_TIME) {
      this.state = 'repaired';
      this.repairing = false;
      m.onWreckRepaired();
      return false;
    }
    return true;
  };
  MuleWreck.prototype.repairFrac = function () {
    return M.clamp(this.repairT / MuleWreck.REPAIR_TIME, 0, 1);
  };

  MuleWreck.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var img = spr('mule_leg');
    var molly = A().get('obj_molly');

    g.save();
    g.globalAlpha = 0.3; g.fillStyle = '#000';
    g.beginPath(); g.ellipse(sx, sy + 2, 40, 7, 0, 0, 6.283); g.fill();
    g.restore();

    // 残骸本体：莫莉压暗 + 灰化（她倒了很久了）
    if (molly && molly.width) {
      gfx.sprite(g, molly, sx, sy - this.h * 0.7, this.h * 1.7, { rot: -0.06 });
      gfx.spriteTint(g, molly, sx, sy - this.h * 0.7, this.h * 1.7, '#39414c', 0.55, false);
    } else {
      g.save();
      g.fillStyle = '#4a525e';
      g.fillRect(sx - 22, sy - 30, 44, 30);
      g.restore();
    }

    // 四个腿位：装上的画腿，缺的画虚线空位
    var slots = [-1, 1, -2.2, 2.2];             // 相对框架的横向偏移（px 比例）
    for (var i = 0; i < 4; i++) {
      var lx = sx + slots[i] * 14, ly = sy - 6 - (i > 1 ? 16 : 0);
      if (i < this.legs.length) {
        var rot = (slots[i] > 0 ? 1 : -1) * (0.5 + (i > 1 ? 0.2 : 0));
        if (img) gfx.sprite(g, img, lx, ly - 8, 26, { rot: rot });
        else {
          g.save();
          g.translate(lx, ly - 8); g.rotate(rot);
          g.fillStyle = '#9ed44f'; g.fillRect(-4, -12, 8, 24);
          g.restore();
        }
      } else {
        g.save();
        g.strokeStyle = 'rgba(176,255,122,0.4)';
        g.lineWidth = 1.6; g.setLineDash([4, 3]);
        g.beginPath(); g.arc(lx, ly - 8, 9, 0, 6.283); g.stroke();
        g.restore();
      }
    }

    // 修复进度环
    if (this.state === 'ready' && this.repairT > 0.02) {
      gfx.ring(g, sx, sy - 64, 20, this.repairFrac(), '#b0ff7a', 5);
      gfx.text(g, this.repairing ? L('修复中 ') + Math.round(this.repairFrac() * 100) + '%' : L('修复进度 ') + Math.round(this.repairFrac() * 100) + '%' + L('（长按 E 继续）'),
        sx, sy - 92, { size: 12, align: 'center', col: this.repairing ? '#b0ff7a' : '#cfd8e0' });
    } else if (this.state === 'ready') {
      gfx.text(g, L('长按 E 修复矿骡'), sx, sy - 64 + Math.sin(this.t * 4) * 2,
        { size: 13, align: 'center', col: gfx.pulse(this.t, '#b0ff7a', '#ffffff', 6), alpha: 0.9 });
    } else if (this.state === 'await') {
      gfx.text(g, L('矿骡残骸 · 还差 ') + (4 - this.installed) + L(' 条腿'), sx, sy - 60,
        { size: 12, align: 'center', col: '#9aa8b6', alpha: 0.85 });
    }
    if (this.state === 'repaired') {
      g.save();
      g.globalCompositeOperation = 'lighter';
      var blink = 0.4 + 0.3 * Math.sin(this.t * 6);
      g.fillStyle = 'rgba(176,255,122,' + blink + ')';
      g.beginPath(); g.arc(sx, sy - this.h * 1.5 - 12, 4, 0, 6.283); g.fill();
      g.restore();
    }
  };
  MuleWreck.prototype.lights = function (cam) {
    var col = this.state === 'repaired' ? [176, 255, 122] : [200, 215, 235];
    DRG.light.add(this.x - cam.x, this.y - cam.y - 22, this.state === 'repaired' ? 200 : 140, this.state === 'repaired' ? 0.6 : 0.3, col, 0.25);
    if (this.repairing) DRG.light.add(this.x - cam.x, this.y - cam.y - 24, 170, 0.5 + Math.random() * 0.3, [255, 215, 106], 0.4);
  };

  DRG.SalvBeacon = SalvBeacon;
  DRG.MuleLeg = MuleLeg;
  DRG.MuleWreck = MuleWreck;
  DRG.SALV = { REPAIR_TIME: MuleWreck.REPAIR_TIME };
})(window);
