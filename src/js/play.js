/* tailzu.space, what plays after the first screen (lazy: loaded on idle
 * after load, when #how comes within a screen, or the first time one of
 * these is asked for). Uses only window.TZ (js/site.js).
 *
 *   the films  below the hero: in view they play, muted; the reel plays the
 *              card nearest its middle; "Sound" swaps in the voiced cut
 *   W2         a plucked thread throws off a real spoken phrase
 *   W4         "type." crumbles into keys and dust, and back
 *   W5         Ctrl twice: the app's real pill at the foot of the screen
 *   W7         typing at the page: letters crumble into the nearest thread
 *   W17, W18   copy a line; the mark's dots scatter
 *   the dust   motes that fly to a thread (W4, W7, the comb)
 */
(function () {
  "use strict";
  const TZ = window.TZ;
  if (!TZ || TZ.playUp) return;
  TZ.playUp = true;
  const { $, $$, get, setText, el, clamp, rnd, smooth, sleep, track, egg, toast, sched, on, emit, addLayer, toneAt, pointer, mqPhone, CREAM, INK } = TZ;
  const doc = document, BL = TZ.blip, C = TZ.C;

  /* ---------------------------------------------------------------- the words below the hero (from /v1/site; the HTML holds the same) */
  const TEXTS = [
    ["deskTryLine", "desk.try"], ["reelNote", "ui.android"], ["capTyped", "hero.typed"], ["capTaps", "hero.taps"], ["capSaid", "hero.said"], ["capPress", "hero.press"], ["stTyped", "hero.typed"], ["stTaps", "hero.taps"], ["stSaid", "hero.said"], ["stPress", "hero.press"], ["deskShareLab", "desk.share"], ["deskOther", "download.other"], ["phonePrivacy", "phone.privacy"],
    ["combKey", "comb.key"], ["riverLede", "river.lede"], ["riverMix", "river.mix"], ["riverFind", "river.find"],
    ["phoneLede", "phone.lede"], ["sabLabel", "phone.saboteur.label"], ["sabSay", "phone.saboteur.say"], ["sabAfter", "phone.saboteur.after"],
    ["filmsLede", "films.lede"], ["racePrompt", "race.prompt"], ["raceLine", "race.line"], ["raceYou", "race.you"], ["raceSaid", "race.said"],
    ["toneLede", "tone.lede"], ["toneMore", "tone.more"],
    ["deskLede", "desk.lede"], ["deskStageLbl", "desk.stage"], ["deskNotesLede", "desk.notes"], ["deskKept", "desk.kept"], ["deskPoint", "desk.point"],
    ["deskCredit", "desk.credit"], ["credit", "desk.credit"], ["deskListenLab", "listen.desk"],
    ["llmTitle", "llm.title"], ["llmLede", "llm.lede"], ["llmNote", "llm.note"], ["llmMore", "llm.more"], ["llmTag", "llm.tag"],
    ["devTitle", "dev.title"], ["devLede", "dev.lede"], ["devFile", "dev.file"], ["devApp", "dev.app"],
    ["faqTitle", "faq.title"], ["freeSub", "download.free"], ["finaleNoLab", "free.no"], ["secretSayLab", "free.say"], ["secretType", "free.type"],
    ["secretNote", "listen.note"], ["knotNote", "blip.knot"], ["top", "ui.top"], ["made", "ui.made"],
  ];
  TZ.paintBelow = function () {
    const { fill, paintTitle, paintList } = TZ;
    TEXTS.forEach(([id, p]) => { const v = get(p); if (typeof v === "string") setText(id, v); });
    const T = (id, o) => { if (o) paintTitle($(id), o.title, o.human, false); };
    T("howTitle", C.how); T("riverTitle", C.river); T("phoneTitle", C.phone); T("filmsTitle", C.films); T("toneTitle", C.tone); T("deskTitle", C.desk); T("freeTitle", C.free);
    // the steps, the tones, the questions: the markup the sync writes
    if (C.how && Array.isArray(C.how.steps)) paintList($("steps"), C.how.steps, (s, i) => { const d = el("div", "step"); d.appendChild(el("p", "n", "0" + (i + 1))); d.appendChild(el("h3", null, fill(s.title))); return d; }, (s) => s.title);
    if (C.tone) {
      if (typeof C.tone.said === "string") setText("toneSaid", C.tone.said);
      if (Array.isArray(C.tone.tones)) paintList($("toneGrid"), C.tone.tones, (t, i) => { const d = el("div", "tcard t" + (i % 8)); d.appendChild(el("span", "tn", t.name)); d.appendChild(el("p", null, t.text)); return d; }, (t) => t.name + t.text);
    }
    if (C.faq && Array.isArray(C.faq.items)) paintList($("faq"), C.faq.items, (it) => { const d = el("div", "qa"); d.appendChild(el("h3", null, fill(it.q))); d.appendChild(el("p", null, fill(it.a))); return d; }, (it) => it.q + it.a);
    const keys = get("desk.keys");
    if (Array.isArray(keys)) $$("#deskKeys:not(.touch) kbd").forEach((k, i) => { if (keys[i]) setText(k, keys[i]); });
    $$(".qrq").forEach((q) => setText(q, get("free.qr")));
    [["reelPrev", "ui.prev"], ["reelNext", "ui.next"], ["knot", "ui.top"]].forEach(([id, p]) => { const v = get(p); if (v) $(id).setAttribute("aria-label", v); });
    // the films: titles and lines by id
    const items = get("films.items");
    if (Array.isArray(items)) items.forEach((it) => { const c = doc.querySelector('[data-card="' + it.id + '"]'); if (c) { setText(c.querySelector('[data-k="title"]'), it.title); setText(c.querySelector('[data-k="line"]'), it.line); } });
    // the meeting, line by line (sections.js bleeps the small talk)
    const M = get("desk.meeting");
    if (Array.isArray(M)) paintList($("deskNotes"), M, (s) => { const li = el("li", null, s); if (/twenty-five|twelve fifty|€|\d/.test(s)) li.className = "point"; return li; });
    // the comb's sentence and what it becomes (the case with that "said")
    const cs = get("comb.said");
    if (typeof cs === "string") {
      if (!$("comb")._busy) { const k = (C.cases || []).find((x) => x.said === cs); setText("combSaid", cs); if (k) setText("combWrote", k.wrote); }
      setText("combHint", TZ.fine() ? get("comb.hint") : (get("comb.hintTouch") || get("comb.hint")));
    }
    // the tabs: one per machine, its prompt in the panel
    const L = C.llm || {}, tabs = $("llmTabs");
    if (Array.isArray(L.targets)) {
      const btns = $$('[role="tab"]', tabs);
      L.targets.forEach((name, i) => {
        let b = btns[i];
        if (!b) { b = el("button", "chip"); b.type = "button"; b.setAttribute("role", "tab"); b.id = "llmTab" + i; b.setAttribute("aria-controls", "llmPanel"); b.setAttribute("aria-selected", "false"); b.tabIndex = -1; tabs.insertBefore(b, $("llmMore")); }
        setText(b, name);
      });
      btns.slice(L.targets.length).forEach((b) => b.remove());
      if (!TZ.llmBusy) {
        const i = Math.max(0, btns.findIndex((b) => b.getAttribute("aria-selected") === "true")), p = (L.prompts && L.prompts[i]) || L;
        setText("llmName", L.targets[i]); setText("llmHeard", p.said); setText("llmText", p.wrote);
      }
    }
    const D = C.dev || {};
    if (!TZ.devBusy) { setText("devHeard", D.said); setText("devText", D.wrote); }
  };

  /* ---------------------------------------------------------------- the films */
  const filmsPaused = new WeakSet(), heroFilm = $("heroFilm");
  let filmPlaying = null;
  function ensureSrc(v) {
    if (v._loaded) return;
    v._loaded = true;
    const s = v.querySelector("source[data-src]");
    if (s) { s.src = s.getAttribute("data-src"); v.load(); }
  }
  function playFilm(v, user) {
    if (!v) return;
    if (!user && (TZ.calm || TZ.saveData || filmsPaused.has(v))) return;
    ensureSrc(v);
    if (filmPlaying && filmPlaying !== v && filmPlaying !== heroFilm) filmPlaying.pause();
    filmPlaying = v;
    const p = v.play(); if (p && p.catch) p.catch(() => {});
    track("tz_film_play", { film: v.dataset.film, sound: !v.muted }, v.dataset.film + (v.muted ? "" : ":sound:" + Date.now()));
  }
  TZ.playFilm = playFilm;
  function filmButtons(v) {
    const card = v.closest(".film-card"); if (!card) return;
    const b = card.querySelector(".fp"), s = card.querySelector(".snd");
    const sync = () => {
      const playing = !v.paused;
      if (b) {
        b.setAttribute("aria-label", get(playing ? "ui.pause" : "ui.play") || (playing ? "Pause the film" : "Play the film"));
        b.setAttribute("aria-pressed", playing ? "true" : "false");
        b.querySelector("use").setAttribute("href", playing ? "#i-pause" : "#i-play");
      }
      if (s) s.setAttribute("aria-pressed", v.muted ? "false" : "true");
    };
    v.addEventListener("play", sync); v.addEventListener("pause", sync);
    v.addEventListener("playing", () => v.classList.add("on"));
    if (b) b.addEventListener("click", () => { if (v.paused) { filmsPaused.delete(v); playFilm(v, true); } else { filmsPaused.add(v); v.pause(); } });
    if (s) {
      s.setAttribute("aria-label", get("films.sound") || "Sound");
      s.addEventListener("click", () => sound(v));
    }
    sync();
  }
  /** The sound version: full length, unmuted, with captions; again to go back. */
  function sound(v) {
    const src = v.querySelector("source");
    if (!v._loop) v._loop = src.getAttribute("data-src");
    const go = v.muted;
    v.pause();
    $$("track", v).forEach((t) => t.remove());
    if (go) {
      src.src = v.dataset.sound; v.loop = false; v.muted = false;
      if (v.dataset.vtt) { const tr = doc.createElement("track"); tr.kind = "captions"; tr.srclang = "en"; tr.label = "English"; tr.src = v.dataset.vtt; tr.default = true; v.appendChild(tr); }
    } else { src.src = v._loop; v.loop = true; v.muted = true; }
    v._loaded = true; v.load();
    filmsPaused.delete(v); playFilm(v, true);
  }
  (function films() {
    const vids = $$("video[data-film]").filter((v) => v !== heroFilm), reel = $("reel");
    vids.forEach(filmButtons);
    let rt = 0;
    function reelPick() {
      if (rt) return;
      rt = requestAnimationFrame(() => {
        rt = 0;
        const rr = reel.getBoundingClientRect(), mid = rr.left + rr.width * .42;
        let best = null, bd = 1e9;
        $$("video[data-film]", reel).forEach((v) => {
          const r = v.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid);
          if ((v._ratio || 0) >= .6 && d < bd) { bd = d; best = v; }
        });
        $$("video[data-film]", reel).forEach((v) => { if (v !== best && !v.paused && v.muted) v.pause(); });
        if (best && best.paused) playFilm(best);
        emit("reel", best);
      });
    }
    // muted, the one section film that shows most (at least 40%) plays; a film on its way out never
    // takes over from the one coming in. Out of sight it pauses (with sound, only when almost gone).
    const others = vids.filter((v) => !(reel && reel.contains(v)));
    function sectionPick() {
      let best = null;
      if (others.some((v) => !v.muted && !v.paused && (v._ratio || 0) >= .05)) return;   // a film with its sound on keeps the floor
      others.forEach((v) => { if ((v._ratio || 0) >= .4 && (!best || v._ratio > best._ratio + .02 || (v === filmPlaying && v._ratio >= best._ratio - .02))) best = v; });
      others.forEach((v) => { if (v !== best && !v.paused && (v.muted ? (v._ratio || 0) < .4 || best : (v._ratio || 0) < .05)) v.pause(); });
      if (best && best.paused) playFilm(best);
    }
    const io = new IntersectionObserver((es) => {
      let sec = false;
      es.forEach((en) => {
        const v = en.target;
        v._ratio = en.intersectionRatio;
        if (reel && reel.contains(v)) reelPick(); else sec = true;
      });
      if (sec) sectionPick();
    }, { threshold: [0, .05, .2, .4, .5, .6, .7, .8, .9, 1] });
    vids.forEach((v) => io.observe(v));
    if (reel) reel.addEventListener("scroll", reelPick, { passive: true });
    on("calm", (c) => { if (c) vids.forEach((v) => { if (v.muted) v.pause(); }); });
  })();

  /* ---------------------------------------------------------------- W2: the phrase a pluck throws off */
  const flying = [];
  let wordsLayerOn = false, thrownAt = 0;
  /** A deliberate pluck throws one phrase, at most every 3 s, up and away from the words: on the
   *  hero's thread only into the empty room right of the said line (none when there is no room). */
  TZ.throwPhrase = function (x, y, strength, where) {
    const P = (TZ.C.cases || []).map((c) => c.said).filter(Boolean);
    if (!P.length || TZ.calm) return;
    const now = performance.now();
    if (now - thrownAt < 3000) return;
    let lo = 0, hi = innerWidth;
    if (where === "hero") { const room = TZ.heroRoom(); if (!room) return; lo = room.x0; hi = room.x1; x = clamp(x, lo, hi); }
    thrownAt = now;
    const ln = P[(Math.random() * P.length) | 0].split(" "), k = (Math.random() * Math.max(1, ln.length - 2)) | 0;
    const text = ln.slice(k, k + 2 + (Math.random() < .4 ? 1 : 0)).join(" ");
    const hit = TZ.SCRIPTS.find(([re]) => re.test(text));
    if (hit) TZ.scriptFor(doc.createElement("span"), text);
    const c = doc.createElement("canvas"); c.width = 560; c.height = 90;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.font = "600 30px " + (hit ? "'" + hit[1] + "', Caveat" : "Caveat"); g.textBaseline = "middle"; g.fillStyle = "#fff";
    const tw = Math.min(540, g.measureText(text).width); g.fillText(text, 10, 45, 540);
    const d = g.getImageData(0, 0, 560, 90).data, pts = [];
    for (let yy = 0; yy < 90; yy += 2) for (let xx = 0; xx < 560; xx += 2) if (d[(yy * 560 + xx) * 4 + 3] > 110) pts.push([xx - 10 - tw / 2, yy - 45, Math.random() * 6.283, .4 + Math.random()]);
    if (flying.length > 6) flying.shift();
    if (where === "hero" && hi - lo < tw + 12) return;
    flying.push({ x: clamp(x, lo + tw / 2 + 6, hi - tw / 2 - 6) + scrollX, y: y + scrollY - 14, t0: performance.now(), pts, s: .6 + .4 * strength, drift: rnd(-20, 20), col: toneAt(y) === "light" ? INK : CREAM });
    if (!wordsLayerOn) { wordsLayerOn = true; addLayer(drawFlying); }
  };
  function drawFlying(g, t, dt, sx, sy) {
    const now = performance.now();
    for (let i = flying.length - 1; i >= 0; i--) if (now - flying[i].t0 > 2200) flying.splice(i, 1);
    flying.forEach((w) => {
      const a = (now - w.t0) / 2200, rise = (1 - Math.pow(1 - Math.min(1, a * 1.4), 3)) * 70 * w.s;
      const br = smooth(.28, 1, a), alpha = (1 - smooth(.55, 1, a)) * smooth(0, .06, a);
      g.fillStyle = "rgba(" + w.col + "," + (.92 * alpha).toFixed(3) + ")";
      g.beginPath();
      for (let i = 0; i < w.pts.length; i++) {
        const p = w.pts[i], ox = Math.cos(p[2]) * br * 46 * p[3] + w.drift * br, oy = Math.sin(p[2]) * br * 30 * p[3] - br * br * 40;
        const px = w.x - sx + p[0] + ox, py = w.y - sy - rise + p[1] + oy, r = .95 * (1 - br * .5);
        g.moveTo(px + r, py); g.arc(px, py, r, 0, 6.283);
      }
      g.fill();
    });
    wordsLayerOn = flying.length > 0;
    return wordsLayerOn;
  }

  /* ---------------------------------------------------------------- the dust: motes that fly to a thread */
  const motes = [];
  let motesOn = false;
  function dust(pts, o) {
    if (TZ.calm || !pts.length) return;
    const t = performance.now() / 1000;
    let x0 = Infinity, x1 = -Infinity;
    pts.forEach((p) => { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; });
    pts.forEach((p) => {
      const lr = (p[0] - x0) / Math.max(1, x1 - x0);
      motes.push({ x: p[0], y: p[1], vx: rnd(-30, 30), vy: rnd(-(o.up || 80), -10), t0: t + (o.delay || 0) + lr * (o.sweep || .05) + rnd(0, .1), fly: (o.fly || .4) + rnd(0, .2),
        seek: false, home: !!o.home, tx: o.home ? p[2] : 0, ty: o.home ? p[3] : 0, to: o.to, str: o.str, col: o.col || CREAM, a: p[4] || 1, done: o.done });
    });
    if (!motesOn) { motesOn = true; addLayer(drawMotes); }
  }
  function drawMotes(g, tt, dt, sx, sy) {
    const t = performance.now() / 1000, S = TZ.motion.springs;
    for (let i = motes.length - 1; i >= 0; i--) {
      const p = motes[i];
      if (t < p.t0) continue;
      const age = t - p.t0;
      if (p.home) { const k = S.settle; p.vx += (k.stiff * (p.tx - p.x) - k.damp * p.vx) * dt; p.vy += (k.stiff * (p.ty - p.y) - k.damp * p.vy) * dt; }
      else if (age < p.fly) { p.vy += 260 * dt; p.vx += rnd(-80, 80) * dt; p.vx *= .985; p.vy *= .985; }
      else {
        if (!p.seek) { p.seek = true; const to = p.to ? p.to() : [p.x, p.y + 60]; p.tx = to[0]; p.ty = to[1]; }
        const k = S.seek; p.vx += (k.stiff * (p.tx - p.x) - k.damp * p.vx) * dt; p.vy += (k.stiff * (p.ty - p.y) - k.damp * p.vy) * dt;
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const d = Math.hypot(p.tx - p.x, p.ty - p.y);
      if ((p.seek || p.home) && d < 4 && (p.home ? Math.hypot(p.vx, p.vy) < 60 : true)) {
        motes.splice(i, 1);
        if (p.str && !p.home) { const r = p.str.svg.getBoundingClientRect(); p.str.kick(p.x - sx - r.left, 1, .35, 3); }   // every mote that lands plucks the thread
        if (p.done && !motes.some((m) => m.done === p.done)) p.done();
        continue;
      }
      if (age > 4) { motes.splice(i, 1); if (p.done && !motes.some((m) => m.done === p.done)) p.done(); }
    }
    const byCol = {};
    motes.forEach((p) => { if (t >= p.t0) (byCol[p.col + "|" + p.a] = byCol[p.col + "|" + p.a] || []).push(p); });
    Object.keys(byCol).forEach((k) => {
      const [col, a] = k.split("|");
      g.fillStyle = "rgba(" + col + "," + (+a * .95) + ")"; g.beginPath();
      byCol[k].forEach((p) => { g.moveTo(p.x - sx + 1.2, p.y - sy); g.arc(p.x - sx, p.y - sy, 1.2, 0, 6.283); });
      g.fill();
    });
    motesOn = motes.length > 0;
    return motesOn;
  }
  TZ.dust = dust;
  /** Blip bursts into dots (five pokes). */
  TZ.burst = function (x, y) {
    if (TZ.calm) return;
    const pts = []; for (let i = 0; i < 70; i++) pts.push({ a: Math.random() * 6.283, v: rnd(40, 160), r: rnd(.8, 1.6) });
    const t0 = performance.now(), col = toneAt(y - scrollY) === "light" ? INK : CREAM;
    addLayer((g, t, dt, sx, sy) => {
      const k = (performance.now() - t0) / 700; if (k > 1) return false;
      g.fillStyle = "rgba(" + col + "," + (1 - k).toFixed(3) + ")";
      for (const p of pts) { const d = p.v * TZ.settleEase(k) * .6; g.beginPath(); g.arc(x - sx + Math.cos(p.a) * d, y - sy + Math.sin(p.a) * d * .7 + k * k * 30, p.r, 0, 6.283); g.fill(); }
      return true;
    });
  };
  /* ---------------------------------------------------------------- Blip's perches below the hero (§6.1) */
  Object.assign(BL.anchors, {
    how: (h, R, sx, sy) => { const r = R($("combThread")); return r && { x: r.right - h * .9 + sx, y: r.top + r.height / 2 + sy, h: h * .8 }; },
    river: (h, R, sx, sy) => { const b = doc.querySelector(".bd[aria-pressed='true']") || doc.querySelector(".bd"), r = R(b); if (!r || !r.width || r.right < 0 || r.left > innerWidth) return null; return { x: r.left + r.width / 2 + sx, y: r.top + sy + 2, h: h * .62 }; },
    apps: (h, R, sx, sy) => { const r = R(doc.querySelector("#apps .film-card")); return r && { x: r.left + r.width * .7 + sx, y: r.top + sy + 1, h }; },
    films: (h, R, sx, sy) => { const r = R(TZ.reelBest ? TZ.reelBest.closest(".film-card") : doc.querySelector("#reel .film-card")); return r && { x: r.left + r.width * .5 + sx, y: r.top + sy + 1, h: h * .8 }; },
    tone: (h, R, sx, sy) => { const d = $("toneDial"), r = R(d.offsetParent ? d : $("toneSegs")); return r && { x: r.left + r.width / 2 + sx, y: r.top + 14 + sy, h: h * .62 }; },
    // over the stand-in field, at the caret: blip.js's own peekSpot (desktop 0.4.0)
    desk: (h, R, sx, sy) => {
      const car = R(doc.querySelector("#deskField .caret")), fld = R($("deskField")), st = R($("deskStage")), TB = window.TailzuBlip;
      const s = TB && car && fld ? TB.peekSpot([car.left, car.top, Math.max(2, car.width), car.height], [fld.left, fld.top, fld.width, fld.height], { w: innerWidth, h: innerHeight, top: 60 }, { height: h * .7, tall: 9999 }) : null;
      return s ? { x: s.x + sx, y: s.y + sy + 1, h: h * .7 } : st && { x: st.left + st.width * .7 + sx, y: st.top + sy, h: h * .7 };
    },
    questions: (h, R, sx, sy) => {
      const qa = TZ.qaHover || null, t = $("faqTitle"), r = R(qa) || R(t);
      if (qa) return { x: r.right - h * .9 + sx, y: r.top + sy + 1, h: h * .7 };
      // beside the heading's words; where they reach the edge (narrow phones), on the first question's rule instead
      const x = Math.min(r.right + h, innerWidth - h), rg = doc.createRange(); rg.selectNodeContents(t);
      const tr = rg.getBoundingClientRect(), q = R(doc.querySelector("#faq .qa"));
      if (x - h * .3 > tr.right + 4 || !q) return { x: x + sx, y: r.top + r.height * .3 + sy, h: h * .7 };
      return { x: q.right - h * .6 + sx, y: q.top + sy + 1, h: h * .7 };
    },
    // on the thread between the halves; where the gap is too short for it (phones), on the pill's top edge at the gap
    free: (h, R, sx, sy) => {
      const f = R($("finale")), d = R(doc.querySelector("#finaleNo .disc")), t = R($("finaleNoLab")), y = R($("finaleYes"));
      const l = Math.max(d ? d.right : f.left, t && t.width ? t.right + 12 : 0), gap = y.left - l, gx = l + gap / 2;
      if (mqPhone.matches) return { x: y.left + y.width * .8 + sx, y: y.top + sy + 1, h: h * .6 };
      return gap > h * .9 ? { x: gx + sx, y: f.top + f.height / 2 + sy, h: h * .8 } : { x: y.left + Math.min(y.width * .7, 260) + sx, y: f.top + sy + 1, h: h * .7 };
    },
    footer: (h, R, sx, sy) => { const f = R(doc.querySelector("footer")); return { x: f.left + f.width * .62 + sx, y: f.top + sy + 1, h: h * .75 }; },
  });
  { const p = BL.perch(); if (p && p !== "hero") { BL.go(null); BL.go(p); } }   // a perch that had no anchor yet: Blip rises there now

  /** Five pokes in four seconds: oops, it bursts into dots and moves house, with a line. */
  let pokeI = 0;
  TZ.poke5 = function (x, y) {
    const B = BL.inst, P = get("blip.pokes") || [];
    if (!B) return;
    let s = P[pokeI % Math.max(1, P.length)] || "";
    if (pokeI % Math.max(1, P.length) === P.length - 1 && !TZ.fine()) s = get("blip.pokeTouch") || s;
    pokeI++;
    egg("poke5"); BL.mood("oops"); TZ.burst(x, y);
    setTimeout(() => {
      const base = BL.perch(), a = BL.anchorOf(base);
      if (a) { const dx = (Math.random() < .5 ? -1 : 1) * Math.min(240, innerWidth * .25); BL.setOverride({ name: base, at: () => ({ x: clamp(a.x + dx, 60 + scrollX, innerWidth - 60 + scrollX), y: a.y, h: a.h }) }); }
      B.pose("hidden"); if (TZ.calm) B.snap(); BL.wake(300);
      setTimeout(() => { BL.refresh(); B.pose("peek"); BL.wake(500); setTimeout(() => TZ.blipSay(s), 340); setTimeout(() => BL.setOverride(null), 9000); }, 420);
    }, 380);
  };
  on("calm", (c) => { if (c) { motes.length = 0; flying.length = 0; if (kwGone) TZ.reform(); } });

  /* ---------------------------------------------------------------- W7: typing at the page */
  let typedN = 0, typedBuf = "", typedLine = [], typedX = 0;
  const TYPED_LAYER = (g) => {
    const n = performance.now();
    typedLine = typedLine.filter((l) => n - l.t < 480);
    typedLine.forEach((l) => { g.font = "600 34px Caveat, cursive"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "rgba(" + l.c + "," + (1 - smooth(.25, 1, (n - l.t) / 480) * .3).toFixed(3) + ")"; g.fillText(l.ch, l.x, l.y); });
    return typedLine.length > 0;
  };
  function nearestThread() {
    let best = null, bd = 1e9;
    TZ.strings.forEach((s) => { const r = s.svg.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || !r.width) return; const d = Math.abs(r.top + r.height / 2 - innerHeight * .5); if (d < bd) { bd = d; best = { s, r }; } });
    return best;
  }
  TZ.typeLetter = function (ch) {
    typedN++;
    typedBuf = (typedBuf + ch.toLowerCase()).slice(-12);
    const nt = nearestThread(), B = BL.inst;
    const room = nt && nt.s.where === "hero" ? TZ.heroRoom() : null;
    if (!TZ.calm && nt && (nt.s.where !== "hero" || room)) {
      const n = performance.now();
      const x0 = room ? room.x0 : nt.r.left + Math.min(nt.r.width * .3, 220), x1 = room ? room.x1 : nt.r.right - 20;
      if (!typedLine.length || n - (typedLine[typedLine.length - 1].t) > 1500) typedX = x0;
      typedX += 20;
      if (typedX > x1) typedX = x0 + 20;
      const x = Math.min(typedX, x1), y = nt.r.top + nt.r.height / 2 - 46, col = toneAt(y) === "light" ? INK : CREAM;
      typedLine.push({ ch, x, y, t: n, c: col });
      addLayer(TYPED_LAYER);
      setTimeout(() => {
        // the letter crumbles into the thread
        const cv = doc.createElement("canvas"); cv.width = cv.height = 48;
        const g = cv.getContext("2d", { willReadFrequently: true }); g.font = "600 34px Caveat, cursive"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText(ch, 24, 24);
        const d = g.getImageData(0, 0, 48, 48).data, pts = [];
        for (let yy = 0; yy < 48; yy += 2) for (let xx = 0; xx < 48; xx += 2) if (d[(yy * 48 + xx) * 4 + 3] > 120) pts.push([x - 24 + xx + scrollX, y - 24 + yy + scrollY]);
        dust(pts, { col, to: () => [x + rnd(-30, 30) + scrollX, nt.r.top + nt.r.height / 2 + scrollY], str: nt.s, up: 30, fly: .2 });
      }, 420);
    }
    if (typedN === 6) { TZ.blipSay(get("blip.typed6")); egg("typed6"); }
    if (typedN === 24) { TZ.blipSay(get("blip.typed24")); egg("typed24"); }
    if (/(^|[^a-z])(um|uh)$/.test(typedBuf)) { floatUm(typedBuf.slice(-2)); egg("um"); }
    if (typedBuf.endsWith("pirate")) pirate();
    if (typedBuf.endsWith("blip")) { egg("blip"); if (B && B.shown()) BL.mood("done", 1200); TZ.blipSay(get("blip.me")); }
    if (typedBuf.endsWith("namaste")) { egg("namaste"); const H = get("blip.hello"); TZ.blipSay(Array.isArray(H) ? H[0] : "Namaste."); if (B && B.shown()) { B.nod(); BL.mood("confirm", 900); } }
    if (typedBuf.endsWith("hi") && TZ.secretReveal) TZ.secretReveal("type");
  };
  function floatUm(w) {
    const s = el("span", "typed-egg", w);
    const x = pointer.x > -1e3 ? pointer.x : innerWidth / 2, y = pointer.y > -1e3 ? pointer.y : innerHeight / 2;
    s.style.setProperty("left", x + "px"); s.style.setProperty("top", y + "px");
    s.classList.add("w", "f");
    doc.body.appendChild(s);
    if (toneAt(y) === "light") s.style.setProperty("color", "var(--ink)");
    requestAnimationFrame(() => s.classList.add("x"));
    if (!TZ.calm && s.animate) s.animate([{ transform: "translate(-50%,-50%)", opacity: 1 }, { transform: "translate(-50%,-50%)", opacity: 1, offset: .5 }, { transform: "translate(-50%,-160%)", opacity: 0 }], { duration: 1100, easing: "cubic-bezier(.55,0,1,.45)", fill: "forwards" });
    setTimeout(() => s.remove(), 1150);
  }
  let pirateT = 0;
  function pirate() {
    egg("pirate");
    TZ.pirate = true; emit("pirate");
    const P = get("blip.pirate") || {}, ld = $("appsLede");
    if (!ld) return;
    if (!ld._plain) ld._plain = ld.textContent;
    ld.textContent = "";
    ld.appendChild(el("span", "ptag lbl", P.tag || "Tone: pirate"));
    ld.appendChild(doc.createTextNode(P.lede || ld._plain));
    ld.classList.add("pirate");
    TZ.blipSay(P.toast);
    clearTimeout(pirateT);
    pirateT = setTimeout(() => { ld.textContent = ld._plain; ld._plain = null; ld.classList.remove("pirate"); TZ.paintAll(); }, 7000);
  }

  /* ---------------------------------------------------------------- W4: "type." crumbles */
  let kwGone = false, kwFlip = 0;
  const kwEl = () => doc.querySelector("#appsTitle .kw");
  function letterRects(k) {
    const out = [], tn = k.firstChild; if (!tn || tn.nodeType !== 3) return out;
    for (let i = 0; i < tn.length; i++) {
      const rg = doc.createRange(); rg.setStart(tn, i); rg.setEnd(tn, i + 1);
      const r = rg.getBoundingClientRect(); out.push({ ch: tn.nodeValue[i], l: r.left, t: r.top, w: r.width, h: r.height });
    }
    return out;
  }
  /** Each letter as a keycap (its outline and the letter), in dithered dots. */
  function keyDots(lr, cs, cell) {
    const pts = [];
    lr.forEach((r) => {
      const pad = r.h * .08, w = Math.ceil(r.w + pad * 2), h = Math.ceil(r.h * .82);
      const cv = doc.createElement("canvas"); cv.width = w; cv.height = h;
      const g = cv.getContext("2d", { willReadFrequently: true });
      g.strokeStyle = "#fff"; g.lineWidth = 2; g.beginPath(); g.roundRect(1, 1, w - 2, h - 2, Math.min(14, h * .16)); g.stroke();
      g.fillStyle = "#fff"; g.font = cs.fontStyle + " " + cs.fontWeight + " " + parseFloat(cs.fontSize) * .62 + "px " + cs.fontFamily; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(r.ch, w / 2, h / 2);
      const d = g.getImageData(0, 0, w, h).data;
      for (let y = 0, j = 0; y < h; y += cell, j++) for (let x = 0, i = 0; x < w; x += cell, i++) {
        const a = d[((y | 0) * w + (x | 0)) * 4 + 3];
        if (a > (TZ.BAYER[(j & 7) * 8 + (i & 7)] + .5) / 64 * 200 + 30) pts.push([r.l - pad + x + scrollX, r.t + r.h * .12 + y + scrollY, r.l - pad + x + scrollX, r.t + r.h * .12 + y + scrollY]);
      }
    });
    return pts;
  }
  const blipHop = (ms) => { const B = BL.inst; if (B && BL.perch() === "hero") { B.pose("hidden"); BL.wake(260); setTimeout(() => { BL.refresh(); B.pose("peek"); BL.wake(500); }, ms); } };
  TZ.crumble = function () {
    const k = kwEl(); if (!k || kwGone || TZ.calm || TZ.lineBusy()) return;
    if (performance.now() - kwFlip < 500) return;
    kwFlip = performance.now(); kwGone = true;
    const lr = letterRects(k), cs = getComputedStyle(k), thr = $("lineThread");
    const pts = keyDots(lr, cs, mqPhone.matches ? 3 : 3.2).slice(0, 1000);
    // the letters become keys (their outlines, 160 ms); the outlines stay behind, in chalk
    const kr0 = k.getBoundingClientRect();
    lr.forEach((r) => { const c = el("i", "chalk"); c.setAttribute("aria-hidden", "true"); c.style.setProperty("left", (r.l - kr0.left - r.h * .08).toFixed(1) + "px"); c.style.setProperty("width", (r.w + r.h * .16).toFixed(1) + "px"); c.style.setProperty("top", (r.t - kr0.top + r.h * .12).toFixed(1) + "px"); c.style.setProperty("height", (r.h * .82).toFixed(1) + "px"); k.appendChild(c); });
    k.classList.add("kcaps");
    setTimeout(() => {
      k.classList.add("gone");
      const tr = thr.getBoundingClientRect();
      dust(pts.map((p) => [p[0], p[1]]), { col: CREAM, sweep: .35, up: 90, fly: .45, str: TZ.heroStr(), to: () => [tr.left + scrollX + rnd(tr.width * .05, Math.min(tr.width, 760) * .95), tr.top + tr.height / 2 + scrollY] });
      // Blip hops into the hole
      BL.setOverride({ name: "hero", at: () => { const r2 = k.getBoundingClientRect(); return { x: r2.left + r2.width / 2 + scrollX, y: r2.bottom - r2.height * .16 + scrollY, h: Math.min(TZ.PERCH_H() * 1.1, r2.height * 1.1) }; } });
      blipHop(700);
      egg("crumble");
    }, 160);
  };
  TZ.reform = function () {
    const k = kwEl(); if (!k || !kwGone) return;
    if (performance.now() - kwFlip < 500) { setTimeout(TZ.reform, 520); return; }
    kwFlip = performance.now();
    const lr = letterRects(k), cs = getComputedStyle(k), tr = $("lineThread").getBoundingClientRect();
    if (!TZ.calm) {
      const pts = keyDots(lr, cs, 4).filter(() => Math.random() < .55).map((p) => [tr.left + scrollX + rnd(0, Math.min(tr.width, 760)), tr.top + tr.height / 2 + scrollY, p[0], p[1]]);
      dust(pts, { home: true, col: CREAM, up: 300 });
      const hs = TZ.heroStr(); if (hs) hs.pluck(.5);
    }
    BL.setOverride(null);
    blipHop(300);
    setTimeout(() => { $$(".chalk", k).forEach((c) => c.remove()); k.classList.remove("gone", "kcaps"); kwGone = false; }, TZ.calm ? 0 : 640);
  };
  TZ.kwOut = () => setTimeout(() => { const k = kwEl(); if (k && !k.matches(":hover")) TZ.reform(); }, 120);
  TZ.kwTap = () => { if (kwGone) TZ.reform(); else TZ.crumble(); };

  /* ---------------------------------------------------------------- W5: the app's pill at the foot of the screen */
  const inst = $("instrument");
  let instFrame = null, instOpen = false, instReady = null, instGen = 0, instTimers = [];
  const tell = (m) => TZ.tellPill(instFrame, m);
  // on a desk the app's pill is drawn 1.5x (CSS zoom on a px-sized frame, as #desk's stage does), so it is an event, not a speck
  function fitInst() {
    if (!instFrame) return;
    const Z = TZ.fine() ? 1.5 : 1;
    instFrame.style.setProperty("zoom", String(Z));
    instFrame.style.setProperty("width", (inst.clientWidth / Z).toFixed(1) + "px"); instFrame.style.setProperty("height", (inst.clientHeight / Z).toFixed(1) + "px");
  }
  TZ.openInstrument = async function () {
    if (instOpen) { finish(); return; }
    const g = ++instGen;
    if (!instFrame) { const p = TZ.pillFrame(inst); instFrame = p.f; instReady = p.ready; fitInst(); window.addEventListener("resize", fitInst, { passive: true }); }
    await instReady;
    if (g !== instGen) return;
    instOpen = true; inst.classList.add("open"); doc.documentElement.classList.add("inst-open");
    const speak = "um so like can we push the call to…".split(" ");
    tell({ pill: { state: "rest", hint: "", rest: true } });
    await sleep(TZ.calm ? 0 : 330);
    tell({ pill: { state: "listening" } });
    TZ.star = (TZ.star || 0) + 1;
    let i = 0;
    const lv = setInterval(() => { const b = []; for (let k = 0; k < 16; k++) b.push(.35 + .5 * Math.abs(Math.sin(performance.now() / 90 + k))); tell({ level: { bands: b } }); }, 60);
    const cap = setInterval(() => { if (g !== instGen) return clearInterval(cap); if (i < speak.length) tell({ pill: { state: "caption", text: speak.slice(0, ++i).join(" ") } }); }, TZ.calm ? 30 : 170);
    instTimers = [lv, cap];
    await sleep(TZ.calm ? 400 : 2300);
    if (g !== instGen) return;
    finish();
  };
  /** ✓: the halves snap home; in view, the words pour up from the pill into the hero's line. */
  async function finish() {
    const g = instGen;
    instTimers.forEach(clearInterval); instTimers = [];
    if (!instOpen) return;
    tell({ level: { bands: Array(16).fill(0) } });
    tell({ pill: { state: "writing" } });
    await sleep(TZ.calm ? 0 : 380);
    tell({ pill: { state: "done", words: 7 } });
    TZ.star = Math.max(0, (TZ.star || 1) - 1);
    const hr = $("hero").getBoundingClientRect();
    if (hr.bottom > innerHeight * .4 && !TZ.lineBusy()) {
      const cs = get("comb.said") || "um so like can we push the call to four", k = (TZ.C.cases || []).find((x) => x.said === cs);
      if (k) {
        const pts = []; for (let i = 0; i < 220; i++) pts.push([innerWidth / 2 + rnd(-160, 160) + scrollX, innerHeight - 100 + rnd(-12, 12) + scrollY]);
        TZ.runLine({ said: k.said, wrote: k.wrote, note: "", lang: "en" }, { sources: pts, fast: true });
      }
    } else toast(get("desk.toast"));
    await sleep(TZ.calm ? 200 : 1300);
    if (g === instGen) close();
  }
  function close() {
    if (!instOpen) return;
    instGen++;
    instTimers.forEach(clearInterval); instTimers = [];
    tell({ pill: { state: "rest", rest: false } });
    instOpen = false; inst.classList.remove("open"); doc.documentElement.classList.remove("inst-open");
    TZ.star = 0;
  }
  on("escape", close);
  on("frame", (e) => { if (instFrame && e.source === instFrame.contentWindow && e.data.pill === "action") { if (e.data.a === "cancel") close(); else if (e.data.a === "finish") finish(); } });

  /* ---------------------------------------------------------------- W17, W18 */
  doc.addEventListener("copy", () => { egg("copy"); TZ.blipSay(get("blip.copy")); });   // never touches what was copied
  const mark = $("markLink");
  let markHits = [];
  mark.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse" || TZ.calm) return;
    const n = performance.now(); markHits = markHits.filter((x) => n - x < 1500); markHits.push(n);
    if (markHits.length >= 3) { markHits = []; scatterMark(); }
  });
  function scatterMark() {
    egg("logo");
    const sq = $$(".sq", mark).map((r) => ({ r, s: { x: 0, v: 0 }, dx: rnd(-26, 26), dy: rnd(-18, 18), rot: rnd(-50, 50) }));
    const t0 = performance.now();
    sched.add(function scatter(t, dt) {
      const to = performance.now() - t0 < 450 ? 1 : 0;
      let moving = false;
      sq.forEach((q) => { TZ.springStep(q.s, to, to ? "pull-out" : "settle", dt); q.r.style.setProperty("transform", "translate(" + (q.dx * q.s.x).toFixed(2) + "px," + (q.dy * q.s.x).toFixed(2) + "px) rotate(" + (q.rot * q.s.x).toFixed(1) + "deg)"); if (Math.abs(q.s.x - to) > .002 || Math.abs(q.s.v) > .01) moving = true; });
      if (!moving && to === 0) { sq.forEach((q) => q.r.style.removeProperty("transform")); return false; }
      return true;
    });
  }
  TZ.paintBelow();
  emit("paint");
  emit("play");
})();
