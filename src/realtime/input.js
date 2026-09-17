/* ============================================================
   input.js — keyboard, mouse and mobile touch state
   ============================================================ */
(function (root) {
  'use strict';
  var DRG = root.DRG;
  var touch = {
    moveId: null,
    aimId: null,
    jumpArmed: true,
    lastAimX: 1,
    lastAimY: 0,
    heldKeys: {}
  };

  var I = DRG.input = {
    keys: {}, pressed: {}, released: {},
    mx: 0, my: 0,               // canvas-space (css px)
    wx: 0, wy: 0,               // world-space, filled by the camera each frame
    down: [false, false, false],
    clicked: [false, false, false],
    wheel: 0,
    anyKey: false,
    attach: function (canvas) {
      I.mx = canvas.clientWidth * 0.72;
      I.my = canvas.clientHeight * 0.42;
      root.addEventListener('keydown', function (e) {
        var k = norm(e);
        if (!I.keys[k]) I.pressed[k] = true;
        I.keys[k] = true; I.anyKey = true;
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'F1'].indexOf(e.code) >= 0) e.preventDefault();
        if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) e.preventDefault();
      });
      root.addEventListener('keyup', function (e) {
        var k = norm(e);
        I.keys[k] = false; I.released[k] = true;
      });
      root.addEventListener('blur', resetTouch);
      root.addEventListener('pagehide', resetTouch);
      canvas.addEventListener('mousemove', function (e) {
        var r = canvas.getBoundingClientRect();
        I.mx = e.clientX - r.left; I.my = e.clientY - r.top;
      });
      canvas.addEventListener('mousedown', function (e) {
        I.down[e.button] = true; I.clicked[e.button] = true; e.preventDefault();
      });
      root.addEventListener('mouseup', function (e) { I.down[e.button] = false; });
      canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      canvas.addEventListener('wheel', function (e) { I.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
      bindTouch(canvas);
    },
    /** call at the end of every frame */
    endFrame: function () {
      I.pressed = {}; I.released = {}; I.wheel = 0;
      I.clicked = [false, false, false];
      I.anyKey = false;
    },
    key: function () { for (var i = 0; i < arguments.length; i++) if (I.keys[arguments[i]]) return true; return false; },
    hit: function () { for (var i = 0; i < arguments.length; i++) if (I.pressed[arguments[i]]) return true; return false; },
    resetTouch: resetTouch
  };

  function norm(e) { return e.code || e.key; }

  function setVirtualKey(key, active) {
    if (active) {
      touch.heldKeys[key] = true;
      if (!I.keys[key]) I.pressed[key] = true;
      I.keys[key] = true;
      I.anyKey = true;
    } else {
      delete touch.heldKeys[key];
      if (I.keys[key]) I.released[key] = true;
      I.keys[key] = false;
    }
  }

  function unlockAudio() {
    if (DRG.audio && DRG.audio.unlock) DRG.audio.unlock();
    if (root.navigator.vibrate) root.navigator.vibrate(8);
  }

  function capturePointer(el, e) {
    try { el.setPointerCapture(e.pointerId); } catch (error) {}
  }

  function setKnob(el, x, y) {
    var knob = el.querySelector('.touch-stick-knob');
    if (knob) knob.style.transform = 'translate(calc(-50% + '+x+'px), calc(-50% + '+y+'px))';
  }

  function stickVector(el, e) {
    var rect = el.getBoundingClientRect();
    var dx = e.clientX - (rect.left + rect.width / 2);
    var dy = e.clientY - (rect.top + rect.height / 2);
    var max = Math.min(rect.width, rect.height) * 0.32;
    var length = Math.sqrt(dx * dx + dy * dy);
    var scale = length > max ? max / length : 1;
    return { x: dx * scale, y: dy * scale, nx: dx / max, ny: dy / max, length: length, max: max };
  }

  function updateMove(el, e) {
    var v = stickVector(el, e);
    setKnob(el, v.x, v.y);
    setVirtualKey('KeyA', v.nx < -0.18);
    setVirtualKey('KeyD', v.nx > 0.18);
    if (v.ny < -0.42 && touch.jumpArmed) {
      setVirtualKey('Space', true);
      touch.jumpArmed = false;
    } else if (v.ny > -0.2) {
      setVirtualKey('Space', false);
      touch.jumpArmed = true;
    }
    el.dataset.direction = v.nx < -0.18 ? 'left' : (v.nx > 0.18 ? 'right' : 'center');
  }

  function releaseMove(el) {
    touch.moveId = null;
    touch.jumpArmed = true;
    setVirtualKey('KeyA', false);
    setVirtualKey('KeyD', false);
    setVirtualKey('Space', false);
    setKnob(el, 0, 0);
    el.classList.remove('active');
    el.dataset.direction = 'center';
  }

  function updateAim(canvas, el, e) {
    var v = stickVector(el, e);
    setKnob(el, v.x, v.y);
    if (v.length > v.max * 0.08) {
      var length = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
      touch.lastAimX = v.x / length;
      touch.lastAimY = v.y / length;
    }
    var reach = Math.max(90, Math.min(260, Math.min(canvas.clientWidth, canvas.clientHeight) * 0.42));
    I.mx = canvas.clientWidth / 2 + touch.lastAimX * reach;
    I.my = canvas.clientHeight / 2 + touch.lastAimY * reach;
    I.down[0] = true;
    el.dataset.aim = touch.lastAimX.toFixed(2)+','+touch.lastAimY.toFixed(2);
  }

  function releaseAim(el) {
    touch.aimId = null;
    I.down[0] = false;
    setKnob(el, 0, 0);
    el.classList.remove('active');
  }

  function bindActionButton(button) {
    var pointerId = null;
    var keys = button.dataset.touchCombo ? button.dataset.touchCombo.split('+') : [];
    if (button.dataset.touchKey) keys.push(button.dataset.touchKey);
    if (button.dataset.touchHold) keys.push(button.dataset.touchHold);
    function press(e) {
      if (pointerId !== null) return;
      pointerId = e.pointerId;
      capturePointer(button, e);
      unlockAudio();
      button.classList.add('active');
      keys.forEach(function (key) { setVirtualKey(key, true); });
      if (button.hasAttribute('data-touch-switch')) {
        I.wheel = 1;
        I.anyKey = true;
      }
      e.preventDefault();
      e.stopPropagation();
    }
    function release(e) {
      if (pointerId === null || (e && e.pointerId !== pointerId)) return;
      pointerId = null;
      button.classList.remove('active');
      keys.forEach(function (key) { setVirtualKey(key, false); });
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
  }

  function bindTouch(canvas) {
    var controls = document.getElementById('touch-controls');
    if (!controls || controls.dataset.bound) return;
    controls.dataset.bound = '1';
    if (root.navigator.maxTouchPoints > 0 || 'ontouchstart' in root || root.matchMedia('(pointer: coarse)').matches) {
      document.documentElement.classList.add('touch-capable');
    }
    var move = controls.querySelector('[data-touch-stick="move"]');
    var aim = controls.querySelector('[data-touch-stick="aim"]');
    move.addEventListener('pointerdown', function (e) {
      if (touch.moveId !== null) return;
      touch.moveId = e.pointerId;
      capturePointer(move, e);
      unlockAudio();
      move.classList.add('active');
      updateMove(move, e);
      e.preventDefault();
    });
    move.addEventListener('pointermove', function (e) {
      if (e.pointerId !== touch.moveId) return;
      updateMove(move, e);
      e.preventDefault();
    });
    aim.addEventListener('pointerdown', function (e) {
      if (touch.aimId !== null) return;
      touch.aimId = e.pointerId;
      capturePointer(aim, e);
      unlockAudio();
      aim.classList.add('active');
      I.clicked[0] = true;
      updateAim(canvas, aim, e);
      e.preventDefault();
    });
    aim.addEventListener('pointermove', function (e) {
      if (e.pointerId !== touch.aimId) return;
      updateAim(canvas, aim, e);
      e.preventDefault();
    });
    ['pointerup', 'pointercancel'].forEach(function (eventName) {
      move.addEventListener(eventName, function (e) { if (e.pointerId === touch.moveId) releaseMove(move); });
      aim.addEventListener(eventName, function (e) { if (e.pointerId === touch.aimId) releaseAim(aim); });
      root.addEventListener(eventName, function (e) {
        if (e.pointerId === touch.moveId) releaseMove(move);
        if (e.pointerId === touch.aimId) releaseAim(aim);
      });
    });
    controls.querySelectorAll('[data-touch-key],[data-touch-hold],[data-touch-switch],[data-touch-combo]')
      .forEach(bindActionButton);
    var more = document.getElementById('touch-more');
    if (more) more.addEventListener('click', function (e) {
      var open = controls.classList.toggle('utility-open');
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
      e.preventDefault();
    });
  }

  function resetTouch() {
    Object.keys(touch.heldKeys).forEach(function (key) { I.keys[key] = false; });
    touch.heldKeys = {};
    I.down = [false, false, false];
    var controls = document.getElementById('touch-controls');
    if (!controls) return;
    var move = controls.querySelector('[data-touch-stick="move"]');
    var aim = controls.querySelector('[data-touch-stick="aim"]');
    if (move) releaseMove(move);
    if (aim) releaseAim(aim);
    controls.querySelectorAll('.active').forEach(function (el) { el.classList.remove('active'); });
  }
})(window);
