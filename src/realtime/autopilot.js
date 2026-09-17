/* ============================================================
   autopilot.js v4 — 内置自动演示模式（可靠版）
   动作（存矿/补给/呼叫飞船/照明弹/跳跃）直接调用任务 API，
   只把移动和瞄准交给输入系统 —— 不再依赖按键时序。
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M;
  var TT = DRG.TT, T = DRG.CFG.TILE;
  var DEMO_SEED = 777;
  var DEMO_QUOTA = 36;
  var DEMO_NITRA_COST = 10;   // 演示局补给折扣（正式局为 80）

  var AP = DRG.autopilot = {
    on: false,
    phase: 'idle',
    t: 0, uiT: 0,
    goal: null, path: null, pathT: 0, pathFor: '',
    logT: 0, flareCd: 4,
    smoothX: null, smoothY: null,
    lastX: 0, lastY: 0, stuckT: 0, jumpCd: 0,
    retargetT: 0, callMuleT: 0, shootT: 0,

    start: function () {
      if (AP.on) return;
      AP.on = true; AP.phase = 'ui'; AP.t = 0; AP.uiT = 0; AP.smoothX = AP.smoothY = null;
      DRG.audio.unlock();
      console.log('[DEMO] 自动演示开始 (seed ' + DEMO_SEED + ', 配额 ' + DEMO_QUOTA + ')');
    },
    stop: function () { AP.on = false; AP.release(); },
    release: function () { var I = DRG.input; I.keys = {}; I.down = [false, false, false]; },

    step: function (dt) {
      if (!AP.on) return;
      AP.t += dt;
      var G = DRG.game, m = G.mission, I = DRG.input;
      var UI = DRG.ui;

      /* ---------- 菜单 ---------- */
      if (AP.phase === 'ui') {
        AP.uiT += dt;
        var active = (document.querySelector('.screen.active') || {}).id;
        if (active === 'scr-menu' && AP.uiT > 1.0) {
          var play = document.querySelector('[data-act="play"]');
          if (play) { play.click(); AP.uiT = 0; console.log('[DEMO] 打开任务终端'); }
        } else if (active === 'scr-select' && AP.uiT > 0.9) {
          var todo = [];
          if (!document.querySelector('.biome-item[data-id="magma"].on')) todo.push(['.biome-item[data-id="magma"]', '星区: 岩浆核心']);
          if (!document.querySelector('.haz[data-lv="1"].on')) todo.push(['.haz[data-lv="1"]', '危险等级 1']);
          if (!document.querySelector('.class-item[data-id="driller"].on')) todo.push(['.class-item[data-id="driller"]', '职业: 钻机']);
          if (todo.length) { document.querySelector(todo[0][0]).click(); console.log('[DEMO] 选择', todo[0][1]); AP.uiT = 0; }
          else {
            console.log('[DEMO] 发射下降舱!');
            document.querySelector('#btn-launch').click();
            AP.phase = 'waitMission'; AP.uiT = 0;
          }
        }
        return;
      }
      if (AP.phase === 'waitMission') {
        if (G.state === 'mission' && m) {
          AP.phase = 'mine';
          m.quota = DEMO_QUOTA;
          m.hazard = DRG.HAZARDS[0];             // 演示固定 haz1，敌人温柔但画面热闹
          m.hazard.rate = 0.35;                   // 演示局：虫潮更稀，节奏更顺
          m.nextWave = 24;
          AP.demoNitrateCost = DEMO_NITRA_COST;
          AP.extractT = 0;
          AP.newGoal();
          console.log('[DEMO] 任务开始 — 目标:', m.quota, '莫尔凯特');
        }
        return;
      }

      if (G.state !== 'mission' || !m || G.paused || UI.anyModal()) { AP.release(); return; }
      var p = m.player;
      if (m.state === 'success' || m.state === 'failed') {
        if (AP.phase !== 'done') { AP.phase = 'done'; AP.release(); console.log('[DEMO] 任务结束:', m.state); }
        return;
      }
      if (p.downed) { AP.release(); return; }

      /* ---------- 撤离 ---------- */
      if (m.state === 'extract') {
        if (AP.phase !== 'extract') {
          AP.phase = 'extract'; AP.setGoal(null); AP.extractT = 0;
          m.spawnWave(2.5);
          console.log('[DEMO] 撤离倒计时开始! 先顶住一波虫潮');
        }
        var pod = m.pod;
        if (!pod) return;
        AP.extractT += dt;
        if (AP.extractT < 12) {
          // 防守镜头：原地迎击最近的虫
          var nearE = null, nearD = 340;
          for (var ei = 0; ei < m.enemies.length; ei++) {
            var ee = m.enemies[ei];
            if (ee.dead || ee.passive) continue;
            var dd = M.dist(ee.x, ee.y, p.x, p.y);
            if (dd < nearD) { nearD = dd; nearE = ee; }
          }
          if (nearE) {
            p.aim = Math.atan2((nearE.y - 10) - (p.y - 18), nearE.x - p.x);
            I.down = [true, false, false];
            AP.pointAt(m, nearE.x, nearE.y - 10);
          }
          return;
        }
        if (pod.state === 'landed') {
          if (m.pod.canBoard(p)) { m.board(); return; }
          if (M.dist(p.x, p.y, pod.x, pod.y) > 480) {
            var spot = m.findStandSpotNear(pod.x, pod.y - 40, 9);
            if (spot) { p.x = spot.x; p.y = spot.y; p.vx = p.vy = 0; AP.setGoal(null); }
          } else {
            if (!AP.goal || AP.goal.tag !== 'pod') AP.setGoal({ tag: 'pod', x: pod.x, y: pod.y - 26, mine: false });
            AP.steerTo(m, dt);
          }
        } else {
          if (!AP.goal || AP.goal.tag !== 'pod') AP.setGoal({ tag: 'pod', x: pod.x, y: pod.y - 140, mine: false });
          AP.steerTo(m, dt);
        }
        AP.logProgress(m);
        return;
      }

      /* ---------- 目标完成 → 呼叫飞船 ---------- */
      if (m.objectiveDone && !m.podCalled) {
        console.log('[DEMO] ★ 配额达成! 呼叫撤离飞船 (R)');
        m.callPod();
        return;
      }

      /* ---------- 购买补给 ---------- */
      if (m.nitraBank >= (AP.demoNitrateCost || 80) && !AP.hasResupply(m) && !AP.resupplyDone) {
        if (AP.phase !== 'resupply') { console.log('[DEMO] ★ 购买补给舱 (V) — 硝石', Math.floor(m.nitraBank)); AP.phase = 'resupply'; AP.setGoal(null); }
        m.callResupply();
        return;
      }
      if (AP.phase === 'resupply') {
        var rs = AP.findResupply(m);
        if (!rs) { AP.phase = 'mine'; AP.newGoal(); }
        else if (M.dist(p.x, p.y, rs.x, rs.y - 20) < 74) {
          AP.useResupply(m, rs);
          m.nitraBank -= (AP.demoNitrateCost || 80);
          AP.resupplyDone = true;
          console.log('[DEMO] ★ 补给完成 — 弹药/装备/生命已回满');
          AP.phase = 'mine'; AP.setGoal(null); AP.newGoal();
        } else {
          if (!AP.goal || AP.goal.tag !== 'resupply') AP.setGoal({ tag: 'resupply', x: rs.x, y: rs.y - 20, mine: false });
          AP.steerTo(m, dt);
        }
        AP.logProgress(m);
        return;
      }

      /* ---------- 存矿 ---------- */
      if (AP.phase === 'deposit') {
        // 演示版：把莫莉直接搬到你身边（她本来就是会重新定位的）
        if (M.dist(m.mule.x, m.mule.y, p.x, p.y) > 260) {
          var ms = m.findStandSpotNear(p.x, p.y - 20, 5);
          if (ms) {
            m.mule.x = ms.x; m.mule.y = ms.y;
            m.fx.burst(m.mule.x, m.mule.y - 20, 12, { col: ['#9ad7ff', '#ffffff'], speed: 130, life: 0.5, kind: 1 });
          }
        }
        if (M.dist(m.mule.x, m.mule.y - 14, p.x, p.y) < 140) {
          m.deposit();
          if (m.deposited.morkite >= m.quota) m.checkObjective();
          console.log('[DEMO] ★ 存入莫莉 — 进度', Math.floor(m.deposited.morkite) + '/' + m.quota);
          AP.phase = 'mine'; AP.setGoal(null); AP.newGoal();
        } else {
          if (!AP.goal || AP.goal.tag !== 'mule') AP.setGoal({ tag: 'mule', x: m.mule.x, y: m.mule.y - 14, mine: false });
          AP.steerTo(m, dt);
        }
        AP.logProgress(m);
        return;
      }

      /* ---------- 采矿 ---------- */
      var carried = p.carry.morkite + p.carry.nitra + p.carry.gold + p.carry.crystal;
      var banked = m.deposited.morkite + m.deposited.nitra;
      if (banked > (AP.lastBank || 0)) { AP.lastBank = banked; AP.dryT = 0; }
      else AP.dryT = (AP.dryT || 0) + dt;
      if (AP.dryT > 22 && AP.goal && AP.goal.tag === 'ore') {
        var sp3 = m.findStandSpotNear(AP.goal.x, AP.goal.y, 6);
        if (sp3) { p.x = sp3.x; p.y = sp3.y; p.vx = p.vy = 0; }
        AP.dryT = 0; AP.setGoal(null);
      }
      if (carried >= 12) { AP.phase = 'deposit'; AP.setGoal(null); AP.callMuleT = 0; }
      else if (AP.phase === 'mine') {
        AP.retargetT -= dt;
        if (!AP.goal || AP.goal.tag !== 'ore' || AP.retargetT <= 0) { AP.newGoal(); AP.retargetT = 7; }
        if (AP.goal) AP.steerTo(m, dt);
      }
      AP.logProgress(m);
    },

    /* ---------- 辅助 ---------- */
    setGoal: function (g) { AP.goal = g; AP.path = null; AP.pathFor = ''; },
    hasResupply: function (m) {
      for (var i = 0; i < m.props.length; i++) {
        var x = m.props[i];
        if (x.constructor && x.constructor.name === 'Resupply' && x.state === 'landed' && x.uses > 0) return true;
      }
      return false;
    },
    findResupply: function (m) {
      for (var i = 0; i < m.props.length; i++) {
        var x = m.props[i];
        if (x.constructor && x.constructor.name === 'Resupply' && x.state === 'landed' && x.uses > 0) return x;
      }
      return null;
    },
    useResupply: function (m, rs) {
      rs.uses--;
      var p = m.player;
      p.ammo[0] = DRG.WEAPONS[p.weapons[0]].ammo;
      p.ammo[1] = DRG.WEAPONS[p.weapons[1]].ammo;
      p.mag[0] = DRG.WEAPONS[p.weapons[0]].mag;
      p.mag[1] = DRG.WEAPONS[p.weapons[1]].mag;
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.45);
      p.flares = p.maxFlares; p.grenades = p.maxGrenades;
      p.toolCharges = p.cls.tool.charges;
      if (p.cls.extra) p.extraCharges = p.cls.extra.charges;
      m.toast('已补给：弹药 / 装备 / 生命', '#8ad4ff', 3);
      DRG.audio.sfx('uibig');
    },

    /* ---------- 寻路 ---------- */
    walkable: function (m, tx, ty) {
      var w = m.world;
      if (w.at(tx, ty) !== TT.EMPTY) return false;
      if (w.at(tx, ty - 1) !== TT.EMPTY) return false;
      return w.at(tx, ty + 1) !== TT.EMPTY;
    },
    bfs: function (m, gx, gy) {
      var w = m.world, p = m.player;
      var sx = Math.floor(p.x / T), sy = Math.floor(p.y / T);
      var near = function (tx, ty) { return Math.hypot(tx - gx, ty - gy) < 2.2; };
      if (near(sx, sy)) return [];
      var seen = new Uint8Array(w.w * w.h);
      var qx = [sx], qy = [sy], prev = new Int32Array(w.w * w.h).fill(-1);
      seen[sy * w.w + sx] = 1;
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
      var guard = 0;
      while (qx.length && guard++ < 11000) {
        var cx = qx.shift(), cy = qy.shift();
        if (near(cx, cy)) {
          var path = [[cx, cy]];
          var cur = cy * w.w + cx, hops = 0;
          while (prev[cur] !== -1 && hops++ < 500) {
            var pc = prev[cur];
            path.push([pc % w.w, (pc - (pc % w.w)) / w.w]);
            cur = pc;
          }
          return path.reverse();
        }
        for (var d = 0; d < dirs.length; d++) {
          var nx = cx + dirs[d][0], ny = cy + dirs[d][1];
          if (nx < 3 || ny < 3 || nx >= w.w - 3 || ny >= w.h - 3) continue;
          var k = ny * w.w + nx;
          if (seen[k]) continue;
          if (!AP.walkable(m, nx, ny)) continue;
          seen[k] = 1; prev[k] = cy * w.w + cx;
          qx.push(nx); qy.push(ny);
        }
      }
      return null;
    },
    findPath: function (m) {
      if (!AP.goal) return null;
      var key = AP.goal.tag + ':' + Math.floor(AP.goal.x / T) + ':' + Math.floor(AP.goal.y / T);
      if (!AP.path || AP.pathFor !== key || m.time - AP.pathT > 3) {
        AP.path = AP.bfs(m, Math.floor(AP.goal.x / T), Math.floor(AP.goal.y / T));
        AP.pathT = m.time; AP.pathFor = key;
      }
      return AP.path;
    },
    newGoal: function () {
      var m = DRG.game.mission;
      if (!m) return;
      var w = m.world, p = m.player;
      var wantNitra = !AP.resupplyDone && m.nitraBank < (AP.demoNitrateCost || 80);
      var cands = [];
      for (var i = 0; i < w.tiles.length; i++) {
        var t = w.tiles[i];
        if (t !== TT.MORKITE && t !== TT.NITRA) continue;
        if (wantNitra && t !== TT.NITRA) continue;
        if (!wantNitra && t === TT.NITRA && m.deposited.morkite < m.quota) continue;
        var tx = i % w.w, ty = (i - tx) / w.w;
        var exposed = w.at(tx - 1, ty) === TT.EMPTY || w.at(tx + 1, ty) === TT.EMPTY ||
                      w.at(tx, ty - 1) === TT.EMPTY || w.at(tx, ty + 1) === TT.EMPTY;
        var d = (tx * T - p.x) * (tx * T - p.x) + (ty * T - p.y) * (ty * T - p.y) * 3.4;
        cands.push({ tx: tx, ty: ty, score: d * (exposed ? 0.5 : 1) });
      }
      cands.sort(function (a, b) { return a.score - b.score; });
      var picked = null, pickedPath = null;
      for (var c = 0; c < Math.min(8, cands.length); c++) {
        var cand = cands[c];
        var pth = AP.bfs(m, cand.tx, cand.ty);
        if (pth !== null && (!pickedPath || pth.length < pickedPath.length)) { picked = cand; pickedPath = pth; }
      }
      if (!picked && cands.length) picked = cands[0];
      AP.setGoal(picked ? { tag: 'ore', x: picked.tx * T + T / 2, y: picked.ty * T + T / 2, mine: true } : null);
      if (AP.goal) console.log('[DEMO]', wantNitra ? '(凑硝石) 目标 @' : '目标矿脉 @', Math.floor(AP.goal.x / T) + ',' + Math.floor(AP.goal.y / T),
        pickedPath ? '路径' + pickedPath.length + '格' : '(无路径，直接挖)');
    },

    /* ---------- 驾驶 ---------- */
    steerTo: function (m, dt) {
      var p = m.player, w = m.world, I = DRG.input;
      var keys = {}, down = [false, false, false];
      var g = AP.goal;
      if (!g) return;

      /* 战斗：直接开火 */
      var near = null, nd = 320;
      for (var i = 0; i < m.enemies.length; i++) {
        var e = m.enemies[i];
        if (e.dead || e.passive) continue;
        var de = M.dist(e.x, e.y, p.x, p.y);
        if (de < nd) { nd = de; near = e; }
      }
      var aimX = g.x, aimY = g.y - 12;
      var gdx = g.x - p.x;
      if (Math.abs(gdx) > 12) keys[gdx > 0 ? 'KeyD' : 'KeyA'] = true;   // 永远朝目标移动
      if (near) {
        aimX = near.x; aimY = near.y - 10;
        p.aim = Math.atan2(aimY - (p.y - 18), aimX - p.x);
        down[0] = true;                          // 走输入系统开火（不再每帧直调 fire，杜绝音效叠加）
        if (nd < 40 && M.dist(p.x, p.y, g.x, g.y) > 220) keys[near.x > p.x ? 'KeyA' : 'KeyD'] = true;
      } else if (g.mine && M.dist(p.x, p.y - 14, g.x, g.y) < 74 && w.at(Math.floor(g.x / T), Math.floor(g.y / T)) !== TT.EMPTY) {
        aimX = g.x; aimY = g.y;
        p.aim = Math.atan2(aimY - (p.y - 18), aimX - p.x);
        down[2] = true;
      } else {
        var path = AP.findPath(m);
        var wx = g.x, wy = g.y;
        if (path && path.length > 1) {
          var bi = 0;
          for (var k = 1; k < Math.min(path.length, 12); k++) {
            if (M.dist(path[k][0] * T + T / 2, path[k][1] * T + T / 2, p.x, p.y) > 34) { bi = k; break; }
          }
          if (bi === 0) bi = 1;
          wx = path[bi][0] * T + T / 2; wy = path[bi][1] * T + T / 2;
        }
        var wx2 = wx - p.x, wy2 = wy - (p.y - 14);
        if (Math.abs(wx2) > 12) keys[wx2 > 0 ? 'KeyD' : 'KeyA'] = true;

        /* 没有路 / 已到矿脉跟前：直接朝目标挖 */
        var nearGoal = g.mine && M.dist(p.x, p.y - 14, g.x, g.y) < 140;
        if (g.mine && (path === null || path.length <= 3 || nearGoal)) {
          var dxG = g.x - p.x, dyG = g.y - (p.y - 18);
          var dlG = M.len(dxG, dyG) || 1;
          var h3 = w.ray(p.x, p.y - 18, dxG / dlG, dyG / dlG, 54);
          if (h3.hit && w.at(h3.tx, h3.ty) !== TT.HARD) {
            aimX = h3.tx * T + T / 2; aimY = h3.ty * T + T / 2;
            p.aim = Math.atan2(aimY - (p.y - 18), aimX - p.x);
            down[2] = true;
          }
        }
        /* 挡路就挖 */
        var sx2 = M.sign(wx2) || 1;
        var cands = [[sx2, 0.06], [sx2, -0.7], [sx2, 0.7]];
        var dug = false;
        for (var c2 = 0; c2 < cands.length && !dug; c2++) {
          var len2 = M.len(cands[c2][0], cands[c2][1]) || 1;
          var h2 = w.ray(p.x, p.y - 18, cands[c2][0] / len2, cands[c2][1] / len2, 54);
          if (h2.hit && w.at(h2.tx, h2.ty) !== TT.HARD) {
            aimX = h2.tx * T + T / 2; aimY = h2.ty * T + T / 2;
            p.aim = Math.atan2(aimY - (p.y - 18), aimX - p.x);
            down[2] = true; dug = true;
          }
        }
        if (!dug) { aimX = wx; aimY = wy - 16; }

        /* 跳跃：直接给速度，最可靠 */
        var moved = M.dist(p.x - AP.lastX, p.y - AP.lastY);
        if (moved < 0.6) AP.stuckT += dt; else { AP.stuckT = 0; AP.jumpCd = Math.min(AP.jumpCd, 0.1); }
        AP.lastX = p.x; AP.lastY = p.y;
        AP.jumpCd -= dt;
        var wantUp = (wy - p.y) < -55;
        if ((AP.stuckT > 0.35 || wantUp) && p.onGround && AP.jumpCd <= 0) {
          p.vy = -p.cls.jump * (wantUp ? 1.06 : 1);
          p.onGround = false; p.coyote = 0;
          AP.jumpCd = wantUp ? 0.35 : 0.55; AP.stuckT = 0;
          DRG.audio.sfx('jump', m.panOf(p.x));
        }
        if (AP.stuckT > 1.6 && !p.onGround && AP.jumpCd <= 0) {
          var wallSide = 0;
          if (w.rectSolid(p.x - p.w / 2 - 4, p.y - p.h + 4, 4, p.h - 8)) wallSide = -1;
          else if (w.rectSolid(p.x + p.w / 2, p.y - p.h + 4, 4, p.h - 8)) wallSide = 1;
          if (wallSide) {
            p.vy = -p.cls.jump * 0.86; p.vx = -wallSide * 130;
            p.wallJumps--; AP.jumpCd = 0.45; AP.stuckT = 0;
          }
        }
        if (AP.stuckT > 2.5 && g.tag === 'ore') {
          // 演示保险：直接挪到矿脉旁继续，保证录制节奏
          var sx3 = g.x, sy3 = g.y;
          var spot2 = m.findStandSpotNear(sx3, sy3, 6);
          if (spot2) { p.x = spot2.x; p.y = spot2.y; p.vx = p.vy = 0; }
          AP.stuckT = 0; AP.setGoal(null);
          return;
        }
      }

      /* 照明弹 */
      AP.flareCd -= dt;
      if (AP.flareCd <= 0 && p.flares > 0) { p.throwFlare(m); AP.flareCd = 6 + Math.random() * 5; }

      var sx = aimX - m.cam.x, sy = aimY - m.cam.y;
      if (AP.smoothX == null) { AP.smoothX = sx; AP.smoothY = sy; }
      AP.smoothX += (sx - AP.smoothX) * 0.42;
      AP.smoothY += (sy - AP.smoothY) * 0.42;
      I.keys = keys; I.down = down; I.mx = AP.smoothX; I.my = AP.smoothY;
    },

    pointAt: function (m, wx, wy) {
      var AP2 = DRG.autopilot;
      var sx = wx - m.cam.x, sy = wy - m.cam.y;
      if (AP2.smoothX == null) { AP2.smoothX = sx; AP2.smoothY = sy; }
      AP2.smoothX += (sx - AP2.smoothX) * 0.4;
      AP2.smoothY += (sy - AP2.smoothY) * 0.4;
      DRG.input.mx = AP2.smoothX; DRG.input.my = AP2.smoothY;
    },
    logProgress: function (m) {
      if (m.time - AP.logT < 6) return;
      AP.logT = m.time;
      var p = m.player;
      console.log('[DEMO]', Math.floor(m.time / 60) + ':' + String(Math.floor(m.time % 60)).padStart(2, '0'),
        '|', AP.phase, '| 莫尔凯特', Math.floor(m.deposited.morkite) + '/' + m.quota,
        '| 硝石', Math.floor(m.nitraBank) + '/80', '| HP', Math.round(p.hp),
        '| 虫', m.enemies.length, '| 飞船', m.pod ? m.pod.state : '-');
    },
    drawBadge: function (g, view) {
      if (!AP.on) return;
      DRG.gfx.panel(g, view.w - 178, view.h - 46, 168, 34, { fill: 'rgba(30,12,4,0.85)', corner: false });
      DRG.gfx.text(g, '自动演示中 · AUTOPILOT', view.w - 94, view.h - 23, {
        size: 13, align: 'center', col: DRG.gfx.pulse(performance.now() / 1000, '#ffb03c', '#ffffff', 5)
      });
    }
  };

  var origStep = DRG.game.step;
  DRG.game.step = function (now) {
    origStep.call(DRG.game, now);
    if (DRG.autopilot.on) DRG.autopilot.step(1 / 60);
  };
  var origHud = DRG.hud.draw;
  DRG.hud.draw = function (g, m, view) {
    origHud.call(DRG.hud, g, m, view);
    DRG.autopilot.drawBadge(g, view);
  };
  var origStart = DRG.game.startMission;
  DRG.game.startMission = function (opt) {
    if (DRG.autopilot.on) { opt = opt || {}; opt.seed = DEMO_SEED; opt.haz = 1; opt.cls = opt.cls || 'driller'; opt.biome = opt.biome || DRG.biomeById('magma'); }
    return origStart.call(DRG.game, opt);
  };
  if (location.hash === '#demo') {
    setTimeout(function () { DRG.autopilot.start(); }, 2600);
  }
})(window);
