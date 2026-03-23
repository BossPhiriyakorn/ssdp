/**
 * Hero stats: kinetic count-up (requestAnimationFrame, ease-out, 1.5s).
 * Targets read from data-stat-target + text content fallback for no-JS.
 */
(function () {
  'use strict';

  var DURATION_MS = 1500;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  var reducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var rafByEl = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var fallbackRaf = {};

  function cancelForEl(el) {
    var id = rafByEl ? rafByEl.get(el) : fallbackRaf[el.id || ''];
    if (id != null) {
      cancelAnimationFrame(id);
      if (rafByEl) rafByEl.delete(el);
      else delete fallbackRaf[el.id || ''];
    }
  }

  function rememberRaf(el, id) {
    if (rafByEl) rafByEl.set(el, id);
    else if (el.id) fallbackRaf[el.id] = id;
  }

  function readTarget(el) {
    var raw = el.getAttribute('data-stat-target');
    if (raw != null && String(raw).trim() !== '') {
      var n = parseInt(raw, 10);
      if (!isNaN(n) && n >= 0) return n;
    }
    var t = (el.textContent || '').replace(/\D/g, '');
    var m = parseInt(t, 10);
    return !isNaN(m) && m >= 0 ? m : 0;
  }

  function setFinal(el, value) {
    el.textContent = String(value);
  }

  /**
   * Animate el from `from` to `target` over durationMs (ease-out).
   */
  function countUpFromTo(el, from, target, durationMs, onDone) {
    cancelForEl(el);
    from = Math.max(0, Math.floor(from));
    target = Math.max(0, Math.floor(target));
    if (reducedMotion || from === target) {
      setFinal(el, target);
      if (onDone) onDone();
      return;
    }

    var start = null;
    var delta = target - from;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / durationMs);
      var eased = easeOutCubic(t);
      var value = Math.round(from + delta * eased);
      setFinal(el, value);
      if (t < 1) {
        rememberRaf(el, requestAnimationFrame(frame));
      } else {
        setFinal(el, target);
        if (rafByEl) rafByEl.delete(el);
        else if (el.id) delete fallbackRaf[el.id];
        if (onDone) onDone();
      }
    }

    setFinal(el, from);
    rememberRaf(el, requestAnimationFrame(frame));
  }

  /**
   * Animate el from 0 to target over DURATION_MS (or set instantly if reduced motion).
   */
  function countUp(el, target, onDone) {
    countUpFromTo(el, 0, target, DURATION_MS, onDone);
  }

  function initLucideIcons() {
    if (!window.lucide || typeof lucide.createIcons !== 'function') return;
    try {
      var root = document.querySelector('.hero-cover__stats');
      if (root) {
        lucide.createIcons({ attrs: { 'stroke-width': 1.75 }, root: root });
      } else {
        lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
      }
    } catch (e) {
      try {
        lucide.createIcons();
      } catch (e2) { /* ignore */ }
    }
  }

  function boot() {
    initLucideIcons();

    var membersEl = document.getElementById('totalCount');
    var groupsEl = document.getElementById('groupsCount');

    if (membersEl) {
      var mt = readTarget(membersEl);
      countUp(membersEl, mt);
    }
    if (groupsEl) {
      var gt = readTarget(groupsEl);
      countUp(groupsEl, gt);
    }
  }

  function setMemberCount(n) {
    var el = document.getElementById('totalCount');
    if (!el || typeof n !== 'number' || isNaN(n) || n < 0) return;
    var target = Math.floor(n);
    el.setAttribute('data-stat-target', String(target));
    var current = parseInt(el.textContent, 10);
    if (isNaN(current)) current = 0;
    countUpFromTo(el, current, target, DURATION_MS);
  }

  window.HeroStats = {
    setMemberCount: setMemberCount,
    /** Expose for tests / manual re-run */
    countUp: countUp,
    readTarget: readTarget
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
