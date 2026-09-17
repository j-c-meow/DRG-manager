/* ============================================================
   world.js — biomes, destructible tile terrain, procedural caves,
   chunked renderer, minimap.
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M, CFG = DRG.CFG;
  var T = CFG.TILE;

  /* ---------------- tile types ---------------- */
  var TT = DRG.TT = {
    EMPTY: 0, DIRT: 1, ROCK: 2, HARD: 3,
    MORKITE: 4, NITRA: 5, GOLD: 6, CRYSTAL: 7, PLATFORM: 8
  };
  var HP = DRG.TILE_HP = [0, 24, 52, 1e9, 60, 60, 60, 44, 20];
  var ORE_OF = {};
  ORE_OF[TT.MORKITE] = 'morkite'; ORE_OF[TT.NITRA] = 'nitra';
  ORE_OF[TT.GOLD] = 'gold'; ORE_OF[TT.CRYSTAL] = 'crystal';
  DRG.ORE_OF = ORE_OF;

  DRG.ORE_INFO = {
    morkite: { name: '莫尔凯特', cn: 'MORKITE', color: '#3ad98a', icon: 'ore_morkite', value: 0, yield: 1 },
    nitra:   { name: '硝石',     cn: 'NITRA',   color: '#e2503f', icon: 'ore_nitra',   value: 2, yield: 1 },
    gold:    { name: '黄金',     cn: 'GOLD',    color: '#ffc23a', icon: 'ore_gold',    value: 12, yield: 1 },
    crystal: { name: '晶石',     cn: 'GEMS',    color: '#7ad7ff', icon: 'ore_jadiz',   value: 22, yield: 1 }
  };

  /* ---------------- biomes ---------------- */
  DRG.BIOMES = [
    { id: 'crystalline', name: '晶洞秘境', en: 'Crystalline Caverns', art: 'biome_crystalline',
      dirt: '#4b5a78', rock: '#33415a', hard: '#8b93a8', glow: '#7fd4ff', fog: '#0b1220', crystals: 1.6, tint: 2 },
    { id: 'salt', name: '盐晶矿坑', en: 'Salt Pits', art: 'biome_salt',
      dirt: '#8a8471', rock: '#6a6557', hard: '#c9c6b4', glow: '#ffe9b0', fog: '#181510', crystals: 0.7, tint: 5 },
    { id: 'fungus', name: '真菌沼泽', en: 'Fungus Bogs', art: 'biome_fungus',
      dirt: '#4e5f3d', rock: '#374630', hard: '#8fa07a', glow: '#a8ff6a', fog: '#0d1408', crystals: 0.9, tint: 1 },
    { id: 'radioactive', name: '辐射禁区', en: 'Radioactive Exclusion Zone', art: 'biome_radioactive',
      dirt: '#5e5f38', rock: '#43442a', hard: '#a8ab6c', glow: '#c6ff3a', fog: '#0f1008', crystals: 1.1, tint: 3 },
    { id: 'biozone', name: '茂密生态区', en: 'Dense Biozone', art: 'biome_biozone',
      dirt: '#46583a', rock: '#2f3f2b', hard: '#7d9668', glow: '#7dff9a', fog: '#08120b', crystals: 1.0, tint: 1 },
    { id: 'glacial', name: '冰川地层', en: 'Glacial Strata', art: 'biome_glacial',
      dirt: '#5d7488', rock: '#41556a', hard: '#b9d6e8', glow: '#a8e9ff', fog: '#0a1420', crystals: 1.3, tint: 6 },
    { id: 'magma', name: '岩浆核心', en: 'Magma Core', art: 'biome_magma',
      dirt: '#6b3524', rock: '#4a251b', hard: '#a3543a', glow: '#ff7a2a', fog: '#160805', crystals: 0.8, tint: 8 },
    { id: 'azure', name: '蔚蓝荒原', en: 'Azure Weald', art: 'biome_azure',
      dirt: '#40506e', rock: '#2c3a52', hard: '#8ba0c8', glow: '#66b8ff', fog: '#080f1a', crystals: 1.4, tint: 2 },
    { id: 'bough', name: '空心枝丫', en: 'Hollow Bough', art: 'biome_bough',
      dirt: '#5e452f', rock: '#43301f', hard: '#9c7a52', glow: '#ff9a5a', fog: '#120a05', crystals: 1.0, tint: 7 },
    { id: 'sandblasted', name: '风蚀走廊', en: 'Sandblasted Corridors', art: 'biome_sandblasted',
      dirt: '#8a713f', rock: '#68542f', hard: '#c8ab72', glow: '#ffd27a', fog: '#141005', crystals: 0.8, tint: 5 }
  ];
  DRG.biomeById = function (id) {
    for (var i = 0; i < DRG.BIOMES.length; i++) if (DRG.BIOMES[i].id === id) return DRG.BIOMES[i];
    return DRG.BIOMES[0];
  };

  /* ---------------- world ---------------- */
  function World(opt) {
    this.w = opt.w || 400;
    this.h = opt.h || 165;
    this.seed = opt.seed || 1;
    this.biome = opt.biome || DRG.BIOMES[0];
    this.rng = DRG.RNG(this.seed);
    this.noise = DRG.makeNoise(this.seed ^ 0x9e37);
    this.noise2 = DRG.makeNoise(this.seed ^ 0x51ed);
    var n = this.w * this.h;
    this.tiles = new Uint8Array(n);
    this.hp = new Uint16Array(n);
    this.explored = new Uint8Array(n);
    this.chunks = new Map();
    this.chunkOrder = [];
    this.nodes = [];
    this.oreCount = { morkite: 0, nitra: 0, gold: 0, crystal: 0 };
    this.dirtyMinimap = true;
    this.mmBox = null;                    // dirty bbox for incremental minimap redraws
    this.shade = new Uint8Array(n);       // per-tile colour jitter
    this.generate();
  }
  World.prototype.idx = function (tx, ty) { return ty * this.w + tx; };
  /** grow the minimap's dirty rectangle so redraws stay cheap */
  World.prototype.mmDirty = function (tx, ty) {
    var b = this.mmBox;
    if (!b) this.mmBox = { x0: tx, y0: ty, x1: tx, y1: ty };
    else {
      if (tx < b.x0) b.x0 = tx; if (tx > b.x1) b.x1 = tx;
      if (ty < b.y0) b.y0 = ty; if (ty > b.y1) b.y1 = ty;
    }
    this.dirtyMinimap = true;
  };
  World.prototype.inside = function (tx, ty) { return tx >= 0 && ty >= 0 && tx < this.w && ty < this.h; };
  World.prototype.at = function (tx, ty) {
    return this.inside(tx, ty) ? this.tiles[ty * this.w + tx] : TT.HARD;
  };
  World.prototype.solid = function (tx, ty) { return this.at(tx, ty) !== TT.EMPTY; };
  World.prototype.solidPx = function (x, y) {
    return this.solid(Math.floor(x / T), Math.floor(y / T));
  };
  World.prototype.set = function (tx, ty, type) {
    if (!this.inside(tx, ty)) return;
    var i = ty * this.w + tx;
    if (this.tiles[i] === type) return;
    this.tiles[i] = type;
    this.hp[i] = HP[type];
    this.invalidateAround(tx, ty);
    this.mmDirty(tx, ty);
  };

  /* ---------------- generation ---------------- */
  World.prototype.generate = function () {
    var w = this.w, h = this.h, rng = this.rng, i, x, y;
    var carve = new Uint8Array(w * h);

    // 1. solid rock everywhere
    for (i = 0; i < w * h; i++) this.tiles[i] = TT.ROCK;

    // 2. cave nodes on a jittered grid
    var cols = 9, rows = 5, nodes = [];
    for (var cy = 0; cy < rows; cy++) {
      for (var cx = 0; cx < cols; cx++) {
        var nx = Math.round((cx + 0.5) / cols * (w - 40) + 20 + rng.range(-13, 13));
        var ny = Math.round((cy + 0.5) / rows * (h - 34) + 17 + rng.range(-9, 9));
        if (rng.chance(0.14) && nodes.length > 6) continue;       // a few gaps
        nodes.push({ x: M.clamp(nx, 14, w - 15), y: M.clamp(ny, 12, h - 13), r: rng.range(5.5, 13) });
      }
    }
    this.nodes = nodes;

    var self = this;
    function ellipse(cxx, cyy, rx, ry, wobble) {
      var x0 = Math.max(1, Math.floor(cxx - rx - 2)), x1 = Math.min(w - 2, Math.ceil(cxx + rx + 2));
      var y0 = Math.max(1, Math.floor(cyy - ry - 2)), y1 = Math.min(h - 2, Math.ceil(cyy + ry + 2));
      for (var yy = y0; yy <= y1; yy++) {
        for (var xx = x0; xx <= x1; xx++) {
          var dx = (xx - cxx) / rx, dy = (yy - cyy) / ry;
          var d = Math.sqrt(dx * dx + dy * dy);
          var wob = wobble ? (self.noise(xx * 0.14, yy * 0.14) - 0.5) * 0.55 : 0;
          if (d + wob < 1) carve[yy * w + xx] = 1;
        }
      }
    }
    function tunnel(a, b, rad) {
      var steps = Math.ceil(M.dist(a.x, a.y, b.x, b.y) * 1.6) + 2;
      var mx = (a.x + b.x) / 2 + rng.range(-9, 9), my = (a.y + b.y) / 2 + rng.range(-7, 7);
      for (var s = 0; s <= steps; s++) {
        var t = s / steps, it = 1 - t;
        var px = it * it * a.x + 2 * it * t * mx + t * t * b.x;
        var py = it * it * a.y + 2 * it * t * my + t * t * b.y;
        var r = rad * (0.8 + 0.5 * self.noise(px * 0.09, py * 0.09));
        ellipse(px, py, r, r * rng.range(0.75, 1.05), false);
      }
    }

    // 3. caverns
    for (i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      ellipse(nd.x, nd.y, nd.r * rng.range(1.0, 1.6), nd.r * rng.range(0.6, 1.0), true);
      if (rng.chance(0.5)) ellipse(nd.x + rng.range(-6, 6), nd.y + rng.range(-4, 4), nd.r * 0.8, nd.r * 0.6, true);
    }

    // 4. connect: nearest-neighbour spanning tree + extra loops
    var connected = [0], pending = [];
    for (i = 1; i < nodes.length; i++) pending.push(i);
    while (pending.length) {
      var bestA = 0, bestB = 0, bestD = 1e9;
      for (var a = 0; a < connected.length; a++) {
        for (var b = 0; b < pending.length; b++) {
          var d = M.dist2(nodes[connected[a]].x, nodes[connected[a]].y, nodes[pending[b]].x, nodes[pending[b]].y);
          if (d < bestD) { bestD = d; bestA = connected[a]; bestB = b; }
        }
      }
      var nb = pending.splice(bestB, 1)[0];
      tunnel(nodes[bestA], nodes[nb], rng.range(2.3, 3.6));
      connected.push(nb);
    }
    for (i = 0; i < Math.floor(nodes.length * 0.4); i++) {
      var p = nodes[rng.int(0, nodes.length - 1)], q = nodes[rng.int(0, nodes.length - 1)];
      if (p !== q && M.dist(p.x, p.y, q.x, q.y) < 55) tunnel(p, q, rng.range(1.9, 3.0));
    }

    // 5. a couple of long vertical shafts for verticality
    for (i = 0; i < 3; i++) {
      var sx = rng.int(25, w - 25), sy0 = rng.int(14, h - 60);
      tunnel({ x: sx, y: sy0 }, { x: sx + rng.range(-6, 6), y: sy0 + rng.range(35, 55) }, rng.range(2.0, 3.0));
    }

    // 6. cellular-automata smoothing (organic edges, keeps connectivity)
    var tmp = new Uint8Array(carve);
    for (var pass = 0; pass < 2; pass++) {
      for (y = 2; y < h - 2; y++) {
        for (x = 2; x < w - 2; x++) {
          var open = 0;
          for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) if (carve[(y + oy) * w + x + ox]) open++;
          var k = y * w + x;
          tmp[k] = carve[k] ? (open >= 3 ? 1 : 0) : (open >= 6 ? 1 : 0);
        }
      }
      carve.set(tmp);
    }

    // 7. materialise: empty / dirt / rock / hard rock
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        i = y * w + x;
        this.shade[i] = Math.floor(this.noise2(x * 0.7, y * 0.7) * 255);
        if (x < 3 || y < 3 || x >= w - 3 || y >= h - 3) { this.tiles[i] = TT.HARD; continue; }
        if (carve[i]) { this.tiles[i] = TT.EMPTY; continue; }
        var nv = this.noise(x * 0.055, y * 0.055);
        var hv = this.noise2(x * 0.11 + 40, y * 0.11 - 20);
        if (hv > 0.845 && nv > 0.4) this.tiles[i] = TT.HARD;        // unbreakable veins
        else this.tiles[i] = nv > 0.52 ? TT.DIRT : TT.ROCK;
      }
    }

    // 7b. shave the sharpest floor steps so a stubby dwarf can walk the caves
    var self3 = this;
    function empty(xx, yy) { return self3.at(xx, yy) === TT.EMPTY; }
    for (y = 5; y < h - 5; y++) {
      for (x = 5; x < w - 5; x++) {
        i = y * w + x;
        if (this.tiles[i] === TT.EMPTY || this.tiles[i] === TT.HARD) continue;
        if (this.tiles[i - w] === TT.EMPTY || this.tiles[i - w] === TT.HARD) continue;
        if (!empty(x, y - 2)) continue;
        var leftOpen = empty(x - 1, y - 1) && empty(x - 1, y);
        var rightOpen = empty(x + 1, y - 1) && empty(x + 1, y);
        if (leftOpen || rightOpen) this.tiles[i - w] = TT.EMPTY;
      }
    }

    // 8. mineral veins on cave surfaces
    var surface = [];
    for (y = 4; y < h - 4; y++) {
      for (x = 4; x < w - 4; x++) {
        i = y * w + x;
        if (this.tiles[i] === TT.EMPTY || this.tiles[i] === TT.HARD) continue;
        if (this.tiles[i - 1] === TT.EMPTY || this.tiles[i + 1] === TT.EMPTY ||
            this.tiles[i - w] === TT.EMPTY || this.tiles[i + w] === TT.EMPTY) surface.push(i);
      }
    }
    rng.shuffle(surface);
    var self2 = this;
    function vein(startIdx, type, size) {
      var open = [startIdx], placed = 0, guard = 0;
      while (open.length && placed < size && guard++ < 160) {
        var k = open.splice(rng.int(0, open.length - 1), 1)[0];
        if (self2.tiles[k] === TT.EMPTY || self2.tiles[k] === TT.HARD || self2.tiles[k] === type) continue;
        self2.tiles[k] = type; self2.hp[k] = HP[type]; placed++;
        var kx = k % w, ky = (k - kx) / w;
        if (kx > 4) open.push(k - 1);
        if (kx < w - 5) open.push(k + 1);
        if (ky > 4) open.push(k - w);
        if (ky < h - 5) open.push(k + w);
      }
      return placed;
    }
    var plan = [
      ['morkite', TT.MORKITE, 64, 3, 8],
      ['nitra', TT.NITRA, 32, 3, 6],
      ['gold', TT.GOLD, 20, 2, 5],
      ['crystal', TT.CRYSTAL, Math.round(22 * (this.biome.crystals || 1)), 2, 4]
    ];
    var cursor = 0;
    for (var pi = 0; pi < plan.length; pi++) {
      var pl = plan[pi];
      for (var v = 0; v < pl[2] && cursor < surface.length; v++) {
        var n2 = vein(surface[cursor += Math.max(1, rng.int(3, 11))], pl[1], rng.int(pl[3], pl[4]));
        this.oreCount[pl[0]] += n2;
      }
    }

    // 9. entry cavern: leftmost-ish node with the most open space + drop shaft
    var startNode = nodes[0];
    for (i = 0; i < nodes.length; i++) if (nodes[i].x < startNode.x + 6 && nodes[i].r > startNode.r) startNode = nodes[i];
    ellipse(startNode.x, startNode.y, 9, 6, false);
    for (y = 3; y < startNode.y; y++) {
      for (x = startNode.x - 3; x <= startNode.x + 3; x++) {
        i = y * w + x;
        if (this.tiles[i] !== TT.HARD || y > 4) this.tiles[i] = TT.EMPTY;
      }
    }
    for (y = startNode.y - 8; y < startNode.y + 8; y++)
      for (x = startNode.x - 10; x <= startNode.x + 10; x++)
        if (this.inside(x, y) && M.dist(x, y, startNode.x, startNode.y) < 8) this.tiles[y * w + x] = TT.EMPTY;

    // floor under the entry cavern so nobody falls out of the map
    for (x = startNode.x - 11; x <= startNode.x + 11; x++)
      for (y = startNode.y + 6; y < startNode.y + 9; y++)
        if (this.inside(x, y) && this.tiles[y * w + x] === TT.EMPTY) this.tiles[y * w + x] = TT.DIRT;

    this.start = { tx: startNode.x, ty: startNode.y + 4 };
    this.startNode = startNode;

    // 10. tile hp
    for (i = 0; i < w * h; i++) this.hp[i] = HP[this.tiles[i]];

    // 11. cache open floor spots (spawning, molly, pods)
    this.floors = [];
    for (y = 6; y < h - 6; y++) {
      for (x = 6; x < w - 6; x++) {
        i = y * w + x;
        if (this.tiles[i] !== TT.EMPTY) continue;
        if (this.tiles[i + w] === TT.EMPTY || this.tiles[i + w] === TT.HARD) continue;
        if (this.tiles[i - w] !== TT.EMPTY || this.tiles[i - 2 * w] !== TT.EMPTY) continue;
        this.floors.push({ tx: x, ty: y });
      }
    }
    DRG.log('world', this.w + 'x' + this.h, 'ore', JSON.stringify(this.oreCount), 'floors', this.floors.length);
  };

  /* ---------------- queries ---------------- */
  World.prototype.rectSolid = function (x, y, w, h) {
    var x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.001) / T);
    var y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.001) / T);
    for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) if (this.solid(tx, ty)) return true;
    return false;
  };

  /** DDA ray march; returns {hit,tx,ty,x,y,dist,type} */
  World.prototype.ray = function (x0, y0, dx, dy, maxDist) {
    var len = M.len(dx, dy) || 1; dx /= len; dy /= len;
    var tx = Math.floor(x0 / T), ty = Math.floor(y0 / T);
    var stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1;
    var tDeltaX = dx === 0 ? 1e9 : Math.abs(T / dx), tDeltaY = dy === 0 ? 1e9 : Math.abs(T / dy);
    var nextX = dx === 0 ? 1e9 : (((dx > 0 ? (tx + 1) * T : tx * T) - x0) / dx);
    var nextY = dy === 0 ? 1e9 : (((dy > 0 ? (ty + 1) * T : ty * T) - y0) / dy);
    var dist = 0, guard = 0;
    while (dist < maxDist && guard++ < 900) {
      if (this.solid(tx, ty)) {
        return { hit: true, tx: tx, ty: ty, x: x0 + dx * dist, y: y0 + dy * dist, dist: dist, type: this.at(tx, ty) };
      }
      if (nextX < nextY) { dist = nextX; nextX += tDeltaX; tx += stepX; }
      else { dist = nextY; nextY += tDeltaY; ty += stepY; }
    }
    return { hit: false, x: x0 + dx * maxDist, y: y0 + dy * maxDist, dist: maxDist };
  };

  /** damage a tile; returns 0 none, 1 damaged, 2 destroyed */
  World.prototype.damage = function (tx, ty, amount, fx) {
    if (!this.inside(tx, ty)) return 0;
    var i = ty * this.w + tx, type = this.tiles[i];
    if (type === TT.EMPTY || type === TT.HARD) return 0;
    // NOTE: hp is a Uint16Array — subtracting past zero would wrap around,
    // so compute in float space and only store a positive remainder.
    var left = this.hp[i] - amount;
    if (left <= 0) {
      this.tiles[i] = TT.EMPTY; this.hp[i] = 0;
      this.invalidateAround(tx, ty);
      this.mmDirty(tx, ty);
      if (fx) fx(type, tx, ty, true);
      return 2;
    }
    this.hp[i] = left;
    this.invalidateChunk(tx, ty);
    if (fx) fx(type, tx, ty, false);
    return 1;
  };

  /** spherical dig used by explosives and the drill */
  World.prototype.digCircle = function (px, py, radius, dmg, fx) {
    var tx0 = Math.floor((px - radius) / T), tx1 = Math.floor((px + radius) / T);
    var ty0 = Math.floor((py - radius) / T), ty1 = Math.floor((py + radius) / T);
    var broken = 0;
    for (var ty = ty0; ty <= ty1; ty++) {
      for (var tx = tx0; tx <= tx1; tx++) {
        var cx = tx * T + T / 2, cy = ty * T + T / 2;
        var d = M.dist(px, py, cx, cy);
        if (d > radius) continue;
        var falloff = 1 - d / radius * 0.55;
        if (this.damage(tx, ty, dmg * falloff, fx) === 2) broken++;
      }
    }
    return broken;
  };

  World.prototype.findFloorBelow = function (tx, ty, maxDown) {
    for (var y = ty; y < Math.min(this.h - 4, ty + (maxDown || 60)); y++) {
      if (this.solid(tx, y) && !this.solid(tx, y - 1) && !this.solid(tx, y - 2)) return y - 1;
    }
    return -1;
  };

  /** carve a landing shaft from the ceiling down to a floor tile (drop pod) */
  World.prototype.carveShaft = function (tx, ty, radius, fx) {
    for (var y = 3; y <= ty; y++) {
      for (var x = tx - radius; x <= tx + radius; x++) {
        if (!this.inside(x, y)) continue;
        var i = y * this.w + x;
        if (this.tiles[i] === TT.EMPTY) continue;
        var t = this.tiles[i];
        this.tiles[i] = TT.EMPTY; this.hp[i] = 0;
        this.mmDirty(x, y);
        if (fx && Math.random() < 0.14) fx(t, x, y, true);
      }
    }
    this.chunks.clear(); this.chunkOrder.length = 0;
  };

  World.prototype.markExplored = function (px, py, radiusPx) {
    var r = Math.ceil(radiusPx / T);
    var ctx0 = Math.floor(px / T), cty0 = Math.floor(py / T);
    for (var y = cty0 - r; y <= cty0 + r; y++) {
      for (var x = ctx0 - r; x <= ctx0 + r; x++) {
        if (!this.inside(x, y)) continue;
        if ((x - ctx0) * (x - ctx0) + (y - cty0) * (y - cty0) > r * r) continue;
        var i = y * this.w + x;
        if (!this.explored[i]) { this.explored[i] = 1; this.mmDirty(x, y); }
      }
    }
  };

  /* ---------------- chunk rendering ---------------- */
  World.prototype.invalidateChunk = function (tx, ty) {
    var C = CFG.CHUNK, key = Math.floor(tx / C) + ',' + Math.floor(ty / C);
    if (this.chunks.has(key)) {
      this.chunks.delete(key);
      var k = this.chunkOrder.indexOf(key);
      if (k >= 0) this.chunkOrder.splice(k, 1);
    }
  };
  World.prototype.invalidateAround = function (tx, ty) {
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) this.invalidateChunk(tx + dx, ty + dy);
  };

  function shadeColor(hex, amt) {
    var r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
    r = M.clamp(Math.round(r * amt), 0, 255); g = M.clamp(Math.round(g * amt), 0, 255); b = M.clamp(Math.round(b * amt), 0, 255);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  World.prototype.buildChunk = function (cx, cy) {
    var C = CFG.CHUNK, px = C * T;
    var cv = document.createElement('canvas');
    cv.width = px; cv.height = px;
    var g = cv.getContext('2d');
    var B = this.biome;
    var baseCols = {};
    baseCols[TT.DIRT] = B.dirt; baseCols[TT.ROCK] = B.rock; baseCols[TT.HARD] = B.hard;
    baseCols[TT.MORKITE] = B.rock; baseCols[TT.NITRA] = B.rock;
    baseCols[TT.GOLD] = B.rock; baseCols[TT.CRYSTAL] = B.rock;
    baseCols[TT.PLATFORM] = '#3e6cb0';

    for (var ly = 0; ly < C; ly++) {
      for (var lx = 0; lx < C; lx++) {
        var tx = cx * C + lx, ty = cy * C + ly;
        if (!this.inside(tx, ty)) continue;
        var i = ty * this.w + tx, type = this.tiles[i];
        if (type === TT.EMPTY) continue;
        var x = lx * T, y = ly * T;
        var jitter = 0.82 + (this.shade[i] / 255) * 0.36;
        g.fillStyle = shadeColor(baseCols[type] || B.rock, jitter);
        g.fillRect(x, y, T + 1, T + 1);

        // bevel: lit top edge where the tile is exposed to air
        var openUp = this.at(tx, ty - 1) === TT.EMPTY;
        if (openUp) {
          g.fillStyle = shadeColor(baseCols[type] || B.rock, jitter + 0.5);
          g.fillRect(x, y, T + 1, 3);
          g.fillStyle = 'rgba(255,255,255,0.06)';
          g.fillRect(x, y + 3, T + 1, 2);
        }
        if (this.at(tx - 1, ty) === TT.EMPTY) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x, y, 2, T + 1); }
        if (this.at(tx + 1, ty) === TT.EMPTY) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + T - 2, y, 3, T + 1); }
        if (this.at(tx, ty + 1) === TT.EMPTY) { g.fillStyle = 'rgba(0,0,0,0.26)'; g.fillRect(x, y + T - 2, T + 1, 3); }

        // grain
        var s = this.shade[i];
        g.fillStyle = 'rgba(0,0,0,0.10)';
        g.fillRect(x + (s % 7), y + ((s >> 3) % 9), 3, 2);
        g.fillStyle = 'rgba(255,255,255,0.045)';
        g.fillRect(x + ((s >> 2) % 11), y + ((s >> 5) % 13), 2, 2);

        if (type === TT.HARD) {
          g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 1;
          g.beginPath(); g.moveTo(x + 2, y + T - 3); g.lineTo(x + T / 2, y + 3); g.lineTo(x + T - 2, y + T - 4); g.stroke();
        }

        // mineral crystals inside the tile
        var ore = ORE_OF[type];
        if (ore) {
          var info = DRG.ORE_INFO[ore];
          g.save();
          g.globalAlpha = 0.95;
          for (var b2 = 0; b2 < 3; b2++) {
            var bx = x + 3 + ((s >> (b2 * 2)) % (T - 7));
            var by = y + 3 + ((s >> (b2 * 2 + 1)) % (T - 7));
            var br = 2.2 + ((s >> b2) % 3);
            g.fillStyle = info.color;
            g.beginPath(); g.arc(bx, by, br, 0, 6.283); g.fill();
            g.fillStyle = 'rgba(255,255,255,0.55)';
            g.beginPath(); g.arc(bx - br * 0.3, by - br * 0.3, br * 0.35, 0, 6.283); g.fill();
          }
          g.restore();
        }

        // damage cracks
        var maxHp = HP[type];
        if (maxHp < 1e8 && this.hp[i] < maxHp) {
          var frac = 1 - this.hp[i] / maxHp;
          g.strokeStyle = 'rgba(0,0,0,' + (0.25 + frac * 0.5).toFixed(2) + ')';
          g.lineWidth = 1 + frac * 1.5;
          g.beginPath();
          g.moveTo(x + 3, y + 4 + (s % 5)); g.lineTo(x + T * 0.55, y + T * 0.5);
          g.lineTo(x + T - 3, y + T - 4 - (s % 4));
          if (frac > 0.5) { g.moveTo(x + T - 4, y + 3); g.lineTo(x + T * 0.45, y + T * 0.6); }
          g.stroke();
        }
      }
    }
    return cv;
  };

  World.prototype.getChunk = function (cx, cy) {
    var key = cx + ',' + cy;
    var c = this.chunks.get(key);
    if (c) return c;
    c = this.buildChunk(cx, cy);
    this.chunks.set(key, c);
    this.chunkOrder.push(key);
    while (this.chunkOrder.length > CFG.CHUNK_CACHE) {
      var old = this.chunkOrder.shift();
      if (old !== key) this.chunks.delete(old);
    }
    return c;
  };

  World.prototype.draw = function (g, cam) {
    var C = CFG.CHUNK, px = C * T;
    var cx0 = Math.floor(cam.x / px), cx1 = Math.floor((cam.x + cam.w) / px);
    var cy0 = Math.floor(cam.y / px), cy1 = Math.floor((cam.y + cam.h) / px);
    for (var cy = cy0; cy <= cy1; cy++) {
      for (var cx = cx0; cx <= cx1; cx++) {
        if (cx < 0 || cy < 0 || cx * C >= this.w || cy * C >= this.h) continue;
        g.drawImage(this.getChunk(cx, cy), Math.round(cx * px - cam.x), Math.round(cy * px - cam.y));
      }
    }
  };

  /* ---------------- minimap ---------------- */
  World.prototype.minimap = function (scale) {
    scale = scale || 2;
    if (!this._mm) {
      this._mm = document.createElement('canvas');
      this._mm.width = this.w * scale; this._mm.height = this.h * scale;
      this._mmScale = scale;
    }
    if (!this.dirtyMinimap) return this._mm;
    var g = this._mm.getContext('2d');
    var B = this.biome;
    // only repaint the rectangle that actually changed
    var box = this.mmBox || { x0: 0, y0: 0, x1: this.w - 1, y1: this.h - 1 };
    var bx0 = M.clamp(box.x0, 0, this.w - 1), bx1 = M.clamp(box.x1, 0, this.w - 1);
    var by0 = M.clamp(box.y0, 0, this.h - 1), by1 = M.clamp(box.y1, 0, this.h - 1);
    g.clearRect(bx0 * scale, by0 * scale, (bx1 - bx0 + 1) * scale, (by1 - by0 + 1) * scale);
    for (var y = by0; y <= by1; y++) {
      for (var x = bx0; x <= bx1; x++) {
        var i = y * this.w + x;
        if (!this.explored[i]) continue;
        var t = this.tiles[i];
        var col;
        if (t === TT.EMPTY) col = 'rgba(12,16,20,0.85)';
        else if (t === TT.HARD) col = 'rgba(150,150,160,0.9)';
        else if (ORE_OF[t]) col = DRG.ORE_INFO[ORE_OF[t]].color;
        else col = t === TT.DIRT ? shadeColor(B.dirt, 0.9) : shadeColor(B.rock, 0.9);
        g.fillStyle = col;
        g.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    this.dirtyMinimap = false;
    this.mmBox = null;
    return this._mm;
  };

  DRG.World = World;
})(window);
