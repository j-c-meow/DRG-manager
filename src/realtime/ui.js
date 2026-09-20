/* ============================================================
   ui.js — DOM screens: menu, mission terminal, debrief, modals
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG, M = DRG.M;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  var UI = DRG.ui = {
    sel: { biome: 'crystalline', haz: 3, cls: 'driller', seed: 424242 },
    selectionBuilt: false,

    init: function () {
      UI.buildHelp();
      UI.buildSettings();
      UI.wire();
      UI.refreshMenuStats();
    },

    show: function (name) {
      if (name === 'select' && !UI.selectionBuilt) {
        UI.buildBiomes();
        UI.buildHazards();
        UI.buildClasses();
        UI.refreshSummary();
        UI.selectionBuilt = true;
      }
      UI.screen = name;
      $$('.screen').forEach(function (s) { s.classList.remove('active'); });
      var el = $('#scr-' + name);
      if (el) {
        $$('img[data-src]', el).forEach(function (image) {
          image.src = image.dataset.src;
          delete image.dataset.src;
        });
        el.classList.add('active');
      }
      DRG.log('screen ->', name);
    },
    hideAll: function () { $$('.screen').forEach(function (s) { s.classList.remove('active'); }); UI.screen = 'game'; },

    modal: function (name, on) {
      var el = $('#ov-' + name);
      if (!el) return;
      el.classList.toggle('active', on !== false);
      /* 幻影弹窗防御：关闭态强制内联隐藏，打开态先清内联——即使 manager.css 的
         .modal{display:flex} 与 realtime.css 缺失/错位叠加，.active 开关也始终有效 */
      el.style.display = (on === false) ? 'none' : '';
      if (on !== false) DRG.audio.sfx('ui');
    },
    anyModal: function () { return !!$('.modal.active'); },
    closeModals: function () { $$('.modal').forEach(function (m) { m.classList.remove('active'); m.style.display = 'none'; }); },

    /* ---------------- boot ---------------- */
    bootProgress: function (f, label) {
      var fill = $('#boot-fill');
      if (fill) fill.style.width = Math.round(f * 100) + '%';
      if (label) $('#boot-status').textContent = label;
    },

    /* ---------------- builders ---------------- */
    buildBiomes: function () {
      var host = $('#biome-list');
      host.innerHTML = '';
      DRG.BIOMES.forEach(function (b) {
        var d = document.createElement('div');
        d.className = 'biome-item' + (b.id === UI.sel.biome ? ' on' : '');
        d.dataset.id = b.id;
        d.innerHTML = '<img src="assets/img/' + DRG.IMG_MANIFEST[b.art] + '" alt=""><div><b>' + L(b.name) + '</b><span>' + b.en + '</span></div>';
        d.addEventListener('click', function () {
          UI.sel.biome = b.id;
          $$('.biome-item').forEach(function (n) { n.classList.toggle('on', n.dataset.id === b.id); });
          UI.refreshSummary(); DRG.audio.sfx('ui');
        });
        host.appendChild(d);
      });
    },

    buildHazards: function () {
      var host = $('#haz-row');
      host.innerHTML = '';
      DRG.HAZARDS.forEach(function (h) {
        var d = document.createElement('div');
        d.className = 'haz' + (h.lv === UI.sel.haz ? ' on' : '');
        d.dataset.lv = h.lv;
        d.innerHTML = '<img src="assets/img/haz_' + h.lv + '.png" alt=""><small>HAZ ' + h.lv + '</small>';
        d.addEventListener('click', function () {
          UI.sel.haz = h.lv;
          $$('.haz').forEach(function (n) { n.classList.toggle('on', +n.dataset.lv === h.lv); });
          UI.refreshSummary(); DRG.audio.sfx('ui');
        });
        host.appendChild(d);
      });
    },

    buildClasses: function () {
      var host = $('#class-list');
      host.innerHTML = '';
      DRG.CLASSES.forEach(function (c) {
        var w1 = DRG.WEAPONS[c.primary], w2 = DRG.WEAPONS[c.secondary];
        var d = document.createElement('div');
        d.className = 'class-item' + (c.id === UI.sel.cls ? ' on' : '');
        d.dataset.id = c.id;
        d.innerHTML =
          '<img class="por" src="assets/img/' + DRG.IMG_MANIFEST[c.portrait] + '" alt="">' +
          '<div><b style="color:' + c.color + '">' + L(c.name.toUpperCase() + ' · ' + c.en) + '</b>' +
          '<p>' + L(c.blurb) + '</p>' +
          '<div class="wep"><img src="assets/img/' + DRG.IMG_MANIFEST[w1.hud] + '"><small>' + L(w1) + '</small>' +
          '<img src="assets/img/' + DRG.IMG_MANIFEST[w2.hud] + '"><small>' + L(w2) + '</small></div>' +
          '<div class="wep"><img src="assets/img/' + DRG.IMG_MANIFEST[c.tool.hud] + '"><small>Q · ' + L(c.tool.name) + '</small>' +
          (c.extra ? '<img src="assets/img/' + DRG.IMG_MANIFEST[c.extra.hud] + '"><small>X · ' + L(c.extra.name) + '</small>' : '') +
          '</div></div>';
        d.addEventListener('click', function () {
          UI.sel.cls = c.id;
          $$('.class-item').forEach(function (n) { n.classList.toggle('on', n.dataset.id === c.id); });
          UI.refreshSummary(); DRG.audio.sfx('ui');
        });
        host.appendChild(d);
      });
    },

    buildHelp: function () {
      var rows = [
        ['A / D', L('左右移动')], ['空格 / W', L('跳跃')], ['鼠标', L('瞄准')],
        ['鼠标左键', L('开火（当前武器）')], ['鼠标右键 / C', L('挖掘（镐 / 钻机）')],
        ['1 / 2 / 滚轮', L('切换主副武器')], ['R', L('装填 · 配额完成后呼叫飞船')],
        ['F', L('扔照明弹（照亮洞穴）')], ['G', L('手雷')], ['Q', L('职业装备（抓钩/平台/护盾/C4）')],
        ['X', L('工程师：部署哨戒炮')], ['Shift + Q', L('命令 BOSCO 开采准星处矿石')],
        ['E', L('交互：存矿 / 补给 / 登船')], ['V', L('呼叫补给舱（需 80 硝石）')],
        ['T', L('呼叫 M.U.L.E. 莫莉过来')], ['贴墙 + 空格', L('蹬墙跳（爬出自己挖的竖井）')],
        ['TAB', L('地形扫描仪全图')], ['ESC', L('暂停菜单')]
      ];
      $('#help-grid').innerHTML = rows.map(function (r) {
        return '<div class="help-item"><kbd>' + r[0] + '</kbd><span>' + r[1] + '</span></div>';
      }).join('');
    },

    buildSettings: function () {
      var o = DRG.opts();
      var defs = [
        ['master', L('总音量'), 0, 1, .05],
        ['sfx', L('音效音量'), 0, 1, .05],
        ['voice', L('语音音量'), 0, 1, .05],
        ['music', L('环境音'), 0, 1, .05],
        ['darkness', L('黑暗程度'), 0, 1, .05],
        ['shake', L('镜头抖动'), 0, 1, .1],
        ['particles', L('粒子密度'), .3, 1, .1],
        ['quality', L('渲染精度'), .6, 1.4, .1]
      ];
      var host = $('#set-list');
      host.innerHTML = defs.map(function (d) {
        return '<div class="set-row"><label>' + d[1] + '</label>' +
          '<input type="range" data-k="' + d[0] + '" min="' + d[2] + '" max="' + d[3] + '" step="' + d[4] + '" value="' + o[d[0]] + '">' +
          '<span data-v="' + d[0] + '">' + Math.round(o[d[0]] * 100) + '%</span></div>';
      }).join('') +
        '<div class="set-row"><label>' + L('显示 FPS') + '</label><input type="checkbox" data-k="fps"' + (o.fps ? ' checked' : '') + '><span></span></div>';

      $$('#set-list input').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var k = inp.dataset.k;
          if (inp.type === 'checkbox') DRG.opts()[k] = inp.checked;
          else {
            DRG.opts()[k] = parseFloat(inp.value);
            var lab = $('[data-v="' + k + '"]');
            if (lab) lab.textContent = Math.round(parseFloat(inp.value) * 100) + '%';
          }
          DRG.audio.refreshVolumes();
          DRG.save.flush();
          if (k === 'quality' && DRG.game) DRG.game.resize();
        });
      });
    },

    /* ---------------- dynamic text ---------------- */
    refreshSummary: function () {
      var b = DRG.biomeById(UI.sel.biome), h = DRG.HAZARDS[UI.sel.haz - 1], c = DRG.classById(UI.sel.cls);
      var quota = Math.round(120 * h.quota);
      $('#brief-list').innerHTML =
        '<li><span>' + L('主要目标') + '</span><b>' + quota + L(' 莫尔凯特') + '</b></li>' +
        '<li><span>' + L('虫潮强度') + '</span><b>×' + h.rate.toFixed(2) + '</b></li>' +
        '<li><span>' + L('敌人伤害') + '</span><b>×' + h.dmgMul.toFixed(2) + '</b></li>' +
        '<li><span>' + L('信用点奖励') + '</span><b>×' + h.credit.toFixed(2) + '</b></li>' +
        '<li><span>' + L('撤离时限') + '</span><b>3:00</b></li>';
      var pv = $('#biome-preview');
      pv.style.backgroundImage = 'url(assets/img/' + DRG.IMG_MANIFEST[b.art] + ')';
      pv.dataset.label = L(b.name) + ' · ' + b.en;
      $('#sel-summary').innerHTML =
        '<b>' + L(b.name) + '</b> · ' + L(h.name) + ' · <b style="color:' + c.color + '">' + L(c.name) + '</b><br>' +
        L('主武器 ') + L(DRG.WEAPONS[c.primary]) + L(' / 副武器 ') + L(DRG.WEAPONS[c.secondary]) + L(' · 装备 ') + L(c.tool.name);
    },

    refreshMenuStats: function () {
      var s = DRG.save.data, lv = DRG.levelFromXp(s.xp);
      $('#menu-stats').innerHTML =
        '<div><b>' + M.fmtNum(s.credits) + '</b>' + L('信用点 CREDITS') + '</div>' +
        '<div><b>Lv.' + lv.level + '</b>' + L('矮人等级') + '</div>' +
        '<div><b>' + s.missions + '</b>' + L('完成任务') + '</div>' +
        '<div><b>' + M.fmtNum(s.kills) + '</b>' + L('击杀虫子') + '</div>' +
        '<div><b>' + M.fmtNum(s.morkite) + '</b>' + L('累计莫尔凯特') + '</div>';
    },

    /* ---------------- descent transition ---------------- */
    descend: function (biome, cb) {
      var el = $('#descend');
      var podImage = el.querySelector('img[data-src]');
      if (podImage) {
        podImage.src = podImage.dataset.src;
        delete podImage.dataset.src;
      }
      $('#desc-title').textContent = L('下降舱脱离中…');
      $('#desc-sub').textContent = L(biome.name) + ' · ' + biome.en + L(' — 正在穿过地壳');
      el.classList.add('active');
      DRG.audio.sfx('podland');
      setTimeout(function () {
        $('#desc-title').textContent = L('接近洞穴层');
        $('#desc-sub').textContent = L('准备着陆 · ROCK AND STONE!');
      }, 1100);
      setTimeout(function () {
        el.classList.remove('active');
        cb();
      }, 2100);
    },

    /* ---------------- debrief ---------------- */
    debrief: function (m, win) {
      var s = m.stats;
      var mined = s.mined || {};
      var credits = Math.round(s.credits);
      var xp = Math.round(s.xp);
      if (!win) { credits = Math.round(credits * 0.35); xp = Math.round(xp * 0.4); }

      var sv = DRG.save.data;
      sv.credits += credits; sv.xp += xp;
      sv.kills += s.kills; sv.morkite += Math.floor(m.deposited.morkite);
      if (win) sv.missions++; else sv.deaths++;
      var key = m.biome.id + '-h' + m.hazard.lv;
      if (win && (!sv.best[key] || sv.best[key] < credits)) sv.best[key] = credits;
      DRG.save.flush();
      if (DRG.integration) DRG.integration.complete(m, win, credits, xp);

      $('#deb-title').textContent = win ? L('任务完成 · MISSION COMPLETE') : L('任务失败 · MISSION FAILED');
      $('#deb-title').style.color = win ? '#7fff9a' : '#ff5a4a';
      $('#deb-sub').textContent = (win ? L('干得漂亮，矮人！') : (m.failReason ? L(m.failReason) : L('再来一次。'))) +
        '　' + L(m.biome.name) + ' · ' + L(m.hazard.name) + ' · ' + L(DRG.classById(m.opt.cls).name) + L(' · 用时 ') + M.fmtTime(m.time);
      $('#deb-art').src = win ? 'assets/img/salute.png' : 'assets/img/bug_grunt.png';

      var rows = [
        [m.isEscort ? L('朵蕾妲推进进度')
          : m.isPoint ? L('入库矿块 AQUARQ')
          : m.isSalv ? L('矿骡修复 SALVAGE')
          : L('存入莫尔凯特 MORKITE'),
          m.isEscort ? Math.round((m.doretta ? m.doretta.progress : 0) * 100) + '%'
          : m.isPoint ? m.chunksDeposited + ' / ' + m.pointQuota
          : m.isSalv ? ((m.wreck ? m.wreck.installed : 0) + ' / 4') + (m.wreck && m.wreck.state === 'repaired' ? L(' · 已修复') : '')
          : Math.floor(m.deposited.morkite) + ' / ' + m.quota, win],
        [L('存入硝石 NITRA'), Math.floor(m.deposited.nitra)],
        [L('存入黄金 GOLD'), Math.floor(m.deposited.gold)],
        [L('存入晶石 GEMS'), Math.floor(m.deposited.crystal)],
        [L('开采矿石总量'), Object.keys(mined).reduce(function (a, k) { return a + mined[k]; }, 0)],
        [L('击杀虫子 KILLS'), s.kills],
        [L('挖穿方块 TILES DUG'), s.dug],
        [L('遭遇虫潮 SWARMS'), s.waves],
        [L('被击倒次数'), s.downs],
        [L('获得信用点 CREDITS'), '+' + M.fmtNum(credits), true],
        [L('获得经验 XP'), '+' + M.fmtNum(xp), true]
      ];
      $('#deb-stats').innerHTML = rows.map(function (r) {
        return '<div class="deb-row' + (r[2] ? ' good' : '') + '"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>';
      }).join('');

      var lv = DRG.levelFromXp(sv.xp);
      $('#deb-level').textContent = L('矮人等级 Lv.') + lv.level;
      $('#deb-xpnum').textContent = M.fmtNum(lv.xp) + ' / ' + M.fmtNum(lv.need) + ' XP';
      $('#deb-xpfill').style.width = '0%';
      setTimeout(function () { $('#deb-xpfill').style.width = Math.round(lv.xp / lv.need * 100) + '%'; }, 120);

      UI.show('debrief');
      UI.refreshMenuStats();
      if (win) DRG.audio.clipOf(['salute_1', 'salute_2', 'salute_3'], 1, true);
    },

    /* ---------------- events ---------------- */
    wire: function () {
      // main menu buttons
      $$('#scr-menu .btn').forEach(function (b) {
        b.addEventListener('click', function () {
          var act = b.dataset.act;
          DRG.audio.unlock(); DRG.audio.sfx('uibig');
          if (act === 'play') UI.show('select');
          else if (act === 'help') UI.modal('help');
          else if (act === 'settings') UI.modal('settings');
          else if (act === 'credits') UI.modal('credits');
        });
      });
      $('[data-act="back"]').addEventListener('click', function () { UI.show('menu'); DRG.audio.sfx('ui'); });
      $('#seed-rand').addEventListener('click', function () {
        UI.sel.seed = Math.floor(Math.random() * 999999);
        $('#seed-input').value = UI.sel.seed;
        DRG.audio.sfx('ui');
      });
      $('#seed-input').addEventListener('change', function () {
        var v = parseInt($('#seed-input').value.replace(/\D/g, ''), 10);
        UI.sel.seed = isNaN(v) ? 1 : v;
        $('#seed-input').value = UI.sel.seed;
      });
      $('#btn-launch').addEventListener('click', function () {
        DRG.audio.unlock();
        DRG.audio.clipOf(['rns_1', 'rns_2', 'rns_3', 'rns_4', 'rns_5'], 1, true);
        var biome = DRG.biomeById(UI.sel.biome);
        UI.hideAll();
        UI.descend(biome, function () {
          DRG.game.startMission({ biome: biome, haz: UI.sel.haz, cls: UI.sel.cls, seed: UI.sel.seed });
        });
      });

      // debrief
      $$('#scr-debrief .btn').forEach(function (b) {
        b.addEventListener('click', function () {
          var act = b.dataset.act;
          DRG.audio.sfx('ui');
          if (act === 'again') {
            var biome = DRG.biomeById(UI.sel.biome);
            UI.hideAll();
            UI.descend(biome, function () {
              DRG.game.startMission({ biome: biome, haz: UI.sel.haz, cls: UI.sel.cls, seed: (UI.sel.seed + 7) | 0 });
            });
          } else if (act === 'terminal') UI.show('select');
          else { UI.show('menu'); UI.refreshMenuStats(); }
        });
      });

      // modals
      $$('.modal .btn').forEach(function (b) {
        b.addEventListener('click', function () {
          var act = b.dataset.act;
          if (act === 'close') UI.closeModals();
          else if (act === 'autopilot') { UI.closeModals(); DRG.game.setPaused(false); DRG.autopilot.start(); }
          else if (act === 'resume') { UI.closeModals(); DRG.game.setPaused(false); }
          else if (act === 'help') { UI.closeModals(); UI.modal('help'); }
          else if (act === 'settings') { UI.closeModals(); UI.modal('settings'); }
          else if (act === 'abandon') { UI.closeModals(); DRG.game.abandon(); }
          else if (act === 'reset') {
            if (confirm(L('确定要清空本地存档（信用点 / 等级 / 统计）吗？'))) {
              DRG.save.reset(); UI.refreshMenuStats(); UI.buildSettings();
            }
          }
        });
      });
      $$('.modal').forEach(function (mo) {
        mo.addEventListener('click', function (e) { if (e.target === mo) UI.closeModals(); });
      });
    }
  };
})(window);
