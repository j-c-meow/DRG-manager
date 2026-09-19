/* ============================================================
   elim.js — 消灭任务（Elimination）：无畏机甲 Boss 战
   圆形竞技场（world.generateElim 生成：开阔腔 + 中心茧台）；
   中心虫茧长按 E 破茧（2 秒）→ 无畏机甲出场：
   阶段 1（血量 100~50%）装甲态——腹部发光弱点随时间换位
   （打弱点 ×3 伤害，打装甲 ×0.35）；攻击 = 近战扑击 + 周期召唤小虫；
   阶段 2（血量 <50%）狂暴——移速/攻速 +30%，新增酸弹三连，弱点换位更快。
   血尽 → 胜利；矿工倒地流血过多（沿用 BOSCO 救援机制）→ 失败。
   素材 public/assets/realtime/{dreadnought,cocoon}.png 由官方 Wiki
   Glyphid Dreadnought 渲染图 / Kill Dreadnought Objective icon 处理而来。
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
  DRG.loadElimSprites = function () {
    ensureSprite('dreadnought', 'assets/realtime/dreadnought.png');
    ensureSprite('cocoon', 'assets/realtime/cocoon.png');
  };
  function spr(key) {
    var img = A().get(key);
    return img && img.width > 2 ? img : null;   // 未加载完时回退矢量画法
  }

  var BREAK_TIME = 2;                           // 破茧耗时（秒）
  var WEAK_RADIUS = 17;                         // 弱点判定半径
  var WEAK_MULT = 3, ARMOR_MULT = 0.35;

  /* ======================================================== 虫茧 */
  function Cocoon(x, groundY) {
    this.x = x; this.y = groundY;
    this.t = 0;
    this.state = 'intact';                      // intact | breaking | broken
    this.breakT = 0;
    this.breaking = false;
    this.wob = 0;
  }
  Cocoon.prototype.canBreak = function (p) {
    return this.state === 'intact' && !p.downed &&
      Math.abs(p.x - this.x) < 92 && Math.abs(p.y - this.y) < 110;
  };
  /** 长按破茧：每帧由 mission.elimDirector 调用 */
  Cocoon.prototype.breakUpdate = function (dt, holding, m) {
    if (this.state !== 'intact') return false;
    this.breaking = !!holding;
    if (!holding) return true;
    this.breakT += dt;
    this.wob = Math.sin(this.breakT * 22) * 0.06;
    if (Math.random() < dt * 14) {
      m.fx.burst(this.x + (Math.random() - 0.5) * 30, this.y - 26 - Math.random() * 20, 2, {
        col: ['#c8a4ff', '#ff7a5a', '#ffd76a'], speed: 150, life: 0.4, size: 2.6, kind: 1
      });
    }
    m.shake(1.4 + this.breakT * 1.2, 0.05);
    if (this.breakT % 0.5 < dt) DRG.audio.sfx('pick', m.panOf(this.x), 1.3);
    if (this.breakT >= BREAK_TIME) {
      this.state = 'broken';
      this.breaking = false;
      m.onCocoonBroken(this);
      return false;
    }
    return true;
  };
  Cocoon.prototype.breakFrac = function () {
    return M.clamp(this.breakT / BREAK_TIME, 0, 1);
  };
  Cocoon.prototype.update = function (dt, m) {
    this.t += dt;
    if (this.state === 'intact' && Math.random() < dt * 2.2) {
      m.fx.spawn({ x: this.x + (Math.random() - 0.5) * 26, y: this.y - 30, vx: (Math.random() - 0.5) * 10, vy: -18, life: 0.9, size: 2, col: '#ff7a5a', kind: 4, glow: 14 });
    }
    return this.state !== 'broken';
  };
  Cocoon.prototype.draw = function (g, cam) {
    if (this.state === 'broken') return;
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var t = this.t;
    var img = spr('cocoon');

    g.save();
    g.globalAlpha = 0.3; g.fillStyle = '#000';
    g.beginPath(); g.ellipse(sx, sy + 2, 30, 6, 0, 0, 6.283); g.fill();
    g.restore();

    // 茧衣裂纹（越破越亮）
    var pulse = 0.35 + 0.2 * Math.sin(t * 3.4) + this.breakFrac() * 0.5;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = pulse * 0.5;
    g.fillStyle = '#ff7a5a';
    g.beginPath(); g.arc(sx, sy - 26, 30, 0, 6.283); g.fill();
    g.restore();

    g.save();
    g.translate(sx, sy);
    g.rotate(this.wob || Math.sin(t * 1.8) * 0.03);
    if (img) gfx.sprite(g, img, 0, -30, 56);
    else {
      // 矢量回退：紫基座 + 橙茧
      g.fillStyle = '#7a3cc8';
      g.beginPath();
      g.moveTo(-22, 0); g.lineTo(-14, -14); g.lineTo(0, -10); g.lineTo(14, -14); g.lineTo(22, 0);
      g.lineTo(10, -4); g.lineTo(-10, -4); g.closePath(); g.fill();
      g.fillStyle = '#d4502a';
      g.beginPath(); g.ellipse(0, -32, 17, 24, 0, 0, 6.283); g.fill();
      g.fillStyle = '#e8764a';
      g.beginPath(); g.ellipse(-4, -38, 7, 10, -0.4, 0, 6.283); g.fill();
    }
    g.restore();

    if (this.breakT > 0.04) {
      gfx.ring(g, sx, sy - 74, 18, this.breakFrac(), '#ff7a5a', 5);
      gfx.text(g, '破茧中 ' + Math.round(this.breakFrac() * 100) + '%' + (this.breaking ? '' : '（长按 E 继续）'),
        sx, sy - 100, { size: 12, align: 'center', col: this.breaking ? '#ff7a5a' : '#cfd8e0' });
    } else {
      gfx.text(g, '无畏虫茧 · 长按 E 破茧', sx, sy - 74 + Math.sin(t * 4) * 2,
        { size: 13, align: 'center', col: gfx.pulse(t, '#ff7a5a', '#ffd0c0', 5), alpha: 0.9 });
    }
  };
  Cocoon.prototype.lights = function (cam) {
    if (this.state === 'broken') return;
    var pulse = 0.4 + 0.25 * Math.sin(this.t * 3.4);
    DRG.light.add(this.x - cam.x, this.y - cam.y - 30, 170, pulse, [255, 122, 90], 0.42);
  };

  /* ======================================================== 无畏机甲 */
  var BOSS_DEFS = {
    name: '无畏机甲 Dreadnought',
    credits: 60, xp: 420
  };

  function Dreadnought(x, groundY, maxHp) {
    this.type = 'dreadnought';
    this.def = BOSS_DEFS;
    this.isDread = true;
    this.x = x; this.y = groundY;
    this.vx = 0; this.vy = 0;
    this.w = 120; this.h = 96;                  // 碰撞盒（hitEnemyAt 用）
    this.size = 190;                            // 绘制尺寸
    this.face = -1;
    this.t = 0;
    this.maxHp = maxHp; this.hp = maxHp;
    this.phase = 1;                             // 1 装甲态 | 2 狂暴
    this.dead = false;
    this.deathT = 0;
    this.hitFlash = 0;
    this.onGround = false;
    this.stuck = 0;

    // 弱点：腹部发光核，在三个锚位间换位
    this.weakSlots = [
      { fx: -0.34, fy: -0.34 },                 // 后腹（比例 * w/h，face 翻转 fx）
      { fx: 0.05, fy: -0.72 },                  // 背部高位
      { fx: 0.30, fy: -0.30 }                   // 前腹
    ];
    this.weakIdx = 0;
    this.weakT = 0;
    this.weakInterval = 7;

    // 攻击
    this.atkCd = 2.2;                           // 近战/扑击
    this.windup = 0;                            // 扑击前摇
    this.lungeT = 0;
    this.spitCd = 5;
    this.summonCd = 6;                          // 出场后较快的第一波

    this.emergeT = 1.4;                         // 出场动画（破土）
    this.spawnCd = 0;
    this.hurtSound = 0;
  }

  Dreadnought.prototype.weakPos = function () {
    var s = this.weakSlots[this.weakIdx];
    var fx = s.fx * (this.face > 0 ? -1 : 1);   // 腹部弱点在背离玩家一侧的体表
    return { x: this.x + fx * this.w, y: this.y - s.fy * this.h };
  };

  /** 受击：打弱点 ×3，打装甲 ×0.35（y 缺省按装甲算） */
  Dreadnought.prototype.hurt = function (dmg, m, fromX, y) {
    if (this.dead || this.emergeT > 0) return;
    var wp = this.weakPos();
    var weak = y != null && M.dist(fromX || this.x, y, wp.x, wp.y) < WEAK_RADIUS;
    if (weak) {
      dmg *= WEAK_MULT;
      m.fx.burst(wp.x, wp.y, 8, { col: ['#ffe6a0', '#ffb03c', '#ff7a5a'], speed: 220, life: 0.4, kind: 1, glow: 20 });
      m.fx.text(wp.x, wp.y - 18, '弱点!', '#ffb03c', 13);
      DRG.audio.clipOf(['rns_5', 'rns_6'], 0.4, true);
    } else {
      dmg *= ARMOR_MULT;
      m.fx.burst(fromX || this.x, y || this.y - this.h * 0.5, 3, { col: ['#8a929e', '#c8d0e0'], speed: 130, life: 0.25, kind: 1 });
    }
    this.hp -= dmg;
    this.hitFlash = 1;
    if (performance.now() - this.hurtSound > 280) {
      this.hurtSound = performance.now();
      DRG.audio.sfx('bughit', m.panOf(this.x), 0.7);
    }
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) this.enterPhase2(m);
    if (this.hp <= 0) this.die(m);
  };

  Dreadnought.prototype.enterPhase2 = function (m) {
    this.phase = 2;
    this.weakInterval = 4.5;
    m.mc('它狂暴了！小心酸弹——盯着它的弱点打！');
    m.toast('无畏机甲进入狂暴：移速/攻速 +30%，新增酸弹三连', '#ff5a4a', 5);
    DRG.audio.clip('prae_scream', 0.9);
    m.shake(8, 0.4);
    m.spawnWave(1.1, false, { x: this.x, y: this.y });
  };

  Dreadnought.prototype.die = function (m) {
    if (this.dead) return;
    this.dead = true;
    this.hp = 0;
    this.vx = 0;
    m.explode(this.x, this.y - this.h * 0.4, 150, 0, 0);
    DRG.audio.clip('prae_scream', 1);
    if (m.onDreadDead) m.onDreadDead(this);
  };

  Dreadnought.prototype.update = function (dt, m) {
    this.t += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4);

    if (this.dead) {
      this.deathT += dt;
      if (Math.random() < dt * 12) {
        m.fx.burst(this.x + (Math.random() - 0.5) * this.w, this.y - Math.random() * this.h, 3, {
          col: ['#ffb03c', '#ff6a2a', '#3a3a3a'], speed: 190, life: 0.6, size: 4, kind: 1, grav: 0.2
        });
      }
      if (Math.random() < dt * 4) m.shake(3, 0.1);
      return this.deathT < 2.6;                 // 尸体停留一段后移除
    }
    if (this.emergeT > 0) {                     // 破土出场
      this.emergeT -= dt;
      if (Math.random() < dt * 26) {
        m.fx.burst(this.x + (Math.random() - 0.5) * 60, this.y, 3, {
          col: ['#c9b18a', '#8a7a5e', '#ffd08a'], speed: 240, life: 0.5, size: 3.6, ang: -2.4 + Math.random() * 0.8, spread: 0.8, kind: 1
        });
      }
      m.shake(2.4, 0.06);
      return true;
    }

    var p = m.player;
    var dx = p.x - this.x, dy = p.y - this.y;
    var dist = M.len(dx, dy);
    var enraged = this.phase === 2;
    var speed = (enraged ? 68 : 52) * (0.9 + Math.random() * 0.1);
    this.face = dx > 0 ? 1 : -1;

    // 弱点换位计时
    this.weakT += dt;
    if (this.weakT >= this.weakInterval) {
      this.weakT = 0;
      this.weakIdx = (this.weakIdx + 1 + ((Math.random() * 2) | 0)) % this.weakSlots.length;
      var nwp = this.weakPos();
      m.fx.burst(nwp.x, nwp.y, 8, { col: ['#ffb03c', '#ffe6a0'], speed: 170, life: 0.45, kind: 1, glow: 16 });
      DRG.audio.clip('exploder_scream', 0.4);
    }

    if (this.windup > 0) {                      // 扑击前摇：后坐蓄力
      this.windup -= dt;
      this.vx = M.damp(this.vx, -this.face * 40, 8, dt);
      if (this.windup <= 0) {
        this.lungeT = 0.36;
        DRG.audio.clipOf(['grunt_attack_1', 'grunt_attack_2'], 0.8);
      }
    } else if (this.lungeT > 0) {               // 扑击中
      this.lungeT -= dt;
      this.vx = this.face * (enraged ? 470 : 400);
      if (Math.random() < dt * 30) m.fx.spawn({ x: this.x - this.face * 30, y: this.y - 8, vx: -this.face * 90, vy: -30, life: 0.3, size: 3, col: '#8a7a5e', kind: 2 });
      // 扑中玩家
      if (!p.downed && Math.abs(p.x - this.x) < 46 && Math.abs(p.y - this.y) < 60) {
        p.hurt((enraged ? 24 : 19) * m.hazard.dmgMul, m, 'lunge');
        p.vx += this.face * 320; p.vy -= 180;
        this.lungeT = 0;
      }
    } else {
      // 常规逼近 + 攻击决策
      this.atkCd -= dt;
      this.spitCd -= dt;
      this.summonCd -= dt;
      if (dist < 62) {
        if (this.atkCd <= 0) {                  // 近战撕咬
          this.atkCd = enraged ? 0.9 : 1.25;
          if (!p.downed) {
            p.hurt((enraged ? 15 : 12) * m.hazard.dmgMul, m, 'bite');
            m.fx.burst(p.x, p.y - 12, 6, { col: ['#ff6a5a', '#ffd08a'], speed: 170, life: 0.35, kind: 1 });
            DRG.audio.clipOf(['grunt_attack_1', 'grunt_attack_2'], 0.6);
          }
        }
        this.vx = M.damp(this.vx, M.sign(dx) * speed * 0.3, 10, dt);
      } else if (dist < (enraged ? 300 : 240) && this.atkCd <= 0) {
        this.windup = enraged ? 0.42 : 0.55;    // 扑击
        this.atkCd = enraged ? 2.4 : 3.2;
        m.fx.text(this.x, this.y - this.h - 20, '!', '#ff5a4a', 20);
      } else {
        this.vx = M.damp(this.vx, M.sign(dx) * speed, 6, dt);
      }
      // 酸弹三连（阶段 2）
      if (enraged && this.spitCd <= 0 && dist > 90) {
        this.spitCd = 4.6;
        var base = Math.atan2((p.y - 14) - (this.y - this.h * 0.5), p.x - this.x);
        for (var i = -1; i <= 1; i++) {
          var a = base + i * 0.2;
          m.bullets.push(new DRG.Ent.Bullet({
            x: this.x + Math.cos(base) * 30, y: this.y - this.h * 0.5 + Math.sin(base) * 20,
            vx: Math.cos(a) * 540, vy: Math.sin(a) * 540 - 40,
            dmg: 11 * m.hazard.dmgMul, foe: true, col: '#a6ff5a', size: 4.2, life: 2.4, glow: 0.7
          }));
        }
        DRG.audio.clip('mactera_attack', 0.7);
      }
      // 召唤小虫
      if (this.summonCd <= 0) {
        this.summonCd = enraged ? 9 : 12;
        var n = enraged ? 4 : 3;
        if (m.enemies.length < 34) {
          for (var s = 0; s < n; s++) {
            var ex = this.x + (Math.random() - 0.5) * 120;
            var ey = this.y - 6;
            m.spawnEnemy(s === n - 1 && enraged ? 'grunt' : 'swarmer', ex, ey);
          }
          m.toast('无畏机甲召唤了虫群！', '#ff8a5a', 2.5);
          DRG.audio.clip('swarm_detect_1', 0.6);
        }
      }
    }

    // 移动 + 重力（竞技场开阔，贴地行走即可）
    var w = m.world;
    var nx = this.x + this.vx * dt;
    if (w.rectSolid(nx - this.w / 2 + 12, this.y - this.h + 8, this.w - 24, this.h - 8)) {
      var stepped = false;
      for (var up = 1; up <= 3; up++) {
        if (!w.rectSolid(nx - this.w / 2 + 12, this.y - this.h + 8 - up * T, this.w - 24, this.h - 8)) {
          this.y -= up * T * 0.9; stepped = true; break;
        }
      }
      if (!stepped) { this.vx = 0; nx = this.x; this.stuck += dt; } else this.stuck = 0;
    } else this.stuck = Math.max(0, this.stuck - dt);
    this.x = nx;
    this.vy += DRG.CFG.GRAVITY * 0.7 * dt;
    var ny = this.y + this.vy * dt;
    if (w.rectSolid(this.x - this.w / 2 + 12, ny - this.h + 8, this.w - 24, this.h - 8)) {
      if (this.vy > 0) this.onGround = true;
      this.vy = 0;
    } else { this.y = ny; this.onGround = false; }
    if (this.onGround && this.stuck > 0.5) { this.vy = -460; this.onGround = false; this.stuck = 0; }

    this.x = M.clamp(this.x, 6 * T, (w.w - 6) * T);
    this.y = M.clamp(this.y, 6 * T, (w.h - 6) * T);
    w.markExplored(this.x, this.y - 30, 260);
    return true;
  };

  Dreadnought.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var img = spr('dreadnought');
    var emergeFrac = this.emergeT > 0 ? M.clamp(1 - this.emergeT / 1.4, 0, 1) : 1;
    var h = this.size * (0.4 + 0.6 * emergeFrac);

    g.save();
    g.globalAlpha = 0.32; g.fillStyle = '#000';
    g.beginPath(); g.ellipse(sx, sy + 2, this.w * 0.46, 8, 0, 0, 6.283); g.fill();
    g.restore();

    if (this.dead) {
      // 尸体：压暗 + 倾斜下沉
      g.save();
      g.translate(sx, sy - h * 0.18);
      g.rotate(this.face * 0.22);
      g.globalAlpha = 0.85;
      if (img) gfx.sprite(g, img, 0, 0, h * 0.8, { flip: this.face > 0 });
      else this.drawFallback(g, 0, 0, h * 0.8, 1);
      g.restore();
      gfx.bar(g, sx - 40, sy - h * 0.95, 80, 6, 0, '#ff5a4a');
      return;
    }

    var bob = Math.sin(this.t * 2.4) * 3;
    var drawY = sy - h * 0.42 - bob + (1 - emergeFrac) * 30;
    if (img) gfx.sprite(g, img, sx, drawY, h, { flip: this.face > 0 });
    else this.drawFallback(g, sx, drawY, h, 0);

    // 受击闪白 / 狂暴红光
    var tintCol = this.hitFlash > 0.02 ? '#ffffff' : (this.phase === 2 ? '#ff3a2a' : null);
    var tintA = this.hitFlash > 0.02 ? this.hitFlash * 0.75 : (this.phase === 2 ? 0.16 + 0.08 * Math.sin(this.t * 6) : 0);
    if (tintCol && img) gfx.spriteTint(g, img, sx, drawY, h, tintCol, tintA, this.face > 0);
    if (this.windup > 0 && img) gfx.spriteTint(g, img, sx, drawY, h, '#ffd76a', 0.3 * Math.sin(this.t * 30) * this.face, this.face > 0);

    // 弱点发光核（换位时平滑移动）
    var wp = this.weakPos();
    var wsx = wp.x - cam.x, wsy = wp.y - cam.y;
    var pulse = 0.55 + 0.3 * Math.sin(this.t * 7);
    g.save();
    g.globalCompositeOperation = 'lighter';
    var grd = g.createRadialGradient(wsx, wsy, 0, wsx, wsy, 26);
    grd.addColorStop(0, 'rgba(255,220,140,' + pulse + ')');
    grd.addColorStop(0.4, 'rgba(255,150,60,' + pulse * 0.55 + ')');
    grd.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(wsx, wsy, 26, 0, 6.283); g.fill();
    g.fillStyle = '#ffe6a0';
    g.beginPath(); g.arc(wsx, wsy, 6.5, 0, 6.283); g.fill();
    g.restore();

    // 血条（分段刻度标出 50% 狂暴线）
    var frac = M.clamp(this.hp / this.maxHp, 0, 1);
    gfx.bar(g, sx - 60, sy - this.size - 26, 120, 8, frac, frac > 0.5 ? '#ffb03c' : gfx.pulse(this.t, '#ff4a3a', '#ff9a6a', 9), { grad: true });
    g.save();
    g.globalAlpha = 0.7;
    g.strokeStyle = '#ffffff'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(sx - 60 + 60, sy - this.size - 26); g.lineTo(sx - 60 + 60, sy - this.size - 18); g.stroke();
    g.restore();
    gfx.text(g, this.phase === 2 ? '狂暴' : '装甲态', sx + 70, sy - this.size - 19,
      { size: 12, col: this.phase === 2 ? gfx.pulse(this.t, '#ff4a3a', '#ffb0a0', 8) : '#9aa8b6' });
  };

  Dreadnought.prototype.drawFallback = function (g, sx, sy, h, dead) {
    g.save();
    g.translate(sx, sy);
    if (this.face > 0) g.scale(-1, 1);
    var w = h * 1.24;
    // 甲壳主体
    g.fillStyle = dead ? '#4a3a30' : '#5a4a3a';
    g.beginPath();
    g.moveTo(-w / 2, h * 0.18);
    g.quadraticCurveTo(-w * 0.3, -h * 0.5, 0, -h * 0.52);
    g.quadraticCurveTo(w * 0.32, -h * 0.5, w / 2, h * 0.1);
    g.quadraticCurveTo(w * 0.2, h * 0.3, 0, h * 0.3);
    g.quadraticCurveTo(-w * 0.25, h * 0.3, -w / 2, h * 0.18);
    g.closePath(); g.fill();
    // 尖刺
    g.fillStyle = dead ? '#6a5a30' : '#c47a16';
    for (var i = -2; i <= 2; i++) {
      g.beginPath();
      g.moveTo(i * w * 0.17 - 8, -h * 0.3);
      g.lineTo(i * w * 0.17, -h * 0.52 - Math.abs(i) * -4);
      g.lineTo(i * w * 0.17 + 8, -h * 0.3);
      g.closePath(); g.fill();
    }
    // 腿
    g.strokeStyle = '#3c3226'; g.lineWidth = 5;
    for (var l = 0; l < 3; l++) {
      var lx = -w * 0.3 + l * w * 0.28;
      g.beginPath(); g.moveTo(lx, h * 0.1);
      g.lineTo(lx - this.face * 26, h * 0.42); g.stroke();
    }
    g.restore();
  };

  Dreadnought.prototype.lights = function (cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    if (this.dead) {
      if (this.deathT < 1.4) DRG.light.add(sx, sy - 30, 260, (1.4 - this.deathT), [255, 150, 60], 0.5);
      return;
    }
    var wp = this.weakPos();
    DRG.light.add(wp.x - cam.x, wp.y - cam.y, 170, 0.7, [255, 190, 90], 0.42);
    if (this.phase === 2) DRG.light.add(sx, sy - this.h * 0.4, 200, 0.4 + 0.15 * Math.sin(this.t * 6), [255, 70, 50], 0.4);
    if (this.hitFlash > 0.05) DRG.light.add(sx, sy - this.h * 0.4, 220, this.hitFlash, [255, 120, 60], 0.45);
  };

  DRG.Cocoon = Cocoon;
  DRG.Dreadnought = Dreadnought;
  DRG.ELIM = {
    BREAK_TIME: BREAK_TIME,
    WEAK_RADIUS: WEAK_RADIUS,
    WEAK_MULT: WEAK_MULT,
    ARMOR_MULT: ARMOR_MULT,
    bossHp: function (lv) { return 1200 + (lv - 1) * 450; }
  };
})(window);
