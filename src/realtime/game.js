/* ============================================================
   game.js — boot, canvas, main loop, state machine
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M;

  var G = DRG.game = {
    canvas: null, g: null,
    view: { w: 1280, h: 720 },
    dpr: 1,
    mission: null,
    paused: false,
    state: 'boot',          // boot | menu | mission | debrief
    fps: 60,
    lastT: 0,
    acc: 0,
    frames: 0, fpsT: 0,
    endTimer: 0,
    autoScale: 1,          // adaptive render scale (never touches the user's setting)
    slowT: 0, fastT: 0,

    init: function () {
      if (G.initialized) return;
      G.initialized = true;
      DRG.save.load();
      G.canvas = document.getElementById('game');
      G.g = G.canvas.getContext('2d', { alpha: false });
      DRG.input.attach(G.canvas);
      G.resize();
      root.addEventListener('resize', G.resize);
      root.addEventListener('orientationchange', G.resize);
      if (root.visualViewport) root.visualViewport.addEventListener('resize', G.resize);
      DRG.ui.init();
      if (DRG.integration) DRG.integration.configureUi();

      // unlock WebAudio on the first gesture (browser policy)
      ['pointerdown', 'keydown'].forEach(function (ev) {
        root.addEventListener(ev, function () { DRG.audio.unlock(); }, { once: true });
      });

      DRG.assets.load(
        function (f) {
          DRG.ui.bootProgress(f * 0.98, f < 0.4 ? '正在装载矮人与虫子…' : (f < 0.8 ? '正在校准照明弹…' : '正在连接任务控制中心…'));
        },
        function () {
          DRG.ui.bootProgress(1, '准备就绪');
          if (DRG.assets.failed.length) {
            var w = document.getElementById('toast-boot');
            w.style.display = 'block';
            w.textContent = '注意：' + DRG.assets.failed.length + ' 个素材未能加载（可能是从 file:// 打开）。建议用本地 HTTP 服务器运行。';
            console.warn('[DRG] missing assets', DRG.assets.failed);
          }
          setTimeout(function () {
            G.ready = true;
            if (DRG.integration && DRG.integration.hasCompletedRequest()) {
              DRG.integration.returnToManager();
              return;
            }
            G.state = 'menu';
            if (DRG.integration && DRG.integration.launch()) return;
            DRG.ui.show('menu');
            DRG.ui.refreshMenuStats();
          }, 420);
        }
      );

      G.lastT = performance.now();
      if (!root.__DRG_PHASER_DRIVER) requestAnimationFrame(G.frame);
      DRG.log('booted');
    },

    /** drop internal resolution when the machine cannot keep up, restore when it can */
    adaptQuality: function (dt) {
      if (G.state !== 'mission') { G.slowT = G.fastT = 0; return; }
      if (G.fps < 42) { G.slowT += dt; G.fastT = 0; } else if (G.fps > 57) { G.fastT += dt; G.slowT = 0; }
      else { G.slowT = Math.max(0, G.slowT - dt); G.fastT = Math.max(0, G.fastT - dt); }
      if (G.slowT > 1.6 && G.autoScale > 0.62) { G.autoScale = Math.max(0.6, G.autoScale - 0.16); G.slowT = 0; G.resize(); DRG.log('auto quality ->', G.autoScale); }
      else if (G.fastT > 6 && G.autoScale < 1) { G.autoScale = Math.min(1, G.autoScale + 0.12); G.fastT = 0; G.resize(); }
    },

    resize: function () {
      var q = M.clamp((DRG.opts().quality || 1) * G.autoScale, 0.5, 1.6);
      var dpr = Math.min(root.devicePixelRatio || 1, DRG.CFG.RENDER_SCALE_CAP) * q;
      var app = document.getElementById('realtime-app');
      var w = Math.max(1, app.clientWidth || root.innerWidth);
      var h = Math.max(1, app.clientHeight || root.innerHeight);
      var styles = root.getComputedStyle(document.documentElement);
      function safeInset(name) { return parseFloat(styles.getPropertyValue(name)) || 0; }
      G.dpr = dpr;
      G.canvas.width = Math.floor(w * dpr);
      G.canvas.height = Math.floor(h * dpr);
      G.canvas.style.width = '100%';
      G.canvas.style.height = '100%';
      G.view.w = w; G.view.h = h;
      G.view.safeTop = safeInset('--safe-top');
      G.view.safeRight = safeInset('--safe-right');
      G.view.safeBottom = safeInset('--safe-bottom');
      G.view.safeLeft = safeInset('--safe-left');
      G.g.setTransform(dpr, 0, 0, dpr, 0, 0);
      G.g.imageSmoothingEnabled = true;
    },

    startMission: function (opt) {
      try {
        G.mission = new DRG.Mission(opt);
      } catch (e) {
        console.error('[DRG] mission generation failed', e);
        alert('洞穴生成失败：' + e.message);
        DRG.ui.show('menu');
        return;
      }
      G.state = 'mission';
      G.paused = false;
      G.endTimer = 0;
      DRG.ui.hideAll();
      document.body.classList.add('mission-active');
      DRG.audio.startAmbience(opt.biome.tint);
      var m = G.mission;
      setTimeout(function () {
        if (G.mission !== m) return;
        m.mc('欢迎来到 ' + opt.biome.name + '，矮人。开采 ' + m.quota + ' 单位莫尔凯特并存入 M.U.L.E.。', 'mc_begin_1');
      }, 700);
      DRG.log('mission start', opt.biome.id, 'haz', opt.haz, 'cls', opt.cls, 'seed', opt.seed);
    },

    abandon: function () {
      if (!G.mission) return;
      G.mission.state = 'failed';
      G.mission.failReason = '主动放弃任务';
      G.finishMission(false);
    },

    finishMission: function (win) {
      var m = G.mission;
      if (!m) return;
      DRG.audio.stopAmbience();
      G.state = 'debrief';
      G.paused = false;
      document.body.classList.remove('mission-active');
      DRG.input.resetTouch();
      DRG.ui.debrief(m, win);
      G.mission = null;
    },

    setPaused: function (p) {
      G.paused = p;
      if (p) {
        DRG.input.resetTouch();
        DRG.ui.modal('pause');
      } else DRG.ui.closeModals();
    },

    frame: function (now) {
      requestAnimationFrame(G.frame);
      try { G.step(now); }
      catch (e) {
        G.errCount = (G.errCount || 0) + 1;
        if (G.errCount < 6) console.error('[DRG] frame error', e);
      } finally { DRG.input.endFrame(); }
    },

    step: function (now) {
      var dt = (now - G.lastT) / 1000;
      G.lastT = now;
      if (dt > 0.25) dt = 0.25;
      G.frames++; G.fpsT += dt;
      if (G.fpsT > 0.5) { G.fps = G.frames / G.fpsT; G.frames = 0; G.fpsT = 0; }
      G.adaptQuality(dt);

      var I = DRG.input;
      // global keys
      if (I.hit('Escape')) {
        if (DRG.ui.anyModal()) { DRG.ui.closeModals(); if (G.state === 'mission') G.paused = false; }
        else if (G.state === 'mission') G.setPaused(!G.paused);
      }
      if (I.hit('Tab') && G.state === 'mission') { DRG.hud.mapOpen = !DRG.hud.mapOpen; DRG.audio.sfx('ui'); }
      if (I.hit('F1')) { root.__DRG_DEBUG = !root.__DRG_DEBUG; }

      var g = G.g;
      if (G.state === 'mission' && G.mission) {
        var m = G.mission;
        if (!G.paused && !DRG.ui.anyModal()) {
          var step = Math.min(dt, DRG.CFG.MAX_DT);
          var left = dt;
          var guard = 0;
          while (left > 0.0001 && guard++ < 4) {
            var s = Math.min(step, left);
            m.update(s, G.view);
            left -= s;
          }
          if (m.state === 'success' || m.state === 'failed') {
            G.endTimer += dt;
            if (G.endTimer > (m.state === 'success' ? 2.6 : 2.2)) G.finishMission(m.state === 'success');
          }
        }
        m.draw(g, G.view);
        DRG.hud.draw(g, m, G.view);
        if (G.paused) {
          g.fillStyle = 'rgba(3,5,8,0.55)';
          g.fillRect(0, 0, G.view.w, G.view.h);
        }
      } else {
        // menus own the screen; keep the canvas cheap and dark
        g.fillStyle = '#05070a';
        g.fillRect(0, 0, G.view.w, G.view.h);
      }
    }
  };

  if (!root.__DRG_PHASER_DRIVER) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', G.init);
    else G.init();
  }
})(window);
