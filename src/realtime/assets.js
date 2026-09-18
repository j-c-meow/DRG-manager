/* ============================================================
   assets.js — image + audio manifest and loader
   Every asset is a local file under assets/ (fetched from the
   official Deep Rock Galactic wiki, see CREDITS.md).
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG;

  var IMG = {
    // classes
    class_driller: 'class_driller.png', class_engineer: 'class_engineer.png',
    class_gunner: 'class_gunner.png', class_scout: 'class_scout.png',
    portrait_driller: 'portrait_driller.png', portrait_engineer: 'portrait_engineer.png',
    portrait_gunner: 'portrait_gunner.png', portrait_scout: 'portrait_scout.png',
    icon_driller: 'icon_driller.png', icon_engineer: 'icon_engineer.png',
    icon_gunner: 'icon_gunner.png', icon_scout: 'icon_scout.png',
    // minerals
    ore_morkite: 'ore_morkite.png', ore_nitra: 'ore_nitra.png', ore_gold: 'ore_gold.png',
    ore_bismor: 'ore_bismor.png', ore_croppa: 'ore_croppa.png', ore_jadiz: 'ore_jadiz.png',
    ore_enor: 'ore_enor.png', ore_magnite: 'ore_magnite.png', ore_umanite: 'ore_umanite.png',
    // bugs
    bug_grunt: 'bug_grunt.png', bug_guard: 'bug_guard.png', bug_praetorian: 'bug_praetorian.png',
    bug_exploder: 'bug_exploder.png', bug_swarmer: 'bug_swarmer.png', bug_mactera: 'bug_mactera.png',
    bug_lootbug: 'bug_lootbug.png', bug_lootbug_gold: 'bug_lootbug_gold.png',
    bug_leech: 'bug_leech.png', bug_breeder: 'bug_breeder.png',
    // objects
    obj_droppod: 'obj_droppod.png', obj_resupply: 'obj_resupply.png', obj_beacon: 'obj_beacon.png',
    obj_molly: 'obj_molly.png', obj_bosco: 'obj_bosco.png', obj_flare: 'obj_flare.png',
    obj_scanner: 'obj_scanner.png',
    // weapons
    w_pickaxe: 'w_pickaxe.png', w_drill: 'w_drill.png', w_shotgun: 'w_shotgun.png',
    w_flaregun: 'w_flaregun.png', w_platgun: 'w_platgun.png', w_foamgun: 'w_foamgun.png',
    w_flamer: 'w_flamer.png', w_subata: 'w_subata.png', w_minigun: 'w_minigun.png',
    w_revolver: 'w_revolver.png', w_smg: 'w_smg.png', w_autocannon: 'w_autocannon.png',
    // hud icons
    hud_pickaxe: 'hud_pickaxe.png', hud_rifle: 'hud_rifle.png', hud_shotgun: 'hud_shotgun.png',
    hud_flamer: 'hud_flamer.png', hud_minigun: 'hud_minigun.png', hud_grapple: 'hud_grapple.png',
    hud_grenade: 'hud_grenade.png', hud_drill: 'hud_drill.png', hud_flaregun: 'hud_flaregun.png',
    hud_pistol: 'hud_pistol.png', hud_platgun: 'hud_platgun.png', hud_revolver: 'hud_revolver.png',
    hud_sentry: 'hud_sentry.png', hud_supply: 'hud_supply.png', hud_zipline: 'hud_zipline.png',
    hud_detpack: 'hud_detpack.png',
    // ui / branding
    logo_gsg: 'logo_gsg.png', rocknstone: 'rocknstone.png', hoxxes: 'hoxxes.png',
    mc_portrait: 'mc_portrait.png', salute: 'salute.png',
    mission_mining: 'mission_mining.png', mission_egg: 'mission_egg.png',
    mission_point: 'mission_point.png', mission_elim: 'mission_elim.png',
    mission_escort: 'mission_escort.png',
    haz_1: 'haz_1.png', haz_2: 'haz_2.png', haz_3: 'haz_3.png', haz_4: 'haz_4.png', haz_5: 'haz_5.png',
    // biome art
    biome_crystalline: 'biome_crystalline.webp', biome_magma: 'biome_magma.webp',
    biome_azure: 'biome_azure.webp', biome_salt: 'biome_salt.webp',
    biome_fungus: 'biome_fungus.webp', biome_glacial: 'biome_glacial.webp',
    biome_radioactive: 'biome_radioactive.webp', biome_biozone: 'biome_biozone.webp',
    biome_bough: 'biome_bough.webp', biome_sandblasted: 'biome_sandblasted.webp',
    spacerig: 'spacerig.webp'
  };

  var SND = {
    // dwarf
    rns_1: 'voice/rns_1.ogg', rns_2: 'voice/rns_2.ogg', rns_3: 'voice/rns_3.ogg',
    rns_4: 'voice/rns_4.ogg', rns_5: 'voice/rns_5.ogg', rns_6: 'voice/rns_6.ogg',
    salute_1: 'voice/salute_1.ogg', salute_2: 'voice/salute_2.ogg', salute_3: 'voice/salute_3.ogg',
    dwarf_resupply_1: 'voice/dwarf_resupply_1.ogg', dwarf_resupply_2: 'voice/dwarf_resupply_2.ogg',
    // mission control
    mc_begin_1: 'voice/mc_begin_1.ogg', mc_begin_2: 'voice/mc_begin_2.ogg',
    mc_objective_1: 'voice/mc_objective_1.ogg', mc_objective_2: 'voice/mc_objective_2.ogg',
    mc_countdown: 'voice/mc_countdown.ogg', mc_pod_arrived: 'voice/mc_pod_arrived.ogg',
    mc_complete_1: 'voice/mc_complete_1.ogg', mc_complete_2: 'voice/mc_complete_2.ogg',
    mc_mule: 'voice/mc_mule.ogg', mc_resupply: 'voice/mc_resupply.ogg',
    // creatures / gear
    grunt_attack_1: 'sfx/grunt_attack_1.ogg', grunt_attack_2: 'sfx/grunt_attack_2.ogg',
    grunt_detect_1: 'sfx/grunt_detect_1.ogg', grunt_detect_2: 'sfx/grunt_detect_2.ogg',
    swarm_detect_1: 'sfx/swarm_detect_1.ogg', swarm_detect_2: 'sfx/swarm_detect_2.ogg',
    swarm_attack: 'sfx/swarm_attack.ogg', prae_scream: 'sfx/prae_scream.ogg',
    exploder_scream: 'sfx/exploder_scream.ogg', exploder_expand: 'sfx/exploder_expand.ogg',
    mactera_detect: 'sfx/mactera_detect.ogg', mactera_attack: 'sfx/mactera_attack.ogg',
    lootbug: 'sfx/lootbug.ogg', lootbug_hurt: 'sfx/lootbug_hurt.ogg',
    flaregun_1: 'sfx/flaregun_1.ogg', flaregun_2: 'sfx/flaregun_2.ogg'
  };

  var A = DRG.assets = {
    img: {},
    snd: {},
    ready: false,
    total: 0,
    loaded: 0,
    failed: [],
    /** returns an <img> or a 1x1 transparent stand-in so draw calls never throw */
    get: function (k) { return A.img[k] || A._blank; },
    has: function (k) { return !!A.img[k]; }
  };

  A._blank = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 1; return c;
  })();

  A.load = function (onProgress, onDone) {
    var keys = Object.keys(IMG), sndKeys = Object.keys(SND);
    var assetBase = new URL('assets/', document.baseURI);
    A.total = keys.length;
    A.loaded = 0;
    A.failed.length = 0;
    var done = false;

    function assetUrl(path, retry) {
      var url = new URL(path, assetBase);
      if (retry) url.searchParams.set('retry', Date.now().toString(36));
      return url.href;
    }

    function tick() {
      A.loaded++;
      if (onProgress) onProgress(A.loaded / A.total);
      if (A.loaded >= A.total && !done) { done = true; A.ready = true; onDone && onDone(); }
    }

    function runQueue(items, concurrency, worker) {
      var nextIndex = 0, active = 0;
      function pump() {
        while (active < concurrency && nextIndex < items.length) {
          active++;
          worker(items[nextIndex++], function () {
            active--;
            pump();
          });
        }
      }
      pump();
    }

    function loadImage(k, next, attempt) {
      var im = new Image();
      var settled = false;
      im.decoding = 'async';
      im.onload = function () {
        if (settled) return;
        settled = true;
        A.img[k] = im;
        tick();
        next();
      };
      im.onerror = function () {
        if (settled) return;
        settled = true;
        if (attempt < 1) {
          setTimeout(function () { loadImage(k, next, attempt + 1); }, 250);
          return;
        }
        A.failed.push('img/' + IMG[k]);
        tick();
        next();
      };
      im.src = assetUrl('img/' + IMG[k], attempt);
    }

    function cropWithCanvas(image, frame) {
      var canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      canvas.getContext('2d').drawImage(
        image,
        frame.x, frame.y, frame.width, frame.height,
        0, 0, frame.width, frame.height
      );
      return canvas;
    }

    function cropFrame(image, frame) {
      if (!root.createImageBitmap) return Promise.resolve(cropWithCanvas(image, frame));
      return root.createImageBitmap(
        image,
        frame.x, frame.y, frame.width, frame.height
      ).catch(function () {
        return cropWithCanvas(image, frame);
      });
    }

    function loadAtlasPage(page, attempt) {
      return new Promise(function (resolve, reject) {
        var image = new Image();
        image.decoding = 'async';
        image.onload = function () { resolve(image); };
        image.onerror = reject;
        image.src = assetUrl('generated/' + page.file, attempt);
      });
    }

    function loadAtlas(attempt) {
      fetch(assetUrl('generated/realtime-atlas.json', attempt))
        .then(function (response) {
          if (!response.ok) throw new Error('atlas manifest ' + response.status);
          return response.json();
        })
        .then(function (manifest) {
          return Promise.all(manifest.pages.map(function (page) {
            return loadAtlasPage(page, attempt);
          })).then(function (pages) {
            return Promise.all(keys.map(function (key) {
              var frame = manifest.frames[IMG[key]];
              if (!frame || !pages[frame.page]) throw new Error('atlas frame missing: ' + IMG[key]);
              return cropFrame(pages[frame.page], frame);
            }));
          });
        })
        .then(function (images) {
          images.forEach(function (image, index) {
            A.img[keys[index]] = image;
            tick();
          });
        })
        .catch(function () {
          if (attempt < 1) {
            setTimeout(function () { loadAtlas(attempt + 1); }, 250);
            return;
          }
          runQueue(keys, 4, function (key, next) { loadImage(key, next, 0); });
        });
    }

    // Shipped clips are prepared without preloading. The browser fetches only a clip that is played.
    sndKeys.forEach(function (key) {
      var audio = new Audio();
      audio.dataset.src = assetUrl(SND[key], 0);
      A.snd[key] = audio;
    });
    loadAtlas(0);

    // hard safety valve: never hang the boot screen
    setTimeout(function () {
      if (!done) { done = true; A.ready = true; onDone && onDone(); }
    }, 12000);
  };

  DRG.IMG_MANIFEST = IMG;
  DRG.SND_MANIFEST = SND;
})(window);
