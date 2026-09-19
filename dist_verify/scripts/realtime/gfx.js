/* ============================================================
   gfx.js — sprite + canvas drawing helpers shared by everything
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M;

  var gfx = DRG.gfx = {
    /** canvas font stack: latin display face first, subsetted CJK face behind it */
    FONT: '"Saira Condensed", "Chakra Petch", "DRG Sans CJK", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',

    /** draw an image scaled so its height is h, centred on (x,y) */
    sprite: function (g, img, x, y, h, opt) {
      if (!img || !img.width) return;
      opt = opt || {};
      var sc = h / img.height;
      var w = img.width * sc;
      g.save();
      g.translate(x, y);
      if (opt.rot) g.rotate(opt.rot);
      if (opt.flip) g.scale(-1, 1);
      if (opt.alpha != null) g.globalAlpha = opt.alpha;
      if (opt.squash) g.scale(1 / opt.squash, opt.squash);
      g.drawImage(img, -w / 2 + (opt.ox || 0), -h / 2 + (opt.oy || 0), w, h);
      g.restore();
    },

    /** silhouette / tint version (used for damage flashes and shadows) */
    spriteTint: function (g, img, x, y, h, col, alpha, flip) {
      if (!img || !img.width) return;
      var buf = gfx._tintBuf || (gfx._tintBuf = document.createElement('canvas'));
      var b = buf.getContext('2d');
      if (buf.width < img.width || buf.height < img.height) { buf.width = img.width; buf.height = img.height; }
      b.clearRect(0, 0, buf.width, buf.height);
      b.globalCompositeOperation = 'source-over';
      b.drawImage(img, 0, 0);
      b.globalCompositeOperation = 'source-in';
      b.fillStyle = col;
      b.fillRect(0, 0, img.width, img.height);
      b.globalCompositeOperation = 'source-over';
      var sc = h / img.height, w = img.width * sc;
      g.save();
      g.globalAlpha = alpha == null ? 1 : alpha;
      g.translate(x, y);
      if (flip) g.scale(-1, 1);
      g.drawImage(buf, 0, 0, img.width, img.height, -w / 2, -h / 2, w, h);
      g.restore();
    },

    text: function (g, str, x, y, opt) {
      opt = opt || {};
      g.save();
      g.font = (opt.weight || 700) + ' ' + (opt.size || 16) + 'px ' + (opt.font || gfx.FONT);
      g.textAlign = opt.align || 'left';
      g.textBaseline = opt.baseline || 'alphabetic';
      if (opt.shadow !== false) {
        g.lineJoin = 'round';
        g.lineWidth = opt.outline || 3;
        g.strokeStyle = opt.outlineCol || 'rgba(0,0,0,0.72)';
        g.strokeText(str, x, y);
      }
      g.fillStyle = opt.col || '#f2e9cf';
      if (opt.alpha != null) g.globalAlpha = opt.alpha;
      g.fillText(str, x, y);
      g.restore();
    },

    /** industrial DRG-ish panel */
    panel: function (g, x, y, w, h, opt) {
      opt = opt || {};
      var r = opt.r == null ? 4 : opt.r;
      g.save();
      g.beginPath();
      gfx.roundRect(g, x, y, w, h, r);
      g.fillStyle = opt.fill || 'rgba(14,17,22,0.82)';
      g.fill();
      if (opt.stroke !== false) {
        g.lineWidth = opt.lw || 2;
        g.strokeStyle = opt.stroke || 'rgba(255,181,60,0.55)';
        g.stroke();
      }
      if (opt.corner !== false) {
        g.strokeStyle = opt.cornerCol || 'rgba(255,181,60,0.95)';
        g.lineWidth = 3;
        var c = Math.min(16, w * 0.2, h * 0.4);
        g.beginPath();
        g.moveTo(x + 1, y + c); g.lineTo(x + 1, y + 1); g.lineTo(x + c, y + 1);
        g.moveTo(x + w - c, y + h - 1); g.lineTo(x + w - 1, y + h - 1); g.lineTo(x + w - 1, y + h - c);
        g.stroke();
      }
      g.restore();
    },

    roundRect: function (g, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      g.moveTo(x + r, y);
      g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
      g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
      g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
    },

    bar: function (g, x, y, w, h, frac, col, opt) {
      opt = opt || {};
      g.save();
      g.fillStyle = opt.back || 'rgba(0,0,0,0.55)';
      g.fillRect(x, y, w, h);
      var f = M.clamp(frac, 0, 1);
      if (opt.grad) {
        var gr = g.createLinearGradient(x, y, x, y + h);
        gr.addColorStop(0, col); gr.addColorStop(1, gfx.mix(col, '#000', 0.35));
        g.fillStyle = gr;
      } else g.fillStyle = col;
      g.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * f), h - 2);
      if (opt.ghost != null) {
        g.fillStyle = 'rgba(255,255,255,0.25)';
        g.fillRect(x + 1 + (w - 2) * f, y + 1, Math.max(0, (w - 2) * (M.clamp(opt.ghost, 0, 1) - f)), h - 2);
      }
      g.strokeStyle = opt.stroke || 'rgba(255,255,255,0.22)';
      g.lineWidth = 1;
      g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      g.restore();
    },

    mix: function (a, b, t) {
      function p(c) {
        if (c[0] === '#') {
          var h = c.slice(1);
          if (h.length === 3 || h.length === 4) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
          return [parseInt(h.substr(0, 2), 16) || 0, parseInt(h.substr(2, 2), 16) || 0, parseInt(h.substr(4, 2), 16) || 0];
        }
        var m = c.match(/[\d.]+/g);
        return m ? [+m[0] || 0, +m[1] || 0, +m[2] || 0] : [255, 255, 255];
      }
      var A = p(a), B = p(b);
      return 'rgb(' + Math.round(M.lerp(A[0], B[0], t)) + ',' + Math.round(M.lerp(A[1], B[1], t)) + ',' + Math.round(M.lerp(A[2], B[2], t)) + ')';
    },

    /** flashing highlight colour for urgent HUD elements */
    pulse: function (t, a, b, speed) {
      return gfx.mix(a, b, (Math.sin(t * (speed || 6)) + 1) / 2);
    }
  };
})(window);
