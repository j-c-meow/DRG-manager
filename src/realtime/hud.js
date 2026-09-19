/* ============================================================
   hud.js — in-mission heads-up display, drawn on the canvas
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M, gfx = DRG.gfx, T = DRG.CFG.TILE;
  var A = function () { return DRG.assets; };
  var GOLD = '#ffb03c', INK = 'rgba(10,12,16,0.78)';

  var HUD = DRG.hud = {
    mapOpen: false,

    draw: function (g, m, view) {
      var p = m.player;
      HUD.crosshair(g, m, view);

      var safeLeft = view.safeLeft || 0, safeRight = view.safeRight || 0;
      var safeTop = view.safeTop || 0, safeBottom = view.safeBottom || 0;
      var contentW = Math.max(1, view.w - safeLeft - safeRight);
      var contentH = Math.max(1, view.h - safeTop - safeBottom);
      var narrow = contentW < 700;
      var scale = narrow
        ? M.clamp(contentW / 560, 0.58, 1)
        : (contentH < 520 ? Math.min(1, contentW / 900) : 1);
      var hudView = {
        w: contentW / scale,
        h: contentH / scale,
        compact: narrow,
        touch: narrow && document.documentElement.classList.contains('touch-capable')
      };

      g.save();
      g.translate(safeLeft, safeTop);
      g.scale(scale, scale);
      HUD.vitals(g, m, p, hudView);
      HUD.itemBar(g, m, p, hudView);
      HUD.objective(g, m, hudView);
      if (m.isEscort) HUD.escortTrack(g, m, hudView);
      HUD.inventory(g, m, p, hudView);
      HUD.minimap(g, m, hudView);
      HUD.messages(g, m, hudView);
      HUD.prompts(g, m, p, hudView);
      if (HUD.mapOpen) HUD.bigMap(g, m, hudView);
      if (DRG.opts().fps) {
        gfx.text(g, Math.round(DRG.game.fps) + ' FPS · ' + m.enemies.length + ' bugs · ' + DRG.light.lights + ' lights',
          hudView.w - 12, 18, { size: 12, align: 'right', col: '#7f8a96' });
      }
      g.restore();
      if (p.hurtFlash > 0.01 || p.hp / p.maxHp < 0.35) HUD.vignette(g, m, p, view);
    },

    /* ---------- crosshair ---------- */
    crosshair: function (g, m, view) {
      var I = DRG.input, p = m.player;
      var x = I.mx, y = I.my;
      var wp = p.weapon();
      var spread = 6 + (wp.spread || 0) * 190 + (p.recoil * 8);
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = (p.mineTarget || p.drillTarget) ? 'rgba(255,214,106,0.95)' : 'rgba(255,255,255,0.8)';
      g.lineWidth = 1.6;
      for (var i = 0; i < 4; i++) {
        var a = i * Math.PI / 2;
        g.beginPath();
        g.moveTo(x + Math.cos(a) * spread, y + Math.sin(a) * spread);
        g.lineTo(x + Math.cos(a) * (spread + 6), y + Math.sin(a) * (spread + 6));
        g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.fillRect(x - 1, y - 1, 2, 2);
      g.restore();
    },

    /* ---------- health / shield ---------- */
    vitals: function (g, m, p, view) {
      var x = 18, y = view.h - (view.touch ? 426 : 96), w = 216;
      gfx.panel(g, x - 6, y - 8, w + 12, 84, { fill: INK, stroke: 'rgba(255,176,60,0.35)' });
      var por = A().get(p.cls.portrait);
      g.save();
      g.beginPath(); g.arc(x + 26, y + 26, 25, 0, 6.283); g.clip();
      gfx.sprite(g, por, x + 26, y + 26, 58);
      g.restore();
      g.strokeStyle = p.cls.color; g.lineWidth = 2;
      g.beginPath(); g.arc(x + 26, y + 26, 25, 0, 6.283); g.stroke();

      var bx = x + 60, bw = w - 68;
      gfx.text(g, p.cls.name.toUpperCase() + ' · ' + p.cls.en, bx, y + 10, { size: 13, col: p.cls.color });
      var hpFrac = p.hp / p.maxHp;
      gfx.bar(g, bx, y + 16, bw, 13, hpFrac, hpFrac > 0.35 ? '#4ad06a' : gfx.pulse(m.time, '#ff4a3a', '#ff9a6a', 9), { grad: true });
      gfx.text(g, Math.ceil(p.hp) + ' / ' + p.maxHp, bx + bw - 4, y + 27, { size: 12, align: 'right', col: '#eaf3ea' });
      gfx.bar(g, bx, y + 33, bw, 8, p.shield / p.maxShield, '#4aa8ff', { grad: true });
      gfx.text(g, '护盾 SHIELD', bx + 2, y + 40, { size: 10, col: 'rgba(200,230,255,0.85)' });

      // status chips
      var cx = bx, cy = y + 50;
      var chips = [
        { icon: 'obj_flare', n: p.flares, col: '#ffb03c' },
        { icon: 'hud_grenade', n: p.grenades, col: '#ff8a5a' },
        { icon: p.cls.tool.hud, n: p.cls.tool.id === 'grapple' ? (p.toolCd > 0 ? Math.ceil(p.toolCd) : '✓') : p.toolCharges, col: '#8ad4ff' }
      ];
      if (p.cls.extra) chips.push({ icon: p.cls.extra.hud, n: p.extraCharges, col: '#c8a4ff' });
      for (var i = 0; i < chips.length; i++) {
        var c = chips[i];
        gfx.sprite(g, A().get(c.icon), cx + 10, cy + 10, 18);
        gfx.text(g, String(c.n), cx + 21, cy + 16, { size: 12, col: c.col });
        cx += 40;
      }
      if (p.downed) {
        gfx.text(g, '倒地 · BLEEDING OUT ' + Math.ceil(p.bleed) + 's', x, y - 16, { size: 16, col: gfx.pulse(m.time, '#ff3a2a', '#ffd0c0', 10) });
        gfx.text(g, m.bosco.reviveCd > 0 ? 'BOSCO 充能中 ' + Math.ceil(m.bosco.reviveCd) + 's' : 'BOSCO 正在赶来救援',
          x, y - 34, { size: 13, col: m.bosco.reviveCd > 0 ? '#ff8a5a' : '#7ad7ff' });
      }
    },

    /* ---------- weapons / item bar ---------- */
    itemBar: function (g, m, p, view) {
      var slots = [];
      var carryLock = DRG.carryRestriction(p);   // 携带矿块/矿骡腿：主手槽灰显禁用
      for (var i = 0; i < 2; i++) {
        var wp = DRG.WEAPONS[p.weapons[i]];
        slots.push({ icon: wp.hud, key: String(i + 1), sel: !p.toolSelected && p.cur === i, mag: p.mag[i], ammo: p.ammo[i], name: wp.name, flame: wp.flame, locked: !!carryLock && i === 0 });
      }
      slots.push({ icon: p.cls.drill ? 'hud_drill' : 'hud_pickaxe', key: 'RMB', name: p.cls.drill ? '钻机' : '镐', tool: true });
      slots.push({ icon: p.cls.tool.hud, key: 'Q', name: p.cls.tool.name, tool: true, sel: p.toolSelected, n: p.cls.tool.id === 'grapple' ? null : p.toolCharges });
      if (p.cls.extra) slots.push({ icon: p.cls.extra.hud, key: 'X', name: p.cls.extra.name, tool: true, n: p.extraCharges });
      slots.push({ icon: 'hud_flaregun', key: 'F', name: '照明弹', tool: true, n: p.flares });

      var sw = 62, gap = 6;
      var total = slots.length * (sw + gap) - gap;
      var x0 = view.w / 2 - total / 2;
      var y = view.h - (view.touch ? 580 : (view.compact ? 250 : 78));
      for (i = 0; i < slots.length; i++) {
        var s = slots[i], x = x0 + i * (sw + gap);
        gfx.panel(g, x, y, sw, 60, {
          fill: s.sel ? 'rgba(48,36,12,0.9)' : INK,
          stroke: s.sel ? GOLD : 'rgba(255,255,255,0.16)', corner: false, lw: s.sel ? 2 : 1
        });
        gfx.sprite(g, A().get(s.icon), x + sw / 2, y + 24, 30, { alpha: s.tool ? 0.85 : (s.locked ? 0.3 : 1) });
        gfx.text(g, s.key, x + 5, y + 13, { size: 11, col: s.locked ? '#5d6772' : (s.sel ? GOLD : '#8d96a2') });
        if (s.locked) {
          // 主手禁用：暗淡图标 + 红色斜杠 + 标签
          g.save();
          g.strokeStyle = 'rgba(255,74,58,0.8)'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(x + 8, y + 40); g.lineTo(x + sw - 8, y + 8); g.stroke();
          g.restore();
          gfx.text(g, '禁用', x + sw - 6, y + 13, { size: 10, align: 'right', col: '#ff6a5a' });
        }
        if (s.mag != null) {
          var txt = s.flame ? Math.ceil(s.mag) + '' : s.mag + '/' + s.ammo;
          gfx.text(g, txt, x + sw / 2, y + 54, { size: 13, align: 'center', col: s.locked ? '#5d6772' : (s.mag > 0 ? '#f2e9cf' : '#ff5a4a') });
        } else if (s.n != null) {
          gfx.text(g, 'x' + s.n, x + sw / 2, y + 54, { size: 13, align: 'center', col: '#cfd8e0' });
        }
      }
      // reload bar
      if (p.reload > 0) {
        var rw = 150;
        gfx.bar(g, view.w / 2 - rw / 2, y - 14, rw, 8, 1 - p.reload / (p.weapon().mag > 100 ? 3.4 : 1.9), GOLD);
        gfx.text(g, '装填中 RELOADING', view.w / 2, y - 18, { size: 11, align: 'center', col: GOLD });
      }
      if (p.spin > 0.02 && p.spin < 1) {
        gfx.bar(g, view.w / 2 - 60, y - 14, 120, 6, p.spin, '#8ad4ff');
      }
    },

    /* ---------- objective panel ---------- */
    objective: function (g, m, view) {
      var w = 268, x = 18, y = 16;
      gfx.panel(g, x, y, w, 86, { fill: INK });
      if (m.isEscort) {
        var d = m.doretta, dHp = d ? M.clamp(d.hp / d.maxHp, 0, 1) : 0;
        gfx.sprite(g, A().get('mission_escort'), x + 26, y + 30, 34);
        gfx.text(g, '执勤护送 · DRILLDOZER ESCORT', x + 50, y + 20, { size: 13, col: GOLD });
        gfx.text(g, m.biome.name + ' · ' + m.hazard.name, x + 50, y + 36, { size: 12, col: '#9aa8b6' });

        gfx.bar(g, x + 12, y + 48, w - 24, 14, dHp, dHp > 0.3 ? '#ffb03c' : gfx.pulse(m.time, '#ff4a3a', '#ff9a6a', 9), { grad: true });
        var dImg = A().get('doretta');
        if (dImg && dImg.width > 2) gfx.sprite(g, dImg, x + 22, y + 55, 18);
        else gfx.sprite(g, A().get('mission_escort'), x + 22, y + 55, 16);
        gfx.text(g, '朵蕾妲 ' + Math.ceil(d ? d.hp : 0) + ' / ' + (d ? d.maxHp : 0), x + 34, y + 60, { size: 12, col: '#ffe9c8' });

        var phase;
        if (!d || d.dead) phase = '朵蕾妲已损毁……';
        else if (d.state === 'hold') phase = '心石防守：坚持 ' + Math.ceil(m.defenseT) + ' 秒！';
        else if (d.state === 'fueling') phase = '加油中……';
        else if (d.state === 'waitFuel') phase = '停车加油：把燃料罐送到油箱口';
        else phase = '推进中 ' + Math.round(d.progress * 100) + '%';
        gfx.text(g, phase, x + 12, y + 78, {
          size: 12,
          col: d && d.state === 'hold' ? gfx.pulse(m.time, '#ff7adf', '#ffffff', 6) : (d && d.dead ? '#ff5a4a' : '#9aa8b6')
        });
      } else if (m.isPoint) {
        /* 定点提取：矿块入库进度 */
        gfx.sprite(g, A().get('mission_point'), x + 26, y + 30, 34);
        gfx.text(g, '定点提取 · POINT EXTRACTION', x + 50, y + 20, { size: 13, col: GOLD });
        gfx.text(g, m.biome.name + ' · ' + m.hazard.name, x + 50, y + 36, { size: 12, col: '#9aa8b6' });

        var q2 = M.clamp(m.chunksDeposited / m.pointQuota, 0, 1);
        gfx.bar(g, x + 12, y + 48, w - 24, 14, q2, m.objectiveDone ? '#4ad06a' : '#7fd4ff', { grad: true });
        var aq = A().get('aquarq');
        if (aq && aq.width > 2) gfx.sprite(g, aq, x + 22, y + 55, 18);
        else gfx.sprite(g, A().get('mission_point'), x + 22, y + 55, 16);
        gfx.text(g, m.chunksDeposited + ' / ' + m.pointQuota + ' 矿块', x + 34, y + 60, { size: 12, col: '#e8f6ff' });

        var pPhase;
        if (m.objectiveDone) pPhase = '目标完成 · 撤离飞船已呼叫';
        else if (m.player.carriedItem && m.player.carriedItem.kind === 'chunk') pPhase = '把矿块搬回莫莉处按 E 入库';
        else pPhase = '跟随蓝色光柱 · 按住左键钻采矿结';
        gfx.text(g, pPhase, x + 12, y + 78, {
          size: 12,
          col: m.objectiveDone ? gfx.pulse(m.time, '#7fff9a', '#ffffff', 5) : '#9aa8b6'
        });
      } else if (m.isSalv) {
        /* 搜救行动：矿骡腿安装 + 修复进度 */
        gfx.sprite(g, A().get('obj_molly'), x + 26, y + 30, 34);
        gfx.text(g, '搜救行动 · SALVAGE OPERATION', x + 50, y + 20, { size: 13, col: GOLD });
        gfx.text(g, m.biome.name + ' · ' + m.hazard.name, x + 50, y + 36, { size: 12, col: '#9aa8b6' });

        var wr = m.wreck, inst = wr ? wr.installed : 0;
        var done = wr && wr.state === 'repaired';
        gfx.bar(g, x + 12, y + 48, w - 24, 14, done ? 1 : inst / 4, done ? '#4ad06a' : '#b0ff7a', { grad: true });
        gfx.sprite(g, A().get('obj_molly'), x + 22, y + 55, 16);
        gfx.text(g, done ? '矿骡已修复' : (wr && wr.state === 'ready' ? '修复中 ' + Math.round(wr.repairFrac() * 100) + '%' : '矿骡腿 ' + inst + ' / 4'), x + 34, y + 60, { size: 12, col: '#eefff0' });

        var sPhase;
        if (done) sPhase = '修复完成 · 撤离飞船已呼叫';
        else if (wr && wr.state === 'ready') sPhase = '对准矿骡长按 E 修复（松开保留进度）';
        else if (m.player.carriedItem && m.player.carriedItem.kind === 'leg') sPhase = '把矿骡腿搬到残骸处按 E 安装';
        else sPhase = '最近的矿骡腿 ' + HUD.nearestLegDist(m) + 'm · 跟随信标';
        gfx.text(g, sPhase, x + 12, y + 78, {
          size: 12,
          col: done ? gfx.pulse(m.time, '#7fff9a', '#ffffff', 5) : '#9aa8b6'
        });
      } else {
        gfx.sprite(g, A().get('mission_mining'), x + 26, y + 30, 34);
        gfx.text(g, '采矿远征 · MINING EXPEDITION', x + 50, y + 20, { size: 13, col: GOLD });
        gfx.text(g, m.biome.name + ' · ' + m.hazard.name, x + 50, y + 36, { size: 12, col: '#9aa8b6' });

        var q = M.clamp(m.deposited.morkite / m.quota, 0, 1);
        gfx.bar(g, x + 12, y + 48, w - 24, 14, q, m.objectiveDone ? '#4ad06a' : '#3ad98a', { grad: true, ghost: M.clamp((m.deposited.morkite + m.player.carry.morkite) / m.quota, 0, 1) });
        gfx.sprite(g, A().get('ore_morkite'), x + 22, y + 55, 16);
        gfx.text(g, Math.floor(m.deposited.morkite) + ' / ' + m.quota + ' 莫尔凯特', x + 34, y + 60, { size: 12, col: '#eafff2' });
        gfx.text(g, m.objectiveDone ? '目标完成 · 按 R 呼叫飞船' : '把矿石存入 M.U.L.E.（靠近按 E）',
          x + 12, y + 78, { size: 12, col: m.objectiveDone ? gfx.pulse(m.time, '#7fff9a', '#ffffff', 5) : '#9aa8b6' });
      }

      // extraction timer
      var timerY = view.compact ? 146 : 14;
      if (m.state === 'extract') {
        var tw = 210, tx = view.w / 2 - tw / 2;
        gfx.panel(g, tx, timerY, tw, 52, { fill: 'rgba(40,8,6,0.86)', stroke: gfx.pulse(m.time, '#ff3a2a', '#ffb03c', 8) });
        gfx.text(g, '撤离倒计时 EXTRACTION', tx + tw / 2, timerY + 18, { size: 13, align: 'center', col: '#ffb03c' });
        gfx.text(g, M.fmtTime(m.escapeTime), tx + tw / 2, timerY + 44, {
          size: 26, align: 'center', col: m.escapeTime < 30 ? gfx.pulse(m.time, '#ff3a2a', '#ffffff', 12) : '#ffe6a0'
        });
      } else if (m.time > 1) {
        gfx.text(g, '任务时间 ' + M.fmtTime(m.time), view.w / 2, view.compact ? 148 : 26, { size: 13, align: 'center', col: 'rgba(220,230,240,0.55)' });
      }
    },

    /* ---------- escort：顶部朵蕾妲进度轨（车头位置 + 血条 + 燃料状态） ---------- */
    /** 搜救：最近的散落矿骡腿距离（米读数，1 tile ≈ 1m） */
    nearestLegDist: function (m) {
      var best = -1;
      for (var i = 0; i < m.props.length; i++) {
        var pr = m.props[i];
        if (!(pr instanceof DRG.MuleLeg) || pr.state !== 'idle') continue;
        var d = M.dist(pr.x, pr.y, m.player.x, m.player.y);
        if (best < 0 || d < best) best = d;
      }
      return best < 0 ? 0 : Math.round(best / T);
    },

    escortTrack: function (g, m, view) {
      var d = m.doretta;
      if (!d) return;
      var railW = Math.min(430, view.w - 360);
      if (railW < 150) return;
      var railH = 8;
      var x = Math.round(view.w / 2 - railW / 2), y = view.compact ? 178 : 42;

      // rail + progress fill
      gfx.bar(g, x, y, railW, railH, d.progress, d.dead ? '#6a5a48' : GOLD, { grad: true, back: 'rgba(16,20,26,0.88)' });

      // station ticks（两处燃料检查点 + 终点）
      var track = d.track;
      var ticks = [];
      for (var i = 0; i < track.stations.length; i++)
        ticks.push({ f: (track.stations[i] - track.x0) / (track.x1 - track.x0), col: '#ffd76a', done: d.stationIdx > i });
      ticks.push({ f: 1, col: '#ff7adf', done: d.state === 'done' });
      g.save();
      for (i = 0; i < ticks.length; i++) {
        var tk = ticks[i];
        g.globalAlpha = tk.done ? 1 : 0.8;
        g.fillStyle = tk.col;
        g.fillRect(x + railW * tk.f - 1.5, y - 3, 3, railH + 6);
      }
      g.restore();

      // doretta head marker on the rail
      var dImg = A().get('doretta');
      var hx = x + railW * d.progress;
      if (dImg && dImg.width > 2) gfx.sprite(g, dImg, hx, y - 12, 18);
      else gfx.sprite(g, A().get('mission_escort'), hx, y - 12, 16);

      // hp strip under the rail
      var hpF = M.clamp(d.hp / d.maxHp, 0, 1);
      gfx.bar(g, x + railW * 0.2, y + railH + 5, railW * 0.6, 5, hpF,
        hpF > 0.3 ? '#ffb03c' : gfx.pulse(m.time, '#ff4a3a', '#ff9a6a', 9));

      // fuel canister status icons（两处检查点：完成=亮、进行中=闪烁、未到=暗）
      var cImg = A().get('fuel_canister');
      for (i = 0; i < track.stations.length; i++) {
        var done = d.stationIdx > i, cur = d.stationIdx === i;
        var cx = x + railW + 16 + i * 24, cy = y + railH / 2;
        g.save();
        g.globalAlpha = done ? 1 : (cur ? 0.55 + 0.4 * Math.sin(m.time * 6) : 0.25);
        if (cImg && cImg.width > 2) gfx.sprite(g, cImg, cx, cy, 20);
        else {
          g.fillStyle = '#ffd76a'; g.fillRect(cx - 5, cy - 8, 10, 16);
          g.fillStyle = '#d64834'; g.fillRect(cx - 5, cy - 3, 10, 4);
        }
        g.restore();
        if (done) gfx.text(g, '✓', cx, cy + 4, { size: 11, align: 'center', col: '#7fff9a' });
      }

      // heart-stone defense countdown
      if (d.state === 'hold') {
        gfx.text(g, '心石防守 ' + Math.ceil(m.defenseT) + 's', view.w / 2, y + railH + 26,
          { size: 20, align: 'center', col: gfx.pulse(m.time, '#ff7adf', '#ffffff', 8) });
      }
    },

    /* ---------- carried minerals ---------- */
    inventory: function (g, m, p, view) {
      var keys = ['morkite', 'nitra', 'gold', 'crystal'];
      var w = 150, h = 22 * keys.length + 34, x = view.w - w - 18;
      var y = view.h - h - (view.touch ? 398 : 18);
      gfx.panel(g, x, y, w, h, { fill: INK });
      gfx.text(g, '背包 BACKPACK', x + 10, y + 18, { size: 12, col: GOLD });
      var total = 0;
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i], info = DRG.ORE_INFO[k];
        total += p.carry[k];
        var yy = y + 30 + i * 22;
        gfx.sprite(g, A().get(info.icon), x + 20, yy + 7, 18);
        gfx.text(g, info.name, x + 34, yy + 12, { size: 12, col: '#cfd8e0' });
        gfx.text(g, String(p.carry[k]), x + w - 10, yy + 12, { size: 13, align: 'right', col: p.carry[k] > 0 ? info.color : '#5d6772' });
      }
      var frac = total / p.carryCap;
      gfx.bar(g, x + 10, y + h - 10, w - 20, 5, frac, frac > 0.9 ? '#ff5a4a' : '#8d96a2');
      // nitra bank for resupply
      var nx = x, ny = y - 42;
      gfx.panel(g, nx, ny, w, 36, { fill: INK, corner: false });
      gfx.sprite(g, A().get('ore_nitra'), nx + 18, ny + 18, 20);
      var need = (DRG.autopilot && DRG.autopilot.on && DRG.autopilot.demoNitrateCost) || 80;
      var ready = m.nitraBank >= need;
      gfx.text(g, '硝石 ' + Math.floor(m.nitraBank) + '/' + need, nx + 34, ny + 16, { size: 12, col: ready ? '#7fff9a' : '#cfd8e0' });
      gfx.text(g, ready ? '按 V 呼叫补给' : '存入硝石可换补给', nx + 34, ny + 30, { size: 10, col: ready ? gfx.pulse(m.time, '#7fff9a', '#ffffff', 6) : '#7f8a96' });
    },

    /* ---------- minimap ---------- */
    minimap: function (g, m, view) {
      var size = 176, x = view.w - size - 18, y = 16;
      gfx.panel(g, x, y, size, size * 0.62 + 18, { fill: 'rgba(6,9,12,0.86)' });
      gfx.text(g, '地形扫描仪 SCANNER', x + 8, y + 14, { size: 11, col: GOLD });
      var mmw = size - 16, mmh = size * 0.62 - 4;
      var mm = m.world.minimap(2);
      var p = m.player;
      // window centred on the dwarf
      var scale = 2, viewTilesX = mmw / scale * 0.6, viewTilesY = mmh / scale * 0.6;
      var ptx = p.x / T, pty = p.y / T;
      var sx0 = M.clamp(ptx - viewTilesX / 2, 0, m.world.w - viewTilesX) * scale;
      var sy0 = M.clamp(pty - viewTilesY / 2, 0, m.world.h - viewTilesY) * scale;
      g.save();
      g.beginPath(); g.rect(x + 8, y + 20, mmw, mmh); g.clip();
      g.fillStyle = '#05070a'; g.fillRect(x + 8, y + 20, mmw, mmh);
      g.imageSmoothingEnabled = false;
      g.drawImage(mm, sx0, sy0, viewTilesX * scale, viewTilesY * scale, x + 8, y + 20, mmw, mmh);
      // blips
      function blip(wx, wy, col, r) {
        var bx = x + 8 + (wx / T * scale - sx0) * (mmw / (viewTilesX * scale));
        var by = y + 20 + (wy / T * scale - sy0) * (mmh / (viewTilesY * scale));
        g.fillStyle = col;
        g.beginPath(); g.arc(bx, by, r || 2.4, 0, 6.283); g.fill();
      }
      for (var i = 0; i < m.enemies.length; i++) {
        var e = m.enemies[i];
        if (e.dead || e.passive) continue;
        if (M.dist(e.x, e.y, p.x, p.y) > 900) continue;
        blip(e.x, e.y, '#ff4a3a', 2);
      }
      blip(m.mule.x, m.mule.y, '#8ad4ff', 3);
      if (m.doretta) blip(m.doretta.x, m.doretta.y - 10, '#ffb03c', 4);
      blip(m.bosco.x, m.bosco.y, '#7ad7ff', 2);
      if (m.pod) blip(m.pod.x, m.pod.y, '#7fff9a', 4);
      for (var bp = 0; bp < m.beacons.length; bp++)
        if (m.beacons[bp].state === 'active') blip(m.beacons[bp].x, m.beacons[bp].y, '#7fd4ff', 3);
      for (var bs = 0; bs < m.salvBeacons.length; bs++)
        if (m.salvBeacons[bs].leg && m.salvBeacons[bs].leg.state === 'idle') blip(m.salvBeacons[bs].x, m.salvBeacons[bs].y, '#b0ff7a', 2.4);
      if (m.wreck) blip(m.wreck.x, m.wreck.y, '#cfd8e0', 4);
      blip(p.x, p.y, '#ffd76a', 3.4);
      g.restore();
      gfx.text(g, 'TAB 全图', x + size - 8, y + 14, { size: 10, align: 'right', col: '#7f8a96' });
    },

    bigMap: function (g, m, view) {
      var pad = 60;
      g.save();
      g.fillStyle = 'rgba(4,6,9,0.9)';
      g.fillRect(0, 0, view.w, view.h);
      var mm = m.world.minimap(2);
      var scale = Math.min((view.w - pad * 2) / mm.width, (view.h - pad * 2) / mm.height);
      var dw = mm.width * scale, dh = mm.height * scale;
      var ox = (view.w - dw) / 2, oy = (view.h - dh) / 2;
      g.imageSmoothingEnabled = false;
      g.drawImage(mm, ox, oy, dw, dh);
      g.strokeStyle = 'rgba(255,176,60,0.5)'; g.lineWidth = 2; g.strokeRect(ox, oy, dw, dh);
      function put(wx, wy, col, r, label) {
        var bx = ox + (wx / T) * 2 * scale, by = oy + (wy / T) * 2 * scale;
        g.fillStyle = col;
        g.beginPath(); g.arc(bx, by, r, 0, 6.283); g.fill();
        if (label) gfx.text(g, label, bx, by - r - 4, { size: 11, align: 'center', col: col });
      }
      put(m.mule.x, m.mule.y, '#8ad4ff', 4, 'M.U.L.E.');
      if (m.doretta) put(m.doretta.x, m.doretta.y - 10, '#ffb03c', 5, '朵蕾妲');
      if (m.pod) put(m.pod.x, m.pod.y, '#7fff9a', 5, '撤离飞船');
      for (var i = 0; i < m.props.length; i++)
        if (m.props[i] instanceof DRG.Ent.Resupply) put(m.props[i].x, m.props[i].y, '#ffd76a', 4, '补给');
      for (var bq = 0; bq < m.beacons.length; bq++)
        if (m.beacons[bq].state === 'active') put(m.beacons[bq].x, m.beacons[bq].y, '#7fd4ff', 4, '富矿点');
      for (var sb = 0; sb < m.salvBeacons.length; sb++)
        if (m.salvBeacons[sb].leg && m.salvBeacons[sb].leg.state === 'idle') put(m.salvBeacons[sb].x, m.salvBeacons[sb].y, '#b0ff7a', 3, '矿骡腿');
      if (m.wreck) put(m.wreck.x, m.wreck.y, '#cfd8e0', 5, '矿骡残骸');
      put(m.player.x, m.player.y, '#ffd76a', 5, '你');
      gfx.text(g, '地形扫描仪 · 按 TAB 关闭', view.w / 2, oy - 16, { size: 15, align: 'center', col: GOLD });
      g.restore();
    },

    /* ---------- toasts + mission control ---------- */
    messages: function (g, m, view) {
      var y = view.h - (view.touch ? 500 : (view.compact ? 300 : 150));
      for (var i = m.toasts.length - 1; i >= 0; i--) {
        var t = m.toasts[i];
        var a = M.clamp(Math.min(t.t * 4, (t.life - t.t) * 3), 0, 1);
        gfx.text(g, t.text, view.w / 2, y, { size: 15, align: 'center', col: t.col, alpha: a });
        y -= 22;
      }
      if (m.mcLine) {
        var mc = m.mcLine;
        var a2 = M.clamp(Math.min(mc.t * 5, (mc.life - mc.t) * 2), 0, 1);
        var bw = Math.min(660, view.w - 36), bx = view.w / 2 - bw / 2;
        var textX = bx + 60, maxWidth = bw - 72;
        var wrapKey = maxWidth + '|' + mc.text;
        if (mc._hudWrapKey !== wrapKey) {
          g.save();
          g.font = '700 15px ' + gfx.FONT;
          var chars = mc.text.split(''), lines = [], line = '';
          for (var j = 0; j < chars.length; j++) {
            var next = line + chars[j];
            if (line && g.measureText(next).width > maxWidth) {
              lines.push(line);
              line = chars[j];
            } else line = next;
          }
          if (line) lines.push(line);
          g.restore();
          mc._hudWrapKey = wrapKey;
          mc._hudLines = lines.slice(0, 3);
        }
        var wrapped = mc._hudLines || [mc.text];
        var bh = 44 + wrapped.length * 20;
        var by = view.h - (view.touch ? 690 : (view.compact ? 390 : 210));
        g.save();
        g.globalAlpha = a2;
        gfx.panel(g, bx, by, bw, bh, { fill: 'rgba(8,12,18,0.9)', stroke: 'rgba(120,200,255,0.5)' });
        g.save();
        g.beginPath(); g.rect(bx + 8, by + 6, 44, bh - 12); g.clip();
        gfx.sprite(g, A().get('mc_portrait'), bx + 30, by + 30, 48);
        g.restore();
        gfx.text(g, '任务控制中心 MISSION CONTROL', textX, by + 20, { size: 11, col: '#7ad7ff' });
        for (j = 0; j < wrapped.length; j++)
          gfx.text(g, wrapped[j], textX, by + 42 + j * 20, { size: 15, col: '#e8f4ff' });
        g.restore();
      }
    },

    /* ---------- context prompts ---------- */
    prompts: function (g, m, p, view) {
      var msg = null;
      if (m.isEscort) {
        var d = m.doretta;
        if (d && !d.dead) {
          if (d.canFuel(p)) msg = '按 E 加入燃料罐';
          else if (p.carriedCan) msg = '把燃料罐送到朵蕾妲油箱口（黄色箭头）';
          else {
            for (var i = 0; i < m.props.length; i++) {
              var pr = m.props[i];
              if (pr instanceof DRG.Ent.Resupply && pr.canUse(p)) { msg = '按 E 使用补给舱 (' + pr.uses + ')'; break; }
              if (pr instanceof DRG.FuelCanister && pr.state === 'idle' && M.dist(pr.x, pr.y, p.x, p.y) < 52) { msg = '按 E 拾起燃料罐'; break; }
            }
          }
          if (!msg && d.state === 'hold') msg = '守住朵蕾妲！还剩 ' + Math.ceil(m.defenseT) + ' 秒';
          if (!msg && d.state === 'waitFuel') msg = '朵蕾妲在等待燃料——找到她放下的燃料罐';
        }
      } else if (m.isPoint) {
        if (m.pod && m.pod.canBoard(p)) msg = '按 E 登船撤离';
        else if (m.player.carriedItem && m.player.carriedItem.kind === 'chunk' && m.mule.canDeposit(p))
          msg = '按 E 矿块入库（' + m.chunksDeposited + '/' + m.pointQuota + '）';
        else if (m.mule.canDeposit(p)) {
          var totP = p.carry.morkite + p.carry.nitra + p.carry.gold + p.carry.crystal;
          msg = totP > 0 ? '按 E 存放 ' + totP + ' 单位矿石' : null;
        } else {
          for (var ip = 0; ip < m.props.length; ip++) {
            var prp = m.props[ip];
            if (prp instanceof DRG.Ent.Resupply && prp.canUse(p)) { msg = '按 E 使用补给舱 (' + prp.uses + ')'; break; }
          }
        }
        if (m.objectiveDone && !m.podCalled) msg = msg || '按 R 呼叫撤离飞船';
      } else if (m.isSalv) {
        var wr = m.wreck;
        if (m.pod && m.pod.canBoard(p)) msg = '按 E 登船撤离';
        else if (wr && p.carriedItem && p.carriedItem.kind === 'leg' && wr.canInstall(p)) msg = '按 E 安装矿骡腿';
        else if (wr && wr.state === 'ready' && wr.canRepair(p)) msg = '长按 E 修复矿骡（松开保留进度）';
        else {
          for (var il = 0; il < m.props.length; il++) {
            var prl = m.props[il];
            if (prl instanceof DRG.MuleLeg && prl.state === 'idle' && M.dist(prl.x, prl.y, p.x, p.y) < 56) { msg = '按 E 扛起矿骡腿'; break; }
            if (prl instanceof DRG.Ent.Resupply && prl.canUse(p)) { msg = '按 E 使用补给舱 (' + prl.uses + ')'; break; }
          }
        }
      } else {
        if (m.pod && m.pod.canBoard(p)) msg = '按 E 登船撤离';
        else if (m.mule.canDeposit(p)) {
          var tot = p.carry.morkite + p.carry.nitra + p.carry.gold + p.carry.crystal;
          msg = tot > 0 ? '按 E 存放 ' + tot + ' 单位矿石' : 'M.U.L.E. 就绪';
        } else {
          for (var j = 0; j < m.props.length; j++)
            if (m.props[j] instanceof DRG.Ent.Resupply && m.props[j].canUse(p)) msg = '按 E 使用补给舱 (' + m.props[j].uses + ')';
        }
        if (m.objectiveDone && !m.podCalled) msg = msg || '按 R 呼叫撤离飞船';
      }
      if (msg) {
        var y = view.h - (view.touch ? 510 : (view.compact ? 285 : 210));
        gfx.text(g, msg, view.w / 2, y, { size: 17, align: 'center', col: gfx.pulse(m.time, '#ffd76a', '#ffffff', 6) });
      }
    },

    vignette: function (g, m, p, view) {
      var hurt = Math.max(p.hurtFlash * 0.5, p.hp / p.maxHp < 0.35 ? (0.22 + Math.sin(m.time * 5) * 0.06) : 0);
      var grd = g.createRadialGradient(view.w / 2, view.h / 2, Math.min(view.w, view.h) * 0.28,
        view.w / 2, view.h / 2, Math.max(view.w, view.h) * 0.62);
      grd.addColorStop(0, 'rgba(120,0,0,0)');
      grd.addColorStop(1, 'rgba(150,10,0,' + hurt.toFixed(3) + ')');
      g.fillStyle = grd;
      g.fillRect(0, 0, view.w, view.h);
    }
  };
})(window);
