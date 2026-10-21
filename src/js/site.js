/* tailzu.space, the page's own script (eager, deferred). The page is complete
 * without it. Here: the words (C + /v1/site, applyShape v2), the button that
 * knows the visitor, the motion (one rAF, TZ.motion, Calm), the hero's pour,
 * the threads, Blip's perches, the trail. Lazy: js/play.js (films below the
 * hero, the toys), js/sections.js, js/mic.js; all use only window.TZ.
 * CSP: no inline handlers or style attributes; styles go through CSSOM. */
(function () {
  "use strict";
  const W = window, doc = document, root = doc.documentElement;
  const C = W.C || (W.C = {});
  const Q = new URLSearchParams(location.search);
  const $ = (id) => doc.getElementById(id);
  const $$ = (sel, r) => Array.prototype.slice.call((r || doc).querySelectorAll(sel));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (a, b, x) => { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const PS = W.TailzuPillSplit, TB = W.TailzuBlip;
  const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
  const CREAM = "243,226,198", INK = "15,13,11", AMBER = "#E8A23C";

  /* -- where, what, who */
  // the API: same origin on tailzu.space (Vercel proxies /v1/*), else data-api or api.tailzu.space
  let API = root.getAttribute("data-api") || "";
  if (!API && !/(^|\.)tailzu\.space$/.test(location.hostname)) API = "https://api.tailzu.space";
  const forceDemo = Q.get("demo") === "1";
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  const mqFine = matchMedia("(hover: hover) and (pointer: fine)");
  const mqPhone = matchMedia("(max-width: 760px)");
  const mqPortrait = matchMedia("(orientation: portrait) and (max-width: 900px)");
  const conn = navigator.connection || {};
  const saveData = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
  const fastNet = !conn.effectiveType || conn.effectiveType === "4g";
  const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  const dprCap = () => Math.min(lowEnd ? 1.5 : 2, W.devicePixelRatio || 1);
  const fine = () => mqFine.matches;
  const site = { downloads: {}, demo: forceDemo, maxSeconds: 15, perMinute: 6, freeWords: 800, ask: "off", mic: null };
  const lazy = ((doc.querySelector('meta[name="tz:lazy"]') || {}).content || "").split(/\s+/).filter(Boolean);
  const lazyUrl = (name) => lazy.find((u) => u.indexOf(name) >= 0) || name;

  /* -- a small bus */
  const bus = {};
  const on = (ev, f) => { (bus[ev] = bus[ev] || []).push(f); };
  const emit = (ev, a) => { (bus[ev] || []).slice().forEach((f) => { try { f(a); } catch (e) { console.error(e); } }); };

  /* -- TZ.motion: the names of index.html's CSS and the spec; the app's own springs */
  const MOTION = {
    springs: {
      "pull-out": { stiff: 120, damp: 24 },   // coming apart: the pill's halves, the finale
      "pull-in": { stiff: 240, damp: 16 },    // going home: the snap, the click-shut, detents
      seek: { stiff: 22, damp: 5.2 },         // dust flying to a thread, on curves
      settle: { stiff: 60, damp: 15.5 },      // dots forming a shape, no overshoot
      magnet: { rate: 14, max: [7, 5], reach: 70 },
      peek: { base: .0009 },                  // blip.js: 1 - 0.0009^dt
      thread: { amp: 16, hz: 5.5, sag: 3, attack: 18, release: 5 },
      string: { K: .42, damp: .016, substeps: 6, spacing: 6 },
    },
    curves: { settle: [.16, 1, .3, 1], glide: [.65, 0, .35, 1], bloom: [.34, 1.64, .64, 1], fold: [.55, 0, 1, .45] },
    t: { tap: 90, hover: 160, quick: 220, rise: 330, move: 420, bloom: 520, scene: 900, sweep: 1300 },
  };
  /** One step of a named spring: s = {x, v}, toward `to`. */
  function springStep(s, to, name, dt) {
    const k = MOTION.springs[name];
    let n = Math.max(1, Math.ceil(dt / .008)); const h = dt / n;
    while (n--) { const a = k.stiff * (to - s.x) - k.damp * s.v; s.v += a * h; s.x += s.v * h; }
    return s;
  }
  const glide = PS ? PS.easeInOut : (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const settleEase = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 4);

  /* -- calm */
  let userCalm = null;
  try { const v = localStorage.getItem("tz.calm"); if (v === "1" || v === "0") userCalm = v === "1"; } catch (e) { /* private mode */ }
  const calmNow = () => (userCalm === null ? mqReduce.matches : userCalm);
  const TZ = W.TZ = W.TZ || {};
  TZ.calm = calmNow();
  function applyCalm() {
    const c = calmNow(), was = root.classList.contains("calm");
    TZ.calm = c;
    root.classList.toggle("calm", c); root.classList.toggle("motion", !c);
    const sw = $("calm"); if (sw) sw.setAttribute("aria-checked", c ? "true" : "false");
    if (was !== c) emit("calm", c);
  }
  mqReduce.addEventListener("change", applyCalm);

  /* -- consent, track. consent() is the Meta pixel's gate (api/_meta.js, tulmi src/ads/meta.ts):
     CHANGE ONE, CHANGE ALL. Plain dataLayer events; nothing waits on them. */
  function consent() {
    const nav = navigator;
    if (nav.globalPrivacyControl === true || nav.doNotTrack === "1" || W.doNotTrack === "1") return false;
    let tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* none */ }
    if (/^(Europe\/|Atlantic\/(Azores|Canary|Faroe|Madeira|Reykjavik)$)/.test(tz)) return false;
    return true;
  }
  const tracked = new Set();
  function track(event, params, onceKey) {
    if (onceKey !== undefined) { const k = event + ":" + onceKey; if (tracked.has(k)) return; tracked.add(k); }
    if (!consent()) return;
    try { (W.dataLayer = W.dataLayer || []).push(Object.assign({ event }, params || {})); } catch (e) { /* none */ }
  }
  const egg = (name) => track("tz_egg", { name }, name);

  /* -- the scheduler: one rAF; a job returns true while it moves; idle or hidden, no rAF.
     raf is -1 while a tick runs, so a job that adds a job (the mic's read wakes Blip every
     frame) never asks for a second frame: one chain, one frame each, ever. */
  const sched = (function () {
    let jobs = [], raf = 0, last = 0;
    function tick(now) {
      raf = -1;
      const t = now / 1000, dt = last ? Math.min(.05, Math.max(0, t - last)) : 1 / 60; last = t;
      const run = jobs; jobs = [];
      for (let i = 0; i < run.length; i++) {
        const f = run[i]; let more = false;
        try { more = f(t, dt); } catch (e) { console.error(e); }
        if (more && jobs.indexOf(f) < 0) jobs.push(f);
      }
      raf = 0;
      if (jobs.length && !doc.hidden) raf = requestAnimationFrame(tick); else last = 0;
    }
    function add(f) { if (jobs.indexOf(f) < 0) jobs.push(f); if (raf === 0 && !doc.hidden) raf = requestAnimationFrame(tick); }
    doc.addEventListener("visibilitychange", () => { if (!doc.hidden && jobs.length && raf === 0) { last = 0; raf = requestAnimationFrame(tick); } });
    return { add, busy: () => jobs.length > 0, count: () => jobs.length, names: () => jobs.map((f) => f.name || "?"), now: () => performance.now() / 1000 };
  })();

  /* -- #fx: the one overlay */
  const fx = $("fx"), fctx = fx.getContext("2d");
  let VW = innerWidth, VH = innerHeight, fxDpr = 1;
  function sizeFx() {
    fxDpr = dprCap(); VW = innerWidth; VH = innerHeight;
    fx.width = Math.round(VW * fxDpr); fx.height = Math.round(VH * fxDpr);
  }
  const layers = [];
  let fxTail = 0;
  function fxJob(t, dt) {
    fctx.setTransform(fxDpr, 0, 0, fxDpr, 0, 0); fctx.clearRect(0, 0, VW, VH);
    const sx = scrollX, sy = scrollY;
    for (let i = layers.length - 1; i >= 0; i--) {
      let keep = false;
      try { keep = layers[i](fctx, t, dt, sx, sy); } catch (e) { console.error(e); }
      if (!keep) layers.splice(i, 1);
    }
    if (layers.length) { fxTail = 2; return true; }
    return fxTail-- > 0;
  }
  function addLayer(f) { if (layers.indexOf(f) < 0) layers.push(f); sched.add(fxJob); }

  /* -- the words */
  function fill(s) {
    return String(s == null ? "" : s).replace(/\{n\}/g, String(site.freeWords || 800))
      .replace(/\{maxSeconds\}/g, String(site.maxSeconds)).replace(/\{perMinute\}/g, String(site.perMinute));
  }
  function get(path, base) {
    const parts = path.split(".");
    let o = base || C;
    for (let i = 0; i < parts.length; i++) { if (o == null) return undefined; o = o[parts[i]]; }
    return o;
  }
  function setText(el, s) {
    if (typeof el === "string") el = $(el);
    if (!el || s == null || typeof s === "object") return;
    const v = fill(s);
    if (el.textContent !== v) el.textContent = v;
  }
  /** Deep merge: objects merge, arrays replace, never the prototype. */
  function mergeInto(dst, src) {
    if (!src || typeof src !== "object" || Array.isArray(src)) return dst;
    Object.keys(src).forEach((k) => {
      if (k === "__proto__" || k === "constructor" || k === "prototype") return;
      const v = src[k];
      if (v && typeof v === "object" && !Array.isArray(v) && dst[k] && typeof dst[k] === "object" && !Array.isArray(dst[k])) mergeInto(dst[k], v);
      else dst[k] = v;
    });
    return dst;
  }
  /** The human half in <em>; the h1's last word in span.kw. The sync's markup (tulmi src/seo/home.ts). */
  function paintTitle(el, title, human, kw) {
    if (!el || typeof title !== "string" || !title) return;
    const sig = title + "|" + (human || "") + "|" + (kw ? 1 : 0);
    if (el._sig === sig) return;
    if (!el._sig && el.textContent === title && (!human || (el.querySelector("em") || {}).textContent === human)) { el._sig = sig; return; }
    if (el.querySelector(".kw.gone")) return;   // "type" is dust right now; the words are the same
    el._sig = sig;
    el.textContent = "";
    let pre = "", hum = "", rest = title, tail = "";
    if (human && title.indexOf(human) === 0) { hum = human; rest = title.slice(human.length); }
    else if (human && title.length > human.length && title.lastIndexOf(human) === title.length - human.length) { pre = title.slice(0, title.length - human.length); hum = human; rest = ""; tail = "end"; }
    if (tail === "end") {
      el.appendChild(doc.createTextNode(pre));
      const e = doc.createElement("em"); e.textContent = hum; el.appendChild(e);
      return;
    }
    if (hum) { const e = doc.createElement("em"); e.textContent = hum; el.appendChild(e); }
    if (kw) {
      const m = /([\p{L}\p{N}][\p{L}\p{N}'’-]*)([^\p{L}\p{N}]*)$/u.exec(rest);
      if (m) {
        el.appendChild(doc.createTextNode(rest.slice(0, m.index)));
        const s = doc.createElement("span"); s.className = "kw"; s.textContent = m[1]; el.appendChild(s);
        el.appendChild(doc.createTextNode(m[2]));
        return;
      }
    }
    el.appendChild(doc.createTextNode(rest));
  }
  /** Rebuild a list's children from data only when the words changed. */
  function paintList(el, items, make, sigOf) {
    if (!el || !Array.isArray(items)) return;
    const sig = JSON.stringify(items.map(sigOf || ((x) => x)));
    if (el._sig === sig) return;
    el._sig = sig;
    const nodes = items.map(make);
    if (nodes.map((n) => n.textContent).join("|") === $$(":scope > *", el).map((n) => n.textContent).join("|")) return;
    // Keep the SEO markers: replace only element children.
    $$(":scope > *", el).forEach((n) => n.remove());
    const end = Array.prototype.find.call(el.childNodes, (n) => n.nodeType === 8 && /^\s*\//.test(n.nodeValue));
    nodes.forEach((n) => el.insertBefore(n, end || null));
  }
  function el(tag, cls, text) { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  // [id, copy path]: the hero's and the mast's words
  const TEXTS = [
    ["appsKind", "apps.kind"], ["appsLede", "apps.lede"], ["againLong", "hero.again"], ["freeLine", "download.free"], ["other", "download.other"], ["chordHint", "desk.try"],
    ["navFilms", "ui.films"], ["navLangs", "ui.languages"], ["navQs", "ui.questions"], ["navSoon", "ui.soon"], ["calmLab", "ui.calm"],
  ];
  function paintAll() {
    TEXTS.forEach(([id, p]) => { const v = get(p); if (typeof v === "string") setText(id, v); });
    const A = C.apps || {}, h1 = $("appsTitle");
    paintTitle(h1, A.title, A.human, true);
    h1.classList.toggle("long", (A.title || "").length > 26);
    // the beat: the backend's absorbs, rendered at last
    const ab = Array.isArray(C.absorbs) ? C.absorbs : null;
    if (ab) $$("#beat span").forEach((s, i) => { if (typeof ab[i] === "string") setText(s, ab[i]); });
    const P = get("ui.platforms");
    if (Array.isArray(P)) ["ios", "android", "win", "mac", "linux"].forEach((os, i) => { if (P[i]) $$('a[data-place="row"][data-os="' + os + '"]').forEach((a) => setText(a, P[i])); });
    const keys = get("desk.keys");
    if (Array.isArray(keys)) $$("#chord kbd").forEach((k, i) => { if (keys[i]) setText(k, keys[i]); });
    // the hero's caption: its last part goes on phones
    const hf = get("ui.heroFilm"), cap = $("heroCap");
    if (typeof hf === "string" && cap._sig !== hf) { const cut = hf.lastIndexOf(" · "); cap._sig = hf; cap.textContent = cut > 0 ? hf.slice(0, cut) : hf; if (cut > 0) cap.appendChild(el("span", "long", hf.slice(cut))); }
    const sk = doc.querySelector(".skip"); if (get("ui.skip")) setText(sk, get("ui.skip"));
    const nav = get("ui.ask"), na = $("navAsk"); if (nav && na.firstChild && na.firstChild.nodeType === 3) na.firstChild.nodeValue = nav;
    paintLine();
    listenUi();
    if (TZ.paintBelow) TZ.paintBelow();
    emit("paint");
  }

  /* -- applyShape v2: theme; order (unlisted sections ride with their source predecessor, the hero
     never moves); hidden (#ask only with ask soon|live); bands (the page's own only); meta */
  const BANDS = { "on-ink": "dark", "on-violet": "dark", "on-indigo": "dark", "on-cream": "light" };
  const main = $("main");
  const SOURCE = $$(":scope > section[id]", main).map((s) => s.id);
  function applyShape(j) {
    if (!j || typeof j !== "object") return;
    const th = j.theme;
    if (th && typeof th === "object") Object.keys(th).forEach((k) => {
      const v = th[k];
      if (/^[a-z0-9-]{1,40}$/i.test(k) && typeof v === "string" && !/[;{}<>]/.test(v)) root.style.setProperty("--" + k, v);
    });
    const L = j.layout && typeof j.layout === "object" ? j.layout : {};
    if (Array.isArray(L.order)) {
      const byId = {}; SOURCE.forEach((id) => { byId[id] = $(id); });
      const seq = [];
      L.order.forEach((id) => { if (typeof id === "string" && id !== "hero" && byId[id] && seq.indexOf(id) < 0) seq.push(id); });
      SOURCE.forEach((id, i) => {
        if (id === "hero" || seq.indexOf(id) >= 0) return;
        const pred = i > 0 ? SOURCE[i - 1] : null;
        const at = pred && pred !== "hero" ? seq.indexOf(pred) : -1;
        seq.splice(at + 1, 0, id);
      });
      const now = $$(":scope > section[id]", main).map((s) => s.id).filter((id) => id !== "hero");
      if (now.join() !== seq.join()) { seq.forEach((id) => main.appendChild(byId[id])); emit("layout"); }
    }
    if (Array.isArray(L.hidden)) $$(":scope > section[id]", main).forEach((s) => { if (s.id !== "hero") s.hidden = L.hidden.indexOf(s.id) >= 0; });
    const askOn = j.ask === "soon" || j.ask === "live";
    if (!askOn) $("ask").hidden = true; else if (!Array.isArray(L.hidden)) $("ask").hidden = false;
    $("navAsk").hidden = !askOn || $("ask").hidden;
    $("navSoon").hidden = j.ask !== "soon";   // "Soon" only while it is coming; live is plain "Ask"
    if (L.bands && typeof L.bands === "object") Object.keys(L.bands).forEach((id) => {
      const s = $(id), b = L.bands[id];
      if (!s || s.tagName !== "SECTION" || id === "hero" || !BANDS[b]) return;
      Object.keys(BANDS).forEach((c) => s.classList.remove(c));
      s.classList.add(b); s.setAttribute("data-tone", BANDS[b]);
    });
    if (j.meta && typeof j.meta === "object") {
      if (typeof j.meta.title === "string" && j.meta.title) doc.title = j.meta.title;
      if (typeof j.meta.description === "string" && j.meta.description) { const m = doc.querySelector('meta[name="description"]'); if (m) m.setAttribute("content", j.meta.description); }
    }
  }

  /* -- one button that knows the visitor */
  function detect() {
    const o = (Q.get("os") || "").toLowerCase();
    if (/^(ios|android|win|mac|linux|chromeos|other)$/.test(o)) return o;
    const ua = navigator.userAgent || "";
    if (/iPhone|iPod|iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";   // iPadOS says Macintosh
    if (/Android/.test(ua)) return "android";
    if (/CrOS/.test(ua)) return "chromeos";
    if (/Windows/.test(ua)) return "win";
    if (/Mac OS X|Macintosh/.test(ua)) return "mac";
    if (/Linux/.test(ua)) return "linux";
    return "other";
  }
  const OS = detect();
  const MOBILE = OS === "ios" || OS === "android";
  if (MOBILE) root.classList.add("mobile");
  const DL = "https://api.tailzu.space/downloads/";
  function hrefFor(os) {
    const st = C.stores || {}, ok = (s) => (typeof s === "string" && /^https:\/\//.test(s) ? s : "");
    const d = site.downloads || {};
    if (os === "ios") return ok(st.ios) || "/download";
    if (os === "android") return ok(st.android) || "/download";
    if (os === "win") return ok(st.windowsInstaller) || (d.win ? DL + "Tailzu-Setup.exe" : "/download");
    if (os === "mac") return d.mac ? DL + "Tailzu.dmg" : "/download";
    if (os === "linux") return d.linux ? DL + "Tailzu.AppImage" : "/download";
    return "/download";
  }
  const isInstaller = (h) => /\/downloads\/Tailzu(\.dmg|-Setup\.exe|\.AppImage)$/.test(h) || /^https:\/\/get\.microsoft\.com\/installer\//.test(h);
  const fileOf = (h) => (/\.dmg$/.test(h) ? "Tailzu.dmg" : /\.AppImage$/.test(h) ? "Tailzu.AppImage" : /Setup\.exe$/.test(h) ? "Tailzu-Setup.exe" : "Tailzu's installer");
  function kindOf(h) {
    if (/apps\.apple\.com|itunes\.apple\.com/.test(h)) return "iphone";
    if (/play\.google\.com/.test(h)) return "android";
    if (/microsoft\.com|Setup\.exe$/.test(h)) return "windows";
    if (/\.dmg$/.test(h)) return "mac";
    if (/\.AppImage$/.test(h)) return "linux";
    return "other";
  }
  function labelFor(os) {
    const d = C.download || {};
    return os === "chromeos" || os === "other" ? (d.get || "Get Tailzu") : (d[os] || d.get || "Get Tailzu");
  }
  const glyphFor = (os) => (os === "ios" || os === "android" ? "#g-phone" : os === "win" || os === "mac" || os === "linux" ? "#g-laptop" : "#g-dots");
  function route() {
    $$("a[data-dl]").forEach((a) => {
      if (a.classList.contains("busy")) return;   // loading or done: its href is the one just pressed
      const os = a.dataset.dl === "auto" ? OS : a.dataset.dl;
      const href = hrefFor(os);
      if (a.getAttribute("href") !== href) a.setAttribute("href", href);
      let text = labelFor(os);
      if (a.id === "mastPill") {
        const d = C.download || {};
        a.setAttribute("aria-label", text);
        text = MOBILE ? (d.shortTouch || d.short || "Get it") : (d.short || "Download");
      } else if (a.dataset.place === "apps") a.setAttribute("aria-label", text + ", " + (os === "ios" ? "App Store" : "Google Play"));
      const lab = a.querySelector(".pl"); if (lab) setText(lab, text);
      const g = a.querySelector(".pg use"); if (g) g.setAttribute("href", glyphFor(os));
      const ar = a.querySelector(".pa use"); if (ar) ar.setAttribute("href", isInstaller(href) ? "#a-down" : "#a-out");
      a.classList.toggle("store", !isInstaller(href));
    });
    $$('a[data-os][data-place="row"]').forEach((a) => {
      const href = hrefFor(a.dataset.os);
      if (a.getAttribute("href") !== href) a.setAttribute("href", href);
      a.classList.toggle("here", a.dataset.os === OS);
    });
    // the visitor's store first; the visitor's desktop first and larger
    const st = $("appsStores");
    if (st && OS === "android") { const a = st.querySelector('[data-os="android"]'); if (a && st.firstElementChild !== a) st.insertBefore(a, st.firstElementChild); }
    const dp = $("deskPills");
    if (dp && /^(win|mac|linux)$/.test(OS)) {
      const a = dp.querySelector('[data-os="' + OS + '"]');
      if (a && dp.firstElementChild !== a) dp.insertBefore(a, dp.firstElementChild);
      $$(".pill", dp).forEach((p) => { p.classList.toggle("l", p === a); p.classList.toggle("m", p !== a); });
    }
    pills.forEach((p) => p.measure());
    mastRoom();
  }
  // a download click: tracked beside the pixel's Lead, never held or prevented; an installer says it started
  doc.addEventListener("click", (e) => {
    const a = e.target && e.target.closest ? e.target.closest("a[data-dl], a[data-os]") : null;
    if (!a) return;
    const h = a.href || "";
    if (a.dataset.place) track("tz_cta_click", { place: a.dataset.place, kind: kindOf(h) });
    if (a.classList.contains("pill") && isInstaller(h)) started(a, h);
  });
  function started(a, h) {
    const p = a._pill, lab = a.querySelector(".pl"), was = lab ? lab.textContent : "";
    const d = C.download || {};
    clearTimeout(a._t1); clearTimeout(a._t2);
    a.classList.add("busy", "is-loading"); a.classList.remove("is-done");
    if (lab) lab.textContent = d.starting || "Starting";
    if (p) { p.hold = true; p.wake(); }
    a._t1 = setTimeout(() => {
      a.classList.remove("is-loading"); a.classList.add("is-done");
      if (lab) lab.textContent = d.started || "Check your downloads";
      if (p) { p.hold = false; p.thread.pluck(1, { amp: 6 }); p.wake(); }
      say(fill(d.startedNote || "Download started. Open {file} to install.").replace("{file}", fileOf(h)));
      a._t2 = setTimeout(() => { a.classList.remove("is-done", "busy"); if (lab) lab.textContent = was; route(); }, 6000);
    }, 1200);
  }

  /* -- the pill: split, thread, magnet, dent */
  const pointer = { x: -1e4, y: -1e4, px: -1e4, py: -1e4, vx: 0, vy: 0, t: 0, down: false, type: "mouse", moved: 0 };
  const pills = [];
  function Pill(a) {
    this.el = a; a._pill = this;
    this.s = { x: 0, v: 0 }; this.hover = false; this.focus = false; this.down = false; this.hold = false; this.touch = false;
    this.mx = 0; this.my = 0; this.tmx = 0; this.tmy = 0; this.speed = 0; this.last = -1;
    this.thread = PS.createThread();
    this.path = a.querySelector(".seam path"); this.rect = a.querySelector(".ring rect");
    this.full = a.classList.contains("full");
    const self = this;
    a.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && fine() && !self.mute) { self.hover = true; if (!TZ.calm) self.thread.pluck(.55, { amp: 6 }); blipAttend(a); self.wake(); } });
    a.addEventListener("pointerleave", () => { self.mute = false; self.hover = false; self.down = false; self.touch = false; a.classList.remove("dent"); self.tmx = self.tmy = 0; blipAttend(null); self.wake(); });
    a.addEventListener("focus", () => { if (a.matches(":focus-visible")) { self.focus = true; self.wake(); } });
    a.addEventListener("blur", () => { self.focus = false; self.wake(); });
    a.addEventListener("pointerdown", (e) => { self.down = true; self.touch = e.pointerType !== "mouse"; a.classList.add("dent"); self.wake(); });
    const up = () => { if (!self.down) return; self.down = false; self.touch = false; a.classList.remove("dent"); if (!TZ.calm) self.thread.pluck(1, { amp: 6 }); self.wake(); };
    a.addEventListener("pointerup", up); a.addEventListener("pointercancel", up);
    this.measure();
  }
  Pill.prototype.measure = function () {
    const a = this.el, cs = getComputedStyle(a);
    this.h = parseFloat(cs.height) || 60;
    this.full = a.classList.contains("full") || parseFloat(cs.paddingRight) < 1;
    this.gap = this.full ? 18 : this.h * .9;
    if (this.rect) {
      const w = a.offsetWidth + 10, h = this.h + 10;
      this.rect.setAttribute("x", 1); this.rect.setAttribute("y", 1);
      this.rect.setAttribute("width", Math.max(0, w - 2)); this.rect.setAttribute("height", Math.max(0, h - 2)); this.rect.setAttribute("rx", h / 2);
    }
  };
  Pill.prototype.target = function () {
    if (this.hold || this.hover || this.focus || this.teach) return 1;
    if (this.down && this.touch) return this.full ? 1 : 18 / this.gap;
    return 0;
  };
  Pill.prototype.wake = function () { sched.add(pillJob); };
  Pill.prototype.step = function (t, dt) {
    const to = this.target();
    if (TZ.calm) { this.s.x = to; this.s.v = 0; } else PS.spring(this.s, to, null, dt);
    const e = this.s.x;
    this.el.style.setProperty("--split", e.toFixed(4));
    // the seam's thread, plucked by the pointer's speed
    const bands = []; for (let i = 0; i < 12; i++) bands.push(Math.min(1, this.speed * (.6 + .4 * Math.sin(t * 9 + i))));
    this.thread.step(dt, bands, this.speed > .05, { amp: 6, sag: 1.5 });
    this.speed *= Math.exp(-6 * dt);
    const w = Math.max(0, e) * this.gap;
    if (this.path) {
      if (w < 1.5) { if (this.last !== 0) { this.path.setAttribute("d", ""); this.last = 0; } }
      else {
        const pts = this.thread.points(0, w, this.h / 2, t, Math.max(4, Math.round(w / 4)), null, TZ.calm ? { amp: 0, sag: 0 } : { amp: 6, sag: 1.5 });
        this.path.setAttribute("d", "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L")); this.last = 1;
      }
    }
    // the magnet: the drawing moves, never the link's hit area
    let tx = 0, ty = 0;
    if (!TZ.calm && fine() && !TZ.star && (this.hover || this.near)) { tx = this.tmx; ty = this.tmy; }
    const k = 1 - Math.exp(-14 * dt);
    this.mx += (tx - this.mx) * k; this.my += (ty - this.my) * k;
    this.el.style.setProperty("--mx", this.mx.toFixed(2) + "px"); this.el.style.setProperty("--my", this.my.toFixed(2) + "px");
    return PS.springMoving(this.s, to) || this.thread.energy() > .05 || Math.abs(this.mx - tx) > .05 || Math.abs(this.my - ty) > .05;
  };
  function pillJob(t, dt) { let more = false; for (const p of pills) if (p.step(t, dt)) more = true; return more; }
  function pillsPointer(e) {
    if (!fine() || TZ.calm) return;
    for (const p of pills) {
      const r = p.el.getBoundingClientRect();
      if (!r.width) continue;
      const bw = r.width - (p.full ? 0 : p.gap), cx = r.left + bw / 2 - p.mx, cy = r.top + r.height / 2 - p.my;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const ox = Math.max(0, Math.abs(dx) - bw / 2), oy = Math.max(0, Math.abs(dy) - r.height / 2), d = Math.hypot(ox, oy);
      const was = p.near; p.near = d < 70;
      if (p.near) { const k = 1 - d / 70; p.tmx = clamp(dx * .06 * k, -7, 7); p.tmy = clamp(dy * .12 * k, -5, 5); p.wake(); }
      else if (was) { p.tmx = p.tmy = 0; p.wake(); }
      if (p.hover) { p.speed = Math.min(1, p.speed + Math.hypot(pointer.vx, pointer.vy) / 1200 * .08); p.wake(); }
    }
  }

  /* -- the mast, the sticky pills */
  const mast = $("mast"), mastPill = $("mastPill"), footPill = $("footPill");
  let heroPillSeen = true, othersSeen = 0, footerSeen = false, typingFocus = false, mastRaf = 0;
  function tuneMast() {
    mastRaf = 0;
    const y = mast.offsetHeight / 2;
    let tone = "dark", footTone = "dark";
    const secs = $$(":scope > section:not([hidden])", main).concat([doc.querySelector("footer")]);
    for (const s of secs) {
      const r = s.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) tone = s.getAttribute("data-tone") || "dark";
      if (r.top <= VH - 40 && r.bottom > VH - 40) footTone = s.getAttribute("data-tone") || "dark";
    }
    mast.classList.toggle("light", tone === "light");
    const hero = $("hero").getBoundingClientRect();
    mast.classList.toggle("solid", scrollY > 8 || hero.bottom < mast.offsetHeight + 8);
    footPill.classList.toggle("inv", footTone !== "light");
  }
  function sticky() {
    const away = heroPillSeen || othersSeen > 0;
    mastPill.classList.toggle("away", away);
    mast.classList.toggle("bare", away);
    mastPill.tabIndex = away ? -1 : 0;
    if (!away && fine()) track("tz_cta_view", { place: "mast" }, "mast");
    const up = !heroPillSeen && othersSeen === 0 && !footerSeen && !typingFocus;
    footPill.classList.toggle("up", up);
    footPill.tabIndex = up ? 0 : -1;
    if (up) { footPill.removeAttribute("aria-hidden"); if (getComputedStyle(footPill).display !== "none") track("tz_cta_view", { place: "foot" }, "foot"); } else footPill.setAttribute("aria-hidden", "true");
  }
  W.addEventListener("scroll", () => { if (!mastRaf) mastRaf = requestAnimationFrame(tuneMast); }, { passive: true });
  // the room the mast pill takes, so the nav can sit at the edge while it is away
  const mastRoom = () => mast.style.setProperty("--mpw", (mastPill.offsetWidth ? mastPill.offsetWidth + (parseFloat(getComputedStyle(mast).columnGap) || 0) : 0) + "px");
  doc.addEventListener("focusin", (e) => { typingFocus = !!(e.target && (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable)); sticky(); });
  doc.addEventListener("focusout", () => { typingFocus = false; setTimeout(sticky, 50); });

  /* -- the hero's film (the others: js/play.js) */
  const heroFilm = $("heroFilm");
  // the hero's film: after load, only in view, with motion, on a fast line
  let heroIn = true, heroFilmWanted = true, pageLoaded = false;
  const filmPause = $("filmPause");
  function heroFilmUi() {
    const playing = heroFilm && !heroFilm.paused;
    filmPause.setAttribute("aria-label", get(playing ? "ui.pause" : "ui.play") || (playing ? "Pause the film" : "Play the film"));
    filmPause.setAttribute("aria-pressed", playing ? "false" : "true");
    filmPause.querySelector("use").setAttribute("href", playing ? "#i-pause" : "#i-play");
  }
  function heroFilmSrc() { return heroFilm.getAttribute(mqPortrait.matches ? "data-src9" : "data-src16"); }
  function heroFilmGo(user) {
    if (!heroFilm) return;
    if (!user && (!pageLoaded || TZ.calm || saveData || !fastNet || !heroFilmWanted || !heroIn)) { heroFilmUi(); return; }
    const want = heroFilmSrc();
    if (want && heroFilm.getAttribute("src") !== want) { heroFilm.classList.remove("on"); heroFilm.src = want; }
    const p = heroFilm.play(); if (p && p.catch) p.catch(() => {});
  }
  if (heroFilm) {
    heroFilm.addEventListener("playing", () => { heroFilm.classList.add("on"); heroFilmUi(); });
    heroFilm.addEventListener("pause", heroFilmUi);
    filmPause.addEventListener("click", () => {
      if (heroFilm.paused) { heroFilmWanted = true; if (TZ.calm) root.classList.add("film-ok"); heroFilm.hidden = false; heroFilmGo(true); }
      else { heroFilmWanted = false; heroFilm.pause(); }
    });
    mqPortrait.addEventListener("change", () => { if (!heroFilm.paused || heroFilm.getAttribute("src")) heroFilmGo(); });
  }

  // W19: the river runs 1 to 2.5x with the scroll's speed (read, never set)
  let lastSY = scrollY, lastST = performance.now(), scrollV = 0, rate = 1;
  function scrollJob(t, dt) {
    rate += (1 + Math.min(1.5, Math.abs(scrollV) / 1600) - rate) * (1 - Math.exp(-dt / .12));
    scrollV *= Math.exp(-dt / .6 * 3);
    if (heroFilm && !heroFilm.paused) { try { heroFilm.playbackRate = clamp(rate, 1, 2.5); } catch (e) { /* none */ } }
    TZ.scrollV = scrollV;
    if (Math.abs(rate - 1) < .01 && Math.abs(scrollV) < 5) { rate = 1; if (heroFilm && !heroFilm.paused) heroFilm.playbackRate = 1; TZ.scrollV = 0; return false; }
    return true;
  }
  W.addEventListener("scroll", () => {
    const n = performance.now(), dy = scrollY - lastSY, dtt = Math.max(8, n - lastST);
    lastSY = scrollY; lastST = n;
    if (TZ.calm) return;
    scrollV = scrollV * .6 + (dy / dtt * 1000) * .4;
    sched.add(scrollJob);
  }, { passive: true });

  /* -- the thread: a wave equation on nodes 6 px apart. Slow, it catches; let go, it rings;
     fast, it is struck. At rest, a straight dotted SVG line. */
  function Str(svg, o) {
    this.svg = svg; this.path = svg.querySelector("path"); this.o = Object.assign({ cy: null, max: 26, sp: 6 }, o || {});
    this.N = 0; this.ys = null; this.vs = null; this.acc = null; this.pins = null; this.sleep = true; this.grab = null; this.talk = 0; this.bands = null;
    this.layout();
  }
  Str.prototype.layout = function () {
    const r = this.svg.getBoundingClientRect();
    this.w = r.width; this.h = r.height; this.cy = this.o.cy != null ? this.o.cy : r.height / 2;
    const N = Math.max(3, Math.ceil(this.w / this.o.sp) + 1);
    if (N !== this.N) { this.N = N; this.ys = new Float32Array(N); this.vs = new Float32Array(N); this.acc = new Float32Array(N); this.pins = new Uint8Array(N); }
    this.pins.fill(0); this.pins[0] = this.pins[N - 1] = 1;
    (this.o.pinAt || []).forEach((x) => { const i = Math.round(x / this.o.sp); if (i > 0 && i < N - 1) this.pins[i] = 1; });
    this.draw(true);
  };
  Str.prototype.kick = function (x, dir, amt, width) {
    if (TZ.calm) return;
    const i0 = Math.round(x / this.o.sp), wd = width || 5;
    for (let k = -wd; k <= wd; k++) { const i = i0 + k; if (i > 0 && i < this.N - 1 && !this.pins[i]) this.vs[i] += dir * amt * Math.exp(-(k * k) / (wd * 1.6)); }
    this.wake();
  };
  Str.prototype.pluck = function (strength, x) { this.kick(x == null ? this.w * (.3 + Math.random() * .4) : x, Math.random() < .5 ? -1 : 1, 2 + 7 * strength, 6); };
  Str.prototype.wake = function () { this.sleep = false; sched.add(this._job || (this._job = (t, dt) => this.step(t, dt))); };
  Str.prototype.step = function (t, dt) {
    const N = this.N, ys = this.ys, vs = this.vs, acc = this.acc, pins = this.pins, S = MOTION.springs.string;
    if (this.talk > 0 && this.bands) {
      // the voice: four modes, from the low, middle and high bands
      const b = this.bands, lo = (b[0] + b[1] + b[2]) / 3, mid = (b[3] + b[4] + b[5] + b[6]) / 4, hi = (b[7] + b[8] + b[9] + b[10] + b[11]) / 5;
      [[1, lo], [2, mid * .7], [3, hi * .6], [4, (lo + mid + hi) / 4]].forEach(([m, a]) => {
        for (let k = 1; k <= m; k++) { const x = (k - .5) / m * this.w; const i = Math.round(x / this.o.sp); if (i > 0 && i < N - 1 && !pins[i]) vs[i] += Math.sin(t * (7 + m * 3)) * a * 1.4 * (k % 2 ? 1 : -1); }
      });
    }
    for (let s = 0; s < S.substeps; s++) {
      for (let i = 1; i < N - 1; i++) acc[i] = pins[i] ? 0 : S.K * (ys[i - 1] + ys[i + 1] - 2 * ys[i]) - S.damp * vs[i];
      for (let i = 1; i < N - 1; i++) { if (pins[i]) { ys[i] = 0; vs[i] = 0; continue; } vs[i] += acc[i]; ys[i] += vs[i]; }
      if (this.grab) { ys[this.grab.i] = this.grab.d; vs[this.grab.i] = 0; }
    }
    let e = 0; for (let i = 0; i < N; i++) e += Math.abs(ys[i]) + Math.abs(vs[i]);
    this.sleep = e < .05 && !this.grab && !(this.talk > 0);
    if (this.sleep) { ys.fill(0); vs.fill(0); }
    this.draw(this.sleep);
    return !this.sleep;
  };
  Str.prototype.draw = function (flat) {
    if (!this.path) return;
    const cy = this.cy;
    if (flat || TZ.calm) { this.path.setAttribute("d", "M0 " + cy.toFixed(1) + "H" + this.w.toFixed(1)); return; }
    let d = "M0 " + cy.toFixed(1);
    for (let i = 1; i < this.N; i++) d += "L" + Math.min(this.w, i * this.o.sp).toFixed(1) + " " + (cy + this.ys[i]).toFixed(1);
    this.path.setAttribute("d", d);
  };
  /** Pointer over the string: catch slow, strike fast. Returns a pluck. */
  Str.prototype.feel = function (x, y, px, py, kind, release) {
    if (TZ.calm) return null;
    const i = Math.round(x / this.o.sp);
    if (this.grab) {
      const d = y - this.cy;
      if (release || i <= 0 || i >= this.N - 1 || this.pins[i] || Math.abs(d) > this.o.max || Math.abs(x - this.grab.x) > 70) { const g = this.grab; this.grab = null; this.wake(); return { x: g.x, s: Math.min(1, Math.abs(g.d) / this.o.max) }; }
      this.grab.i = i; this.grab.d = d; this.grab.x = x; this.wake(); return null;
    }
    if (release || i <= 0 || i >= this.N - 1 || this.pins[i] || px < -1e3) return null;
    const a = py - (this.cy + this.ys[i]), b = y - (this.cy + this.ys[i]);
    if ((a < 0) !== (b < 0) && Math.abs(a - b) < 400) {
      const speed = Math.hypot(x - px, y - py);
      if (speed < 9 && kind === "mouse") { this.grab = { i, d: b, x }; this.wake(); return null; }
      this.kick(x, b > 0 ? 1 : -1, Math.min(9, 2 + speed * .22));
      return { x, s: Math.min(1, speed / 30) };
    }
    return null;
  };
  TZ.Str = Str;

  /* -- dots: words to dots and back */
  const off = doc.createElement("canvas"), og = off.getContext("2d", { willReadFrequently: true });
  /** An element's text as dots (page px), through the films' 8x8 dither. */
  function sample(elm, cell, max) {
    const r = elm.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return [];
    const cs = getComputedStyle(elm), pad = 6;
    const w = Math.ceil(r.width) + pad * 2, h = Math.ceil(r.height) + pad * 2;
    off.width = w; off.height = h;
    og.clearRect(0, 0, w, h);
    og.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    if ("letterSpacing" in og) og.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
    og.textBaseline = "alphabetic"; og.fillStyle = "#fff";
    const m = og.measureText(elm.textContent), fs = parseFloat(cs.fontSize);
    const asc = m.fontBoundingBoxAscent || fs * .9, desc = m.fontBoundingBoxDescent || fs * .25;
    og.fillText(elm.textContent, pad, pad + (r.height - (asc + desc)) / 2 + asc);
    const d = og.getImageData(0, 0, w, h).data, out = [];
    for (let y = 0, j = 0; y < h; y += cell, j++) for (let x = (j % 2) * cell / 2, i = 0; x < w; x += cell, i++) {
      const al = d[((y | 0) * w + (x | 0)) * 4 + 3];
      if (al > (BAYER[(j & 7) * 8 + (i & 7)] + .5) / 64 * 230 + 20) out.push([r.left + scrollX + x - pad, r.top + scrollY + y - pad]);
    }
    for (let i = out.length - 1; i > 0; i--) { const k = (Math.random() * (i + 1)) | 0, t = out[i]; out[i] = out[k]; out[k] = t; }
    return max ? out.slice(0, max) : out;
  }
  TZ.sample = sample;

  /** Wrap an element's words in span.w (the text itself never changes). */
  function words(e) {
    if (!e) return [];
    if (e._w && e._wt === e.textContent && e._w.every((s) => s.parentNode === e)) return e._w;
    const text = e.textContent; e.textContent = "";
    const out = [];
    text.split(/(\s+)/).forEach((p) => {
      if (!p) return;
      if (/^\s+$/.test(p)) { e.appendChild(doc.createTextNode(p)); return; }
      const s = doc.createElement("span"); s.className = "w"; s.textContent = p; e.appendChild(s); out.push(s);
    });
    e._w = out; e._wt = e.textContent;
    return out;
  }
  TZ.words = words;

  // THE DIFF (§2.5): LCS; kept words land untouched (numbers and names ringed), the rest re-forms,
  // fillers are struck; under 30% aligned it pours as one block. The receipt is always the served note.
  const FILLERS = new Set(["um", "uh", "so", "like", "eh", "euh", "ähm", "cioè", "tipo", "yani", "ну", "えっと", "음"]);
  const norm = (s) => String(s).toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, "");
  function diff(said, wrote) {
    const a = said.map(norm), b = wrote.map(norm), n = a.length, m = b.length;
    const L = []; for (let i = 0; i <= n; i++) L.push(new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] && a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const S = new Array(n).fill(null), Wd = new Array(m).fill(null), pairs = [];
    for (let i = 0, j = 0; i < n && j < m;) {
      if (a[i] && a[i] === b[j]) { pairs.push([i, j]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
    }
    const block = pairs.length / Math.max(n, m, 1) < .3;
    if (block) {
      for (let i = 0; i < n; i++) S[i] = { k: FILLERS.has(a[i]) ? "filler" : "fix" };
      const src = S.map((s, i) => (s.k === "fix" ? i : -1)).filter((i) => i >= 0);
      for (let j = 0; j < m; j++) Wd[j] = { k: "fix", src: [src.length ? src[Math.min(src.length - 1, Math.floor(j * src.length / m))] : 0] };
      return { said: S, wrote: Wd, block: true };
    }
    pairs.forEach(([i, j]) => {
      S[i] = { k: "keep", j };
      // numbers, and names (capitalised mid-sentence)
      const prev = j > 0 ? wrote[j - 1] : "";
      const ring = /\p{N}/u.test(b[j]) || (j > 0 && /^\p{Lu}/u.test(wrote[j]) && /\p{L}[^.!?]*$/u.test(prev) && !/[.!?:]$/.test(prev));
      Wd[j] = { k: "keep", src: [i], ring };
    });
    // the runs between matches
    const edges = [[-1, -1]].concat(pairs, [[n, m]]);
    for (let q = 0; q < edges.length - 1; q++) {
      const [i0, j0] = edges[q], [i1, j1] = edges[q + 1];
      const si = []; for (let i = i0 + 1; i < i1; i++) si.push(i);
      const wj = []; for (let j = j0 + 1; j < j1; j++) wj.push(j);
      const fixes = [];
      si.forEach((i) => { if (FILLERS.has(a[i]) && !(wj.length && fixes.length === 0 && si.length === 1)) S[i] = { k: "filler" }; else { S[i] = { k: "fix" }; fixes.push(i); } });
      wj.forEach((j, x) => {
        const near = fixes.length ? [fixes[Math.min(fixes.length - 1, Math.floor(x * fixes.length / wj.length))]] : [Math.max(0, Math.min(n - 1, i0 >= 0 ? i0 : 0))];
        Wd[j] = { k: "fix", src: near };
      });
    }
    return { said: S, wrote: Wd, block: false };
  }
  TZ.diff = diff;

  // THE POUR (W1): said words break into dots that fall through the thread; written words go solid as they land
  function pour(fromEl, toEl, o) {
    o = Object.assign({ color: CREAM, start: 0, stagger: 85, flight: 520, via: null, str: null, max: mqPhone.matches || lowEnd ? 900 : 1600, plan: null, keepFirst: true, onLand: null, sources: null }, o || {});
    const tw = words(toEl), sw = fromEl ? words(fromEl) : [];
    const plan = o.plan || (fromEl ? diff(sw.map((s) => s.textContent), tw.map((s) => s.textContent)) : { wrote: tw.map(() => ({ k: "fix", src: [0] })), said: [] });
    // the ringed words take their room now (their capsule's margin), so the dots aim where they land
    tw.forEach((s, j) => { if ((plan.wrote[j] || {}).ring) s.classList.add("kept"); });
    const land = (s, j) => {
      const p = plan.wrote[j] || {};
      s.classList.add("on");
      if (p.k === "fix") s.classList.add("fix");
      if (p.ring) { s.classList.add("kept"); s.setAttribute("data-tag", get("comb.kept") || "Kept"); tagFit(s); setTimeout(() => s.classList.add("ring"), 120); }
      if (o.onLand) o.onLand(s, j);
    };
    if (TZ.calm) { tw.forEach(land); return Promise.resolve(); }
    const cell = mqPhone.matches ? 4 : 3;
    // the order: kept words land first and untouched, then the rest
    const order = tw.map((s, j) => j);
    if (o.keepFirst) order.sort((x, y) => ((plan.wrote[x] || {}).k === "keep" ? 0 : 1) - ((plan.wrote[y] || {}).k === "keep" ? 0 : 1) || x - y);
    const targets = order.map((j) => sample(tw[j], cell));
    const total = targets.reduce((s, t) => s + t.length, 0), keep = total > o.max ? o.max / total : 1;
    const srcDots = {};
    const srcOf = (i) => (srcDots[i] || (srcDots[i] = sw[i] ? sample(sw[i], cell + 1, 160) : []));
    const t0 = performance.now() + o.start, parts = [];
    const viaY = o.via != null ? o.via : null;
    let lastLand = 0;
    order.forEach((j, q) => {
      const tg = targets[q].filter(() => Math.random() < keep), p = plan.wrote[j] || { src: [] };
      let src = [];
      if (o.sources) src = o.sources;
      else (p.src || []).forEach((i) => { src = src.concat(srcOf(i)); });
      if (!src.length) src = tg;
      const start = t0 + q * o.stagger;
      let landAt = start + o.flight;
      tg.forEach((d, k) => {
        const s = src[k % src.length], jit = Math.random() * 110, dur = o.flight + Math.random() * 90;
        if (viaY != null) {
          // through the thread: the word lifts as it breaks, falls through the thread a little past it, and settles in its slot
          parts.push({ sx: s[0] + rnd(-1.5, 1.5), sy: s[1] + rnd(-1.5, 1.5), ax: s[0] + rnd(-16, 16), ay: s[1] - rnd(6, 26), cx: s[0] + (d[0] - s[0]) * .62 + rnd(-28, 28), cy: viaY + rnd(10, 30), tx: d[0], ty: d[1], t0: start + jit, dur: dur + 80 });
        } else {
          const cx = (s[0] + d[0]) / 2 + rnd(-50, 50), cy = (s[1] + d[1]) / 2 - rnd(10, 50);
          parts.push({ sx: s[0] + rnd(-1.5, 1.5), sy: s[1] + rnd(-1.5, 1.5), cx, cy, tx: d[0], ty: d[1], t0: start + jit, dur });
        }
        landAt = Math.max(landAt, start + jit + dur * .9);
      });
      // each word plucks the thread where it passes through
      if (o.str && tg.length) {
        const mx = tg.reduce((a, d) => a + d[0], 0) / tg.length;
        setTimeout(() => { const r = o.str.svg.getBoundingClientRect(); o.str.kick(mx - scrollX - r.left, 1, 2.6, 4); }, Math.max(0, start + o.flight * .45 - performance.now()));
      }
      const at = Math.max(0, landAt - performance.now());
      setTimeout(() => land(tw[j], j), at);
      lastLand = Math.max(lastLand, at);
    });
    TZ.star = (TZ.star || 0) + 1;
    addLayer((g, t, dt, sx, sy) => {
      const now = performance.now();
      let alive = false;
      g.fillStyle = "rgb(" + o.color + ")";
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i], k = (now - p.t0) / p.dur;
        if (k < 0) { alive = true; continue; }
        if (k > 1.35) continue;
        alive = true;
        const e = glide(Math.min(1, k)), u = 1 - e;
        let x, y;
        if (p.ax != null) { const a = u * u * u, b = 3 * u * u * e, c = 3 * u * e * e, d = e * e * e; x = a * p.sx + b * p.ax + c * p.cx + d * p.tx - sx; y = a * p.sy + b * p.ay + c * p.cy + d * p.ty - sy; }
        else { x = u * u * p.sx + 2 * u * e * p.cx + e * e * p.tx - sx; y = u * u * p.sy + 2 * u * e * p.cy + e * e * p.ty - sy; }
        if (y < -20 || y > VH + 20) continue;
        g.globalAlpha = k < .08 ? k / .08 : k > 1 ? Math.max(0, 1 - (k - 1) / .35) : .95;
        const r = k > 1 ? 1.1 : 1.45;
        g.fillRect(x - r / 2, y - r / 2, r, r);
      }
      g.globalAlpha = 1;
      return alive;
    });
    return new Promise((res) => setTimeout(() => { TZ.star = Math.max(0, (TZ.star || 1) - 1); res(); }, lastLand + 120));
  }

  /** A KEPT tag sits over its word; on a wrapped line it would sit on the line above, so it goes (the ring stays). */
  function tagFit(s) {
    const f = s.parentNode && s.parentNode.querySelector(".w");
    s.classList.toggle("lowtag", !!(f && s.offsetTop > f.offsetTop + 4));
  }
  TZ.tagFit = tagFit;
  // a late font or a new width re-wraps a line: its tags fit again (a tag on a wrapped line would sit on the line above)
  const refitTags = () => $$(".w.kept[data-tag]").forEach(tagFit);
  if (doc.fonts && doc.fonts.addEventListener) doc.fonts.addEventListener("loadingdone", refitTags);

  /* -- scripts for what was said */
  // what was said is handwriting in every script the page can: Kalam for Devanagari, Kavivanar for
  // Tamil (Google Fonts, a &text= subset of the words shown, a few KB each); the others, that script's Noto
  const SCRIPTS = [[/[ऀ-ॿ]/, "Kalam", 400], [/[ঀ-৿]/, "Noto Sans Bengali"], [/[਀-੿]/, "Noto Sans Gurmukhi"],
    [/[઀-૿]/, "Noto Sans Gujarati"], [/[଀-୿]/, "Noto Sans Oriya"], [/[஀-௿]/, "Kavivanar", 400], [/[ఀ-౿]/, "Noto Sans Telugu"],
    [/[ಀ-೿]/, "Noto Sans Kannada"], [/[ഀ-ൿ]/, "Noto Sans Malayalam"], [/[඀-෿]/, "Noto Sans Sinhala"], [/[؀-ۿ]/, "Noto Sans Arabic"],
    [/[֐-׿]/, "Noto Sans Hebrew"], [/[฀-๿]/, "Noto Sans Thai"], [/[぀-ヿ]/, "Noto Sans JP"], [/[가-힯]/, "Noto Sans KR"],
    [/[一-鿿]/, "Noto Sans SC"], [/[Ͱ-Ͽ]/, "Noto Sans"]];
  const fontsAsked = {};
  /** Not in Caveat's alphabets: that script's Noto, a &text= subset of the words shown. */
  function scriptFor(e, text) {
    const hit = SCRIPTS.find(([re]) => re.test(text));
    if (!hit) { e.style.removeProperty("font-family"); e.style.removeProperty("font-weight"); e.style.removeProperty("font-size"); return Promise.resolve(); }
    const fam = hit[1], wt = hit[2] || 500, key = fam + "|" + text;
    e.style.setProperty("font-family", "'" + fam + "', var(--hand)");
    e.style.setProperty("font-weight", String(wt));
    if (!fontsAsked[key]) {
      const l = doc.createElement("link"); l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=" + fam.replace(/ /g, "+") + ":wght@" + wt + "&display=swap&text=" + encodeURIComponent(Array.from(new Set(Array.from(text))).join(""));
      doc.head.appendChild(l);
      fontsAsked[key] = new Promise((res) => { l.onload = res; l.onerror = res; setTimeout(res, 1500); }).then(() => doc.fonts.load(wt + " 32px '" + fam + "'", text).catch(() => {}));
    }
    return fontsAsked[key];
  }
  TZ.scriptFor = scriptFor;

  /* -- the hero's line */
  const line = $("line"), lineSaid = $("lineSaid"), lineWrote = $("lineWrote"), lineNote = $("lineNote"), beatEl = $("beat");
  const LANG_OF = { English: "en", Hindi: "hi", Hinglish: "hi-Latn", Tamil: "ta", Bengali: "bn", Marathi: "mr", Telugu: "te", Punjabi: "pa", Gujarati: "gu", Kannada: "kn", Malayalam: "ml", Odia: "or", Nepali: "ne", Urdu: "ur", Spanish: "es" };
  let lineIdx = 0, lineBusy = false, linePlan = null, firstDone = false;
  /** The five lines, India first; a visitor's own Indian language second. */
  function heroLines() {
    const L = Array.isArray(C.lines) && C.lines.length ? C.lines.slice() : [{ said: lineSaid.textContent, wrote: lineWrote.textContent, note: lineNote.textContent }];
    const langs = (navigator.languages || [navigator.language || ""]).map((l) => String(l).toLowerCase().split("-")[0]);
    const want = langs.find((l) => /^(hi|ta|bn|mr|te|pa|gu|kn|ml|or|ne|ur)$/.test(l));
    if (!want || L.length < 2) return L;
    const NAME = { hi: "Hindi", ta: "Tamil", bn: "Bengali", mr: "Marathi", te: "Telugu", pa: "Punjabi", gu: "Gujarati", kn: "Kannada", ml: "Malayalam", or: "Odia", ne: "Nepali", ur: "Urdu" }[want];
    const re = { hi: /[ऀ-ॿ]/, ta: /[஀-௿]/ }[want];
    let k = re ? L.findIndex((x, i) => i > 0 && re.test(x.said)) : -1;
    if (k < 0) {
      const c = (C.cases || []).find((x) => x.lang === NAME);
      if (!c) return L;
      const tpl = L.find((x) => / Hindi /.test(" " + (x.note || "") + " "));
      L.splice(1, 0, { said: c.said, wrote: c.wrote, note: tpl ? tpl.note.replace("Hindi", c.lang) : c.lang, lang: LANG_OF[c.lang] });
      return L;
    }
    if (k > 1) L.splice(1, 0, L.splice(k, 1)[0]);
    return L;
  }
  function langOf(said) {
    const c = (C.cases || []).find((x) => x.said === said);
    if (c && LANG_OF[c.lang]) return LANG_OF[c.lang];
    if (/[ऀ-ॿ]/.test(said)) return "hi";
    if (/[஀-௿]/.test(said)) return "ta";
    return /\b(ko|mein|hai|hoon|abhi|bolo|likho)\b/.test(said) ? "hi-Latn" : "en";
  }
  let lastLine = null;   // what the line shows now (a line, the instrument's, the visitor's own)
  function paintLine() {
    if (lineBusy) return;
    const L = lastLine || heroLines()[lineIdx] || heroLines()[0];
    if (!L) return;
    // once the line has run, a repaint is its end state again (rings, strikes, the receipt), never bare text
    if (firstDone && (lineSaid.textContent !== L.said || lineWrote.textContent !== L.wrote)) { endState(L); return; }
    if (lineSaid.textContent !== L.said) { lineSaid.textContent = L.said; lineSaid.setAttribute("lang", L.lang || langOf(L.said)); scriptFor(lineSaid, L.said); }
    if (lineWrote.textContent !== L.wrote) lineWrote.textContent = L.wrote;
    if (lineNote.textContent !== L.note && !line.classList.contains("run")) lineNote.textContent = L.note || "";
  }
  function setBeat(i) { $$("span", beatEl).forEach((s, k) => s.classList.toggle("on", k === i)); }
  const lineThread = $("lineThread"), markSaid = $("markSaid"), markWrote = $("markWrote"), bead = $("listenBead");
  let heroStr = null;
  /** The mic before what was said, the mark before what got written (hung in the margin; phones indent),
   *  and the bead's labels make way when a said line runs into them. */
  function placeMarks() {
    const lr = line.getBoundingClientRect();
    [[markSaid, lineSaid], [markWrote, lineWrote]].forEach(([m, p]) => {
      const rg = doc.createRange(); rg.selectNodeContents(p); const r = rg.getClientRects()[0];
      if (!r) return;
      const h = m.offsetHeight || 24;
      m.style.setProperty("top", (r.top - lr.top + (r.height - h) / 2 + r.height * .06).toFixed(1) + "px");
    });
    if (bead && !bead.hidden) {
      // the label makes way for a said line that runs into it
      const rg = doc.createRange(); rg.selectNodeContents(lineSaid); const rs = rg.getClientRects(), ls = rs[rs.length - 1];
      bead.classList.remove("tight");
      const bl = bead.querySelector(".bl.a"), br = bl && bl.getBoundingClientRect();
      bead.classList.toggle("tight", !!(ls && br && br.width && ls.right > br.left - 24 && ls.bottom > br.top - 6));
    }
  }
  /** A line's end state at once: the strikes, the misheard marks, the rings, the receipt, the beat on its last word. */
  function endState(L) {
    lastLine = L;
    line.classList.remove("done");
    lineSaid.textContent = L.said; lineSaid.setAttribute("lang", L.lang || langOf(L.said)); scriptFor(lineSaid, L.said);
    lineWrote.textContent = L.wrote; lineNote.textContent = L.note || "";
    const sw = words(lineSaid), ww = words(lineWrote);
    const plan = linePlan = diff(sw.map((s) => s.textContent), ww.map((s) => s.textContent));
    line.classList.add("run");
    sw.forEach((s, i) => {
      const p = plan.said[i] || {};
      s.classList.add("on");
      if (p.k === "filler") s.classList.add("f", "x");
      else { if (p.k === "fix" && !plan.block) s.classList.add("mis"); s.classList.add("gone"); }
    });
    ww.forEach((s, j) => { s.classList.add("on"); const p = plan.wrote[j]; if (p && p.ring) { s.classList.add("kept", "ring"); s.setAttribute("data-tag", get("comb.kept") || "Kept"); tagFit(s); } });
    setBeat(($$("span", beatEl).length || 4) - 1);
    markSaid.classList.add("on"); markWrote.classList.add("on");
    line.classList.add("done");
    placeMarks();
  }
  /** One line: said, meant, written, sent: readable by 2.2 s, done by 2.6 s. */
  async function runLine(L, opt) {
    opt = opt || {};
    lineBusy = true;
    lastLine = L;
    hideNudge();
    line.classList.remove("done");
    markSaid.classList.remove("on"); markWrote.classList.remove("on");
    lineSaid.textContent = L.said; lineSaid.setAttribute("lang", L.lang || langOf(L.said));
    lineWrote.textContent = L.wrote; lineNote.textContent = L.note || "";
    await scriptFor(lineSaid, L.said);
    if (TZ.calm) {
      endState(L); lineBusy = false; emit("line", L);
      say("Written: " + L.wrote);
      blipMood("peek");
      return;
    }
    const sw = words(lineSaid), ww = words(lineWrote);
    const plan = linePlan = diff(sw.map((s) => s.textContent), ww.map((s) => s.textContent));
    // the ringed words take their capsule's room while the line is still unseen, so nothing re-wraps under the pour (CLS)
    ww.forEach((s, j) => { if ((plan.wrote[j] || {}).ring) s.classList.add("kept"); });
    // and the written line stays unpainted until its own face is in: on a slow line that face swaps in after the
    // said words have started, and the words re-wrap (fonts.ready is no help there: the font CSS is still on its way,
    // nothing is "loading" yet, so it resolves at once)
    const wroteIn = () => { if (!doc.fonts) return true; for (const f of doc.fonts) if (f.status === "loaded" && f.family.replace(/["']/g, "") === "Newsreader" && String(f.weight) === "400" && f.style === "normal") return true; return false; };
    const t0f = performance.now();
    if (!wroteIn()) lineWrote.style.setProperty("opacity", "0");
    line.classList.add("run");
    placeMarks();
    $("hero").classList.add("dim");
    note("");
    const T = (ms) => sleep(ms);
    const from = opt.sources;
    await T(opt.fast ? 40 : 100);
    setBeat(0); markSaid.classList.add("on");
    const said = from ? 0 : Math.min(420, sw.length * 50);
    if (!from) {
      sw.forEach((s, i) => setTimeout(() => s.classList.add("on"), i * 50));
      if (heroStr) { heroStr.talk = 1; heroStr.bands = Array(12).fill(.35); heroStr.wake(); }
      blipMood("listening");
    } else sw.forEach((s) => s.classList.add("on"));
    await T(said + 120);
    setBeat(1);
    sw.forEach((s, i) => {
      const p = plan.said[i];
      if (!p) return;
      if (p.k === "filler") { s.classList.add("f"); setTimeout(() => s.classList.add("x"), 60 * (i % 6)); }
      else if (p.k === "fix" && !plan.block) s.classList.add("mis");
    });
    // the dots need the faces they become: a late font waits a moment, never long (1.2 s from the line's start)
    await T(220);
    while (!wroteIn() && performance.now() - t0f < 1200) await T(50);
    await new Promise((r) => requestAnimationFrame(r));
    lineWrote.style.removeProperty("opacity");
    if (heroStr) { heroStr.talk = 0; heroStr.pluck(.8); }
    setBeat(2); markWrote.classList.add("on");
    blipMood("peek");
    const thr = lineThread.getBoundingClientRect();
    sw.forEach((s, i) => { const p = plan.said[i]; if (p && p.k !== "filler") setTimeout(() => s.classList.add("gone"), 40 + i * 30); });
    await pour(from ? null : lineSaid, lineWrote, { plan, stagger: 75, via: thr.top + scrollY + thr.height / 2, str: heroStr, sources: from, onLand: () => { if (B) B.nod(); } });
    setBeat(3);
    if (B) { blipMood("done"); setTimeout(() => blipMood("peek"), 900); }
    await typeNote(L.note || "");
    $("hero").classList.remove("dim");
    line.classList.add("done");
    lineBusy = false;
    say("Written: " + L.wrote);
    emit("line", L);
  }
  function note(s) { lineNote.textContent = s; }
  function typeNote(s) {
    return new Promise((res) => {
      if (TZ.calm || !s) { note(s); res(); return; }
      let i = 0;
      const step = () => { i = Math.min(s.length, i + 2); note(s.slice(0, i)); if (i < s.length) setTimeout(step, 18); else res(); };
      step();
    });
  }
  let lineTouched = false;
  function againPress() {
    if (lineBusy) return;
    lineTouched = true;
    hideNudge();
    const L = heroLines();
    lineIdx = (lineIdx + 1) % L.length;
    track("tz_line_replay", { line: lineIdx + 1 });
    runLine(L[lineIdx]);
  }
  /** Line 1 done, nobody touched anything, the hero still in view: line 2 (the Hindi one) runs once on its own. */
  function autoSecond() {
    if (lineTouched || lineBusy || TZ.calm || lineIdx !== 0) return Promise.resolve(false);
    const r = $("hero").getBoundingClientRect();
    if (r.bottom < innerHeight * .5 || r.top > innerHeight * .5 || doc.hidden) return Promise.resolve(false);
    const L = heroLines();
    if (L.length < 2) return Promise.resolve(false);
    lineIdx = 1;
    track("tz_line_replay", { line: 2, auto: true });
    return runLine(L[1]).then(() => true);
  }
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach((t) => $("hero").addEventListener(t, () => { lineTouched = true; }, { passive: true }));

  /* -- the threads: pluck them */
  // every thread on the page answers the pointer
  const strings = [];
  function addString(svg, where, o) { const s = new Str(svg, o); s.where = where; strings.push(s); return s; }
  TZ.addString = addString;
  let plucked = 0;
  function feelStrings(x, y, px, py, kind, release) {
    for (const s of strings) {
      const r = s.svg.getBoundingClientRect();
      if (!r.width || x < r.left - 4 || x > r.right + 4 || Math.max(y, py) < r.top - 40 || Math.min(y, py) > r.bottom + 40) { if (s.grab) { const p = s.feel(0, 0, 0, 0, kind, true); if (p) plucked++; } continue; }
      const hit = s.feel(x - r.left, y - r.top, px - r.left, py - r.top, kind, release);
      if (hit) {
        plucked++;
        if (s.where === "hero") { play("throwPhrase", r.left + hit.x, r.top + s.cy, hit.s, "hero"); hideNudge(); }
        track("tz_pluck", { where: s.where }, s.where);
        emit("pluck", s);
      }
    }
  }

  /* -- the pointer */
  doc.addEventListener("pointermove", (e) => {
    const n = performance.now(), dt = Math.max(8, n - pointer.t);
    pointer.vx = (e.clientX - pointer.x) / dt * 1000; pointer.vy = (e.clientY - pointer.y) / dt * 1000;
    pointer.px = pointer.x; pointer.py = pointer.y;
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = n; pointer.type = e.pointerType; pointer.moved = n;
    idleSince = n;
    if (e.pointerType === "mouse" && fine()) {
      feelStrings(pointer.x, pointer.y, pointer.px, pointer.py, "mouse");
      pillsPointer(e);
      trail(e.clientX, e.clientY, n);
      blipLook();
    } else if (pointer.down) feelStrings(pointer.x, pointer.y, pointer.px, pointer.py, "touch");
  }, { passive: true });
  doc.addEventListener("pointerdown", (e) => { pointer.down = true; pointer.x = pointer.px = e.clientX; pointer.y = pointer.py = e.clientY; pointer.type = e.pointerType; idleSince = performance.now(); }, { passive: true });
  doc.addEventListener("pointerup", () => { pointer.down = false; feelStrings(pointer.x, pointer.y, pointer.x, pointer.y, pointer.type, true); }, { passive: true });
  // a finger across a thread (touchmove comes while the page scrolls)
  let tPrev = null;
  doc.addEventListener("touchmove", (e) => {
    const t = e.touches && e.touches[0]; if (!t) return;
    if (tPrev) feelStrings(t.clientX, t.clientY, tPrev[0], tPrev[1], "touch");
    tPrev = [t.clientX, t.clientY];
  }, { passive: true });
  doc.addEventListener("touchend", () => { tPrev = null; }, { passive: true });
  doc.addEventListener("pointerleave", () => { pointer.x = pointer.y = -1e4; blipLook(); });

  /* -- W8: the dotted trail */
  const trailPts = [];
  let trailOn = false;
  function trail(x, y, n) {
    if (TZ.calm || TZ.star || !fine()) return;
    const l = trailPts[trailPts.length - 1];
    if (l && Math.hypot(l.x - x, l.y - y) < 9) return;
    trailPts.push({ x, y, t: n, c: toneAt(y) === "light" ? INK : CREAM });
    while (trailPts.length > 40) trailPts.shift();
    if (!trailOn) { trailOn = true; addLayer(drawTrail); }
  }
  function drawTrail(g) {
    const n = performance.now();
    while (trailPts.length && n - trailPts[0].t > 520) trailPts.shift();
    for (const p of trailPts) {
      const a = 1 - (n - p.t) / 520;
      g.fillStyle = "rgba(" + p.c + "," + (.5 * a).toFixed(3) + ")";
      g.beginPath(); g.arc(p.x, p.y, 1.6 * (.5 + .5 * a), 0, 6.283); g.fill();
    }
    trailOn = trailPts.length > 0;
    return trailOn;
  }
  /** The ground under a viewport y: light (cream) or dark. */
  function toneAt(y) {
    const els = $$(":scope > section:not([hidden])", main).concat([doc.querySelector("footer")]);
    for (const s of els) { const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) return s.getAttribute("data-tone") || "dark"; }
    return "dark";
  }
  TZ.toneAt = toneAt;

  /* -- Blip, on its perches */
  const blipCv = $("blip"), bctx = blipCv.getContext("2d"), blipHit = $("blipHit");
  let B = null, perch = null, perchOverride = null, blipH = 92, blipPos = { x: -999, y: -999 }, blipShownAt = 0, blipMoodT = 0;
  let blipPose = "hidden", blipBurstUntil = 0, idleSince = performance.now(), blipLookAt = null, blipPointAt = null, attendEl = null;
  const PERCH_H = () => (mqPhone.matches ? 80 : 128);
  function ensureBlip() {
    if (B || !TB) return B;
    B = TB.createBlip({ height: PERCH_H() });
    B.still(TZ.calm); B.pose("hidden");
    TZ.blip.inst = B;
    return B;
  }
  /** Blip's perches {x, y, h} in page px; the sections' come with js/play.js. */
  const ANCHORS = {
    hero: (h, R, sx, sy) => {
      const tn = lineWrote.lastChild && lineWrote.lastChild.nodeType === 1 ? lineWrote.lastChild : lineWrote;
      const rg = doc.createRange(); rg.selectNodeContents(tn);
      const rects = rg.getClientRects(), r = rects.length ? rects[rects.length - 1] : R(lineWrote);
      const fs = parseFloat(getComputedStyle(lineWrote).fontSize);
      return { x: Math.min(r.right + h * .46, innerWidth - h * .7) + sx, y: r.bottom - fs * .24 + sy, h };
    },
    edge: (h, R, sx, sy) => ({ x: Math.max(80, innerWidth * .12) + sx, y: innerHeight + sy, h }),
  };
  function anchorOf(name) {
    if (perchOverride && perchOverride.name === name) return perchOverride.at();
    return ANCHORS[name] ? ANCHORS[name](PERCH_H(), (e) => e && e.getBoundingClientRect(), scrollX, scrollY) : null;
  }
  // what Blip must never sit on: the hero's words, the finale's labels, a reading line
  const KEEP_CLEAR = "#lineSaid .w, #lineWrote .w, #lineNote, #again, #listen, #appsTitle, #appsLede, a.pill:not(#footPill), .stage .msg, .segs i.on, #finale .pl, #finaleNoLab, #finaleFine, .bead .bl.a, #secretLine, .knot-note";
  function clearOf(a) {
    // Blip's visible part in its peek: about half its height above the perch, a little under a third either side;
    // a word's box counts by its ink (a quarter of its line box off the top and the bottom)
    const h = a.h, vis = h * .74, half = h * .32, top0 = a.y - scrollY - vis;
    const rs = $$(KEEP_CLEAR).map((e) => { const r = e.getBoundingClientRect(), k = e.matches("a, button, .msg, .segs i") ? 0 : r.height * .22; return { left: r.left, right: r.right, top: r.top + k, bottom: r.bottom - k, width: r.width }; })
      .filter((r) => r.width && r.bottom > top0 - 110 && r.top < a.y - scrollY + 60);
    if (!rs.length) return a;
    const hits = (x, y) => rs.some((r) => x + half > r.left && x - half < r.right && y > r.top && y - vis < r.bottom);
    const x0 = a.x - scrollX, y0 = a.y - scrollY;
    if (!hits(x0, y0)) return a;
    // the nearest clear spot: along the line first, then a little up or down
    let best = null, bd = 1e9;
    for (let dy = -96; dy <= 48; dy += 12) for (let dx = -240; dx <= 240; dx += 12) {
      const x = x0 + dx, y = y0 + dy, d = Math.abs(dx) + Math.abs(dy) * 1.6;
      if (d >= bd || x - half < 6 || x + half > innerWidth - 6 || y - vis < 60 || hits(x, y)) continue;
      bd = d; best = [x, y];
    }
    if (!best) return a;
    const x = best[0], y = best[1];
    return { x: x + scrollX, y: y + scrollY, h };
  }
  function blipPlace(a) {
    if (!a || !B) return;
    a = clearOf(a);
    const h = Math.round(a.h);
    if (h !== blipH) { blipH = h; B.size(h); }
    const dpr = dprCap(), w = Math.ceil(h * 1.5), ht = Math.ceil(h * .78);
    if (blipCv._w !== w || blipCv._h !== ht || blipCv._d !== dpr) {
      blipCv._w = w; blipCv._h = ht; blipCv._d = dpr;
      blipCv.width = Math.round(w * dpr); blipCv.height = Math.round(ht * dpr);
      blipCv.style.setProperty("width", w + "px"); blipCv.style.setProperty("height", ht + "px");
    }
    // never past the page's edges: a perch off to the side (a reel card scrolled out of view) would
    // hide Blip and widen the page, and on phones a wider page stretches the fixed foot pill
    const x = clamp(a.x, scrollX + w / 2, scrollX + (root.clientWidth || innerWidth) - w / 2);
    blipPos = { x, y: a.y };
    blipCv.style.setProperty("transform", "translate(" + (x - w / 2).toFixed(1) + "px," + (a.y - ht + 2).toFixed(1) + "px)");
    // the tap area is Blip's body, scaled with it: a fixed 56x44 box under a 52 px phone Blip
    // reached below its perch, over the finale's halves, a bead or the tone slider
    const hw = Math.max(32, Math.round(h * .61)), hh = Math.max(24, Math.round(h * .48));
    blipHit.style.setProperty("width", hw + "px"); blipHit.style.setProperty("height", hh + "px");
    blipHit.style.setProperty("transform", "translate(" + (x - hw / 2).toFixed(1) + "px," + (a.y - h * .62).toFixed(1) + "px)");
    if (bubbleOn) placeBubble();
  }
  function blipDraw(t) {
    if (!B) return false;
    const w = blipCv._w || 1, h = blipCv._h || 1, dpr = blipCv._d || 1;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, w, h);
    // its eye: the pointer (fine), or what it attends to
    const look = blipLookAt || (pointer.x > -1e3 && fine() ? [pointer.x + scrollX, pointer.y + scrollY] : null);
    B.lookAt(look ? [look[0] - (blipPos.x - w / 2), look[1] - (blipPos.y - h + 2)] : null);
    B.pointAt(blipPointAt ? [blipPointAt[0] - (blipPos.x - w / 2), blipPointAt[1] - (blipPos.y - h + 2)] : null);
    B.draw(bctx, w / 2, h - 2, TZ.calm ? 0 : t, dpr);
    const shown = B.shown();
    blipCv.classList.toggle("on", true);
    blipHit.classList.toggle("on", shown);
    return shown;
  }
  function settled() {
    if (!B) return true;
    const s = B.state(), g = TB.POSES[s.pose];
    return Object.keys(g).every((k) => Math.abs(g[k] - s[k]) < .006);
  }
  let blipRunning = false;
  function blipJob(t) {
    const n = performance.now();
    blipDraw(t);
    const moving = !settled() || n < blipBurstUntil || n - pointer.moved < 250 || B.state().pose === "done" || n - blipShownAt < 400;
    if (TZ.calm && settled()) { blipRunning = false; return false; }
    blipRunning = moving;
    return moving;
  }
  function blipWake(ms) { if (!B) return; blipBurstUntil = Math.max(blipBurstUntil, performance.now() + (ms || 0)); sched.add(blipJob); }
  function blipLook() { if (B && B.shown() && fine()) blipWake(0); }
  /** A pose for a while, then back to its perch's own. */
  function blipMood(p, ms) {
    if (!ensureBlip() || !perch) return;
    if (!B.shown() && p !== "hidden" && perch !== "hero" && perch !== "free") return;
    B.pose(p); if (TZ.calm) B.snap();
    clearTimeout(blipMoodT);
    if (ms) blipMoodT = setTimeout(() => { if (B) { B.pose(perchPose()); if (TZ.calm) B.snap(); blipWake(400); } }, ms);
    blipWake(400);
  }
  const perchPose = () => (perch === "footer" ? "done" : perch === "desk" && TZ.deskOpen ? "listening" : "peek");
  /** Move house: duck (200 ms), move, rise (330 ms). Only one Blip, ever. */
  let moveT = 0;
  function blipGo(name) {
    if (!ensureBlip()) return;
    if (name === perch && !perchOverride) { const a = anchorOf(name); if (a) blipPlace(a); blipWake(0); return; }
    perch = name;
    clearTimeout(moveT);
    if (!name || name === "ask") { B.pose("hidden"); if (TZ.calm) B.snap(); blipWake(300); return; }
    const go = () => {
      const a = anchorOf(name);
      if (!a) { B.pose("hidden"); blipWake(300); return; }
      blipPlace(a); B.pose(perchPose()); if (TZ.calm) B.snap();
      blipShownAt = performance.now(); blipWake(400);
      if (bubbleOn) blipHush();
      if (name === "footer" && !blipGo.bye) { blipGo.bye = true; setTimeout(() => blipSay(fine() ? get("blip.bye") : (get("blip.byeTouch") || get("blip.bye"))), 420); }
    };
    if (B.shown() && !TZ.calm) { B.pose("hidden"); blipWake(260); moveT = setTimeout(go, 210); } else go();
  }
  function blipRefresh() { if (perch) { const a = anchorOf(perch); if (a) blipPlace(a); blipWake(0); } }
  function blipAttend(a) {
    attendEl = a;
    if (!B || !B.shown()) return;
    if (a && !TZ.calm) {
      const r = a.getBoundingClientRect();
      if (r.top > innerHeight || r.bottom < 0 || Math.abs(r.top + scrollY - blipPos.y) > innerHeight * .8) return;
      blipPointAt = [r.left + scrollX + Math.min(r.width * .35, 120), r.top + scrollY + r.height / 2];
      blipLookAt = blipPointAt;
      B.pose("point");
    } else { blipPointAt = null; blipLookAt = null; B.pose(perchPose()); }
    blipWake(400);
  }
  // which perch: the section under the reading line
  function perchFor() {
    if (doc.querySelector("footer").getBoundingClientRect().top < innerHeight * .8) return "footer";
    const y = innerHeight * .45;
    const els = $$(":scope > section:not([hidden])", main).concat([doc.querySelector("footer")]);
    for (const s of els) { const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) return s.tagName === "FOOTER" ? "footer" : s.id; }
    return null;
  }
  let perchRaf = 0;
  function perchCheck() {
    perchRaf = 0;
    if (!B) return;
    let p = perchFor();
    if (p === "dev" || p === "llm") p = null;
    if (p !== perch) blipGo(p); else if (perchOverride || p === "questions") blipRefresh();
  }
  W.addEventListener("scroll", () => { idleSince = performance.now(); if (!perchRaf) perchRaf = requestAnimationFrame(perchCheck); }, { passive: true });
  doc.addEventListener("keydown", () => { idleSince = performance.now(); });
    let pokes = [], helloI = 0;
  blipHit.addEventListener("click", (e) => {
    if (!B || !B.shown()) return;
    const n = performance.now();
    pokes = pokes.filter((x) => n - x < 4000); pokes.push(n);
    if (pokes.length >= 5) { pokes = []; play("poke5", blipPos.x, blipPos.y - blipH * .3); return; }   // oops: it bursts and moves house (js/play.js)
    const H = get("blip.hello") || [];
    if (H.length) blipSay(H[helloI++ % H.length]);
    egg("hello");
    B.nod(); blipMood("confirm", 900);
  });
  // idle 25 s: it peeks from the edge of the screen; tab back: it wakes
  let idleT = 0;
  function idleCheck() {
    clearTimeout(idleT);
    idleT = setTimeout(() => {
      if (!B || TZ.calm || doc.hidden || perch === "edge") return idleCheck();
      if (performance.now() - idleSince > 24000 && perch && perch !== "hero") {
        const back = perch;
        perchOverride = { name: back, at: () => anchorOf("edge") };
        blipGo(back);
        const wake = () => { doc.removeEventListener("pointermove", wake); doc.removeEventListener("keydown", wake); W.removeEventListener("scroll", wake); perchOverride = null; perch = null; blipGo(back); };
        doc.addEventListener("pointermove", wake, { passive: true }); doc.addEventListener("keydown", wake); W.addEventListener("scroll", wake, { passive: true });
      }
      idleCheck();
    }, 5000);
  }
  doc.addEventListener("visibilitychange", () => {
    if (doc.hidden || !B || !B.shown()) return;
    B.pose("thinking"); if (TZ.calm) B.snap(); blipWake(600);
    setTimeout(() => { if (B) { B.pose(perchPose()); blipWake(500); } }, 700);
  });
  // a blink: a 200 ms burst on blip.js's blink clock
  let blinkT = 0;
  function blinkLoop() {
    clearTimeout(blinkT);
    const n = performance.now() / 1000, next = Math.ceil((n * 1000 + 300 + 3700 * (1 + Math.round(Math.random()))) / 3700) * 3.7 - .3;
    blinkT = setTimeout(() => { if (B && B.shown() && !TZ.calm && !doc.hidden) blipWake(220); blinkLoop(); }, Math.max(3000, (next - n) * 1000 - 60));
  }
  on("line", () => { if (perch === "hero") blipRefresh(); });
  TZ.blip = { el: blipCv, inst: null, go: blipGo, mood: blipMood, refresh: blipRefresh, attend: blipAttend, wake: blipWake, perchOverride: (o) => { perchOverride = o; blipRefresh(); }, setOverride: (o) => { perchOverride = o; }, perch: () => perch, anchorOf, anchors: ANCHORS };

  /* -- toasts, the live region */
  const toastEl = $("toast"), sayEl = $("say");
  let toastT = 0;
  function say(s) { sayEl.textContent = ""; setTimeout(() => { sayEl.textContent = s; }, 30); }
  function toast(s, tag, low) {
    if (!s) return;
    toastEl.classList.toggle("low", !!low);
    toastEl.textContent = "";
    if (tag) toastEl.appendChild(el("span", "tag", tag));
    toastEl.appendChild(doc.createTextNode(s));
    toastEl.classList.add("on");
    say(s);
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 2800);
  }
  TZ.toast = toast; TZ.say = say;

  /* -- Blip's own voice: a speech bubble at its head, on a three-dot tether (the guide's own),
     rising as it peeks, leaving on fold at 0.6x. The live region hears it too. Where Blip is
     not on screen, the line goes to the toast. */
  const bubble = $("blipSay"), bubbleText = bubble.querySelector("span"), tether = $("blipTether");
  let bubbleOn = false, bubbleT = 0;
  function blipVisible() {
    if (!B || !B.shown() || B.state().pose === "hidden") return false;
    const y = blipPos.y - scrollY;
    return y > 60 && y < innerHeight + 10 && blipPos.x - scrollX > 0 && blipPos.x - scrollX < innerWidth;
  }
  function placeBubble() {
    const h = blipH, head = { x: blipPos.x - scrollX, y: blipPos.y - scrollY - h * .58 };
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight, gap = 26;
    // what it may not cover; what was said (already dimmed, and written below) costs little to cover
    const obst = $$(KEEP_CLEAR + ", h1, h2, .lede, .pill, .said, .wrote, .qa p, .chip, .round, .ghost, main .lbl, .msg, .key, .keys").map((e) => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, w: e.closest(".said") ? .15 : 1 }; }).filter((r) => r.width && r.bottom > head.y - bh - 160 && r.top < head.y + h + bh);
    const fits = (x, y) => x > 8 && x + bw < innerWidth - 8 && y > 64 && !obst.some((r) => x < r.right + 4 && x + bw > r.left - 4 && y < r.bottom + 2 && y + bh > r.top - 2);
    const C = [[head.x + h * .18, head.y - bh - gap], [head.x - bw - h * .18, head.y - bh - gap], [head.x + h * .45, head.y - bh * .5], [head.x - bw - h * .45, head.y - bh * .5],
      [head.x - bw / 2, head.y - bh - gap * 1.6], [head.x - bw - h * .3, head.y + h * .62], [head.x + h * .3, head.y + h * .62], [head.x - bw / 2, head.y - bh - gap * 3]];
    // the first spot that covers nothing; else the one that covers least
    const cover = (x, y) => obst.reduce((t, r) => t + r.w * Math.max(0, Math.min(x + bw, r.right) - Math.max(x, r.left)) * Math.max(0, Math.min(y + bh, r.bottom) - Math.max(y, r.top)), 0) + (x < 8 || x + bw > innerWidth - 8 ? 1e6 : 0) + (y < 64 ? 1e6 : 0);
    let at = C.find(([x, y]) => fits(x, y));
    if (!at) at = C.slice().sort((p, q) => cover(p[0], p[1]) - cover(q[0], q[1]))[0];
    at = [clamp(at[0], 8, innerWidth - bw - 8), Math.max(64, at[1])];
    bubble.style.setProperty("transform", "translate(" + (at[0] + scrollX).toFixed(1) + "px," + (at[1] + scrollY).toFixed(1) + "px)");
    // the tether: three dots from the bubble's near corner to Blip's head
    const ax = at[0] + (at[0] + bw / 2 < head.x ? bw - 18 : 18), ay = at[1] + (at[1] + bh / 2 < head.y ? bh : 0);
    const dx = head.x - ax, dy = head.y - ay, len = Math.max(6, Math.hypot(dx, dy) - 10);
    tether.style.setProperty("width", len.toFixed(1) + "px");
    tether.style.setProperty("transform", "translate(" + (ax + scrollX).toFixed(1) + "px," + (ay + scrollY).toFixed(1) + "px) rotate(" + Math.atan2(dy, dx).toFixed(3) + "rad)");
  }
  function blipSay(s, ms) {
    if (!s) return;
    if (!blipVisible()) { toast(s); return; }
    clearTimeout(bubbleT);
    const tone = toneAt(blipPos.y - scrollY - blipH);
    bubble.classList.toggle("light", tone === "light"); tether.classList.toggle("light", tone === "light");
    bubbleText.textContent = s;
    bubble.classList.remove("on"); tether.classList.remove("on");
    void bubble.offsetWidth;
    bubbleOn = true; placeBubble();
    bubble.classList.add("on"); tether.classList.add("on");
    say(s);
    if (B) { B.nod(); blipWake(400); }
    bubbleT = setTimeout(blipHush, ms || Math.max(2600, 900 + s.length * 55));
  }
  function blipHush() { clearTimeout(bubbleT); bubbleOn = false; bubble.classList.remove("on"); tether.classList.remove("on"); }
  TZ.blipSay = blipSay;
  W.addEventListener("scroll", () => { if (bubbleOn && !blipVisible()) blipHush(); else if (bubbleOn) placeBubble(); }, { passive: true });
  // the phone's hint at the foot of the screen is about the hero's thread: it goes once the visitor scrolls on
  W.addEventListener("scroll", () => { if (scrollY > 60 && toastEl.classList.contains("low") && toastEl.classList.contains("on")) { clearTimeout(toastT); toastEl.classList.remove("on"); } }, { passive: true });

  /* -- W7: typing at the page (the eggs: js/play.js) */
  doc.addEventListener("keydown", (e) => {
    keysDown(e);
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || e.key.length !== 1 || e.key === " ") return;
    const tg = e.target; if (tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))) return;
    if (doc.activeElement && doc.activeElement !== doc.body && doc.activeElement !== root) return;
    play("typeLetter", e.key);
  });
  // W4: "type." crumbles on hover (a tap on touch); js/play.js draws it
  function setupCrumble() {
    const h1 = $("appsTitle"), onKw = (e) => e.target.closest && e.target.closest(".kw");
    // a hover that means it: 350 ms on the word, and never in the page's first 4 s (a cursor resting
    // there while the visitor reads must not blank the headline)
    let intent = 0;
    h1.addEventListener("pointerover", (e) => {
      if (e.pointerType !== "mouse" || !fine() || !onKw(e) || intent) return;
      intent = setTimeout(() => { intent = 0; const k = h1.querySelector(".kw"); if (k && k.matches(":hover") && performance.now() > 4000) play("crumble"); }, 350);
    });
    h1.addEventListener("pointerout", (e) => {
      if (e.pointerType !== "mouse" || !fine() || !onKw(e) || (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".kw"))) return;
      clearTimeout(intent); intent = 0; play("kwOut");
    });
    h1.addEventListener("click", (e) => { if (onKw(e) && !fine()) play("kwTap"); });
  }

  /* -- W5: Ctrl twice, anywhere */
  let ctrlUp = 0, ctrlClean = false, altUp = 0, altClean = false;
  function keysDown(e) {
    if (e.key === "Escape") { emit("escape"); return; }
    if (e.key === "Control") { if (!e.repeat) ctrlClean = true; } else ctrlClean = false;
    if (e.key === "Alt") { if (!e.repeat) altClean = true; } else altClean = false;
  }
  doc.addEventListener("keyup", (e) => {
    const tg = e.target, inField = tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName));
    const n = performance.now();
    if (e.key === "Control") {
      if (ctrlClean && !inField) { if (n - ctrlUp < 400) { ctrlUp = 0; tapKeys($("chord")); ctrlTwice("keys"); } else ctrlUp = n; }
      ctrlClean = false;
    }
    if (e.key === "Alt") {
      if (altClean && !inField && (site.ask === "soon" || site.ask === "live")) { if (n - altUp < 400) { altUp = 0; emit("alt2"); egg("alt2"); } else altUp = n; }
      altClean = false;
    }
  });
  function tapKeys(b) {
    if (!b) return;
    const ks = $$("kbd", b);
    ks.forEach((k, i) => setTimeout(() => { k.classList.add("down"); setTimeout(() => k.classList.remove("down"), 110); }, i * 130));
  }
  /** Ctrl twice: in #desk its stage's pill; elsewhere the app's pill at the screen's foot. */
  function ctrlTwice(how) {
    track("tz_pill_try", { how });
    const desk = $("deskStage"), r = desk && desk.getBoundingClientRect();
    if (r && r.top < innerHeight * .75 && r.bottom > innerHeight * .25 && TZ.deskTry) { TZ.deskTry(how); return; }
    play("openInstrument");
  }
  TZ.ctrlTwice = ctrlTwice;
  // the app's pill, framed (demo/pill.html)
  function pillFrame(host, cls) {
    const f = doc.createElement("iframe");
    f.src = lazyUrl("/demo/pill.html") + (TZ.calm ? (lazyUrl("/demo/pill.html").indexOf("?") >= 0 ? "&" : "?") + "calm=1" : "");
    f.title = "The Tailzu pill"; f.setAttribute("aria-hidden", "true"); f.tabIndex = -1; if (cls) f.className = cls;
    host.appendChild(f);
    const ready = new Promise((res) => { f.addEventListener("load", () => res(f), { once: true }); setTimeout(() => res(f), 4000); });
    return { f, ready };
  }
  TZ.pillFrame = pillFrame;
  const tell = (f, m) => { try { f.contentWindow.postMessage(m, location.origin); } catch (e) { /* none */ } };
  TZ.tellPill = tell;
  W.addEventListener("message", (e) => { if (e.origin === location.origin && e.data && typeof e.data === "object") emit("frame", e); });

  /* -- entrances, the spine */
  function setupEnter() {
    if (TZ.calm || !("IntersectionObserver" in W)) return;
    const near = new IntersectionObserver((es) => es.forEach((en) => {
      const e = en.target;
      if (!en.isIntersecting || e._entered) return;
      const r = en.boundingClientRect;
      if (r.top > innerHeight) { e.classList.add("pre"); seen.observe(e); }
      near.unobserve(e);
    }), { rootMargin: "0px 0px 30% 0px" });
    const seen = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      const e = en.target; e._entered = true; seen.unobserve(e);
      requestAnimationFrame(() => { e.classList.remove("pre"); e.classList.add("in"); });
    }), { threshold: .15 });
    $$("[data-enter]").forEach((e) => { const r = e.getBoundingClientRect(); if (r.top > innerHeight) near.observe(e); });
  }
  /* THE SPINE: each band's --fill (px read so far), knot-beads that double as a nav, and the seams'
     colour above. It reads the scroll, never sets it. */
  const GROUND = { "on-cream": "var(--white)", "on-violet": "var(--field-lo)", "on-ink": "var(--ink)", "on-indigo": "var(--indigo-deep)" };
  const SPINE = { how: "How it works", river: "Languages", apps: "Every app", films: "Films", tone: "Tone", desk: "Desktop", llm: "AI", dev: "Code", ask: "Ask", questions: "Questions", free: "Free" };
  let bandsNow = [], spineTaut = false;
  function setupSpine() {
    const names = Object.assign({}, SPINE, get("ui.spine") || {});
    bandsNow = $$(":scope > section.band:not([hidden])", main);
    let prev = "var(--field-lo)", n = 0;
    $$(":scope > section", main).forEach((s) => {
      if (s.hidden) return;
      if (s.id !== "hero") {
        s.style.setProperty("--prev", prev);
        n++;
        let b = s.querySelector(":scope > a.sp");
        if (!b) { b = el("a", "sp"); b.appendChild(el("i")); b.appendChild(el("b")); b.setAttribute("aria-hidden", "true"); b.tabIndex = -1; s.insertBefore(b, s.firstChild); }
        b.href = "#" + s.id;
        setText(b.querySelector("b"), (n < 10 ? "0" : "") + n + " · " + (names[s.id] || s.id));
      }
      const g = Object.keys(GROUND).find((c) => s.classList.contains(c));
      prev = g ? GROUND[g] : "var(--field-lo)";
    });
    spineFill();
  }
  let fillRaf = 0;
  function spineFill() {
    fillRaf = 0;
    if (spineTaut) return;
    const read = innerHeight * .62;
    bandsNow.forEach((s) => {
      const r = s.getBoundingClientRect(), f = clamp(read - r.top, 0, r.height);
      if (s._fill !== Math.round(f)) { s._fill = Math.round(f); s.style.setProperty("--fill", s._fill + "px"); }
      const b = s._sp || (s._sp = s.querySelector(":scope > a.sp")); if (b) b.classList.toggle("lit", f > 52);
    });
  }
  W.addEventListener("scroll", () => { if (!fillRaf) fillRaf = requestAnimationFrame(spineFill); }, { passive: true });
  on("layout", setupSpine);
  /** The knot: the whole thread draws taut (every band full, 420 ms), then lets the scroll unwind it. */
  TZ.spineTaut = (ms) => {
    spineTaut = true; root.classList.add("taut");
    bandsNow.forEach((s) => { s._fill = Math.round(s.offsetHeight); s.style.setProperty("--fill", s._fill + "px"); });
    setTimeout(() => { root.classList.remove("taut"); spineTaut = false; }, ms || 900);
  };
  // the thread runs on, off the hero: the spine's start
  function layoutHero() {
    const lr = line.getBoundingClientRect(), tr = lineThread.getBoundingClientRect(), hr = $("hero").getBoundingClientRect();
    const y = tr.top - lr.top + tr.height / 2;
    line.style.setProperty("--bead-y", y.toFixed(1) + "px");
    $("hero").style.setProperty("--drop-top", (tr.top - hr.top + tr.height / 2 + 22).toFixed(1) + "px");
    if (heroStr) heroStr.layout();
    pills.forEach((p) => p.measure());
    placeMarks();
  }

  /* -- the nudge, the first teach */
  const nudge = $("nudge");
  function hideNudge() { nudge.classList.remove("on"); }
  function placeNudge() {
    let shown = false; try { shown = sessionStorage.getItem("tz.nudge") === "1"; } catch (e) { /* none */ }
    if (shown || plucked || TZ.calm || lineBusy || $("hero").getBoundingClientRect().bottom < innerHeight * .5) return;
    try { sessionStorage.setItem("tz.nudge", "1"); } catch (e) { /* none */ }
    const tr = lineThread.getBoundingClientRect(), hr = $("hero").getBoundingClientRect(), lr = line.getBoundingClientRect();
    const touch = !fine();
    if (heroStr) heroStr.pluck(.7);
    setText(nudge.firstChild, touch ? (get("blip.hintTouch") || get("blip.hint")) : get("blip.hint"));
    const rg = doc.createRange(); rg.selectNodeContents(lineSaid); const rs = rg.getClientRects(), first = rs[0], last = rs[rs.length - 1];
    if (!last) return;
    let x, y;
    if (touch) {
      // phones: in the said line's spare row, above it (never a toast over the lede or the button)
      const room = first.top - lr.top;
      if (room < 24) return;
      x = first.left - hr.left; y = first.top - hr.top - 30;
    } else {
      // after the said line, short of the bead's labels; where it fits nowhere, the thread's wave is the invitation
      x = last.right - hr.left + 28; y = tr.top - hr.top - 40;
      const bl = $$(".bead .bl.a", line).map((e) => e.getBoundingClientRect()).filter((r) => r.width);
      const stop = bl.length && !$("listenBead").hidden ? Math.min.apply(null, bl.map((r) => r.left)) - hr.left - 24 : hr.width - 40;
      if (x + 230 > stop) return;
    }
    nudge.style.setProperty("left", Math.round(x) + "px");
    nudge.style.setProperty("top", Math.round(y) + "px");
    nudge.classList.add("on");
    setTimeout(hideNudge, 7000);
  }
  /** The empty room by the hero's thread, for what a pluck or a typed letter throws: right of the said
   *  line's last glyph, short of the bead's labels. Null when it is under 200 px wide. */
  function heroRoom() {
    const tr = lineThread.getBoundingClientRect();
    const rg = doc.createRange(); rg.selectNodeContents(lineSaid); const rs = rg.getClientRects(), last = rs[rs.length - 1];
    const x0 = (last ? last.right : tr.left) + 24;
    const bl = $$(".bead .bl.a", line).map((e) => e.getBoundingClientRect()).filter((r) => r.width && !$("listenBead").hidden && !$("listenBead").classList.contains("tight"));
    const x1 = Math.min(tr.right - 20, innerWidth - 20, bl.length ? Math.min.apply(null, bl.map((r) => r.left)) - 24 : 1e9);
    return x1 - x0 >= 200 ? { x0, x1, y: tr.top + tr.height / 2 } : null;
  }
  TZ.heroRoom = heroRoom;
  function teachSplit() {
    let shown = false; try { shown = sessionStorage.getItem("tz.teach") === "1"; sessionStorage.setItem("tz.teach", "1"); } catch (e) { /* none */ }
    const p = $("heroPill")._pill;
    if (shown || fine() || TZ.calm || !p) return;
    p.teach = true; p.wake();
    setTimeout(() => { p.teach = false; p.thread.pluck(1, { amp: 6 }); p.wake(); }, 600 + 900);
  }

  /* -- lazy files */
  const scripts = {};
  function loadScript(src) {
    if (scripts[src]) return scripts[src];
    return (scripts[src] = new Promise((res, rej) => { const s = doc.createElement("script"); s.src = src; s.async = true; s.onload = res; s.onerror = rej; doc.head.appendChild(s); }));
  }
  TZ.loadScript = loadScript;
  let sectionsAsked = false;
  function loadSections() { if (sectionsAsked) return; sectionsAsked = true; loadScript(lazyUrl("/js/sections.js")).catch(() => { sectionsAsked = false; }); }
  TZ.loadMic = () => loadScript(lazyUrl("/js/mic.js")).then(() => TZ.mic);
  // js/play.js: a call waits for it (in order), then runs
  let playAsked = null;
  const loadPlay = () => playAsked || (playAsked = loadScript(lazyUrl("/js/play.js")).catch(() => { playAsked = null; }));
  function play(name, ...args) { loadPlay().then(() => { if (typeof TZ[name] === "function") TZ[name](...args); }); }
  TZ.lazyUrl = lazyUrl;

  /* -- the listen bead (W3), delegated to mic.js */
  const hasMic = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  function setupListen() {
    if (hasMic) $("listen").addEventListener("click", () => TZ.loadMic().then((m) => m && m.toggleThread()));
    listenUi();
  }
  /** demo off: level only, where a pointer reaches the thread's end. demo:true: it records
   *  and sends (phones too), and says so before any press. */
  function listenUi() {
    root.classList.toggle("demo", !!site.demo);
    $("listenBead").hidden = !hasMic || !(site.demo || fine());
    if (TZ.micBusy && TZ.micBusy()) return;
    setText("listenOpen", site.demo ? get("hero.invite") : get("listen.open"));
    setText("listenNote", site.demo ? "" : get("listen.note"));
  }

  /* -- the payload */
  function takePayload(j) {
    if (!j || typeof j !== "object") return;
    if (j.copy) mergeInto(C, j.copy);
    applyShape(j);
    setupSpine();
    if (j.downloads && typeof j.downloads === "object") site.downloads = j.downloads;
    if (typeof j.demo === "boolean") site.demo = j.demo || forceDemo;
    ["maxSeconds", "perMinute", "freeWords"].forEach((k) => { if (typeof j[k] === "number") site[k] = j[k]; });
    site.ask = j.ask === "soon" || j.ask === "live" ? j.ask : "off";
    if (j.mic && j.mic.mark && j.mic.program) site.mic = j.mic;
    paintAll(); route(); layoutHero();
    emit("site", j);
    perchCheck();
  }

  /* -- go */
  function boot() {
    applyCalm();
    sizeFx();
    $("calm").addEventListener("click", () => {
      userCalm = !TZ.calm;
      try { localStorage.setItem("tz.calm", userCalm ? "1" : "0"); } catch (e) { /* none */ }
      applyCalm(); track("tz_calm", { on: userCalm });
    });
    on("calm", (c) => {
      if (B) { B.still(c); if (c) B.snap(); blipWake(300); }
      if (c) { if (heroFilm) heroFilm.pause(); strings.forEach((s) => { s.grab = null; s.ys && s.ys.fill(0); s.draw(true); }); trailPts.length = 0; }
      // the line shows its end state, whatever it was showing (a line, the instrument's, the visitor's own)
      if (!lineBusy && lastLine) endState(lastLine);
      else heroFilmGo();
      pills.forEach((p) => p.wake());
    });
    $$("a.pill").forEach((a) => pills.push(new Pill(a)));
    paintAll();
    route();
    // the hero's line
    heroStr = addString(lineThread, "hero", { max: 26 });
    $("again").addEventListener("click", againPress);
    $("chord").addEventListener("click", () => { tapKeys($("chord")); ctrlTwice("button"); });
    setupCrumble();
    setupListen();
    doc.addEventListener("visibilitychange", () => $$("video").forEach((v) => { if (doc.hidden) { if (!v.paused) { v._resume = true; v.pause(); } } else if (v._resume) { v._resume = false; const p = v.play(); if (p && p.catch) p.catch(() => {}); } }));
    setupEnter();
    setupSpine();
    layoutHero();
    tuneMast();
    // the sticky pills' rules
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.target.id === "heroPill") heroPillSeen = en.isIntersecting;
      else if (en.target.tagName === "FOOTER") footerSeen = en.isIntersecting;
      else { en.target._seen = en.intersectionRatio >= .4; othersSeen = ["appsStores", "deskPills", "deskStage", "deskShare", "finaleYes", site.ask === "soon" || site.ask === "live" ? "askStage" : ""].filter((id) => id && $(id) && $(id)._seen).length; }
      const pl = en.target.dataset && (en.target.dataset.place || ((en.target.querySelector && en.target.querySelector("[data-place]")) || { dataset: {} }).dataset.place);
      if (pl && en.target.tagName !== "FOOTER" && en.intersectionRatio >= .5) track("tz_cta_view", { place: pl }, pl);
      sticky();
    }), { threshold: [0, .4, .5] });
    ["heroPill", "appsStores", "deskPills", "deskStage", "deskShare", "finaleYes", "askStage"].forEach((id) => $(id) && io.observe($(id)));
    io.observe(doc.querySelector("footer"));
    // tz_scroll: the depth
    const depth = new IntersectionObserver((es) => es.forEach((en) => { if (en.intersectionRatio >= .5 || (en.isIntersecting && en.intersectionRect.height > innerHeight * .5)) track("tz_scroll", { section: en.target.id }, en.target.id); }), { threshold: [.5, .8] });
    $$(":scope > section[id]", main).forEach((s) => depth.observe(s));
    // the hero: in view or not
    new IntersectionObserver((es) => { heroIn = es[0].isIntersecting; if (heroIn) heroFilmGo(); else if (heroFilm && !heroFilm.paused) heroFilm.pause(); }, { threshold: 0 }).observe($("hero"));
    // the lazy files: #how a screen away, or idle after load
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { loadSections(); loadPlay(); o.disconnect(); } }, { rootMargin: "100% 0px 100% 0px" }).observe($("how"));
    W.addEventListener("resize", () => { spineFill(); sizeFx(); layoutHero(); refitTags(); strings.forEach((s) => s.layout()); tuneMast(); mastRoom(); blipRefresh(); emit("resize"); }, { passive: true });
    if (W.ResizeObserver) new ResizeObserver(() => { layoutHero(); blipRefresh(); }).observe(line);
    // the words, from the backend
    fetch(API + "/v1/site", { credentials: "omit" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then(takePayload).catch(() => { /* the fallbacks are the page */ });
    // the first line: said and written, once the fonts are in
    // the first line starts now (the said words write on while the fonts arrive; the pour waits for them, briefly)
    const L0 = heroLines();
    lineIdx = 0;
    requestAnimationFrame(() => runLine(L0[0]).then(() => { firstDone = true; return sleep(2200); }).then(autoSecond).then(() => sleep(1200)).then(placeNudge));
    const fontsIn = doc.fonts && doc.fonts.ready ? Promise.race([doc.fonts.ready, sleep(1200)]) : Promise.resolve();
    fontsIn.then(() => {
      layoutHero(); refitTags(); strings.forEach((s) => s.layout());
      ensureBlip();
      blipGo(perchFor() || "hero");
      blinkLoop(); idleCheck();
      setTimeout(teachSplit, 2900);
    });
    W.addEventListener("load", () => {
      const idle = W.requestIdleCallback || ((f) => setTimeout(f, 1200));
      pageLoaded = true;
      idle(() => { heroFilmGo(); loadSections(); loadPlay(); }, { timeout: 3000 });
    });
    root.classList.add("tz-ok");
  }
  Object.assign(TZ, {
    C, site, consent, track, route, pour, sched, motion: MOTION, springStep, on, emit, egg, fine, mqPhone, OS, MOBILE, hrefFor, labelFor,
    get, setText, fill, paintTitle, el, $, $$, clamp, smooth, rnd, sleep, addLayer, pointer, toneAt, runLine: (L, o) => runLine(L, o),
    lineBusy: () => lineBusy, heroStr: () => heroStr, saveData, lowEnd, CREAM, INK, AMBER, isInstaller, glide, settleEase,
    strings, SCRIPTS, BAYER, paintAll, paintList, PERCH_H, play, loadPlay,
  });
  if (!PS || !TB) { route(); paintAll(); return; }   // the app's two files did not load: the page still routes
  boot();
})();
