/* ============================================================
   audio.js — WebAudio synthesised SFX + real DRG voice clips
   Weapon/mining/UI sounds are generated procedurally (no fetch,
   works from file://). Voice lines and creature calls come from
   the .ogg files shipped in assets/.
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M;

  var ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  var lastPlay = {};
  var unlocked = false;

  function opts() { return DRG.opts(); }

  var S = DRG.audio = {
    get ctx() { return ctx; },

    init: function () {
      if (ctx) return;
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = opts().master; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = opts().sfx; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = opts().music * 0.6; musicBus.connect(master);
      // 2s of pink-ish noise reused by every noise voice
      var len = ctx.sampleRate * 2;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0), b0 = 0, b1 = 0, b2 = 0;
      for (var i = 0; i < len; i++) {
        var w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.0990460;
        b1 = 0.96300 * b1 + w * 0.2965164;
        b2 = 0.57000 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.25;
      }
    },

    unlock: function () {
      S.init();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      unlocked = true;
    },

    refreshVolumes: function () {
      if (!ctx) return;
      master.gain.value = opts().master;
      sfxBus.gain.value = opts().sfx;
      musicBus.gain.value = opts().music * 0.6;
    },

    /* ---------- primitives ---------- */
    noise: function (o) {
      if (!ctx) return;
      o = o || {};
      var t = ctx.currentTime + (o.delay || 0);
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      src.playbackRate.value = o.rate || 1;
      var flt = ctx.createBiquadFilter();
      flt.type = o.type || 'bandpass';
      flt.frequency.value = o.freq || 800;
      flt.Q.value = o.q == null ? 1 : o.q;
      if (o.sweep) {
        flt.frequency.setValueAtTime(o.freq || 800, t);
        flt.frequency.exponentialRampToValueAtTime(Math.max(40, o.sweep), t + (o.dur || 0.2));
      }
      var g = ctx.createGain();
      var vol = (o.vol == null ? 0.4 : o.vol) * (o.pan !== undefined ? 1 : 1);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + (o.atk || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + (o.dur || 0.2));
      var node = g;
      if (o.pan !== undefined && ctx.createStereoPanner) {
        var p = ctx.createStereoPanner(); p.pan.value = M.clamp(o.pan, -1, 1); g.connect(p); node = p;
      }
      src.connect(flt); flt.connect(g); node.connect(sfxBus);
      src.start(t); src.stop(t + (o.dur || 0.2) + 0.05);
    },

    tone: function (o) {
      if (!ctx) return;
      o = o || {};
      var t = ctx.currentTime + (o.delay || 0);
      var osc = ctx.createOscillator();
      osc.type = o.wave || 'sine';
      osc.frequency.setValueAtTime(o.f0 || 440, t);
      if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + (o.dur || 0.2));
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol == null ? 0.3 : o.vol), t + (o.atk || 0.006));
      g.gain.exponentialRampToValueAtTime(0.0001, t + (o.dur || 0.2));
      var node = g;
      if (o.pan !== undefined && ctx.createStereoPanner) {
        var p = ctx.createStereoPanner(); p.pan.value = M.clamp(o.pan, -1, 1); g.connect(p); node = p;
      }
      osc.connect(g); node.connect(sfxBus);
      osc.start(t); osc.stop(t + (o.dur || 0.2) + 0.05);
    },

    /* ---------- game sounds ---------- */
    /** 每个音效的最小间隔（毫秒）：超过就丢弃，杜绝“鬼畜”重复 */
    GAPS: {
      pick: 130, break: 150, ore: 120, drill: 90, flame: 80, minigun: 70,
      rifle: 60, shotgun: 110, revolver: 120, pistol: 75, spinup: 260,
      grenade: 160, explode: 220, platform: 130, grapple: 110, zipline: 160,
      shield: 220, hurt: 240, bughit: 110, bugdie: 130, step: 130,
      jump: 160, land: 170, ui: 45, uibig: 70, alarm: 320, podland: 600,
      thruster: 130, beep: 90, revive: 320, nitra: 130
    },
    sfx: function (name, pan, pitch) {
      if (!ctx || !unlocked) return;
      pan = pan || 0; pitch = pitch || 1;
      var now = performance.now();
      // 全局节流：同类声音太密集时直接丢弃
      var minGap = S.GAPS[name];
      if (minGap) { if (now - (lastPlay[name] || 0) < minGap) return; lastPlay[name] = now; }

      switch (name) {
        case 'pick':      // pickaxe into rock
          S.noise({ freq: 1400 * pitch, sweep: 220, q: 0.8, dur: 0.18, vol: 0.45, pan: pan });
          S.tone({ wave: 'triangle', f0: 190 * pitch, f1: 70, dur: 0.14, vol: 0.28, pan: pan });
          break;
        case 'break':     // tile destroyed
          S.noise({ freq: 700, sweep: 120, q: 0.6, dur: 0.34, vol: 0.5, pan: pan });
          S.tone({ wave: 'sine', f0: 120, f1: 45, dur: 0.3, vol: 0.3, pan: pan });
          break;
        case 'drill':
          S.noise({ freq: 320 * pitch, q: 3, dur: 0.14, vol: 0.34, rate: 1.4, pan: pan });
          S.tone({ wave: 'sawtooth', f0: 95 * pitch, f1: 88, dur: 0.13, vol: 0.16, pan: pan });
          break;
        case 'ore':       // mineral secured
          S.tone({ wave: 'sine', f0: 700, f1: 1250, dur: 0.16, vol: 0.24, pan: pan });
          S.tone({ wave: 'sine', f0: 1050, f1: 1600, dur: 0.2, vol: 0.14, delay: 0.05, pan: pan });
          break;
        case 'deposit':
          S.tone({ wave: 'square', f0: 300, f1: 620, dur: 0.1, vol: 0.14 });
          S.tone({ wave: 'square', f0: 620, f1: 900, dur: 0.12, vol: 0.12, delay: 0.09 });
          break;
        case 'rifle':
          S.noise({ freq: 2200, sweep: 500, q: 0.7, dur: 0.1, vol: 0.34, pan: pan });
          S.tone({ wave: 'square', f0: 240, f1: 90, dur: 0.08, vol: 0.2, pan: pan });
          break;
        case 'shotgun':
          S.noise({ freq: 1100, sweep: 180, q: 0.5, dur: 0.3, vol: 0.55, pan: pan });
          S.tone({ wave: 'triangle', f0: 150, f1: 55, dur: 0.26, vol: 0.34, pan: pan });
          break;
        case 'minigun':
          S.noise({ freq: 1700, sweep: 420, q: 0.8, dur: 0.08, vol: 0.3, pan: pan });
          S.tone({ wave: 'square', f0: 190, f1: 80, dur: 0.07, vol: 0.18, pan: pan });
          break;
        case 'revolver':
          S.noise({ freq: 1500, sweep: 200, q: 0.6, dur: 0.34, vol: 0.6, pan: pan });
          S.tone({ wave: 'triangle', f0: 210, f1: 60, dur: 0.3, vol: 0.4, pan: pan });
          break;
        case 'pistol':
          S.noise({ freq: 2600, sweep: 700, q: 0.9, dur: 0.09, vol: 0.28, pan: pan });
          S.tone({ wave: 'square', f0: 300, f1: 120, dur: 0.07, vol: 0.16, pan: pan });
          break;
        case 'flame':
          S.noise({ freq: 620, q: 0.7, dur: 0.2, vol: 0.16, rate: 0.7, pan: pan });
          break;
        case 'spinup':
          S.tone({ wave: 'sawtooth', f0: 60, f1: 220, dur: 0.5, vol: 0.12, pan: pan });
          break;
        case 'grenade':
          S.tone({ wave: 'sine', f0: 500, f1: 200, dur: 0.12, vol: 0.16, pan: pan });
          break;
        case 'explode':
          S.noise({ freq: 380, sweep: 60, q: 0.4, dur: 0.75, vol: 0.8, pan: pan });
          S.tone({ wave: 'sine', f0: 90, f1: 32, dur: 0.7, vol: 0.5, pan: pan });
          break;
        case 'platform':
          S.noise({ freq: 900, sweep: 1500, q: 1.2, dur: 0.22, vol: 0.3, pan: pan });
          break;
        case 'grapple':
          S.noise({ freq: 1800, sweep: 900, q: 1.5, dur: 0.18, vol: 0.28, pan: pan });
          S.tone({ wave: 'triangle', f0: 420, f1: 900, dur: 0.2, vol: 0.14, pan: pan });
          break;
        case 'zipline':
          S.tone({ wave: 'sawtooth', f0: 180, f1: 400, dur: 0.3, vol: 0.14, pan: pan });
          break;
        case 'shield':
          S.tone({ wave: 'sine', f0: 300, f1: 900, dur: 0.5, vol: 0.2 });
          S.noise({ freq: 2500, q: 2, dur: 0.5, vol: 0.12 });
          break;
        case 'hurt':
          S.noise({ freq: 500, sweep: 120, q: 0.5, dur: 0.25, vol: 0.4 });
          S.tone({ wave: 'sawtooth', f0: 160, f1: 60, dur: 0.2, vol: 0.22 });
          break;
        case 'bughit':
          S.noise({ freq: 900, sweep: 300, q: 1.4, dur: 0.09, vol: 0.22, pan: pan });
          break;
        case 'bugdie':
          S.noise({ freq: 600, sweep: 130, q: 0.7, dur: 0.28, vol: 0.35, pan: pan });
          S.tone({ wave: 'triangle', f0: 240, f1: 70, dur: 0.24, vol: 0.16, pan: pan });
          break;
        case 'step':
          S.noise({ freq: 320, sweep: 140, q: 1.1, dur: 0.09, vol: 0.13, pan: pan });
          break;
        case 'jump':
          S.tone({ wave: 'triangle', f0: 240, f1: 420, dur: 0.1, vol: 0.1, pan: pan });
          break;
        case 'land':
          S.noise({ freq: 260, sweep: 90, q: 0.9, dur: 0.16, vol: 0.24, pan: pan });
          break;
        case 'ui':
          S.tone({ wave: 'square', f0: 520, f1: 700, dur: 0.05, vol: 0.09 });
          break;
        case 'uibig':
          S.tone({ wave: 'square', f0: 300, f1: 520, dur: 0.09, vol: 0.14 });
          S.tone({ wave: 'square', f0: 620, f1: 780, dur: 0.12, vol: 0.1, delay: 0.07 });
          break;
        case 'alarm':
          S.tone({ wave: 'square', f0: 880, f1: 620, dur: 0.35, vol: 0.16 });
          S.tone({ wave: 'square', f0: 880, f1: 620, dur: 0.35, vol: 0.16, delay: 0.4 });
          break;
        case 'podland':
          S.noise({ freq: 200, sweep: 45, q: 0.4, dur: 1.4, vol: 0.85 });
          S.tone({ wave: 'sine', f0: 70, f1: 28, dur: 1.3, vol: 0.5 });
          break;
        case 'thruster':
          S.noise({ freq: 420, q: 0.6, dur: 0.5, vol: 0.2, rate: 0.6 });
          break;
        case 'beep':
          S.tone({ wave: 'square', f0: 1200, dur: 0.06, vol: 0.1 });
          break;
        case 'revive':
          S.tone({ wave: 'sine', f0: 300, f1: 800, dur: 0.5, vol: 0.2 });
          break;
        case 'nitra':
          S.tone({ wave: 'sine', f0: 900, f1: 500, dur: 0.2, vol: 0.16 });
          break;
      }
    },

    /* ---------- 循环音效（钻机 / 喷火器 / 转管机枪） ---------- */
    loops: {},
    buildLoop: function (name, o) {
      var t = ctx.currentTime;
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      src.playbackRate.value = o.rate || 1;
      var flt = ctx.createBiquadFilter();
      flt.type = o.type || 'bandpass';
      flt.frequency.value = o.freq || 600;
      flt.Q.value = o.q || 1;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(Math.max(0.0002, o.vol == null ? 0.3 : o.vol), t + 0.07);
      var pan = null, tail = g;
      if (ctx.createStereoPanner) {
        pan = ctx.createStereoPanner(); pan.pan.value = M.clamp(o.pan || 0, -1, 1);
        g.connect(pan); tail = pan;
      }
      src.connect(flt); flt.connect(g); tail.connect(sfxBus);
      src.start(t);
      var l = { src: src, g: g, pan: pan, kind: o.kind, nodes: [src, flt, g, pan] };
      S.loops[name] = l;
      return l;
    },
    /** start / update a continuous loop, or stop it with {stop:true} */
    loop: function (name, o) {
      if (!ctx || !unlocked) return;
      if (o && o.stop) { S.stopLoop(name); return; }
      if (!o) return;
      var l = S.loops[name];
      if (!l || l.kind !== o.kind) { S.stopLoop(name); l = S.buildLoop(name, o); }
      if (l.pan) l.pan.pan.value = M.clamp(o.pan || 0, -1, 1);
      if (o.rate) l.src.playbackRate.value = o.rate;
      l.last = ctx.currentTime;
    },
    stopLoop: function (name) {
      var l = S.loops[name];
      if (!l) return;
      delete S.loops[name];
      try {
        l.g.gain.cancelScheduledValues(ctx.currentTime);
        l.g.gain.setValueAtTime(Math.max(0.0001, l.g.gain.value), ctx.currentTime);
        l.g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.07);
        setTimeout(function () { try { l.src.stop(); } catch (e) { } }, 140);
      } catch (e) { }
    },
    stopAllLoops: function () { for (var k in S.loops) S.stopLoop(k); },

    /* ---------- 语音并发限制 ---------- */
    voiceActive: 0,
    lastVoice: {},
    voiceBusy: function () { return S.voiceActive >= 2; },

    /** play a shipped ogg clip; keeps a small pool so overlaps are fine */
    clip: function (key, vol, isVoice) {
      var el = DRG.assets.snd[key];
      if (!el || !unlocked) return null;
      if (!el.getAttribute('src') && el.dataset.src) {
        el.src = el.dataset.src;
        delete el.dataset.src;
      }
      // 语音线最多同时 2 条，同一条 450ms 内不重复 —— 杜绝虫子合唱团
      if (isVoice) {
        if (S.voiceActive >= 2) return null;
        var vnow = performance.now();
        if (S.lastVoice[key] && vnow - S.lastVoice[key] < 450) return null;
        S.lastVoice[key] = vnow;
      }
      var v = (vol == null ? 1 : vol) * opts().master * (isVoice ? opts().voice : opts().sfx);
      if (v <= 0.001) return null;
      var node;
      try {
        node = el.cloneNode();
        node.volume = M.clamp(v, 0, 1);
        var p = node.play();
        if (p && p.catch) p.catch(function () { });
      } catch (e) { return null; }
      if (isVoice) {
        S.voiceActive++;
        var done = function () { S.voiceActive = Math.max(0, S.voiceActive - 1); };
        node.addEventListener('ended', done, { once: true });
        node.addEventListener('error', done, { once: true });
      }
      return node;
    },

    /** random pick out of key_1..key_n style families */
    clipOf: function (list, vol, isVoice) {
      if (!list || !list.length) return null;
      return S.clip(list[Math.floor(Math.random() * list.length)], vol, isVoice);
    },

    /* ---------- cave ambience: slow evolving drone ---------- */
    ambience: { on: false, nodes: null },
    startAmbience: function (tint) {
      S.init();
      if (!ctx || S.ambience.on) return;
      var g = ctx.createGain(); g.gain.value = 0; g.connect(musicBus);
      var osc1 = ctx.createOscillator(); osc1.type = 'sine'; osc1.frequency.value = 55 + (tint || 0) * 3;
      var osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 82.5 + (tint || 0) * 4;
      var lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.06;
      var lfoG = ctx.createGain(); lfoG.gain.value = 0.05;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      var wind = ctx.createBufferSource(); wind.buffer = noiseBuf; wind.loop = true;
      var wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 220;
      var wg = ctx.createGain(); wg.gain.value = 0.5;
      wind.connect(wf); wf.connect(wg); wg.connect(g);
      osc1.connect(g); osc2.connect(g);
      osc1.start(); osc2.start(); lfo.start(); wind.start();
      g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 4);
      S.ambience = { on: true, nodes: [osc1, osc2, lfo, wind], gain: g };
    },
    stopAmbience: function () {
      if (!S.ambience.on) return;
      var a = S.ambience;
      try {
        a.gain.gain.cancelScheduledValues(ctx.currentTime);
        a.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        setTimeout(function () { a.nodes.forEach(function (n) { try { n.stop(); } catch (e) { } }); }, 800);
      } catch (e) { }
      S.ambience = { on: false, nodes: null };
    }
  };
})(window);
