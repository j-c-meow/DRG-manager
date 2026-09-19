/* ============================================================
   lighting.js — the darkness of Hoxxes IV.
   A low-res additive light buffer multiplied over the scene,
   plus an additive bloom pass for flares and muzzle flashes.
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M;

  var L = DRG.light = {
    cv: null, g: null, scale: 3, w: 0, h: 0,
    bloom: null, bg: null,
    lights: 0,

    begin: function (w, h, ambient, tint) {
      var s = DRG.CFG.LIGHT_DOWNSCALE;
      var bw = Math.max(1, Math.ceil(w / s)), bh = Math.max(1, Math.ceil(h / s));
      if (!L.cv) { L.cv = document.createElement('canvas'); L.g = L.cv.getContext('2d'); }
      if (!L.bloom) { L.bloom = document.createElement('canvas'); L.bg = L.bloom.getContext('2d'); }
      if (L.cv.width !== bw || L.cv.height !== bh) {
        L.cv.width = bw; L.cv.height = bh;
        L.bloom.width = bw; L.bloom.height = bh;
      }
      L.scale = s; L.w = w; L.h = h; L.lights = 0;
      var g = L.g;
      g.globalCompositeOperation = 'source-over';
      var a = M.clamp(ambient, 0, 1);
      // ambient floor keeps the cave readable without killing the mood
      var r = Math.round(255 * a * (0.72 + tint * 0.02));
      var gg = Math.round(255 * a * 0.80);
      var b = Math.round(255 * a * (1.0 + tint * 0.01));
      g.fillStyle = 'rgb(' + M.clamp(r, 0, 255) + ',' + M.clamp(gg, 0, 255) + ',' + M.clamp(b, 0, 255) + ')';
      g.fillRect(0, 0, L.cv.width, L.cv.height);
      g.globalCompositeOperation = 'lighter';
      L.bg.clearRect(0, 0, L.bloom.width, L.bloom.height);
    },

    /** radial light in screen pixels; color like [255,220,170] */
    add: function (x, y, radius, intensity, col, bloomAmt) {
      if (radius <= 0 || intensity <= 0) return;
      var s = L.scale, g = L.g;
      var sx = x / s, sy = y / s, sr = radius / s;
      if (sx + sr < 0 || sy + sr < 0 || sx - sr > L.cv.width || sy - sr > L.cv.height) return;
      L.lights++;
      var c = col || [255, 238, 210];
      var grd = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
      var i = M.clamp(intensity, 0, 2);
      grd.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + i + ')');
      grd.addColorStop(0.45, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (i * 0.42).toFixed(3) + ')');
      grd.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(sx, sy, sr, 0, 6.283); g.fill();

      if (bloomAmt) {
        var bg = L.bg;
        var br = sr * 0.6;
        var g2 = bg.createRadialGradient(sx, sy, 0, sx, sy, br);
        g2.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (bloomAmt * 0.9).toFixed(3) + ')');
        g2.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
        bg.globalCompositeOperation = 'lighter';
        bg.fillStyle = g2;
        bg.beginPath(); bg.arc(sx, sy, br, 0, 6.283); bg.fill();
      }
    },

    /** helmet lamp: a soft cone on top of a small radial pool */
    addCone: function (x, y, ang, spread, radius, intensity, col) {
      var s = L.scale, g = L.g;
      var sx = x / s, sy = y / s, sr = radius / s;
      var c = col || [255, 244, 214];
      L.lights++;
      g.save();
      g.translate(sx, sy); g.rotate(ang);
      var grd = g.createRadialGradient(0, 0, 0, 0, 0, sr);
      grd.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + intensity + ')');
      grd.addColorStop(0.5, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (intensity * 0.5).toFixed(3) + ')');
      grd.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, sr, -spread / 2, spread / 2);
      g.closePath(); g.fill();
      g.restore();
    },

    /** multiply the light buffer over the scene, then add the bloom */
    end: function (g, w, h) {
      g.save();
      g.imageSmoothingEnabled = true;
      g.globalCompositeOperation = 'multiply';
      g.drawImage(L.cv, 0, 0, w, h);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.55;
      g.drawImage(L.bloom, 0, 0, w, h);
      g.restore();
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
    }
  };
})(window);
