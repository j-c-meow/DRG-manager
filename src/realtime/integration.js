/* ============================================================
   integration.js — management terminal ↔ realtime mission bridge
   ============================================================ */
(function (root) {
  'use strict';

  var DRG = root.DRG;
  var REQUEST_KEY = 'drg_realtime_request_v1';
  var RESULT_KEY = 'drg_realtime_result_v1';

  function readJson(key) {
    try {
      var value = root.localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('[DRG] bridge read failed', key, error);
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      root.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[DRG] bridge write failed', key, error);
      return false;
    }
  }

  var request = readJson(REQUEST_KEY);
  var existingResult = readJson(RESULT_KEY);
  var managerVisible = true;

  function isEmbedded() {
    return root.parent && root.parent !== root;
  }

  function postToManager(type) {
    if (!isEmbedded() || !request) return false;
    var targetOrigin = root.location.origin === 'null' ? '*' : root.location.origin;
    root.parent.postMessage({ type: type, requestId: request.id }, targetOrigin);
    return true;
  }

  function returnToManager() {
    if (postToManager('drg:realtime-return')) return;
    root.location.replace(new URL('../', root.location.href).href);
  }

  DRG.integration = {
    request: request,

    isLinked: function () {
      return !!(request && request.id && request.mission && request.miner);
    },

    hasCompletedRequest: function () {
      return !!(DRG.integration.isLinked() && existingResult && existingResult.requestId === request.id);
    },

    configureUi: function () {
      if (!DRG.integration.isLinked()) return;
      var mission = request.mission;
      DRG.ui.sel.biome = mission.realtimeBiome || 'crystalline';
      DRG.ui.sel.haz = mission.hazard || 1;
      DRG.ui.sel.cls = request.miner.cls || 'scout';
      DRG.ui.sel.seed = request.seed || 1;
      DRG.ui.buildBiomes();
      DRG.ui.buildHazards();
      DRG.ui.buildClasses();
      DRG.ui.refreshSummary();
      var seedInput = document.getElementById('seed-input');
      if (seedInput) seedInput.value = DRG.ui.sel.seed;
      document.body.classList.add('linked-mission');
      var managerButton = document.getElementById('btn-manager-return');
      if (managerButton) {
        managerButton.addEventListener('click', function (event) {
          event.preventDefault();
          returnToManager();
        });
      }
    },

    launch: function () {
      if (!DRG.integration.isLinked()) return false;
      var biome = DRG.biomeById(DRG.ui.sel.biome);
      DRG.ui.hideAll();
      DRG.ui.descend(biome, function () {
        DRG.game.startMission({
          biome: biome,
          haz: DRG.ui.sel.haz,
          cls: DRG.ui.sel.cls,
          seed: DRG.ui.sel.seed,
          requestId: request.id
        });
        if (!managerVisible) DRG.game.setPaused(true);
      });
      return true;
    },

    returnToManager: returnToManager,

    complete: function (mission, win, credits, xp) {
      if (!DRG.integration.isLinked()) return;
      var mined = mission.stats.mined || {};
      var result = {
        version: 1,
        requestId: request.id,
        missionId: request.mission.id,
        minerId: request.miner.id,
        finishedAt: Date.now(),
        win: !!win,
        failReason: mission.failReason || '',
        time: mission.time,
        credits: credits,
        xp: xp,
        deposited: {
          morkite: Math.floor(mission.deposited.morkite || 0),
          nitra: Math.floor(mission.deposited.nitra || 0),
          gold: Math.floor(mission.deposited.gold || 0),
          crystal: Math.floor(mission.deposited.crystal || 0)
        },
        stats: {
          kills: mission.stats.kills || 0,
          waves: mission.stats.waves || 0,
          downs: mission.stats.downs || 0,
          dug: mission.stats.dug || 0,
          mined: mined
        }
      };
      if (writeJson(RESULT_KEY, result)) existingResult = result;

      var managerButton = document.getElementById('btn-manager-return');
      if (managerButton) managerButton.hidden = false;
      ['again', 'terminal', 'menu'].forEach(function (action) {
        var button = document.querySelector('#scr-debrief [data-act="' + action + '"]');
        if (button) button.hidden = true;
      });
      postToManager('drg:realtime-complete');
    }
  };

  root.addEventListener('message', function (event) {
    if (!isEmbedded() || event.source !== root.parent) return;
    if (root.location.origin !== 'null' && event.origin !== root.location.origin) return;
    var data = event.data;
    if (!data || data.type !== 'drg:realtime-visibility') return;
    if (request && data.requestId && data.requestId !== request.id) return;
    managerVisible = !!data.visible;
    if (DRG.game && DRG.game.setPaused) DRG.game.setPaused(!data.visible);
    if (DRG.audio && DRG.audio.ctx) {
      if (data.visible) DRG.audio.unlock();
      else if (DRG.audio.ctx.state === 'running') DRG.audio.ctx.suspend();
    }
  });

  postToManager('drg:realtime-ready');
})(window);
