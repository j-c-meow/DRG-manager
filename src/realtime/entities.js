/* ============================================================
   entities.js — pickups, flares, bullets, explosives, M.U.L.E.,
   Bosco, drop pod, resupply pod, sentry, shield bubble
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M, gfx = DRG.gfx, T = DRG.CFG.TILE;
  var A = function () { return DRG.assets; };

  /* ---------------------------------------------------------- pickup */
  function Pickup(x, y, ore, amount) {
    this.x = x; this.y = y; this.ore = ore; this.amount = amount || 1;
    this.vx = (Math.random() - 0.5) * 90; this.vy = -110 - Math.random() * 70;
    this.life = 999; this.t = 0; this.collect = 0; this.dead = false;
    this.info = DRG.ORE_INFO[ore];
  }
  Pickup.prototype.update = function (dt, m) {
    this.t += dt;
    var p = m.player;
    var d = M.dist(this.x, this.y, p.x, p.y);
    if (d < 150) {                                   // magnet
      var s = (1 - d / 150) * 620;
      var a = Math.atan2(p.y - this.y, p.x - this.x);
      this.vx += Math.cos(a) * s * dt; this.vy += Math.sin(a) * s * dt;
      if (d < 24) {
        p.pickUp(this.ore, this.amount, m);
        this.dead = true;
        return false;
      }
    } else {
      this.vy += DRG.CFG.GRAVITY * 0.55 * dt;
      this.vx *= (1 - 1.4 * dt);
    }
    var nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
    if (m.world.solidPx(nx, this.y)) { this.vx *= -0.4; nx = this.x; }
    if (m.world.solidPx(this.x, ny)) { this.vy *= -0.25; this.vx *= 0.6; ny = this.y; }
    this.x = nx; this.y = ny;
    return true;
  };
  Pickup.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y + Math.sin(this.t * 4) * 2;
    var img = A().get(this.info.icon);
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.35;
    g.fillStyle = this.info.color;
    g.beginPath(); g.arc(sx, sy, 13, 0, 6.283); g.fill();
    g.restore();
    gfx.sprite(g, img, sx, sy, 20, { rot: Math.sin(this.t * 2) * 0.25 });
  };
  Pickup.prototype.lights = function (cam) {
    DRG.light.add(this.x - cam.x, this.y - cam.y, 46, 0.34, hexRgb(this.info.color), 0.3);
  };

  function hexRgb(h) {
    return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  }
  DRG.hexRgb = hexRgb;

  /* ---------------------------------------------------------- flare */
  function Flare(x, y, vx, vy, life) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life || 26; this.t = 0; this.stuck = false;
  }
  Flare.prototype.update = function (dt, m) {
    this.t += dt; this.life -= dt;
    if (this.life <= 0) return false;
    if (!this.stuck) {
      this.vy += DRG.CFG.GRAVITY * 0.55 * dt;
      this.vx *= (1 - 0.6 * dt);
      var nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
      if (m.world.solidPx(nx, this.y)) { this.vx *= -0.3; nx = this.x; }
      if (m.world.solidPx(this.x, ny)) { this.vy *= -0.2; this.vx *= 0.5; ny = this.y; }
      this.x = nx; this.y = ny;
      if (M.len(this.vx, this.vy) < 26 && this.t > 0.4) this.stuck = true;
      if (Math.random() < dt * 26) {
        m.fx.spawn({ x: this.x, y: this.y, vx: (Math.random() - .5) * 30, vy: -20 - Math.random() * 30, life: .7, size: 2.4, col: '#ffd08a', kind: 4, grav: -0.15, glow: 26 });
      }
    } else if (Math.random() < dt * 8) {
      m.fx.spawn({ x: this.x, y: this.y - 2, vx: (Math.random() - .5) * 18, vy: -26, life: 1.1, size: 3, col: '#ff9d4a', kind: 2, grav: -0.08 });
    }
    m.world.markExplored(this.x, this.y, 190);
    return true;
  };
  Flare.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var fade = M.clamp(this.life / 4, 0, 1);
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.9 * fade;
    var r = 7 + Math.sin(this.t * 22) * 1.6;
    var grd = g.createRadialGradient(sx, sy, 0, sx, sy, r * 3);
    grd.addColorStop(0, 'rgba(255,240,200,0.95)');
    grd.addColorStop(0.35, 'rgba(255,150,60,0.55)');
    grd.addColorStop(1, 'rgba(255,90,20,0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(sx, sy, r * 3, 0, 6.283); g.fill();
    g.restore();
  };
  Flare.prototype.lights = function (cam) {
    var flick = 0.86 + Math.sin(this.t * 13) * 0.07 + Math.sin(this.t * 27) * 0.05;
    var fade = M.clamp(this.life / 5, 0, 1);
    DRG.light.add(this.x - cam.x, this.y - cam.y, 330 * (0.7 + 0.3 * fade), 1.15 * flick * fade, [255, 176, 96], 0.55 * fade);
  };

  /* ---------------------------------------------------------- bullet */
  function Bullet(o) {
    this.x = o.x; this.y = o.y; this.vx = o.vx; this.vy = o.vy;
    this.dmg = o.dmg; this.life = o.life || 1.2;
    this.foe = !!o.foe;               // fired by a bug
    this.col = o.col || '#ffe6a0';
    this.size = o.size || 2.2;
    this.pierce = o.pierce || 0;
    this.hitRadius = o.hitRadius || 8;
    this.aoe = o.aoe || 0;
    this.trail = o.trail !== false;
    this.glow = o.glow == null ? 0.5 : o.glow;
    this.px = this.x; this.py = this.y;
    this.digs = o.digs || 0;
  }
  Bullet.prototype.update = function (dt, m) {
    this.life -= dt;
    if (this.life <= 0) return false;
    this.px = this.x; this.py = this.y;
    var steps = Math.max(1, Math.ceil(M.len(this.vx, this.vy) * dt / 10));
    for (var s = 0; s < steps; s++) {
      this.x += this.vx * dt / steps;
      this.y += this.vy * dt / steps;
      if (this.foe) {
        var p = m.player;
        if (!p.downed && M.dist(this.x, this.y, p.x, p.y - 8) < 16) {
          p.hurt(this.dmg, m, 'spit');
          this.impact(m, false);
          return false;
        }
        if (m.shield && M.dist(this.x, this.y, m.shield.x, m.shield.y) < m.shield.r) { this.impact(m, false); return false; }
      } else {
        var hit = m.hitEnemyAt(this.x, this.y, this.hitRadius);
        if (hit) {
          m.damageEnemy(hit, this.dmg, this.x, this.y, this.vx, this.vy);
          if (this.aoe) this.impact(m, true);
          if (this.pierce-- <= 0) { if (!this.aoe) this.impact(m, false); return false; }
        }
      }
      if (m.world.solidPx(this.x, this.y)) {
        this.impact(m, true);
        return false;
      }
    }
    return true;
  };
  Bullet.prototype.impact = function (m, terrain) {
    if (this.aoe) {
      m.explode(this.x, this.y, this.aoe, this.dmg * 0.8, this.digs);
    } else {
      m.fx.burst(this.x, this.y, terrain ? 5 : 3, {
        col: terrain ? ['#c9b18a', '#8a7a5e', '#ffe0a0'] : ['#7fff9a', '#a8ff6a'],
        speed: 110, life: 0.3, size: 2.2, kind: 1, glow: 0
      });
      if (this.digs) m.world.digCircle(this.x, this.y, this.digs, 26, m.tileFx);
    }
  };
  Bullet.prototype.draw = function (g, cam) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = this.col;
    g.lineWidth = this.size;
    g.beginPath();
    g.moveTo(this.px - cam.x, this.py - cam.y);
    g.lineTo(this.x - cam.x, this.y - cam.y);
    g.stroke();
    g.fillStyle = '#fff';
    g.globalAlpha = 0.8;
    g.beginPath(); g.arc(this.x - cam.x, this.y - cam.y, this.size * 0.8, 0, 6.283); g.fill();
    g.restore();
  };
  Bullet.prototype.lights = function (cam) {
    if (this.glow <= 0) return;
    DRG.light.add(this.x - cam.x, this.y - cam.y, 70, 0.5 * this.glow, hexRgb(this.col.length === 7 ? this.col : '#ffe6a0'), 0.25);
  };

  /* ---------------------------------------------------------- explosive */
  function Explosive(o) {
    this.x = o.x; this.y = o.y; this.vx = o.vx || 0; this.vy = o.vy || 0;
    this.fuse = o.fuse == null ? 2.2 : o.fuse;
    this.radius = o.radius || 90;
    this.dmg = o.dmg || 120;
    this.dig = o.dig || 0;
    this.sticky = !!o.sticky;
    this.remote = !!o.remote;
    this.armed = false;
    this.t = 0;
  }
  Explosive.prototype.update = function (dt, m) {
    this.t += dt;
    if (!this.remote) this.fuse -= dt;
    this.vy += DRG.CFG.GRAVITY * 0.8 * dt;
    var nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
    if (m.world.solidPx(nx, this.y)) { if (this.sticky) { this.vx = this.vy = 0; } else { this.vx *= -0.4; } nx = this.x; }
    if (m.world.solidPx(this.x, ny)) { if (this.sticky) { this.vx = this.vy = 0; } else { this.vy *= -0.35; this.vx *= 0.7; } ny = this.y; }
    this.x = nx; this.y = ny;
    if (this.t > 0.25) this.armed = true;
    if (this.fuse <= 0) { m.explode(this.x, this.y, this.radius, this.dmg, this.dig); return false; }
    return true;
  };
  Explosive.prototype.detonate = function (m) { m.explode(this.x, this.y, this.radius, this.dmg, this.dig); };
  Explosive.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var blink = this.remote ? (Math.sin(this.t * 8) > 0) : (Math.sin(this.t * (12 + (2.2 - this.fuse) * 12)) > 0);
    g.save();
    g.fillStyle = this.remote ? '#c8c8c8' : '#3c3c3c';
    g.fillRect(sx - 6, sy - 5, 12, 10);
    g.strokeStyle = '#111'; g.lineWidth = 1; g.strokeRect(sx - 6, sy - 5, 12, 10);
    if (blink) {
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = this.remote ? '#5cff7a' : '#ff4a3a';
      g.beginPath(); g.arc(sx, sy - 8, 3, 0, 6.283); g.fill();
    }
    g.restore();
  };
  Explosive.prototype.lights = function (cam) {
    if (Math.sin(this.t * 12) > 0) DRG.light.add(this.x - cam.x, this.y - cam.y - 8, 50, 0.4, this.remote ? [120, 255, 140] : [255, 90, 70], 0.3);
  };

  /* ---------------------------------------------------------- M.U.L.E. */
  function Mule(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.w = 34; this.h = 30;
    this.onGround = false;
    this.t = 0; this.stuck = 0; this.face = 1;
    this.deposits = 0; this.flash = 0;
    this.callTimer = 0; this.lost = 0;
    this.state = 'idle';
  }
  Mule.prototype.update = function (dt, m) {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt * 2);
    var p = m.player;
    var d = M.dist(this.x, this.y, p.x, p.y);
    var target = null;
    if (m.pod && m.pod.state !== 'gone') target = { x: m.pod.x, y: m.pod.y };   // head for extraction
    else if (d > 170 || this.state === 'called') target = { x: p.x, y: p.y };

    var speed = 0;
    if (target) {
      var dx = target.x - this.x;
      if (Math.abs(dx) > 34) { speed = M.sign(dx) * 150; this.face = M.sign(dx); }
      else if (this.state === 'called') this.state = 'idle';
    }
    // she is a mule, not a mountaineer: if she loses the dwarf, she catches up
    this.lost = d > 460 ? this.lost + dt : 0;
    this.vx = M.damp(this.vx, speed, 9, dt);
    this.vy += DRG.CFG.GRAVITY * dt;

    // walk with a generous step-up so she copes with rough tunnels
    var w = m.world;
    var nx = this.x + this.vx * dt;
    if (w.rectSolid(nx - this.w / 2, this.y - this.h, this.w, this.h)) {
      var climbed = false;
      for (var up = 1; up <= 3; up++) {
        if (!w.rectSolid(nx - this.w / 2, this.y - this.h - up * T * 0.7, this.w, this.h)) {
          this.y -= up * T * 0.7; climbed = true; break;
        }
      }
      if (!climbed) { this.vx = 0; nx = this.x; this.stuck += dt; } else this.stuck = 0;
    } else this.stuck = Math.max(0, this.stuck - dt);
    this.x = nx;

    var ny = this.y + this.vy * dt;
    if (w.rectSolid(this.x - this.w / 2, ny - this.h, this.w, this.h)) {
      if (this.vy > 0) this.onGround = true;
      this.vy = 0;
    } else { this.y = ny; this.onGround = false; }

    // hopelessly wedged or left behind? she reroutes through the tunnels off-screen
    if ((this.stuck > 3 && target) || this.lost > 4) {
      var spot = m.findStandSpotNear(p.x, p.y, 5);
      if (spot) {
        this.x = spot.x; this.y = spot.y; this.stuck = 0; this.lost = 0;
        m.fx.burst(this.x, this.y, 12, { col: ['#9ad7ff', '#ffffff'], speed: 130, life: 0.5, kind: 1 });
        m.toast(L('M.U.L.E. 已重新定位到你身边'), '#8ad4ff', 1.6);
      }
    }
    m.world.markExplored(this.x, this.y, 90);
    return true;
  };
  Mule.prototype.canDeposit = function (p) { return M.dist(this.x, this.y - 14, p.x, p.y) < 96; };
  Mule.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var bob = Math.abs(this.vx) > 8 ? Math.sin(this.t * 12) * 2 : Math.sin(this.t * 1.6) * 0.8;
    gfx.sprite(g, A().get('obj_molly'), sx, sy - this.h / 2 + bob, this.h * 1.5, { flip: this.face < 0 });
    if (this.flash > 0) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = this.flash * 0.6;
      gfx.spriteTint(g, A().get('obj_molly'), sx, sy - this.h / 2 + bob, this.h * 1.5, '#7fff9a', this.flash, this.face < 0);
      g.restore();
    }
    // status beacon
    g.save();
    g.globalCompositeOperation = 'lighter';
    var blink = 0.5 + 0.5 * Math.sin(this.t * 4);
    g.fillStyle = 'rgba(120,220,255,' + (0.35 + blink * 0.5) + ')';
    g.beginPath(); g.arc(sx + 8 * this.face, sy - this.h - 4, 3.4, 0, 6.283); g.fill();
    g.restore();
  };
  Mule.prototype.lights = function (cam) {
    DRG.light.add(this.x - cam.x, this.y - cam.y - 20, 210, 0.66, [180, 220, 255], 0.28);
  };

  /* ---------------------------------------------------------- Bosco */
  function Bosco(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.t = 0; this.cool = 0; this.face = 1;
    this.mode = 'follow';        // follow | mine | revive
    this.target = null;          // {tx,ty}
    this.mineT = 0;
    this.laser = null;
    this.reviveT = 0;
    this.reviveCd = 0;
    this.orbit = Math.random() * 6.283;
  }
  Bosco.prototype.update = function (dt, m) {
    this.t += dt; this.cool -= dt; this.orbit += dt * 1.1;
    this.reviveCd -= dt;
    var p = m.player;
    var tx, ty;

    if (p.downed) { this.mode = 'revive'; this.target = null; }
    else if (this.mode === 'revive') { this.mode = 'follow'; this.reviveT = 0; }

    if (this.mode === 'revive') {
      tx = p.x; ty = p.y - 26;
      if (M.dist(this.x, this.y, p.x, p.y) < 60 && this.reviveCd <= 0) {
        this.reviveT += dt;
        if (Math.random() < dt * 30) m.fx.spawn({ x: p.x + (Math.random() - .5) * 24, y: p.y + (Math.random() - .5) * 24, vx: 0, vy: -40, life: .5, size: 2, col: '#7ad7ff', kind: 1, glow: 18 });
        if (this.reviveT > 5.5) {
          p.revive(m);
          this.reviveT = 0; this.mode = 'follow';
          this.reviveCd = 40 + m.hazard.lv * 12;      // Bosco needs to recharge
        }
      }
    } else if (this.mode === 'mine' && this.target) {
      var w = m.world;
      if (w.at(this.target.tx, this.target.ty) === DRG.TT.EMPTY) { this.mode = 'follow'; this.target = null; }
      else {
        tx = this.target.tx * T + T / 2; ty = this.target.ty * T + T / 2 - 34;
        if (M.dist(this.x, this.y, tx, ty + 34) < 90) {
          this.mineT += dt;
          this.laser = { x: this.target.tx * T + T / 2, y: this.target.ty * T + T / 2 };
          if (w.damage(this.target.tx, this.target.ty, 170 * dt, m.tileFx) === 2) {
            m.onTileMined(this.target.tx, this.target.ty, w.at(this.target.tx, this.target.ty), true);
            this.mode = 'follow'; this.target = null; this.laser = null; this.mineT = 0;
          }
          if (Math.random() < dt * 24) m.fx.spawn({ x: this.laser.x + (Math.random() - .5) * 12, y: this.laser.y + (Math.random() - .5) * 12, vx: (Math.random() - .5) * 90, vy: -60, life: .4, size: 2, col: '#9ad7ff', kind: 1, glow: 12 });
        } else this.laser = null;
      }
    }

    if (this.mode === 'follow') {
      this.laser = null;
      tx = p.x - p.face * 34 + Math.cos(this.orbit) * 16;
      ty = p.y - 44 + Math.sin(this.orbit * 1.4) * 9;
      // shoot the nearest bug
      var best = null, bd = 460 * 460;
      for (var i = 0; i < m.enemies.length; i++) {
        var e = m.enemies[i];
        if (e.dead || e.passive) continue;
        var d2 = M.dist2(this.x, this.y, e.x, e.y);
        if (d2 < bd) { bd = d2; best = e; }
      }
      if (best && this.cool <= 0) {
        var ang = Math.atan2(best.y - 6 - this.y, best.x - this.x);
        m.bullets.push(new Bullet({
          x: this.x, y: this.y, vx: Math.cos(ang) * 1250, vy: Math.sin(ang) * 1250,
          dmg: 15, col: '#8fe8ff', size: 2.4, life: 0.7, glow: 0.8
        }));
        DRG.audio.sfx('pistol', m.panOf(this.x), 1.5);
        this.cool = 0.42;
        this.face = best.x > this.x ? 1 : -1;
      }
    }

    if (tx != null) {
      var ax = (tx - this.x) * 6.5 - this.vx * 2.6;
      var ay = (ty - this.y) * 6.5 - this.vy * 2.6;
      this.vx += ax * dt; this.vy += ay * dt;
      this.vx = M.clamp(this.vx, -600, 600); this.vy = M.clamp(this.vy, -600, 600);
      var nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
      if (!m.world.solidPx(nx, this.y)) this.x = nx; else this.vx *= -0.4;
      if (!m.world.solidPx(this.x, ny)) this.y = ny; else this.vy *= -0.4;
      if (Math.abs(this.vx) > 40) this.face = M.sign(this.vx);
    }
    if (Math.random() < dt * 10) {
      m.fx.spawn({ x: this.x, y: this.y + 8, vx: (Math.random() - .5) * 20, vy: 30, life: .35, size: 1.8, col: '#8fd8ff', kind: 1, grav: 0.1, glow: 10 });
    }
    m.world.markExplored(this.x, this.y, 130);
    return true;
  };
  Bosco.prototype.commandMine = function (tx, ty) { this.mode = 'mine'; this.target = { tx: tx, ty: ty }; this.mineT = 0; };
  Bosco.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y + Math.sin(this.t * 3) * 2;
    if (this.laser) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = 'rgba(150,225,255,0.85)';
      g.lineWidth = 2 + Math.sin(this.t * 30) * 0.8;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(this.laser.x - cam.x, this.laser.y - cam.y); g.stroke();
      g.restore();
    }
    gfx.sprite(g, A().get('obj_bosco'), sx, sy, 36, { flip: this.face < 0, rot: M.clamp(this.vx / 900, -0.25, 0.25) });
  };
  Bosco.prototype.lights = function (cam) {
    DRG.light.add(this.x - cam.x, this.y - cam.y, 230, 0.62, [150, 210, 255], 0.3);
  };

  /* ---------------------------------------------------------- drop pod */
  function DropPod(x, groundY) {
    this.x = x; this.targetY = groundY;
    this.y = groundY - 1800;
    this.state = 'incoming';       // incoming | landed | launching | gone
    this.t = 0; this.doorOpen = 0;
    this.h = 190; this.w = 96;
    this.launchT = 0;
  }
  DropPod.prototype.update = function (dt, m) {
    this.t += dt;
    if (this.state === 'incoming') {
      var dy = Math.min(1500 * dt, this.targetY - this.y);
      this.y += dy;
      var tx = Math.floor(this.x / T);
      m.world.carveShaft(tx, Math.floor(this.y / T) + 2, 3, m.tileFx);
      for (var i = 0; i < 3; i++)
        m.fx.spawn({ x: this.x + (Math.random() - .5) * 60, y: this.y + this.h * 0.4, vx: (Math.random() - .5) * 120, vy: 120 + Math.random() * 260, life: .5, size: 5, col: ['#ffd08a', '#ff8a3a', '#fff2c0'][i % 3], kind: 4, grav: -0.2, glow: 24 });
      if (Math.random() < dt * 8) DRG.audio.sfx('thruster');
      if (this.targetY - this.y < 1) {
        this.state = 'landed'; this.y = this.targetY;
        DRG.audio.sfx('podland');
        m.shake(26, 0.9);
        m.world.digCircle(this.x, this.y - 20, 90, 900, m.tileFx);
        m.fx.burst(this.x, this.y, 40, { col: ['#c9b18a', '#7a6a4e', '#ffd08a'], speed: 340, life: 1.1, size: 4 });
        DRG.bus.emit('pod-landed');
      }
    } else if (this.state === 'landed') {
      this.doorOpen = Math.min(1, this.doorOpen + dt * 0.8);
      if (Math.random() < dt * 3) m.fx.spawn({ x: this.x + (Math.random() - .5) * 40, y: this.y - 10, vx: 0, vy: -30, life: 1, size: 4, col: '#5a5a5a', kind: 2, grav: -0.05 });
    } else if (this.state === 'launching') {
      this.launchT += dt;
      this.y -= Math.min(900, this.launchT * this.launchT * 700) * dt;
      for (var j = 0; j < 4; j++)
        m.fx.spawn({ x: this.x + (Math.random() - .5) * 70, y: this.y + this.h * 0.45, vx: (Math.random() - .5) * 200, vy: 260 + Math.random() * 300, life: .6, size: 6, col: ['#ffd08a', '#ff8a3a'][j % 2], kind: 4, grav: -0.3, glow: 30 });
    }
    return true;
  };
  DropPod.prototype.canBoard = function (p) {
    return this.state === 'landed' && Math.abs(p.x - this.x) < 60 && Math.abs(p.y - this.y) < 110;
  };
  DropPod.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    gfx.sprite(g, A().get('obj_droppod'), sx, sy - this.h / 2, this.h * 1.15);
    if (this.state === 'landed') {
      g.save();
      g.globalCompositeOperation = 'lighter';
      var pulse = 0.45 + 0.25 * Math.sin(this.t * 5);
      var grd = g.createLinearGradient(sx, sy - 60, sx, sy + 10);
      grd.addColorStop(0, 'rgba(120,255,150,' + (pulse * 0.35) + ')');
      grd.addColorStop(1, 'rgba(120,255,150,0)');
      g.fillStyle = grd;
      g.fillRect(sx - 34, sy - 60, 68, 70);
      g.restore();
    }
  };
  DropPod.prototype.lights = function (cam) {
    var i = this.state === 'incoming' ? 1.4 : 1.0;
    DRG.light.add(this.x - cam.x, this.y - cam.y - 30, 430, i, [190, 255, 200], 0.5);
    if (this.state === 'incoming' || this.state === 'launching')
      DRG.light.add(this.x - cam.x, this.y - cam.y + this.h * 0.4, 330, 1.5, [255, 170, 90], 0.7);
  };

  /* ---------------------------------------------------------- resupply pod */
  function Resupply(x, groundY) {
    this.x = x; this.targetY = groundY; this.y = groundY - 1500;
    this.state = 'incoming'; this.uses = 2; this.t = 0; this.h = 96;
  }
  Resupply.prototype.update = function (dt, m) {
    this.t += dt;
    if (this.state === 'incoming') {
      this.y += Math.min(1250 * dt, this.targetY - this.y);
      m.world.carveShaft(Math.floor(this.x / T), Math.floor(this.y / T) + 1, 2, m.tileFx);
      for (var i = 0; i < 2; i++)
        m.fx.spawn({ x: this.x + (Math.random() - .5) * 34, y: this.y + 30, vx: (Math.random() - .5) * 90, vy: 130 + Math.random() * 180, life: .4, size: 4, col: '#ffd08a', kind: 4, grav: -0.2, glow: 18 });
      if (this.targetY - this.y < 1) {
        this.state = 'landed'; this.y = this.targetY;
        DRG.audio.sfx('podland');
        m.shake(14, 0.5);
        m.world.digCircle(this.x, this.y - 14, 58, 700, m.tileFx);
        m.toast(L('补给舱已抵达 · RESUPPLY POD LANDED'), '#8ad4ff');
      }
    }
    return this.uses > 0;
  };
  Resupply.prototype.canUse = function (p) { return this.state === 'landed' && M.dist(this.x, this.y - 20, p.x, p.y) < 76; };
  Resupply.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    gfx.sprite(g, A().get('obj_resupply'), sx, sy - this.h / 2, this.h);
    if (this.state === 'landed') {
      gfx.text(g, this.uses + '/2', sx, sy - this.h - 6, { size: 15, align: 'center', col: '#ffd76a' });
    }
  };
  Resupply.prototype.lights = function (cam) {
    DRG.light.add(this.x - cam.x, this.y - cam.y - 20, 250, 0.8, [255, 210, 140], 0.35);
  };

  /* ---------------------------------------------------------- sentry gun */
  function Sentry(x, y) {
    this.x = x; this.y = y; this.ang = -0.4; this.cool = 0;
    this.ammo = 90; this.life = 55; this.t = 0;
  }
  Sentry.prototype.update = function (dt, m) {
    this.t += dt; this.life -= dt; this.cool -= dt;
    if (this.life <= 0 || this.ammo <= 0) {
      m.fx.burst(this.x, this.y, 14, { col: ['#8899aa', '#ffd08a'], speed: 150, life: 0.6 });
      return false;
    }
    var best = null, bd = 430 * 430;
    for (var i = 0; i < m.enemies.length; i++) {
      var e = m.enemies[i];
      if (e.dead || e.passive) continue;
      var d2 = M.dist2(this.x, this.y, e.x, e.y);
      if (d2 < bd) { bd = d2; best = e; }
    }
    if (best) {
      var want = Math.atan2(best.y - 8 - this.y, best.x - this.x);
      this.ang = M.angleLerp(this.ang, want, M.clamp(dt * 8, 0, 1));
      if (this.cool <= 0 && Math.abs(((want - this.ang + Math.PI * 3) % 6.283) - Math.PI) < 0.2) {
        this.cool = 0.16; this.ammo--;
        m.bullets.push(new Bullet({
          x: this.x + Math.cos(this.ang) * 16, y: this.y - 8 + Math.sin(this.ang) * 16,
          vx: Math.cos(this.ang) * 1500, vy: Math.sin(this.ang) * 1500,
          dmg: 11, col: '#ffe08a', size: 2, life: 0.6, glow: 0.6
        }));
        DRG.audio.sfx('rifle', m.panOf(this.x), 1.4);
      }
    }
    return true;
  };
  Sentry.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    g.save();
    g.fillStyle = '#2b3340';
    g.fillRect(sx - 12, sy - 8, 24, 10);
    g.fillStyle = '#3c4756';
    g.fillRect(sx - 8, sy - 14, 16, 8);
    g.translate(sx, sy - 12); g.rotate(this.ang);
    g.fillStyle = '#5a6a7c';
    g.fillRect(0, -3, 20, 6);
    g.fillStyle = '#8d9aa8';
    g.fillRect(14, -2, 8, 4);
    g.restore();
    var f = this.life / 55;
    gfx.bar(g, sx - 14, sy - 26, 28, 4, f, f > 0.3 ? '#7fd4ff' : '#ff8a5a');
  };
  Sentry.prototype.lights = function (cam) {
    DRG.light.add(this.x - cam.x, this.y - cam.y - 12, 130, 0.4, [255, 220, 160], 0.2);
  };

  /* ---------------------------------------------------------- shield bubble */
  function Shield(x, y, life) {
    this.x = x; this.y = y; this.r = 118; this.life = life || 13; this.t = 0;
  }
  Shield.prototype.update = function (dt, m) {
    this.t += dt; this.life -= dt;
    if (M.dist(this.x, this.y, m.player.x, m.player.y) < this.r) m.player.inShield = true;
    return this.life > 0;
  };
  Shield.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var fade = M.clamp(this.life / 2, 0, 1);
    g.save();
    g.globalCompositeOperation = 'lighter';
    var grd = g.createRadialGradient(sx, sy, this.r * 0.55, sx, sy, this.r);
    grd.addColorStop(0, 'rgba(90,190,255,0.03)');
    grd.addColorStop(0.85, 'rgba(120,210,255,' + (0.20 * fade) + ')');
    grd.addColorStop(1, 'rgba(180,240,255,' + (0.42 * fade) + ')');
    g.fillStyle = grd;
    g.beginPath(); g.arc(sx, sy, this.r, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(170,235,255,' + (0.5 * fade) + ')';
    g.lineWidth = 2;
    g.beginPath(); g.arc(sx, sy, this.r + Math.sin(this.t * 6) * 1.5, 0, 6.283); g.stroke();
    g.restore();
  };
  Shield.prototype.lights = function (cam) {
    DRG.light.add(this.x - cam.x, this.y - cam.y, this.r * 2.1, 0.75, [150, 215, 255], 0.4);
  };

  DRG.Ent = { Pickup: Pickup, Flare: Flare, Bullet: Bullet, Explosive: Explosive, Mule: Mule, Bosco: Bosco, DropPod: DropPod, Resupply: Resupply, Sentry: Sentry, Shield: Shield };
})(window);
