/* ============================================================
   player.js — the dwarf: movement, mining, weapons, class tools
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M, gfx = DRG.gfx, T = DRG.CFG.TILE;
  var A = function () { return DRG.assets; };

  /* ---------------- weapon table ---------------- */
  var W = DRG.WEAPONS = {
    gk2: { name: '深核 GK2', en: 'Deepcore GK2', img: 'w_smg', hud: 'hud_rifle', dmg: 12, rpm: 470, mag: 30, ammo: 380, spread: 0.028, speed: 2100, sfx: 'rifle', kick: 1.1 },
    m1000: { name: 'M1000 精准步枪', en: 'M1000 Classic', img: 'w_revolver', hud: 'hud_revolver', dmg: 58, rpm: 105, mag: 8, ammo: 96, spread: 0.004, speed: 2600, sfx: 'revolver', kick: 5, pierce: 1 },
    warthog: { name: '疣猪 210 霰弹枪', en: 'Warthog Auto 210', img: 'w_shotgun', hud: 'hud_shotgun', dmg: 11, rpm: 105, mag: 6, ammo: 90, spread: 0.2, pellets: 8, speed: 1750, sfx: 'shotgun', kick: 6 },
    pgl: { name: '深核 40mm 榴弹发射器', en: 'Deepcore 40mm PGL', img: 'w_autocannon', hud: 'hud_grenade', dmg: 90, rpm: 55, mag: 2, ammo: 16, spread: 0.01, speed: 1000, sfx: 'grenade', aoe: 96, dig: 40, kick: 4, gravity: 1 },
    leadstorm: { name: '铅暴 动力转管机枪', en: '"Lead Storm" Powered Minigun', img: 'w_minigun', hud: 'hud_minigun', dmg: 9, rpm: 850, mag: 600, ammo: 1200, spread: 0.075, speed: 2000, sfx: 'minigun', spinup: 0.5, slow: 0.45, kick: 0.5 },
    bulldog: { name: '斗牛犬 重型左轮', en: '"Bulldog" Heavy Revolver', img: 'w_revolver', hud: 'hud_revolver', dmg: 62, rpm: 95, mag: 6, ammo: 60, spread: 0.008, speed: 2400, sfx: 'revolver', kick: 7 },
    crspr: { name: 'CRSPR 火焰喷射器', en: 'CRSPR Flamethrower', img: 'w_flamer', hud: 'hud_flamer', dmg: 105, mag: 300, ammo: 600, flame: 1, range: 150, sfx: 'flame', kick: 0.2 },
    subata: { name: '苏巴塔 120', en: 'Subata 120', img: 'w_subata', hud: 'hud_pistol', dmg: 17, rpm: 320, mag: 12, ammo: 180, spread: 0.02, speed: 2000, sfx: 'pistol', kick: 1.6 },
    flaregun: { name: '照明弹发射器', en: 'Flare Gun', img: 'w_flaregun', hud: 'hud_flaregun', dmg: 34, rpm: 70, mag: 1, ammo: 24, spread: 0.01, speed: 1250, sfx: 'flaregun', kick: 2, isFlare: 1 }
  };

  /* ---------------- classes ---------------- */
  var CLASSES = DRG.CLASSES = [
    {
      id: 'driller', name: '钻机', en: 'DRILLER', color: '#f7a629',
      body: 'class_driller', portrait: 'portrait_driller', icon: 'icon_driller',
      hp: 135, shield: 25, speed: 208, jump: 505, mine: 1.0,
      primary: 'crspr', secondary: 'subata',
      tool: { id: 'c4', name: 'C4 炸药包', img: 'hud_detpack', hud: 'hud_detpack', charges: 2, cd: 3 },
      pick: 'w_drill', drill: 1,
      blurb: '双持钻机开路，火焰清场。挖掘速度最快。'
    },
    {
      id: 'engineer', name: '工程师', en: 'ENGINEER', color: '#e04b3c',
      body: 'class_engineer', portrait: 'portrait_engineer', icon: 'icon_engineer',
      hp: 115, shield: 25, speed: 210, jump: 515, mine: 0.85,
      primary: 'warthog', secondary: 'pgl',
      tool: { id: 'platform', name: '平台发射器', img: 'w_platgun', hud: 'hud_platgun', charges: 14, cd: 0.35 },
      extra: { id: 'sentry', name: '哨戒炮', hud: 'hud_sentry', charges: 2, cd: 1 },
      pick: 'w_pickaxe',
      blurb: '平台开路、哨戒炮压制，近战火力凶猛。'
    },
    {
      id: 'gunner', name: '枪手', en: 'GUNNER', color: '#3f7fd6',
      body: 'class_gunner', portrait: 'portrait_gunner', icon: 'icon_gunner',
      hp: 145, shield: 30, speed: 192, jump: 495, mine: 0.8,
      primary: 'leadstorm', secondary: 'bulldog',
      tool: { id: 'shield', name: '护盾发生器', img: 'hud_zipline', hud: 'hud_zipline', charges: 3, cd: 2 },
      pick: 'w_pickaxe',
      blurb: '转管机枪压制虫潮，护盾罩住阵地。血最厚。'
    },
    {
      id: 'scout', name: '侦察兵', en: 'SCOUT', color: '#39c9a6',
      body: 'class_scout', portrait: 'portrait_scout', icon: 'icon_scout',
      hp: 95, shield: 25, speed: 252, jump: 560, mine: 0.9,
      primary: 'gk2', secondary: 'flaregun',
      tool: { id: 'grapple', name: '抓钩', img: 'hud_grapple', hud: 'hud_grapple', charges: 99, cd: 3.2 },
      pick: 'w_pickaxe',
      blurb: '抓钩飞索、照明弹开路，跑得最快也最脆。'
    }
  ];
  DRG.classById = function (id) {
    for (var i = 0; i < CLASSES.length; i++) if (CLASSES[i].id === id) return CLASSES[i];
    return CLASSES[0];
  };

/* ---------------- player ---------------- */
/**
 * 携带限制（纯逻辑，冒烟可测）：定点提取的矿块 / 搜救的矿骡腿头顶携带期间——
 * 主手武器禁用（强制锁副手槽）、职业装备不可切（Q）、移速按携带物折扣。
 * 护送局的燃料罐沿用旧规则（不限武器），由此处返回 null 表达。
 */
DRG.carryRestriction = function (p) {
  if (!p || !p.carriedItem || p.carriedCan) return null;
  var item = p.carriedItem;
  return { slot: 1, slowMul: item.slowMul || 0.9, label: item.label || '携带物' };
};

function Player(clsId, x, y) {
    var c = DRG.classById(clsId);
    this.cls = c;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.w = 20; this.h = 32;
    this.face = 1; this.aim = 0;
    this.onGround = false; this.coyote = 0; this.jumpBuf = 0;
    this.maxHp = c.hp; this.hp = c.hp;
    this.maxShield = c.shield; this.shield = c.shield;
    this.shieldTimer = 0;
    this.weapons = [c.primary, c.secondary];
    this.cur = 0;
    this.toolSelected = false;
    this.mag = [W[c.primary].mag, W[c.secondary].mag];
    this.ammo = [W[c.primary].ammo, W[c.secondary].ammo];
    this.reload = 0;
    this.fireCd = 0; this.spin = 0;
    this.carry = { morkite: 0, nitra: 0, gold: 0, crystal: 0 };
    this.carryCap = 60;
    this.carriedCan = null;             // 头顶携带的燃料罐（护送局）
    this.carriedItem = null;            // 头顶携带的通用物品（矿块 / 矿骡腿）
    this.flares = 8; this.maxFlares = 8;
    this.grenades = 3; this.maxGrenades = 3;
    this.toolCharges = c.tool.charges; this.toolCd = 0;
    this.extraCharges = c.extra ? c.extra.charges : 0; this.extraCd = 0;
    this.mining = 0; this.swing = 0; this.mineTarget = null;
    this.drillTarget = null;            // 定点提取：正在钻采的大矿结（PointBeacon）
    this.walkT = 0; this.t = 0;
    this.downed = false; this.bleed = 0; this.downedFully = false;
    this.hurtFlash = 0; this.recoil = 0; this.kickAng = 0;
    this.inShield = false;
    this.grapple = null;
    this.c4 = null;
    this.burning = 0;
    this.stepT = 0;
    this.lastDamage = 99;
    this.landT = 0; this.stepFlip = true;
    this.iframe = 0;
    this.wallJumps = 2;
    this.deposits = 0;
    this.landVy = 0;
  }

  Player.prototype.weapon = function () { return W[this.weapons[this.cur]]; };

/** 携带态按键提示节流（锁副手时按 1/滚轮/Q） */
Player.prototype.carryWarn = function (m) {
  if (this.t - (this._carryWarnT || -9) < 2.5) return;
  this._carryWarnT = this.t;
  var lock = DRG.carryRestriction(this);
  m.toast(L('怀里抱着') + (lock ? L(lock.label) : L('携带物')) + L('——只能用副手武器'), '#ffb03c', 2);
  DRG.audio.sfx('beep');
};

  /* ---------------- damage / health ---------------- */
  Player.prototype.hurt = function (dmg, m, cause) {
    if (this.downed || (m.state !== 'play' && m.state !== 'extract')) return;
    if (this.iframe > 0 && cause !== 'fire' && cause !== 'fall') return;   // brief mercy window
    this.iframe = 0.4;
    if (this.inShield) dmg *= 0.25;
    this.lastDamage = 0;
    var s = Math.min(this.shield, dmg);
    this.shield -= s; dmg -= s;
    if (dmg > 0) this.hp -= dmg;
    this.hurtFlash = 1;
    this.shieldTimer = 0;
    DRG.audio.sfx('hurt');
    m.shake(dmg > 20 ? 12 : 6, 0.25);
    m.fx.burst(this.x, this.y - 12, 4, { col: ['#ff5a4a'], speed: 120, life: 0.3, kind: 3 });
    if (this.hp <= 0) this.goDown(m);
  };

  Player.prototype.goDown = function (m) {
    this.hp = 0; this.downed = true; this.bleed = 28;
    this.vx = 0;
    // 携带物掉落原地（倒地可重拾；护送油罐沿用旧规则不落地）
    if (this.carriedItem && this.carriedItem.drop) {
      this.carriedItem.drop(this, m);
      this.carriedItem = null;
    }
    DRG.audio.loop('flame', { stop: true });
    DRG.audio.loop('minigun', { stop: true });
    DRG.audio.loop('drill', { stop: true });
    m.onPlayerDowned();
  };

  Player.prototype.revive = function (m) {
    this.downed = false;
    this.hp = Math.round(this.maxHp * 0.45);
    this.shield = this.maxShield;
    DRG.audio.sfx('revive');
    DRG.audio.clipOf(['rns_1', 'rns_2', 'rns_3'], 0.8, true);
    m.toast(L('BOSCO 完成救援 · REVIVED'), '#7ad7ff');
    if (m.onPlayerRevived) m.onPlayerRevived();
  };

  Player.prototype.pickUp = function (ore, n, m) {
    var total = this.carry.morkite + this.carry.nitra + this.carry.gold + this.carry.crystal;
    if (total >= this.carryCap) {
      m.toast(L('背包已满，去 M.U.L.E. 处存放！'), '#ffb03c');
      return false;
    }
    this.carry[ore] += n;
    m.stats.mined[ore] = (m.stats.mined[ore] || 0) + n;
    DRG.audio.sfx('ore', m.panOf(this.x));
    m.fx.text(this.x, this.y - 40, '+' + n + ' ' + L(DRG.ORE_INFO[ore].name), DRG.ORE_INFO[ore].color, 13);
    return true;
  };

  /* ---------------- main update ---------------- */
  Player.prototype.update = function (dt, m) {
    var I = DRG.input, w = m.world, c = this.cls;
    this.t += dt;
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 3);
    this.recoil = Math.max(0, this.recoil - dt * 9);
    this.fireCd -= dt; this.toolCd -= dt; this.extraCd -= dt;
    this.lastDamage += dt; this.iframe -= dt;
    this.inShield = false;

    // aim toward the cursor
    this.aim = Math.atan2(I.wy - (this.y - 18), I.wx - this.x);

    if (this.downed) {
      this.bleed -= dt;
      this.vx = M.damp(this.vx, 0, 8, dt);
      this.applyPhysics(dt, m, false);
      if (this.bleed <= 0) { this.downedFully = true; m.onPlayerDead(); }
      return;
    }

    // shield regen (DRG-style delayed recharge)
    this.shieldTimer += dt;
    if (this.lastDamage > 4.2 && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + this.maxShield * 0.55 * dt);
    }
    if (this.burning > 0) {
      this.burning -= dt;
      if (Math.random() < dt * 4) this.hurt(3, m, 'fire');
    }

    /* ---- movement ---- */
    var left = I.key('KeyA', 'ArrowLeft'), right = I.key('KeyD', 'ArrowRight');
    var wantX = (right ? 1 : 0) - (left ? 1 : 0);
    var spd = c.speed;
    var carryLock = DRG.carryRestriction(this);   // 携带矿块/矿骡腿：减速 + 锁副手
    if (carryLock) spd *= carryLock.slowMul;
    if (this.spin > 0.15 && this.cur === 0 && W[c.primary].slow) spd *= (1 - W[c.primary].slow);
    if (this.mining > 0) spd *= 0.6;
    this.vx = M.damp(this.vx, wantX * spd, this.onGround ? 16 : 8, dt);
    if (wantX) this.face = wantX;

    // jump with coyote time + input buffering
    if (I.hit('Space', 'KeyW', 'ArrowUp')) this.jumpBuf = 0.14;
    this.jumpBuf -= dt; this.coyote -= dt;
    if (this.jumpBuf > 0 && (this.onGround || this.coyote > 0) && !this.grapple) {
      this.vy = -c.jump; this.onGround = false; this.coyote = 0; this.jumpBuf = 0;
      this.wallJumps = 2;
      this.landT = 0;
      DRG.audio.sfx('jump', m.panOf(this.x));
      m.fx.burst(this.x, this.y, 6, { col: ['#c9b18a', '#8a7a5e'], speed: 110, life: 0.35, size: 2.6 });
    } else if (this.jumpBuf > 0 && !this.onGround && this.wallJumps > 0 && !this.grapple) {
      // kick off a wall: lets a dwarf climb out of a shaft they dug themselves into
      var side = 0;
      if (w.rectSolid(this.x - this.w / 2 - 4, this.y - this.h + 4, 4, this.h - 8)) side = -1;
      else if (w.rectSolid(this.x + this.w / 2, this.y - this.h + 4, 4, this.h - 8)) side = 1;
      if (side) {
        this.vy = -c.jump * 0.86;
        this.vx = -side * 130 + this.vx * 0.3;
        this.wallJumps--;
        this.jumpBuf = 0;
        DRG.audio.sfx('jump', m.panOf(this.x), 1.2);
        m.fx.burst(this.x + side * 10, this.y - this.h * 0.5, 6, { col: ['#c9b18a', '#e8d8b0'], speed: 130, life: 0.3, size: 2.4 });
      }
    }

    /* ---- grappling hook (Scout) ---- */
    if (this.grapple) this.updateGrapple(dt, m);

    this.applyPhysics(dt, m, true);

    /* ---- footsteps: 步伐音 + 扬尘，节奏跟速度走 ---- */
    this.landT = Math.max(0, this.landT - dt);
    if (this.onGround && Math.abs(this.vx) > 40) {
      this.stepT += Math.abs(this.vx) * dt;
      this.walkT += dt * (2 + Math.abs(this.vx) * 0.02);
      if (this.stepT > 46) {
        this.stepT = 0;
        DRG.audio.sfx('step', m.panOf(this.x));
        m.fx.spawn({ x: this.x - this.face * 6, y: this.y - 2, vx: -this.vx * 0.06, vy: -18 - Math.random() * 20, life: 0.5, size: 2.6, col: 'rgba(201,177,138,0.9)', kind: 2, grav: -0.06, drag: 0.1 });
      }
    } else {
      this.stepT = 0;
    }

    /* ---- actions ---- */
    if (carryLock) {                            // 携带态：强制锁副手武器槽
      if (this.cur !== carryLock.slot || this.toolSelected) {
        this.cur = carryLock.slot; this.toolSelected = false; this.spin = 0;
      }
    }
    if (I.down[2] || I.key('KeyC')) this.mine(dt, m);
    else {
      this.mining = Math.max(0, this.mining - dt * 4);
      this.mineTarget = null;
      if (this.cls.drill) DRG.audio.loop('drill', { stop: true });
    }
    if (carryLock && (I.hit('Digit1') || I.wheel || (I.hit('KeyQ') && !I.key('ShiftLeft', 'ShiftRight')))) this.carryWarn(m);
    if (I.hit('Digit1') && !carryLock) this.switchTo(0, m);
    if (I.hit('Digit2')) this.switchTo(1, m);
    if (I.wheel && !carryLock) this.switchTo(1 - this.cur, m);
    var toolToggled = I.hit('KeyQ') && !I.key('ShiftLeft', 'ShiftRight') && !carryLock;
    if (toolToggled) this.switchTool(m);
    /* 定点提取：按住攻击对着大矿结 → 钻采（拦截开火） */
    var drilling = !this.toolSelected && I.down[0] && !carryLock && m.drillVeinAt ? m.drillVeinAt(this) : null;
    if (drilling) {
      this.mining = Math.min(1, this.mining + dt * 5);
      this.drillTarget = drilling;
      drilling.drill(dt, m);
      DRG.audio.loop('flame', { stop: true });
      DRG.audio.loop('minigun', { stop: true });
    } else {
      this.drillTarget = null;
      if (I.down[0] && !this.toolSelected) this.fire(dt, m); else this.releaseFire(dt, m);
    }
    if (!toolToggled && this.toolSelected && I.clicked[0]) this.useTool(m);
    if (!this.toolSelected && I.hit('KeyR') && this.mag[this.cur] < W[this.weapons[this.cur]].mag) this.startReload(m);
    if (I.hit('KeyF')) this.throwFlare(m);
    if (I.hit('KeyG')) this.throwGrenade(m);
    if (I.hit('KeyX') && this.cls.extra) this.useExtra(m);
    if (this.reload > 0) {
      this.reload -= dt;
      if (this.reload <= 0) {
        var wp = W[this.weapons[this.cur]];
        var need = wp.mag - this.mag[this.cur];
        var take = Math.min(need, this.ammo[this.cur]);
        this.mag[this.cur] += take; this.ammo[this.cur] -= take;
        DRG.audio.sfx('beep');
      }
    }
    if (this.spin > 0 && !I.down[0]) this.spin = Math.max(0, this.spin - dt * 1.5);
    w.markExplored(this.x, this.y, 250);
  };

  Player.prototype.applyPhysics = function (dt, m, allowStep) {
    var w = m.world;
    this.vy += DRG.CFG.GRAVITY * dt;
    if (this.grapple && this.grapple.attached) this.vy -= DRG.CFG.GRAVITY * dt * 0.92;
    this.vy = M.clamp(this.vy, -1400, 1500);

    var nx = this.x + this.vx * dt;
    if (w.rectSolid(nx - this.w / 2, this.y - this.h, this.w, this.h)) {
      var stepped = false;
      if (allowStep && (this.onGround || this.coyote > 0 || Math.abs(this.vy) < 260)) {
        // climb ledges up to a full tile high, the way a stocky dwarf would
        for (var up = 1; up <= 4; up++) {
          if (!w.rectSolid(nx - this.w / 2, this.y - this.h - up * 6, this.w, this.h)) {
            this.y -= up * 6; stepped = true; break;
          }
        }
      }
      if (!stepped) { this.vx = 0; nx = this.x; }
    }
    this.x = nx;

    var landVy = 0;
    var ny = this.y + this.vy * dt;
    if (w.rectSolid(this.x - this.w / 2, ny - this.h, this.w, this.h)) {
      if (this.vy > 0) {
        if (!this.onGround && this.vy > 220) landVy = this.vy;
        if (!this.onGround && this.vy > 620) {
          DRG.audio.sfx('land', m.panOf(this.x));
          m.fx.burst(this.x, this.y, 7, { col: ['#c9b18a', '#8a7a5e'], speed: 130, life: 0.35, size: 2.6 });
          if (this.vy > 1180) this.hurt((this.vy - 1180) * 0.06, m, 'fall');
        }
        this.onGround = true; this.coyote = 0.1; this.wallJumps = 2;
        if (this.grapple) this.grapple = null;
      }
      this.vy = 0;
    } else {
      this.y = ny;
      if (this.onGround) this.coyote = 0.1;
      this.onGround = false;
    }
    this.x = M.clamp(this.x, 4 * T, (w.w - 4) * T);
    this.y = M.clamp(this.y, 4 * T, (w.h - 4) * T);
    // 落地压扁（0.25s 内回弹）
    if (landVy > 220) {
      this.landT = M.clamp(0.12 + landVy * 0.00018, 0.16, 0.3);
      if (landVy > 430) m.fx.burst(this.x, this.y, 5, { col: ['#c9b18a'], speed: 90, life: 0.3, size: 2.2 });
    }
  };

  /* ---------------- mining ---------------- */
  Player.prototype.mine = function (dt, m) {
    var w = m.world;
    var ex = this.x, ey = this.y - 18;
    var reach = this.cls.drill ? 66 : 62;
    var hit = w.ray(ex, ey, Math.cos(this.aim), Math.sin(this.aim), reach);
    this.mining = Math.min(1, this.mining + dt * 5);
    // aim assist: on a 20px grid a perfect ray is fussy, so grab the closest
    // mineable tile inside a cone around the crosshair when the ray misses
    if (!hit.hit) {
      var assist = this.assistTarget(w, ex, ey, reach);
      if (assist) hit = assist;
    }
    if (!hit.hit) { this.mineTarget = null; this.swing = Math.max(0, this.swing - dt * 3); return; }
    this.mineTarget = { tx: hit.tx, ty: hit.ty, x: hit.x, y: hit.y };
    if (w.at(hit.tx, hit.ty) === DRG.TT.HARD) {
      if (Math.random() < dt * 8) {
        m.fx.burst(hit.x, hit.y, 2, { col: ['#ffffff', '#c8d0e0'], speed: 130, life: 0.25, size: 2, kind: 1 });
        DRG.audio.sfx('pick', m.panOf(this.x), 1.6);
      }
      if (!this.hardWarn || this.t - this.hardWarn > 3) { this.hardWarn = this.t; m.toast(L('这是无法挖掘的硬岩！'), '#ff8a5a'); }
      return;
    }

    if (this.cls.drill) {
      // Driller: continuous dual drills, chews a wide tunnel
      var dmg = 460 * dt;
      w.digCircle(hit.x + Math.cos(this.aim) * 10, hit.y + Math.sin(this.aim) * 10, 25, dmg, m.tileFx);
      this.checkMined(m, hit.tx, hit.ty);
      // the drills drag you into the tunnel you are carving
      this.vx = M.damp(this.vx, Math.cos(this.aim) * 150, 4, dt);
      if (Math.sin(this.aim) < -0.4) this.vy = M.damp(this.vy, -120, 4, dt);
      if (Math.random() < dt * 40) {
        m.fx.burst(hit.x, hit.y, 2, {
          col: [m.biome.dirt, m.biome.rock, '#ffd08a'], speed: 210, life: 0.4, size: 2.6,
          ang: this.aim + Math.PI, spread: 1.6, kind: 1
        });
      }
      DRG.audio.loop('drill', { kind: 'drill', pan: m.panOf(this.x), rate: 1.22 + Math.sin(this.t * 9) * 0.1 });
      m.shake(1.6, 0.05);
    } else {
      // everyone else: pickaxe swings
      this.swing += dt / (0.38 / this.cls.mine);
      if (this.swing >= 1) {
        this.swing = 0;
        // a swing bites a chunk out of the wall (target tile + neighbours),
        // so two swings open a tunnel a dwarf can actually walk through
        var res = w.damage(hit.tx, hit.ty, 60, m.tileFx);
        w.digCircle(hit.x + Math.cos(this.aim) * 9, hit.y + Math.sin(this.aim) * 9, 17, 30, m.tileFx);
        DRG.audio.sfx('pick', m.panOf(this.x), 0.9 + Math.random() * 0.25);
        m.fx.burst(hit.x, hit.y, 6, {
          col: [m.biome.dirt, m.biome.rock, '#e8d8b0'], speed: 190, life: 0.45, size: 2.8,
          ang: this.aim + Math.PI, spread: 1.5
        });
        m.shake(2.4, 0.07);
        if (res === 2) this.checkMined(m, hit.tx, hit.ty);
      }
    }
  };

  /** nearest mineable tile within reach and roughly toward the crosshair */
  Player.prototype.assistTarget = function (w, ex, ey, reach) {
    var tx0 = Math.floor(ex / T), ty0 = Math.floor(ey / T);
    var r = Math.ceil(reach / T);
    var best = null, bestScore = 1e9;
    for (var dy = -r; dy <= r; dy++) {
      for (var dx = -r; dx <= r; dx++) {
        var tx = tx0 + dx, ty = ty0 + dy;
        var t = w.at(tx, ty);
        if (t === DRG.TT.EMPTY || t === DRG.TT.HARD) continue;
        var cx = tx * T + T / 2, cy = ty * T + T / 2;
        var d = M.dist(ex, ey, cx, cy);
        if (d > reach) continue;
        var ang = Math.atan2(cy - ey, cx - ex);
        var diff = Math.abs(((ang - this.aim + Math.PI * 3) % 6.283) - Math.PI);
        if (diff > 0.85) continue;                       // keep it inside a ~50° cone
        var score = d + diff * 34 - (DRG.ORE_OF[t] ? 14 : 0);   // minerals win ties
        if (score < bestScore) { bestScore = score; best = { hit: true, tx: tx, ty: ty, x: cx, y: cy, dist: d, type: t }; }
      }
    }
    return best;
  };

  Player.prototype.checkMined = function (m, tx, ty) {
    // digCircle may have cleared several tiles: the mission bookkeeps them
    m.onTileMined(tx, ty, 0, false);
  };

  /* ---------------- shooting ---------------- */
  Player.prototype.switchTo = function (i, m) {
    if ((i === this.cur && !this.toolSelected) || this.reload > 0) return;
    this.cur = i; this.toolSelected = false; this.spin = 0;
    DRG.audio.sfx('ui');
    m.toast(L(W[this.weapons[i]]), '#ffd76a', 0.9);
  };

  Player.prototype.switchTool = function (m) {
    if (this.reload > 0) return;
    this.toolSelected = !this.toolSelected;
    this.spin = 0;
    this.releaseFire(0, m);
    DRG.audio.sfx('ui');
    m.toast(this.toolSelected ? L(this.cls.tool.name) + L(' · 左键使用') : L(W[this.weapons[this.cur]]), this.toolSelected ? '#8ad4ff' : '#ffd76a', 1.1);
  };

  Player.prototype.startReload = function (m) {
    var wp = W[this.weapons[this.cur]];
    if (this.reload > 0 || this.ammo[this.cur] <= 0 || this.mag[this.cur] >= wp.mag) return;
    this.reload = wp.flame ? 2.2 : (wp.mag > 100 ? 3.4 : 1.9);
    DRG.audio.sfx('beep');
    m.toast(L('装填中…'), '#9ad7ff', 0.6);
  };

  Player.prototype.releaseFire = function (dt, m) {
    DRG.audio.loop('flame', { stop: true });
    DRG.audio.loop('minigun', { stop: true });
  };

  Player.prototype.fire = function (dt, m) {
    var wp = W[this.weapons[this.cur]];
    if (this.reload > 0) return;
    if (this.mag[this.cur] <= 0) {
      if (this.ammo[this.cur] > 0) this.startReload(m);
      else { if (Math.random() < dt * 6) DRG.audio.sfx('beep'); }
      return;
    }

    /* flamethrower: continuous cone */
    if (wp.flame) {
      var burn = 34 * dt;
      if (this.magFrac === undefined) this.magFrac = 0;
      this.magFrac += burn;
      while (this.magFrac >= 1 && this.mag[this.cur] > 0) { this.magFrac -= 1; this.mag[this.cur]--; }
      var range = wp.range;
      for (var i = 0; i < 3; i++) {
        var a = this.aim + (Math.random() - 0.5) * 0.42;
        var sp = 420 + Math.random() * 320;
        m.fx.spawn({
          x: this.x + Math.cos(this.aim) * 16, y: this.y - 18 + Math.sin(this.aim) * 16,
          vx: Math.cos(a) * sp + this.vx * 0.4, vy: Math.sin(a) * sp - 40,
          life: 0.42 + Math.random() * 0.2, size: 7 + Math.random() * 6,
          col: ['#ffdc7a', '#ff9a3a', '#ff5a2a'][i % 3], kind: 4, grav: -0.25, glow: 40, drag: 0.9
        });
      }
      // cone damage
      for (var e = 0; e < m.enemies.length; e++) {
        var en = m.enemies[e];
        if (en.dead) continue;
        var d = M.dist(this.x, this.y - 18, en.x, en.y - en.h * 0.4);
        if (d > range) continue;
        var ang = Math.atan2(en.y - en.h * 0.4 - (this.y - 18), en.x - this.x);
        var diff = Math.abs(((ang - this.aim + Math.PI * 3) % 6.283) - Math.PI);
        if (diff < 0.42) {
          m.damageEnemy(en, wp.dmg * dt, en.x, en.y, 0, 0, true);
          en.burn = 2.4;
        }
      }
      DRG.audio.loop('flame', { kind: 'flame', pan: m.panOf(this.x), rate: 0.58 + Math.random() * 0.14 });
      m.light = 1;
      return;
    }

    /* spin-up weapons */
    if (wp.spinup) {
      this.spin = Math.min(1, this.spin + dt / wp.spinup);
      if (this.spin < 1) {
        if (this.spin < dt * 3) DRG.audio.sfx('spinup', m.panOf(this.x));
        return;
      }
    }

    if (this.fireCd > 0) return;
    this.fireCd = 60 / wp.rpm;
    this.mag[this.cur]--;
    this.recoil = 1;
    this.kickAng = (Math.random() - 0.5) * 0.1;

    var ox = this.x + Math.cos(this.aim) * 20, oy = this.y - 18 + Math.sin(this.aim) * 20;
    var pellets = wp.pellets || 1;
    for (var p = 0; p < pellets; p++) {
      var ang2 = this.aim + (Math.random() - 0.5) * wp.spread * (this.onGround ? 1 : 1.5) + this.kickAng;
      if (wp.isFlare) {
        m.flares.push(new DRG.Ent.Flare(ox, oy, Math.cos(ang2) * wp.speed * 0.5, Math.sin(ang2) * wp.speed * 0.5 - 60, 30));
        m.bullets.push(new DRG.Ent.Bullet({
          x: ox, y: oy, vx: Math.cos(ang2) * wp.speed, vy: Math.sin(ang2) * wp.speed,
          dmg: wp.dmg, col: '#ffb060', size: 3.4, life: 0.9, glow: 1
        }));
      } else {
        m.bullets.push(new DRG.Ent.Bullet({
          x: ox, y: oy,
          vx: Math.cos(ang2) * wp.speed, vy: Math.sin(ang2) * wp.speed,
          dmg: wp.dmg, col: wp.aoe ? '#ffd08a' : '#ffe6a0',
          size: wp.aoe ? 4 : 2.2, life: wp.aoe ? 3 : 0.85,
          pierce: wp.pierce || 0, aoe: wp.aoe || 0, digs: wp.dig || 0, glow: 0.6
        }));
      }
    }
    // muzzle flash + kick
    m.fx.burst(ox, oy, 4, { col: ['#fff2c0', '#ffd08a'], speed: 260, life: 0.14, size: 3, kind: 1, ang: this.aim, spread: 0.5, grav: 0 });
    m.muzzle = { x: ox, y: oy, t: 0.06 };
    this.vx -= Math.cos(this.aim) * wp.kick * 9;
    if (!this.onGround) this.vy -= Math.sin(this.aim) * wp.kick * 3;
    m.shake(wp.kick * 1.1, 0.07);
    if (wp.spinup) DRG.audio.loop('minigun', { kind: 'minigun', pan: m.panOf(this.x), rate: 0.82 + Math.random() * 0.36 });
    else DRG.audio.sfx(wp.sfx, m.panOf(this.x));
    if (this.mag[this.cur] <= 0) this.startReload(m);
  };

  /* ---------------- gadgets ---------------- */
  Player.prototype.throwFlare = function (m) {
    if (this.flares <= 0) { m.toast(L('照明弹用完了'), '#ff8a5a'); return; }
    this.flares--;
    var a = this.aim;
    m.flares.push(new DRG.Ent.Flare(
      this.x + Math.cos(a) * 18, this.y - 18 + Math.sin(a) * 18,
      Math.cos(a) * 620 + this.vx * 0.5, Math.sin(a) * 620 - 130, 28));
    DRG.audio.clipOf(['flaregun_1', 'flaregun_2'], 0.6);
  };

  Player.prototype.throwGrenade = function (m) {
    if (this.grenades <= 0) { m.toast(L('手雷用完了'), '#ff8a5a'); return; }
    this.grenades--;
    var a = this.aim;
    m.props.push(new DRG.Ent.Explosive({
      x: this.x + Math.cos(a) * 18, y: this.y - 18 + Math.sin(a) * 18,
      vx: Math.cos(a) * 700 + this.vx * 0.5, vy: Math.sin(a) * 700 - 120,
      fuse: 1.9, radius: 128, dmg: 165, dig: 34
    }));
    DRG.audio.sfx('grenade', m.panOf(this.x));
  };

  Player.prototype.useTool = function (m) {
    var tool = this.cls.tool;
    // a placed satchel charge always detonates instantly, cooldown or not
    if (tool.id === 'c4' && this.c4) { this.c4.detonate(m); this.removeProp(m, this.c4); this.c4 = null; return; }
    if (this.toolCd > 0) return;
    if (tool.id === 'grapple') {
      var hit = m.world.ray(this.x, this.y - 18, Math.cos(this.aim), Math.sin(this.aim), 760);
      this.grapple = { x: hit.x, y: hit.y, attached: false, t: 0, len: 0, sx: this.x, sy: this.y - 18 };
      this.toolCd = tool.cd;
      DRG.audio.sfx('grapple', m.panOf(this.x));
      return;
    }
    if (this.toolCharges <= 0) { m.toast(L('装备充能耗尽 · 用补给舱补充'), '#ff8a5a'); return; }
    if (tool.id === 'platform') {
      var h2 = m.world.ray(this.x, this.y - 18, Math.cos(this.aim), Math.sin(this.aim), 420);
      var px = h2.hit ? h2.x - Math.cos(this.aim) * 6 : h2.x, py = h2.hit ? h2.y - Math.sin(this.aim) * 6 : h2.y;
      var tx0 = Math.floor(px / T), ty0 = Math.floor(py / T), placed = 0;
      for (var dx = -2; dx <= 2; dx++) {
        var tx = tx0 + dx;
        if (m.world.at(tx, ty0) === DRG.TT.EMPTY) { m.world.set(tx, ty0, DRG.TT.PLATFORM); placed++; }
      }
      if (!placed) { m.toast(L('这里放不下平台'), '#ff8a5a'); return; }
      this.toolCharges--; this.toolCd = tool.cd;
      DRG.audio.sfx('platform', m.panOf(this.x));
      m.fx.burst(px, py, 10, { col: ['#7fb0ff', '#d0e8ff'], speed: 140, life: 0.4, size: 2.6, kind: 1 });
      return;
    }
    if (tool.id === 'shield') {
      m.props.push(new DRG.Ent.Shield(this.x, this.y - 14, 13));
      m.shield = m.props[m.props.length - 1];
      this.toolCharges--; this.toolCd = tool.cd;
      DRG.audio.sfx('shield');
      m.toast(L('护盾发生器展开'), '#8ad4ff');
      return;
    }
    if (tool.id === 'c4') {
      var a = this.aim;
      this.c4 = new DRG.Ent.Explosive({
        x: this.x + Math.cos(a) * 16, y: this.y - 18 + Math.sin(a) * 16,
        vx: Math.cos(a) * 420, vy: Math.sin(a) * 420 - 80,
        remote: true, sticky: true, radius: 190, dmg: 320, dig: 130
      });
      m.props.push(this.c4);
      this.toolCharges--; this.toolCd = 0.4;
      m.toast(L('C4 已布置 · 再按 Q 引爆'), '#ffb03c');
      DRG.audio.sfx('beep');
    }
  };

  Player.prototype.removeProp = function (m, obj) {
    var i = m.props.indexOf(obj);
    if (i >= 0) m.props.splice(i, 1);
  };

  Player.prototype.useExtra = function (m) {
    var ex = this.cls.extra;
    if (!ex || this.extraCd > 0) return;
    if (this.extraCharges <= 0) { m.toast(L('哨戒炮充能耗尽'), '#ff8a5a'); return; }
    var gy = m.world.findFloorBelow(Math.floor(this.x / T), Math.floor((this.y - 20) / T), 6);
    if (gy < 0) { m.toast(L('需要平整地面'), '#ff8a5a'); return; }
    m.props.push(new DRG.Ent.Sentry(this.x, gy * T + T));
    this.extraCharges--; this.extraCd = ex.cd;
    DRG.audio.sfx('platform');
    m.toast(L('哨戒炮已部署'), '#ffd76a');
  };

  Player.prototype.updateGrapple = function (dt, m) {
    var gr = this.grapple;
    gr.t += dt;
    gr.sx = this.x; gr.sy = this.y - 18;
    if (!gr.attached) {
      gr.len = Math.min(M.dist(this.x, this.y - 18, gr.x, gr.y), gr.t * 2400);
      if (gr.len >= M.dist(this.x, this.y - 18, gr.x, gr.y) - 4) gr.attached = true;
      return;
    }
    var d = M.dist(this.x, this.y - 18, gr.x, gr.y);
    if (d < 34 || gr.t > 3.2) { this.grapple = null; return; }
    var a = Math.atan2(gr.y - (this.y - 18), gr.x - this.x);
    var pull = 940;
    this.vx = M.damp(this.vx, Math.cos(a) * pull, 9, dt);
    this.vy = M.damp(this.vy, Math.sin(a) * pull, 9, dt);
    if (Math.random() < dt * 20) m.fx.spawn({ x: this.x, y: this.y - 18, vx: (Math.random() - .5) * 60, vy: 40, life: .3, size: 2, col: '#9ad7ff', kind: 1, glow: 8 });
  };

  /* ---------------- draw ---------------- */
  Player.prototype.draw = function (g, cam) {
    var sx = this.x - cam.x, sy = this.y - cam.y;
    var c = this.cls;
    var bodyH = 46;
    var vel = Math.abs(this.vx);
    var moving = this.onGround && vel > 34;
    var air = !this.onGround;

    /* ---- 身体姿态：行走摆动 / 跳跃拉伸 / 下落收腿 / 落地压扁 / 待机呼吸 ---- */
    var cycle = this.walkT * 7;
    var bob = 0, tilt = 0, squash = 1;
    if (moving) {
      bob = Math.abs(Math.sin(cycle)) * 4.4;                  // 上下的步伐颠簸
      tilt = Math.sin(cycle) * 0.085;                          // 左右摇摆
      squash = 1 + Math.sin(cycle * 2) * 0.03;                 // 着地瞬间微压
      tilt += 0.035 * M.sign(this.vx);                          // 前倾
    } else if (air) {
      if (this.vy < -60) squash = 1.18;                        // 上升：拉长（gfx.squash>1 = 瘦高）
      else if (this.vy > 240) squash = 1.06;                   // 下落：微收
      tilt = M.clamp(this.vx / 1400, -0.18, 0.18);
    } else {
      bob = Math.sin(this.t * 2.1) * 1.1;                      // 待机呼吸
      tilt = Math.cos(this.aim) * 0.03;                         // 随准星微倾
    }
    if (this.landT > 0) squash = 1 - Math.sin((this.landT / 0.3) * Math.PI) * 0.24;   // 落地压扁回弹
    if (this.mining > 0.05) tilt += Math.cos(this.aim) * 0.09 * this.mining;          // 挖矿前倾
    bob *= 1 + (this.spin || 0) * 0.12;

    // grapple rope
    if (this.grapple) {
      g.save();
      g.strokeStyle = '#cfd8e0'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(sx, sy - 18 - bob);
      var gx = this.grapple.attached ? this.grapple.x : this.x + Math.cos(this.aim) * this.grapple.len;
      var gy = this.grapple.attached ? this.grapple.y : this.y - 18 + Math.sin(this.aim) * this.grapple.len;
      g.lineTo(gx - cam.x, gy - cam.y); g.stroke();
      g.restore();
    }

    // shadow（离地越高影子越小越淡）
    g.save();
    var shScale = M.clamp(1 - bob * 0.02 - (air ? 0.12 : 0), 0.7, 1);
    g.globalAlpha = (air ? 0.2 : 0.3);
    g.fillStyle = '#000';
    g.beginPath(); g.ellipse(sx, sy + 1, 13 * shScale, 4 * shScale, 0, 0, 6.283); g.fill();
    g.restore();

    if (this.downed) {
      gfx.sprite(g, A().get(c.body), sx, sy - 12, bodyH * 0.8, { rot: 1.35 * this.face, flip: this.face < 0 });
      gfx.text(g, L('倒地! ') + Math.ceil(this.bleed) + 's', sx, sy - 44, { size: 15, align: 'center', col: '#ff5a4a' });
      return;
    }

    // held gear: pickaxe/drill while mining, selected class tool, otherwise the current gun
    var handAng = this.aim;
    var img, gunH = 20;
    if (this.mining > 0.05) {
      img = A().get(c.pick);
      if (c.drill) { handAng = this.aim + Math.sin(this.t * 30) * 0.09; gunH = 26; }
      else { handAng = this.aim - 1.15 + Math.sin(Math.min(1, this.swing) * Math.PI) * 1.5; gunH = 30; }
    } else if (this.toolSelected) {
      img = A().get(c.tool.img || c.tool.hud);
      gunH = c.tool.id === 'platform' ? 24 : 22;
      if (moving) handAng += Math.sin(cycle) * 0.04;
    } else {
      var wp = W[this.weapons[this.cur]];
      img = A().get(wp.img);
      gunH = wp.flame ? 24 : (wp.mag > 100 ? 26 : 20);
      handAng = this.aim - this.recoil * 0.28 * (Math.cos(this.aim) > 0 ? 1 : -1);
      if (this.spin > 0.05) handAng += Math.sin(this.t * 40) * 0.03 * this.spin;
      if (moving) handAng += Math.sin(cycle) * 0.06;
    }

    // 身体朝向由移动方向决定（走动时不再出现“倒着平移”），武器朝向跟准星
    var bodyFlip = this.face < 0;
    var aimFlip = Math.cos(this.aim) < 0;

    // body
    gfx.sprite(g, A().get(c.body), sx, sy - bodyH / 2 - bob, bodyH, { flip: bodyFlip, rot: tilt, squash: squash });
    if (this.hurtFlash > 0.02) gfx.spriteTint(g, A().get(c.body), sx, sy - bodyH / 2 - bob, bodyH, '#ff3a2a', this.hurtFlash * 0.7, bodyFlip);

    // gear in hand（跟着身体一起颠）
    var hx = sx + Math.cos(this.aim) * 12, hy = sy - 20 - bob * 0.72 + Math.sin(this.aim) * 10;
    g.save();
    g.translate(hx, hy);
    g.rotate(handAng + (aimFlip ? Math.PI : 0));
    if (aimFlip) g.scale(1, -1);
    var im = img;
    if (im && im.width) {
      var sc = gunH / im.height;
      g.drawImage(im, -im.width * sc * 0.28, -gunH / 2, im.width * sc, gunH);
    }
    g.restore();

    // helmet lamp glint
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = 'rgba(255,240,190,0.75)';
    g.beginPath(); g.arc(sx + this.face * 5, sy - bodyH + 12 - bob, 2.6, 0, 6.283); g.fill();
    g.restore();

    // mining target reticle
    if (this.mineTarget) {
      var tx = this.mineTarget.tx * T - cam.x, ty = this.mineTarget.ty * T - cam.y;
      g.save();
      g.strokeStyle = 'rgba(255,214,106,0.85)'; g.lineWidth = 1.6;
      g.setLineDash([4, 3]);
      g.strokeRect(tx + 1, ty + 1, T - 2, T - 2);
      g.restore();
    }
  };

  Player.prototype.lights = function (cam, m) {
    var sx = this.x - cam.x, sy = this.y - 22 - cam.y;
    // helmet lamp: cone toward aim + local pool
    DRG.light.addCone(sx, sy, this.aim, 1.35, 470, 1.0, [255, 246, 214]);
    DRG.light.add(sx, sy, 190, 0.72, [255, 240, 205], 0.1);
    if (this.recoil > 0.2) DRG.light.add(sx + Math.cos(this.aim) * 24, sy + Math.sin(this.aim) * 24, 260, this.recoil * 1.2, [255, 220, 150], 0.6);
    if (this.mining > 0.1 && this.mineTarget) {
      DRG.light.add(this.mineTarget.x - cam.x, this.mineTarget.y - cam.y, 120, 0.5 + Math.random() * 0.3, [255, 200, 130], 0.35);
    }
  };

  DRG.Player = Player;
})(window);
