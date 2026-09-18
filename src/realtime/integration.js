/* ============================================================
   integration.js — in-process management ↔ realtime contract
   ============================================================ */
(function (root) {
  'use strict';

  var DRG = root.DRG;
  var request = null;
  var result = null;
  var managerVisible = false;

  function returnToManager() {
    root.DRGUnified.returnToManager();
  }

  function configureUi() {
    if (!request) return;
    var mission = request.mission;
    DRG.ui.sel.biome = mission.realtimeBiome || 'crystalline';
    DRG.ui.sel.haz = mission.hazard || 1;
    DRG.ui.sel.cls = request.miner.cls || 'scout';
    DRG.ui.sel.seed = request.seed || 1;
    var seedInput = document.getElementById('seed-input');
    if (seedInput) seedInput.value = DRG.ui.sel.seed;
    document.body.classList.add('linked-mission');
    var managerButton = document.getElementById('btn-manager-return');
    if (managerButton) managerButton.onclick = returnToManager;
  }

  DRG.integration = {
    get request() { return request; },

    setRequest: function (nextRequest) {
      request = nextRequest;
      result = null;
      configureUi();
    },

    clear: function () {
      request = null;
      result = null;
      document.body.classList.remove('linked-mission');
    },

    isLinked: function () {
      return !!(request && request.id && request.mission && request.miner);
    },

    hasCompletedRequest: function () {
      return !!(result && request && result.requestId === request.id);
    },

    configureUi: configureUi,

    launch: function () {
      if (!DRG.integration.isLinked()) return false;
      if (!DRG.game || !DRG.game.ready) return true;
      configureUi();
      if (DRG.game.mission && DRG.game.mission.opt && DRG.game.mission.opt.requestId === request.id) {
        DRG.game.setPaused(false);
        return true;
      }
      var biome = DRG.biomeById(DRG.ui.sel.biome);
      DRG.ui.hideAll();
      DRG.game.startMission({
        biome: biome,
        haz: DRG.ui.sel.haz,
        cls: DRG.ui.sel.cls,
        seed: DRG.ui.sel.seed,
        requestId: request.id
      });
      if (!managerVisible) DRG.game.setPaused(true);
      return true;
    },

    setVisible: function (visible) {
      managerVisible = !!visible;
      if (DRG.game && DRG.game.mission && DRG.game.setPaused) DRG.game.setPaused(!managerVisible);
      if (DRG.audio && DRG.audio.ctx) {
        if (managerVisible) DRG.audio.unlock();
        else if (DRG.audio.ctx.state === 'running') DRG.audio.ctx.suspend();
      }
    },

    returnToManager: returnToManager,

    complete: function (mission, win, credits, xp) {
      if (!DRG.integration.isLinked()) return;
      var mined = mission.stats.mined || {};
      result = {
        version: 2,
        requestId: request.id,
        missionId: request.mission.id,
        minerId: request.miner.id,
        finishedAt: Date.now(),
        outcome: win ? 'success' : 'failed',
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
      var managerButton = document.getElementById('btn-manager-return');
      if (managerButton) managerButton.hidden = false;
      ['again', 'terminal', 'menu'].forEach(function (action) {
        var button = document.querySelector('#scr-debrief [data-act="' + action + '"]');
        if (button) button.hidden = true;
      });
      root.DRGUnified.completeMission(result);
    },

    takeResult: function () {
      var current = result;
      result = null;
      return current;
    }
  };
})(window);
