/* ============================================================
   enemies.js — Glyphids & friends. Walkers climb walls and chew
   through soft rock, fliers hover and spit.
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M, gfx = DRG.gfx, T = DRG.CFG.TILE;
  var A = function () { return DRG.assets; };

  var TYPES = DRG.ENEMY_TYPES = {
    swarmer: { name: '虫群幼虫 Swarmer', img: 'bug_swarmer', hp: 16, spd: 200, dmg: 6, w: 16, h: 13, size: 26, xp: 3, credits: 0, melee: 0.5, kind: 'walk', climb: 1.1, dig: 22 },
    grunt: { name: '异形虫兵 Grunt', img: 'bug_grunt', hp: 60, spd: 118, dmg: 13, w: 24, h: 20, size: 42, xp: 8, credits: 1, melee: 0.75, kind: 'walk', climb: 1.0, dig: 42 },
    guard: { name: '异形卫士 Guard', img: 'bug_guard', hp: 150, spd: 92, dmg: 20, w: 30, h: 24, size: 52, xp: 16, credits: 3, melee: 0.9, kind: 'walk', climb: 0.85, dig: 52, armor: 0.55 },
    exploder: { name: '爆裂虫 Exploder', img: 'bug_exploder', hp: 34, spd: 132, dmg: 42, w: 22, h: 20, size: 40, xp: 12, credits: 2, kind: 'boom', climb: 0.9, dig: 30 },
    praetorian: { name: '禁卫军 Praetorian', img: 'bug_praetorian', hp: 420, spd: 74, dmg: 30, w: 46, h: 34, size: 76, xp: 46, credits: 9, melee: 1.15, kind: 'walk', climb: 0.6, dig: 90, armor: 0.6, spit: 2.6 },
    mactera: { name: '麦克特拉 Mactera', img: 'bug_mactera', hp: 78, spd: 148, dmg: 12, w: 26, h: 22, size: 46, xp: 14, credits: 3, kind: 'fly', spit: 1.5 },
    lootbug: { name: '肥虫 Loot Bug', img: 'bug_lootbug', hp: 46, spd: 44, dmg: 0, w: 26, h: 20, size: 44, xp: 6, credits: 0, kind: 'passive', loot: 'gold', lootN: 4 },
    goldbug: { name: '黄金肥虫 Golden Loot Bug', img: 'bug_lootbug_gold', hp: 80, spd: 96, dmg: 0, w: 28, h: 22, size: 48, xp: 25, credits: 0, kind: 'passive', loot: 'gold', lootN: 12 },
    breeder: { name: '孵化虫 Breeder', img: 'bug_breeder', hp: 190, spd: 40, dmg: 8, w: 34, h: 30, size: 62, xp: 30, credits: 6, kind: 'fly', spawner: 'swarmer' }
  };

  function Enemy(type, x, y, hazMul) {
    var d = TYPES[type];
    this.type = type; this.def = d;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.w = d.w; this.h = d.h;
    this.maxHp = Math.round(d.hp * (hazMul || 1));
    this.hp = this.maxHp;
    this.spd = d.spd * (0.9 + Math.random() * 0.25);
    this.face = Math.random() < 0.5 ? -1 : 1;
    this.onGround = false; this.climbing = false;
    this.t = Math.random() * 10; this.hitFlash = 0;
    this.attackCd = 0; this.spitCd = (d.spit || 0) * Math.random();
    this.stuck = 0; this.dead = false;
    this.passive = d.kind === 'passive';
    this.state = 'idle';
    this.fuse = 0;
    this.alarm = 0;
    this.wander = (Math.random() < 0.5 ? -1 : 1);
    this.spawnCd = 6;
    this.hurtSound = 0;
    this.bob = Math.random() * 6.283;
  }

  Enemy.prototype.hurt = function (dmg, m, fromX) {
    if (this.dead) return;
    var armor = this.def.armor || 0;
    // hitting from behind ignores the armour plating, DRG-style weakspot feel
    if (armor && fromX != null) {
      var behind = (fromX - this.x) * this.face < 0;
      dmg *= behind ? 1 : (1 - armor * 0.5);
    }
    this.hp -= dmg;
    this.hitFlash = 1;
    if (this.passive) this.state = 'flee';
    if (this.alarm <= 0) this.alarm = 1;
    if (performance.now() - this.hurtSound > 260) {
      this.hurtSound = performance.now();
      DRG.audio.sfx('bughit', m.panOf(this.x));
      if (this.type === 'lootbug' || this.type === 'goldbug') DRG.audio.clip('lootbug_hurt', 0.5);
    }
    if (this.hp <= 0) this.die(m);
  };

  Enemy.prototype.die = function (m) {
    if (this.dead) return;
    this.dead = true;
    m.onEnemyKilled(this);
    DRG.audio.sfx('bugdie', m.panOf(this.x));
    m.fx.burst(this.x, this.y - this.h * 0.3, 16, {
      col: ['#7fe08a', '#4fae66', '#d8ff9a'], speed: 210, life: 0.7, size: 3.4, kind: 3
    });
    m.fx.burst(this.x, this.y - this.h * 0.3, 6, { col: ['#2b3a22'], speed: 90, life: 1.2, size: 5, kind: 2, grav: 0.1 });
    if (this.def.loot) {
      for (var i = 0; i < this.def.lootN; i++) m.pickups.push(new DRG.Ent.Pickup(this.x, this.y - 8, this.def.loot, 1));
    }
    if (this.type === 'exploder') this.boom(m);
  };

  Enemy.prototype.boom = function (m) {
    m.explode(this.x, this.y - 8, 104, this.def.dmg, 46);
    DRG.audio.clip('exploder_expand', 0.7);
  };

  Enemy.prototype.update = function (dt, m) {
    if (this.dead) return false;
    this.t += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
    this.attackCd -= dt; this.spitCd -= dt; this.alarm -= dt;
    var p = m.player, w = m.world;
    /* 执勤护送目标权重：朵蕾妲 > 玩家（m.escortPrey 返回 {x,y,doretta} 或 null） */
    var prey = m.escortPrey ? m.escortPrey(this) : null;
    var px = prey ? prey.x : p.x, py = prey ? prey.y : (p.y - 10);
    var dx = px - this.x, dy = py - this.y;
    var dist = M.len(dx, dy);
    var aware = dist < 620 && !p.downedFully;

    if (this.def.kind === 'fly') this.updateFly(dt, m, dx, dy, dist, aware, prey);
    else if (this.passive) this.updatePassive(dt, m, dist);
    else this.updateWalk(dt, m, dx, dy, dist, aware, prey);

    // announce themselves once in a while
    if (aware && this.alarm <= 0 && Math.random() < dt * 0.25) {
      this.alarm = 6 + Math.random() * 8;
      var pan = m.panOf(this.x);
      if (this.type === 'praetorian') DRG.audio.clip('prae_scream', 0.55);
      else if (this.type === 'exploder') DRG.audio.clip('exploder_scream', 0.45);
      else if (this.def.kind === 'fly') DRG.audio.clip('mactera_detect', 0.4);
      else if (Math.random() < 0.5) DRG.audio.clipOf(['grunt_detect_1', 'grunt_detect_2'], 0.4);
    }
    return !this.dead;
  };

  Enemy.prototype.tryAttack = function (m, dist, prey) {
    var p = m.player;
    var tgt = prey && prey.doretta && !prey.doretta.dead ? prey.doretta : null;
    if (this.def.melee && dist < this.def.melee * 46 + 18 && this.attackCd <= 0 && (tgt || !p.downed)) {
      this.attackCd = 1.15;
      if (tgt) {
        /* 优先啃咬朵蕾妲 */
        tgt.hurt(this.def.dmg * m.hazard.dmgMul, m, this.x);
        m.fx.burst(tgt.x + (this.x < tgt.x ? -30 : 30), tgt.y - tgt.h * 0.5, 6, { col: ['#ff6a5a', '#ffd08a'], speed: 160, life: 0.35, kind: 1 });
      } else {
        p.hurt(this.def.dmg * m.hazard.dmgMul, m, 'bite');
        m.fx.burst(p.x, p.y - 10, 6, { col: ['#ff6a5a', '#ffd08a'], speed: 160, life: 0.35, kind: 1 });
      }
      DRG.audio.clipOf(['grunt_attack_1', 'grunt_attack_2'], 0.5);
      this.state = 'attack';
    }
  };

  Enemy.prototype.updateWalk = function (dt, m, dx, dy, dist, aware, prey) {
    var w = m.world, p = m.player;
    var wantX = 0;
    if (aware) {
      wantX = M.sign(dx) * this.spd * (this.def.kind === 'boom' ? 1.18 : 1);
      this.face = M.sign(dx) || this.face;
      this.state = 'chase';
      this.tryAttack(m, dist, prey);
      if (this.def.kind === 'boom' && dist < 54 && this.fuse === 0) { this.fuse = 0.65; DRG.audio.clip('exploder_scream', 0.6); }
      /* 锁定朵蕾妲的虫不吐酸（酸弹只判玩家命中），贴上去用咬的 */
      if (this.def.spit && !(prey && prey.doretta) && this.spitCd <= 0 && dist > 120 && dist < 460) {
        this.spitCd = this.def.spit + Math.random();
        var a = Math.atan2((p.y - 12) - (this.y - 10), p.x - this.x);
        m.bullets.push(new DRG.Ent.Bullet({
          x: this.x + Math.cos(a) * 22, y: this.y - 12 + Math.sin(a) * 16,
          vx: Math.cos(a) * 520, vy: Math.sin(a) * 520 - 60,
          dmg: 14 * m.hazard.dmgMul, foe: true, col: '#a6ff5a', size: 4, life: 2.2, glow: 0.7
        }));
      }
    } else {
      if (Math.random() < dt * 0.6) this.wander *= -1;
      wantX = this.wander * this.spd * 0.35;
      this.face = M.sign(wantX) || this.face;
      this.state = 'idle';
    }
    if (this.fuse > 0) {
      this.fuse -= dt;
      wantX *= 0.35;
      if (this.fuse <= 0) { this.boom(m); this.dead = true; m.onEnemyKilled(this, true); return; }
    }

    this.vx = M.damp(this.vx, wantX, 12, dt);
    this.vy += DRG.CFG.GRAVITY * (this.climbing ? 0.05 : 1) * dt;

    // --- horizontal move with step-up
    var nx = this.x + this.vx * dt;
    if (w.rectSolid(nx - this.w / 2, this.y - this.h, this.w, this.h)) {
      var climbed = false;
      for (var up = 1; up <= 2; up++) {
        if (!w.rectSolid(nx - this.w / 2, this.y - this.h - up * T, this.w, this.h)) {
          this.y -= up * T * 0.9; climbed = true; break;
        }
      }
      if (!climbed) {
        // glyphids climb sheer walls
        if (aware && dy < 20) {
          this.climbing = true;
          this.vy = -this.spd * (this.def.climb || 1) * 0.8;
        } else {
          this.stuck += dt;
          this.vx = 0;
        }
        if (this.stuck > 0.55) {     // chew through the rock
          var tx = Math.floor((this.x + this.face * (this.w / 2 + 4)) / T);
          var ty = Math.floor((this.y - this.h * 0.5) / T);
          if (w.damage(tx, ty, (this.def.dig || 30) * dt * 4, m.tileFx) === 2) {
            m.onTileMined(tx, ty, 0, false);
            this.stuck = 0;
          }
          if (Math.random() < dt * 12) m.fx.burst(tx * T + T / 2, ty * T + T / 2, 2, { col: ['#8a7a5e'], speed: 90, life: 0.35, size: 2.4 });
        }
        nx = this.x;
      } else this.stuck = 0;
    } else {
      this.stuck = Math.max(0, this.stuck - dt);
      if (this.climbing && !w.rectSolid(this.x - this.w / 2 - 3, this.y - this.h, this.w + 6, this.h + 4)) this.climbing = false;
    }
    this.x = nx;

    // --- vertical
    var ny = this.y + this.vy * dt;
    if (w.rectSolid(this.x - this.w / 2, ny - this.h, this.w, this.h)) {
      if (this.vy > 0) { this.onGround = true; this.climbing = false; }
      this.vy = 0;
    } else {
      this.y = ny; this.onGround = false;
    }
    // hop over small ledges / gaps
    if (aware && this.onGround && Math.abs(this.vx) < 22 && this.stuck > 0.3 && Math.random() < dt * 6) {
      this.vy = -420; this.onGround = false;
    }
    if (aware && this.onGround && dy < -40 && Math.random() < dt * 3) { this.vy = -500; }
  };

  Enemy.prototype.updateFly = function (dt, m, dx, dy, dist, aware, prey) {
    var p = m.player, w = m.world;
    var tx, ty;
    if (this.def.spawner) {
      if (aware && this.spawnCd <= 0) {
        this.spawnCd = 9;
        for (var i = 0; i < 3; i++) m.spawnEnemy('swarmer', this.x + (Math.random() - .5) * 40, this.y + 20);
        m.toast('孵化虫释放了虫群！', '#a8ff6a');
      }
      this.spawnCd -= dt;
    }
    if (aware) {
      var pref = this.def.spawner ? 260 : 190;
      var ang = Math.atan2(dy, dx);
      tx = p.x - Math.cos(ang) * pref;
      ty = (p.y - 40) - Math.sin(ang) * pref * 0.5 - 30;
      this.face = M.sign(dx) || this.face;
      if (this.def.spit && !(prey && prey.doretta) && this.spitCd <= 0 && dist < 460) {
        this.spitCd = this.def.spit + Math.random() * 0.8;
        var a2 = Math.atan2((p.y - 12) - this.y, p.x - this.x);
        m.bullets.push(new DRG.Ent.Bullet({
          x: this.x, y: this.y, vx: Math.cos(a2) * 620, vy: Math.sin(a2) * 620,
          dmg: this.def.dmg * m.hazard.dmgMul, foe: true, col: '#c7ff6a', size: 3.4, life: 1.8, glow: 0.6
        }));
        DRG.audio.clip('mactera_attack', 0.4);
      }
    } else {
      tx = this.x + this.wander * 60; ty = this.y + Math.sin(this.t) * 30;
      if (Math.random() < dt * 0.5) this.wander *= -1;
    }
    var ax = (tx - this.x) * 2.4 - this.vx * 1.9;
    var ay = (ty - this.y) * 2.4 - this.vy * 1.9;
    this.vx = M.clamp(this.vx + ax * dt, -this.spd * 1.6, this.spd * 1.6);
    this.vy = M.clamp(this.vy + ay * dt, -this.spd * 1.4, this.spd * 1.4);
    var nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
    if (!w.rectSolid(nx - this.w / 2, this.y - this.h / 2, this.w, this.h)) this.x = nx; else this.vx *= -0.5;
    if (!w.rectSolid(this.x - this.w / 2, ny - this.h / 2, this.w, this.h)) this.y = ny; else this.vy *= -0.5;
    if (dist < 40) this.tryAttack(m, dist, prey);
  };

  Enemy.prototype.updatePassive = function (dt, m, dist) {
    var w = m.world, p = m.player;
    var flee = this.state === 'flee' || dist < 90;
    var wantX;
    if (flee) {
      wantX = -M.sign(p.x - this.x) * this.spd * 2.1;
      if (dist > 420) this.state = 'idle';
    } else {
      if (Math.random() < dt * 0.5) this.wander *= -1;
      wantX = this.wander * this.spd * 0.5;
      if (Math.random() < dt * 0.4) DRG.audio.clip('lootbug', 0.16);
    }
    this.face = M.sign(wantX) || this.face;
    this.vx = M.damp(this.vx, wantX, 8, dt);
    this.vy += DRG.CFG.GRAVITY * dt;
    var nx = this.x + this.vx * dt;
    if (w.rectSolid(nx - this.w / 2, this.y - this.h, this.w, this.h)) {
      if (!w.rectSolid(nx - this.w / 2, this.y - this.h - T, this.w, this.h)) this.y -= T * 0.8;
      else { this.vx *= -1; this.wander *= -1; nx = this.x; }
    }
    this.x = nx;
    var ny = this.y + this.vy * dt;
    if (w.rectSolid(this.x - this.w / 2, ny - this.h, this.w, this.h)) { this.vy = 0; this.onGround = true; }
    else { this.y = ny; this.onGround = false; }
  };

  Enemy.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var img = A().get(this.def.img);
    var walkT = this.t * (6 + Math.abs(this.vx) * 0.06);
    var squash = this.def.kind === 'fly' ? 1 + Math.sin(this.t * 16) * 0.06 : 1 + Math.sin(walkT) * 0.05;
    var rot = this.def.kind === 'fly' ? Math.sin(this.t * 4) * 0.12 : Math.sin(walkT) * 0.06;
    if (this.climbing) rot += 0.5 * this.face;
    var h = this.def.size;
    var yoff = this.def.kind === 'fly' ? Math.sin(this.t * 5 + this.bob) * 5 : 0;
    if (this.fuse > 0) {
      var f = 1 + (0.65 - this.fuse) * 0.9;
      squash *= 1 / f; h *= f;
    }
    // shadow
    g.save();
    g.globalAlpha = 0.28; g.fillStyle = '#000';
    g.beginPath(); g.ellipse(sx, sy + 2, this.w * 0.6, 4, 0, 0, 6.283); g.fill();
    g.restore();

    gfx.sprite(g, img, sx, sy - h * 0.42 + yoff, h, { flip: this.face > 0, rot: rot, squash: squash });
    if (this.hitFlash > 0.02) {
      gfx.spriteTint(g, img, sx, sy - h * 0.42 + yoff, h, '#ffffff', this.hitFlash * 0.8, this.face > 0);
    }
    if (this.fuse > 0) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 + Math.sin(this.t * 40) * 0.3;
      gfx.spriteTint(g, img, sx, sy - h * 0.42, h, '#ff5a3a', 1, this.face > 0);
      g.restore();
    }
    if (this.maxHp > 120 && this.hp < this.maxHp) {
      gfx.bar(g, sx - 24, sy - h - 8, 48, 5, this.hp / this.maxHp, '#ff6a4a');
    }
  };

  Enemy.prototype.lights = function (cam) {
    if (this.type === 'goldbug') DRG.light.add(this.x - cam.x, this.y - cam.y - 10, 150, 0.5, [255, 200, 90], 0.3);
    else if (this.fuse > 0) DRG.light.add(this.x - cam.x, this.y - cam.y - 10, 170, 0.9, [255, 90, 60], 0.5);
  };

  DRG.Enemy = Enemy;
})(window);
