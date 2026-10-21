/* The bridge the desktop app's main process is to its pill (preload.js's
 * window.tailzu), played by the page that frames this one: it sends what
 * main.js would (states, captions, the voice's bands, knobs) and hears what
 * the pill answers (hover, ✕, ✓). Messages from its own origin only.
 *
 *   parent → { pill: {state, …} }   onPill, as main.js sends it
 *   parent → { level: {bands} }     onLevel
 *   parent → { knobs: {flags} }     knobs.js (the thread's colour: cream for
 *                                   the page's own voice, amber only while the
 *                                   visitor's microphone is open)
 *   pill   → { pill: "hover", v } / { pill: "action", a }
 */
(function () {
  "use strict";
  var pillCb = null, levelCb = null;
  // The page's Calm switch, as the app's own reduced motion: pill.js asks matchMedia.
  if (/[?&]calm=1(&|$)/.test(location.search) && window.matchMedia) {
    var mm = window.matchMedia.bind(window);
    var still = function (q) { return { matches: true, media: q, onchange: null, addEventListener: function () {}, removeEventListener: function () {}, addListener: function () {}, removeListener: function () {} }; };
    window.matchMedia = function (q) { return /prefers-reduced-motion:\s*reduce/.test(q) ? still(q) : mm(q); };
  }
  function up(m) { try { if (window.parent !== window) window.parent.postMessage(m, location.origin); } catch (e) { /* none */ } }
  var first = { labels: {}, flags: { "desktop.pill.live": "#F3E2C6" } };
  window.tailzu = {
    onPill: function (cb) { pillCb = cb; },
    onLevel: function (cb) { levelCb = cb; },
    pillHover: function (v) { up({ pill: "hover", v: !!v }); },
    pillAction: function (a) { up({ pill: "action", a: String(a) }); },
    knobs: function () { return Promise.resolve(first); },
  };
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || e.source !== window.parent) return;
    var m = e.data || {};
    if (m.knobs && window.TailzuKnobs) window.TailzuKnobs.setKnobs({ labels: m.knobs.labels || {}, flags: m.knobs.flags || {} });
    if (m.pill && pillCb) pillCb(m.pill);
    if (m.level && levelCb) levelCb(m.level);
  });
})();
