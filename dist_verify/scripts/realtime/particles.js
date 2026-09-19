/* ============================================================
   particles.js — pooled particles, decals and floating text
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M;

  function Particles(max) {
    this.max = max || 1400;
    this.p = [];
    for (var i = 0; i < this.max; i++) {
      this.p.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, col: '#fff', kind: 0, grav: 1, spin: 0, rot: 0, text: '', glow: 0 });
    }
    this.cursor = 0;
    this.texts = [];
  }

  Particles.prototype.spawn = function (o) {
    var density = DRG.opts().particles;
    if (density < 1 && Math.random() > density) return null;
    for (var tries = 0; tries < 24; tries++) {
      var q = this.p[this.cursor = (this.cursor + 1) % this.max];
      if (!q.alive) {
        q.alive = true;
        q.x = o.x; q.y = o.y;
        q.vx = o.vx || 0; q.vy = o.vy || 0;
        q.life = q.max = o.life || 0.6;
        q.size = o.size || 3;
        q.col = o.col || '#ffcc88';
        q.kind = o.kind || 0;          // 0 chunk, 1 spark, 2 smoke, 3 blood, 4 ember, 5 ring
        q.grav = o.grav == null ? 1 : o.grav;
        q.rot = o.rot || Math.random() * 6.283;
        q.spin = o.spin == null ? (Math.random() - 0.5) * 8 : o.spin;
        q.glow = o.glow || 0;
        q.drag = o.drag == null ? 0.02 : o.drag;
        return q;
      }
    }
    return null;
  };

  Particles.prototype.burst = function (x, y, n, o) {
    o = o || {};
    for (var i = 0; i < n; i++) {
      var a = o.ang == null ? Math.random() * 6.283 : o.ang + (Math.random() - 0.5) * (o.spread || 1.2);
      var sp = (o.speed || 120) * (0.35 + Math.random() * 0.9);
      this.spawn({
        x: x + (Math.random() - 0.5) * (o.jitter || 4),
        y: y + (Math.random() - 0.5) * (o.jitter || 4),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: (o.life || 0.6) * (0.6 + Math.random() * 0.8),
        size: (o.size || 3) * (0.6 + Math.random() * 0.9),
        col: Array.isArray(o.col) ? o.col[Math.floor(Math.random() * o.col.length)] : o.col,
        kind: o.kind || 0, grav: o.grav == null ? 1 : o.grav, glow: o.glow || 0, drag: o.drag
      });
    }
  };

  Particles.prototype.text = function (x, y, str, col, size) {
    if (this.texts.length > 40) this.texts.shift();
    this.texts.push({ x: x, y: y, t: 0, life: 1.1, str: str, col: col || '#ffd76a', size: size || 14, vy: -34 });
  };

  Particles.prototype.update = function (dt, world) {
    var G = DRG.CFG.GRAVITY;
    for (var i = 0; i < this.max; i++) {
      var q = this.p[i];
      if (!q.alive) continue;
      q.life -= dt;
      if (q.life <= 0) { q.alive = false; continue; }
      q.vy += G * q.grav * dt;
      q.vx -= q.vx * q.drag * dt * 60 * 0.06;
      var nx = q.x + q.vx * dt, ny = q.y + q.vy * dt;
      if (world && q.kind !== 2 && q.kind !== 5) {
        if (world.solidPx(nx, q.y)) { q.vx *= -0.35; nx = q.x; }
        if (world.solidPx(q.x, ny)) { q.vy *= -0.3; q.vx *= 0.7; ny = q.y; if (Math.abs(q.vy) < 24) q.vy = 0; }
      }
      q.x = nx; q.y = ny;
      q.rot += q.spin * dt;
    }
    for (var j = this.texts.length - 1; j >= 0; j--) {
      var t = this.texts[j];
      t.t += dt; t.y += t.vy * dt; t.vy *= 0.94;
      if (t.t >= t.life) this.texts.splice(j, 1);
    }
  };

  Particles.prototype.draw = function (g, cam) {
    var i, q, a;
    g.save();
    for (i = 0; i < this.max; i++) {
      q = this.p[i];
      if (!q.alive) continue;
      var sx = q.x - cam.x, sy = q.y - cam.y;
      if (sx < -30 || sy < -30 || sx > cam.w + 30 || sy > cam.h + 30) continue;
      a = M.clamp(q.life / q.max, 0, 1);
      g.globalAlpha = q.kind === 2 ? a * 0.5 : a;
      g.fillStyle = q.col;
      if (q.kind === 1 || q.kind === 4) {           // spark / ember streak
        g.globalCompositeOperation = 'lighter';
        var l = M.clamp(M.len(q.vx, q.vy) * 0.02, 1, 9);
        var ang = Math.atan2(q.vy, q.vx);
        g.save(); g.translate(sx, sy); g.rotate(ang);
        g.fillRect(-l, -q.size * 0.35, l * 2, q.size * 0.7);
        g.restore();
        g.globalCompositeOperation = 'source-over';
      } else if (q.kind === 2) {                    // smoke puff
        g.beginPath(); g.arc(sx, sy, q.size * (2 - a), 0, 6.283); g.fill();
      } else if (q.kind === 5) {                    // shock ring
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = q.col; g.lineWidth = Math.max(1, 3 * a);
        g.beginPath(); g.arc(sx, sy, q.size * (1 - a) * 8 + 4, 0, 6.283); g.stroke();
        g.globalCompositeOperation = 'source-over';
      } else {                                      // rock chunk / blood
        g.save(); g.translate(sx, sy); g.rotate(q.rot);
        g.fillRect(-q.size / 2, -q.size / 2, q.size, q.size);
        g.restore();
      }
    }
    g.globalAlpha = 1;
    g.restore();
  };

  Particles.prototype.drawText = function (g, cam) {
    g.save();
    g.textAlign = 'center';
    for (var i = 0; i < this.texts.length; i++) {
      var t = this.texts[i];
      var a = 1 - t.t / t.life;
      g.globalAlpha = M.clamp(a * 1.6, 0, 1);
      g.font = '800 ' + t.size + 'px ' + DRG.gfx.FONT;
      g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.75)';
      g.strokeText(t.str, t.x - cam.x, t.y - cam.y);
      g.fillStyle = t.col;
      g.fillText(t.str, t.x - cam.x, t.y - cam.y);
    }
    g.globalAlpha = 1;
    g.restore();
  };

  /** lights emitted by glowing particles (embers, flames) */
  Particles.prototype.emitLights = function (cam) {
    var L = DRG.light, n = 0;
    for (var i = 0; i < this.max && n < 26; i++) {
      var q = this.p[i];
      if (!q.alive || !q.glow) continue;
      var a = M.clamp(q.life / q.max, 0, 1);
      L.add(q.x - cam.x, q.y - cam.y, q.glow * (0.5 + a), 0.5 * a, [255, 190, 110], 0.25 * a);
      n++;
    }
  };

  DRG.Particles = Particles;
})(window);
