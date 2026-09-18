/* ============================================================
   深岩银河 HTML 版 — core.js
   Global namespace, math helpers, seeded RNG, config, storage.
   No ES modules on purpose: the game must also run from file://
   ============================================================ */
(function (root) {
  'use strict';

  var DRG = root.DRG = root.DRG || {};

  /* ---------- math ---------- */
  var M = DRG.M = {
    clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    /** frame-rate independent exponential smoothing */
    damp: function (a, b, lambda, dt) { return M.lerp(a, b, 1 - Math.exp(-lambda * dt)); },
    len: function (x, y) { return Math.sqrt(x * x + y * y); },
    dist: function (ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return Math.sqrt(dx * dx + dy * dy); },
    dist2: function (ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; },
    sign: function (v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); },
    angleLerp: function (a, b, t) {
      var d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      return a + d * t;
    },
    smoothstep: function (t) { t = M.clamp(t, 0, 1); return t * t * (3 - 2 * t); },
    aabb: function (ax, ay, aw, ah, bx, by, bw, bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    },
    fmtTime: function (s) {
      s = Math.max(0, Math.floor(s));
      var m = Math.floor(s / 60);
      return m + ':' + String(s % 60).padStart(2, '0');
    },
    fmtNum: function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  };

  /* ---------- seeded RNG (mulberry32) ---------- */
  DRG.RNG = function (seed) {
    var s = (seed >>> 0) || 1;
    var api = {
      next: function () {
        s |= 0; s = (s + 0x6D2B79F5) | 0;
        var t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      range: function (a, b) { return a + api.next() * (b - a); },
      int: function (a, b) { return Math.floor(api.range(a, b + 1)); },
      pick: function (arr) { return arr[Math.floor(api.next() * arr.length)]; },
      chance: function (p) { return api.next() < p; },
      shuffle: function (arr) {
        for (var i = arr.length - 1; i > 0; i--) {
          var j = Math.floor(api.next() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
      },
      /** deterministic value noise in 2D, ~[0,1] */
      noise2: function (x, y) {
        var n = Math.sin(x * 12.9898 + y * 78.233 + s * 0.000173) * 43758.5453;
        return n - Math.floor(n);
      }
    };
    return api;
  };

  /** smooth 2D value noise built on a seeded lattice */
  DRG.makeNoise = function (seed) {
    var perm = new Uint8Array(512), rng = DRG.RNG(seed), i;
    var p = new Uint8Array(256);
    for (i = 0; i < 256; i++) p[i] = i;
    rng.shuffle(p);
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
    function grad(h, x, y) {
      switch (h & 3) {
        case 0: return x + y; case 1: return -x + y; case 2: return x - y; default: return -x - y;
      }
    }
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    return function (x, y) {
      var X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      var xf = x - Math.floor(x), yf = y - Math.floor(y);
      var u = fade(xf), v = fade(yf);
      var aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
      var ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
      var x1 = M.lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
      var x2 = M.lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
      return (M.lerp(x1, x2, v) + 1) * 0.5;
    };
  };

  /* ---------- tunables ---------- */
  DRG.CFG = {
    TILE: 20,
    GRAVITY: 1750,
    MAX_DT: 1 / 30,
    RENDER_SCALE_CAP: 1.4,
    LIGHT_DOWNSCALE: 3,
    CHUNK: 16,
    CHUNK_CACHE: 72,
    VERSION: '1.0.0'
  };

  /* ---------- storage ---------- */
  DRG.save = {
    data: null,
    defaults: function () {
      return {
        credits: 0, xp: 0, missions: 0, kills: 0, morkite: 0, deaths: 0,
        best: {}, seenIntro: false,
        opts: { master: 0.85, sfx: 0.9, voice: 1.0, music: 0.5, darkness: 1.0, shake: 1.0, particles: 1.0, fps: false, quality: 1 }
      };
    },
    load: function () {
      var d = DRG.save.defaults();
      var adapter = root.__DRG_MANAGER_SETTINGS;
      var saved = adapter && adapter.load ? adapter.load() : null;
      if (saved) {
        for (var k in saved) if (k !== 'opts') d[k] = saved[k];
        if (saved.opts) for (var o in saved.opts) if (o in d.opts) d.opts[o] = saved.opts[o];
      }
      DRG.save.data = d;
      return d;
    },
    flush: function () {
      var adapter = root.__DRG_MANAGER_SETTINGS;
      if (adapter && adapter.save) adapter.save(DRG.save.data);
    },
    reset: function () { DRG.save.data = DRG.save.defaults(); DRG.save.flush(); }
  };
  DRG.opts = function () { return DRG.save.data.opts; };

  /* ---------- level curve ---------- */
  DRG.levelFromXp = function (xp) {
    var lvl = 1, need = 800;
    while (xp >= need && lvl < 25) { xp -= need; lvl++; need = Math.round(need * 1.18); }
    return { level: lvl, xp: xp, need: need };
  };

  /* ---------- tiny event bus ---------- */
  DRG.bus = (function () {
    var map = {};
    return {
      on: function (k, fn) { (map[k] = map[k] || []).push(fn); },
      emit: function (k, a, b) { var l = map[k]; if (l) for (var i = 0; i < l.length; i++) l[i](a, b); }
    };
  })();

  DRG.log = function () {
    if (root.__DRG_DEBUG) console.log.apply(console, ['[DRG]'].concat([].slice.call(arguments)));
  };
})(window);
