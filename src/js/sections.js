/* tailzu.space, the sections below the hero (lazy: loaded on idle after
 * load, or when #how comes within a screen). Each section is one claim, one
 * proof that runs, one toy. Uses only window.TZ (js/site.js).
 *
 *   #how      comb the sentence (W9): drag the thread across it, or "Clean it"
 *   #river    the beads: pluck one and its language's real sentence drops
 *   #apps     the chips (real said → written pairs); the autocorrect saboteur (W10)
 *   #films    the reel; the typing race (W11)
 *   #tone     the dial, and its secret seventh detent (W12)
 *   #desk     the app's real pill on a stand-in window; bleep the small talk (W13)
 *   #llm #dev the tabs: a prompt, poured
 *   #ask      the guide in a frame (only when /v1/site says soon or live)
 *   #free     the finale split (W15), the earned secret (W14), and the knot (W16)
 */
(function () {
  "use strict";
  const TZ = window.TZ;
  if (!TZ || TZ.sectionsUp) return;
  TZ.sectionsUp = true;
  const { $, $$, get, setText, el, clamp, rnd, sleep, track, egg, sched, pour, words, diff, toast, say, fine, mqPhone } = TZ;
  const doc = document;
  const PS = window.TailzuPillSplit;
  const once = (elm, f, threshold) => {
    if (!elm) return;
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { io.disconnect(); f(); } }), { threshold: threshold || .35 });
    io.observe(elm);
  };
  const inView = (elm, f, threshold) => {
    if (!elm) return;
    new IntersectionObserver((es) => es.forEach((en) => f(en.isIntersecting, en)), { threshold: threshold || 0 }).observe(elm);
  };
  const vibrate = (ms) => { try { if (navigator.vibrate && !TZ.calm) navigator.vibrate(ms); } catch (e) { /* none */ } };

  /* ---------------------------------------------------------------- #how: comb the sentence */
  (function comb() {
    const box = $("comb"), said = $("combSaid"), wrote = $("combWrote"), key = $("combKey"), hint = $("combHint"), copy = $("howCopy");
    if (!box) return;
    let str = null, pos = 0, done = false, sweeping = false, dragging = false;
    function build() {
      box._busy = true;
      const sw = words(said), ww = words(wrote);
      const plan = diff(sw.map((s) => s.textContent), ww.map((s) => s.textContent));
      return { sw, ww, plan };
    }
    let P = null;
    function setup() {
      P = build();
      if (TZ.calm) { side(true); return; }
      box.classList.add("cm"); box.classList.remove("done");
      P.sw.forEach((s) => s.classList.add("on"));
      P.plan.said.forEach((p, i) => { if (p && p.k === "filler") P.sw[i].classList.add("f"); });
      copy.classList.add("combing", "l1");
      str = TZ.addString($("combThread"), "comb", { max: 22 });
    }
    function side(on) {
      box.classList.toggle("side", on);
      if (on) { box.classList.remove("cm"); box.classList.add("done"); P.sw.forEach((s, i) => { s.classList.add("on"); if (P.plan.said[i] && P.plan.said[i].k === "filler") s.classList.add("f", "x"); }); P.ww.forEach((s) => s.classList.add("on")); copy.classList.remove("combing"); }
    }
    /** The comb at x (0 … 1 of the line): what it has passed is written. */
    function combTo(x, how) {
      const rs = said.getBoundingClientRect(), rw = wrote.getBoundingClientRect();
      const wasPos = pos; pos = clamp(x, 0, 1);
      const X = rs.left + pos * Math.max(rs.width, rw.width);
      P.sw.forEach((s, i) => {
        const r = s.getBoundingClientRect(), passed = r.left + r.width / 2 < X, p = P.plan.said[i] || {};
        if (passed && !s._passed) {
          s._passed = true;
          if (p.k === "filler") {
            s.classList.add("x");
            if (!TZ.calm && TZ.dust) { const pts = TZ.sample(s, 3); TZ.dust(pts, { col: TZ.INK, up: 20, fly: .5, to: () => [pts.length ? pts[0][0] + rnd(-20, 20) : 0, window.scrollY + window.innerHeight + 40] }); }
          } else s.classList.add("gone");
        } else if (!passed && s._passed) { s._passed = false; s.classList.remove("x", "gone"); }
      });
      P.ww.forEach((s, j) => {
        const r = s.getBoundingClientRect(), passed = r.left + r.width / 2 < X;
        if (passed && !s.classList.contains("on")) {
          if (!TZ.calm && pos > wasPos) {
            const src = (P.plan.wrote[j] || {}).src || [];
            const from = src.length && P.sw[src[0]] ? P.sw[src[0]] : null;
            const tmpTo = s;
            if (from) pourWord(from, tmpTo, j); else s.classList.add("on");
          } else s.classList.add("on");
        } else if (!passed && s.classList.contains("on")) s.classList.remove("on", "fix");
      });
      if (str) { const tr = $("combThread").getBoundingClientRect(); str.kick(X - tr.left, pos > wasPos ? 1 : -1, 1.6, 4); }
      copy.classList.toggle("l2", pos > .05);
      copy.classList.toggle("l3", pos >= .98);
      if (pos >= .98 && !done) { done = true; box.classList.add("done"); track("tz_comb", { how }); TZ.blip.mood("done", 900); setTimeout(() => { setText(hint, get("comb.again")); }, 600); }
      if (pos <= .02 && done) { done = false; box.classList.remove("done"); }
    }
    function pourWord(from, to, j) {
      const span = to;
      // one word's dots, from what was said to what got written
      span.classList.add("on");
      if (TZ.calm) return;
      const pts = TZ.sample(from, 3, 140), tg = TZ.sample(span, 3);
      if (!pts.length || !tg.length) return;
      span.classList.remove("on");
      const t0 = performance.now(), parts = tg.map((d, k) => { const s = pts[k % pts.length]; return { sx: s[0], sy: s[1], tx: d[0], ty: d[1], cx: (s[0] + d[0]) / 2 + rnd(-30, 30), cy: (s[1] + d[1]) / 2 + rnd(0, 20), t0: t0 + Math.random() * 90, dur: 420 + Math.random() * 80 }; });
      TZ.addLayer((g, t, dt, sx, sy) => {
        const n = performance.now(); let alive = false;
        g.fillStyle = "rgb(" + TZ.INK + ")";
        parts.forEach((p) => {
          const k = (n - p.t0) / p.dur; if (k > 1.3) return; alive = true; if (k < 0) return;
          const e = TZ.glide(Math.min(1, k)), u = 1 - e;
          g.globalAlpha = k > 1 ? 1 - (k - 1) / .3 : .9;
          g.fillRect(u * u * p.sx + 2 * u * e * p.cx + e * e * p.tx - sx - .7, u * u * p.sy + 2 * u * e * p.cy + e * e * p.ty - sy - .7, 1.4, 1.4);
        });
        g.globalAlpha = 1;
        return alive;
      });
      setTimeout(() => { span.classList.add("on"); if ((P.plan.wrote[j] || {}).ring) { span.classList.add("kept", "ring"); span.setAttribute("data-tag", get("comb.kept") || "Kept"); } }, 480);
    }
    async function sweep(how, back) {
      if (sweeping) return;
      sweeping = true;
      TZ.blip.mood("thinking");
      const from = pos, to = back ? 0 : 1, t0 = performance.now(), D = TZ.calm ? 0 : 900;
      await new Promise((res) => sched.add(function step() {
        const k = D ? Math.min(1, (performance.now() - t0) / D) : 1;
        combTo(from + (to - from) * TZ.glide(k), how);
        if (k >= 1) { res(); return false; }
        return true;
      }));
      sweeping = false;
      if (!back) TZ.blip.mood("peek");
    }
    // the drag: a finger or the pointer along the box, the thread follows
    box.addEventListener("pointerdown", (e) => {
      if (TZ.calm || e.target.closest("button")) return;
      dragging = true; box.setPointerCapture && box.setPointerCapture(e.pointerId);
    });
    box.addEventListener("pointermove", (e) => {
      if (!dragging || sweeping) return;
      const r = said.getBoundingClientRect();
      combTo((e.clientX - r.left) / Math.max(1, r.width), "drag");
    });
    const end = () => { dragging = false; };
    box.addEventListener("pointerup", end); box.addEventListener("pointercancel", end);
    key.addEventListener("click", async () => { if (TZ.calm || sweeping) return; if (pos > .5) await sweep("key", true); sweep("key"); });
    setup();
    once(box, () => setTimeout(() => sweep("auto"), 300), .35);
    TZ.on("calm", (c) => { if (c && P) side(true); });
  })();

  /* ---------------------------------------------------------------- #river: the beads */
  (function beads() {
    const box = $("beads"), pair = $("beadPair");
    if (!box) return;
    const INDIA = ["hindi", "hinglish", "bengali", "telugu", "marathi", "tamil", "urdu", "gujarati", "kannada", "malayalam", "odia", "punjabi", "nepali", "assamese", "maithili", "santali", "kashmiri", "sindhi", "konkani", "dogri", "manipuri", "bodo", "sanskrit"];
    const links = {};
    $$("#langs a.lang").forEach((a) => { const slug = (a.getAttribute("href") || "").split("/").pop(); links[slug] = a; });
    const langs = INDIA.filter((s) => links[s]).map((slug) => {
      const a = links[slug], ln = a.querySelector(".ln"), le = a.querySelector(".le");
      return { slug, code: a.getAttribute("lang") || "", native: ln ? ln.textContent : slug, name: le ? le.textContent : (ln ? ln.textContent : slug), href: a.getAttribute("href") };
    });
    const caseOf = (name) => (TZ.C.cases || []).find((c) => c.lang === name);
    // two strings: the beads are capsules ON them (each centred on its string where it hangs)
    const half = Math.ceil(langs.length / 2);
    const strands = [langs.slice(0, half), langs.slice(half)].map((group, si) => {
      const st = el("div", "strand"), inner = el("div", "in"), row = el("div", "row");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "string thread"); svg.setAttribute("aria-hidden", "true"); svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "path"));
      inner.appendChild(svg); inner.appendChild(row); st.appendChild(inner); box.appendChild(st);
      const btns = group.map((L) => {
        const b = el("button", "bd" + (caseOf(L.name) ? " has" : ""), L.native);
        b.type = "button"; b.setAttribute("aria-pressed", "false"); b.setAttribute("lang", L.code);
        b.setAttribute("aria-label", L.name);
        b.addEventListener("click", () => pluck(L, b, true));
        row.appendChild(b); b._L = L;
        return b;
      });
      const str = TZ.addString(svg, "river", { max: 20, cy: 18 });
      const S = { st, svg, row, btns, str, sag: 0, W: 1, xs: [] };
      S.shape = function () {
        const sr = svg.getBoundingClientRect();
        S.W = sr.width || 1; S.sag = Math.min(26, S.W * .022);
        S.xs = btns.map((b) => { const r = b.getBoundingClientRect(); return r.left + r.width / 2 - sr.left; });
        const bh = btns[0] ? btns[0].offsetHeight : 36; str.o.cy = bh / 2 - 10 + 10; str.layout();
      };
      S.yAt = (x) => { const u = x / S.W; return S.sag * 4 * u * (1 - u); };
      str.draw = function (flat) {
        if (!this.path) return;
        let d = "";
        for (let i = 0; i < this.N; i++) { const x = Math.min(this.w, i * this.o.sp); d += (i ? "L" : "M") + x.toFixed(1) + " " + (this.cy + S.yAt(x) + (flat || TZ.calm ? 0 : this.ys[i])).toFixed(1); }
        this.path.setAttribute("d", d);
        S.xs.forEach((x, k) => { const i = Math.round(x / this.o.sp); const y = S.yAt(x) + (flat || TZ.calm || !this.ys ? 0 : (this.ys[i] || 0)); btns[k].style.setProperty("--by", y.toFixed(1) + "px"); });
      };
      return S;
    });
    const all = [].concat.apply([], strands.map((S) => S.btns));
    function shapeAll() { strands.forEach((S) => { S.shape(); S.str.draw(true); }); }
    shapeAll();
    window.addEventListener("resize", shapeAll, { passive: true });
    TZ.on("paint", shapeAll);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(shapeAll);
    // the scroll sways them (read, never set)
    let swayRaf = 0;
    window.addEventListener("scroll", () => {
      if (swayRaf || TZ.calm) return;
      swayRaf = requestAnimationFrame(() => {
        swayRaf = 0;
        const r = box.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
        const v = Math.min(1, Math.abs(TZ.scrollV || 0) / 3000);
        if (v > .05) strands.forEach((S) => S.str.kick(S.W * rnd(.2, .8), Math.sign(TZ.scrollV || 1), v * 1.2, 8));
      });
    }, { passive: true });
    let current = null;
    async function pluck(L, b, user) {
      all.forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      const S = strands.find((q) => q.btns.indexOf(b) >= 0), k = S ? S.btns.indexOf(b) : -1;
      if (!TZ.calm && S) S.str.kick(S.xs[k] || 0, 1, 6, 6);
      if (user) track("tz_bead", { lang: L.slug });
      TZ.blip.refresh();
      const c = caseOf(L.name), gen = (current = {});
      pair.textContent = ""; pair.classList.remove("done");
      if (!c) {
        pair.appendChild(el("p", "lbl", L.name));
        const a = el("a", "ghost", (get("river.page") || "{lang} page").replace("{lang}", L.name) + " →"); a.href = L.href;
        a.addEventListener("click", () => track("tz_lang_link", { slug: L.slug }));
        pair.appendChild(a);
        return;
      }
      const lab = el("p", "lbl", c.lang), s = el("p", "said", c.said), w = el("p", "wrote", c.wrote);
      s.setAttribute("lang", L.code); w.setAttribute("lang", L.code === "hi" ? "hi-Latn" : L.code + "-Latn");
      pair.appendChild(lab); pair.appendChild(s); pair.appendChild(w);
      await TZ.scriptFor(s, c.said);
      if (gen !== current) return;
      if (TZ.calm) return;
      pair.classList.add("run");
      const sw = words(s), ww = words(w);
      ww.forEach((x) => x.classList.remove("on"));
      sw.forEach((x, i) => setTimeout(() => x.classList.add("on"), i * 50));
      await sleep(Math.min(600, sw.length * 50) + 240);
      if (gen !== current) return;
      sw.forEach((x) => x.classList.add("gone"));
      await pour(s, w, { color: TZ.CREAM, stagger: 70 });
      pair.classList.add("done");
    }
    // the visitor's own language, lit; it plucks itself once, finished by the time the band is a third in
    const prefer = (navigator.languages || [navigator.language || ""]).map((l) => String(l).toLowerCase().split("-")[0]);
    let lit = langs.findIndex((L) => prefer.indexOf(L.code.split("-")[0]) >= 0 && L.code !== "en");
    if (lit < 0) lit = 0;
    all[lit] && all[lit].setAttribute("aria-pressed", "true");
    once(box, () => {
      if (!TZ.calm) all.forEach((b, i) => { b.animate && b.animate([{ translate: "0 -12px", opacity: .2 }, { translate: "0 0", opacity: 1 }], { duration: 520, delay: Math.min(i * 30, 320), easing: "cubic-bezier(.34,1.64,.64,1)", fill: "backwards" }); });
      setTimeout(() => pluck(langs[lit], all[lit], false), TZ.calm ? 0 : 260);
    }, .05);
    $$("#langs a").forEach((a) => a.addEventListener("click", () => track("tz_lang_link", { slug: (a.getAttribute("href") || "").split("/").pop() })));
    // the other languages, one press away
    const grid = $("langs"), more = $("langsMore"), rest = Math.max(0, $$("#langs a").length - 23);
    if (more && rest) {
      const label = () => setText(more, grid.classList.contains("all") ? (get("river.fewer") || "Fewer languages") : (get("river.more") || "{count} more languages").replace("{count}", rest));
      more.hidden = false; label();
      more.addEventListener("click", () => { const on = grid.classList.toggle("all"); more.setAttribute("aria-expanded", on ? "true" : "false"); label(); if (on) track("tz_chip", { section: "langs", value: "more" }); });
    }
    setText("riverTap", TZ.fine() ? (get("river.tap") || "Tap your language") : (get("river.tapTouch") || get("river.tap") || "Tap your language"));
  })();

  /* ---------------------------------------------------------------- #apps: the chips, the saboteur */
  (function apps() {
    const host = $("fields"), pairEl = $("fieldPair");
    const F = (TZ.C.apps && TZ.C.apps.fields) || [];
    const seen = {}, picks = [];
    F.forEach((f) => { if (!f || !f.app) return; if (!seen[f.app] || (!seen[f.app].say && f.say)) { if (!seen[f.app]) picks.push(f.app); seen[f.app] = f; } });
    const chips = picks.map((app, i) => {
      const b = el("button", "chip", app); b.type = "button"; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => { show(i, true); });
      host.appendChild(b);
      return b;
    });
    let cur = -1;
    async function show(i, user) {
      if (i === cur) return;
      cur = i;
      chips.forEach((c, k) => c.setAttribute("aria-pressed", k === i ? "true" : "false"));
      const f = seen[picks[i]];
      if (user) track("tz_chip", { section: "apps", value: f.app });
      pairEl.textContent = "";
      pairEl.appendChild(el("span", "to", f.to ? f.to : f.app));
      let s = null;
      if (f.say) { s = el("p", "said", f.say); s.setAttribute("lang", /[ऀ-ॿ]/.test(f.say) ? "hi" : "hi-Latn"); pairEl.appendChild(s); await TZ.scriptFor(s, f.say); }
      const w = el("p", "wrote", f.text); pairEl.appendChild(w);
      if (!s || TZ.calm) return;
      pairEl.classList.add("run"); pairEl.classList.remove("done");
      words(s).forEach((x) => x.classList.add("on"));
      words(w);
      await pour(s, w, { color: TZ.INK, flight: 460 });
      pairEl.classList.add("done");
    }
    once(host, () => show(0, false), .35);

    // THE SABOTEUR (W10): autocorrect, as it treats Hinglish. Local only.
    const sab = $("saboteur"), input = $("sabInput"), showEl = $("sabShow"), sayB = $("sabSay"), clean = $("sabClean"), after = $("sabAfter");
    const S = (TZ.C.phone && TZ.C.phone.saboteur) || {};
    const fixes = S.fixes || {};
    let bad = 0, shaken = false, typing = false;
    const fixWord = (w) => { const k = w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""); return fixes[k] ? w.replace(new RegExp(k, "i"), fixes[k]) : null; };
    function render() {
      const v = input.value;
      showEl.textContent = "";
      v.split(/(\s+)/).forEach((p) => {
        if (!p) return;
        const k = p.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
        const isBad = Object.keys(fixes).some((f) => fixes[f].toLowerCase() === k);
        if (isBad) showEl.appendChild(el("span", "bad", p)); else showEl.appendChild(doc.createTextNode(p));
      });
      // it wraps (a phone shows the whole joke): the field grows with its words
      if (!CSS.supports || !CSS.supports("field-sizing", "content")) { input.style.setProperty("height", "auto"); input.style.setProperty("height", Math.max(52, input.scrollHeight) + "px"); }
    }
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
    /** Autocorrect at a word's end: the word just finished, "fixed". */
    function correct() {
      const v = input.value, m = /(\S+)(\s|,)$/.exec(v);
      if (!m) { render(); return; }
      const word = m[1].replace(/,$/, ""), f = fixWord(word);
      if (f && f !== word) {
        const at = v.length - m[0].length;
        input.value = v.slice(0, at) + m[0].replace(word, f);
        bad++;
        if (bad === 3 && !shaken) { shaken = true; if (!TZ.calm) { sab.classList.remove("shake"); void sab.offsetWidth; sab.classList.add("shake"); } TZ.blip.mood("oops", 1100); vibrate(20); }
      }
      render();
    }
    input.addEventListener("input", () => { if (!typing) correct(); });
    async function autotype() {
      const text = S.typed || input.value;
      if (TZ.calm) { input.value = text.split(/(\s+)/).map((w) => fixWord(w) || w).join(""); render(); return; }
      typing = true; input.value = ""; render();
      for (let i = 0; i < text.length; i++) {
        if (doc.activeElement === input) { typing = false; return; }
        input.value += text[i];
        if (/[\s,]/.test(text[i])) { typing = false; correct(); typing = true; } else render();
        await sleep(60);
      }
      input.value += " "; typing = false; correct(); input.value = input.value.trimEnd(); render();
    }
    // the joke's full height is held from the start: the field never grows under the reader as it types
    // itself (on a phone it wraps to a second line while the page scrolls on: CLS); a visitor's longer text still grows it
    function reserve() {
      if (typing || doc.activeElement === input) return;
      const v = input.value;
      input.value = S.typed || v; input.style.removeProperty("min-height"); render();
      const h = input.offsetHeight;
      input.value = v; render();
      if (h) input.style.setProperty("min-height", h + "px");
    }
    reserve();
    input.value = ""; render();
    TZ.on("resize", reserve);
    once(sab, autotype, .35);
    sayB.addEventListener("click", async () => {
      track("tz_saboteur", {});
      clean.textContent = S.wrote || "";
      after.hidden = false;
      TZ.blip.mood("done", 1200);
      if (TZ.calm) return;
      sab.classList.add("run"); sab.classList.remove("done");
      const pts = TZ.sample(showEl, 3, 500);
      showEl.classList.add("gone-all");
      showEl.animate && showEl.animate([{ opacity: 1 }, { opacity: .25 }], { duration: 260, fill: "forwards" });
      words(clean);
      await pour(null, clean, { sources: pts, color: TZ.CREAM });
      sab.classList.add("done");
    });
    TZ.on("calm", (c) => { if (c) render(); });
  })();

  /* ---------------------------------------------------------------- #films: the reel, the race */
  (function films() {
    const reel = $("reel"), prog = $("reelProg");
    if (!reel) return;
    const cards = () => $$(":scope > *", reel);
    const step = (dir) => {
      const c = cards(), w = c[0] ? c[0].getBoundingClientRect().width + parseFloat(getComputedStyle(reel).columnGap || "24") : 320;
      reel.scrollBy({ left: dir * w, behavior: TZ.calm ? "auto" : "smooth" });
    };
    $("reelPrev").addEventListener("click", () => step(-1));
    $("reelNext").addEventListener("click", () => step(1));
    let pr = 0;
    reel.addEventListener("scroll", () => { if (pr) return; pr = requestAnimationFrame(() => { pr = 0; const m = reel.scrollWidth - reel.clientWidth; prog.style.setProperty("--p", m > 0 ? (reel.scrollLeft / m).toFixed(3) : "0"); }); }, { passive: true });
    prog.style.setProperty("--p", "0");
    TZ.on("reel", (v) => { TZ.reelBest = v; TZ.blip.refresh(); });

    // THE RACE (W11): beat 2.6 s. Nothing is stored.
    const input = $("raceInput"), out = $("raceOut"), noteEl = $("raceNote"), field = input.parentNode;
    const trkS = $("trkSaid").querySelector("i"), trkY = $("trkYou").querySelector("i");
    const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
    let t0 = 0, running = false, finished = false;
    const paintRace = () => { setText("trkSaidLab", get("race.said") || "Said"); setText("trkYouLab", get("race.you") || "You"); if (get("race.placeholder")) input.placeholder = get("race.placeholder"); };
    paintRace(); TZ.on("paint", paintRace);
    // on one clock (10 s across): said is done at 2.6; yours runs while you type
    const setTrk = (el2, p) => el2.style.setProperty("--p", clamp(p, 0, 1).toFixed(4));
    input.addEventListener("input", () => {
      field.classList.toggle("typed", !!input.value);
      const target = norm(get("race.line") || $("raceLine").textContent);
      if (!running && !finished && input.value) { running = true; t0 = performance.now(); noteEl.textContent = ""; sched.add(tick); }
      if (running && norm(input.value) === target) {
        running = false; finished = true;
        const secs = (performance.now() - t0) / 1000;
        out.textContent = secs.toFixed(1) + " s";
        const you = get("race.you") || "You", said = get("race.said") || "Said";
        say(you + ": " + secs.toFixed(1) + " s. " + said + ": 2.6 s.");
        noteEl.textContent = get("race.note") || "";
        track("tz_race", { bucket: secs < 3 ? "<3" : secs < 6 ? "3-6" : secs < 10 ? "6-10" : ">10" });
      }
      if (!input.value && !running) { finished = false; out.textContent = "0.0 s"; noteEl.textContent = ""; setTrk(trkY, 0); setTrk(trkS, .26); }
    });
    function tick() {
      if (!running) return false;
      const e = (performance.now() - t0) / 1000;
      out.textContent = e.toFixed(1) + " s";
      setTrk(trkY, e / 10); setTrk(trkS, TZ.calm ? .26 : Math.min(2.6, e) / 10);
      return true;
    }
  })();

  /* ---------------------------------------------------------------- #tone: the dial */
  (function tone() {
    const dial = $("toneDial"), ticks = $("toneTicks"), segs = $("toneSegs"), outEl = $("toneOut"), name = $("toneName"), grid = $("toneGrid");
    if (!dial) return;
    let tones = [], idx = 0, knob = { x: 0, v: 0 }, target = 0, turned = false;
    const SPAN = 270;
    // on phones the cards are a snap rail: a scroller the keyboard can reach (its arrow keys scroll it), named by the h2
    const rail = () => {
      if (!grid) return;
      if (grid.scrollWidth > grid.clientWidth + 2) { grid.tabIndex = 0; grid.setAttribute("role", "group"); grid.setAttribute("aria-labelledby", "toneTitle"); }
      else { grid.removeAttribute("tabindex"); grid.removeAttribute("role"); grid.removeAttribute("aria-labelledby"); }
    };
    rail(); TZ.on("resize", rail);
    function list() {
      const T = ((TZ.C.tone && TZ.C.tone.tones) || []).slice(0, 6).map((t) => ({ name: t.name, text: t.text }));
      if (TZ.pirate && TZ.C.tone && TZ.C.tone.pirate) T.push({ name: "Pirate", text: TZ.C.tone.pirate, secret: true });
      return T;
    }
    const angle = (i) => -SPAN / 2 + i * SPAN / Math.max(1, (TZ.pirate ? 6 : 5));
    function build() {
      tones = list();
      ticks.textContent = "";
      tones.forEach((t, i) => {
        const k = el("i", t.secret ? "secret" : ""); k.style.setProperty("--a", angle(i) + "deg"); ticks.appendChild(k);
        const n = el("b", t.secret ? "secret" : "", t.name.slice(0, 2)); n.style.setProperty("--a", angle(i) + "deg"); n.setAttribute("aria-hidden", "true"); ticks.appendChild(n);
      });
      dial.classList.toggle("pirate", !!TZ.pirate);
      dial.setAttribute("aria-valuemax", String(tones.length - 1));
      segs.textContent = "";
      segs.setAttribute("role", "slider"); segs.tabIndex = 0; segs.setAttribute("aria-label", dial.getAttribute("aria-label") || "Tone");
      segs.setAttribute("aria-valuemin", "0"); segs.setAttribute("aria-valuemax", String(tones.length - 1));
      tones.forEach((t, i) => { const b = el("i", null, t.name); b.addEventListener("click", () => select(i, true)); segs.appendChild(b); });
      paintSel(false);
    }
    function paintSel(animate) {
      const t = tones[idx]; if (!t) return;
      [dial, segs].forEach((d) => { d.setAttribute("aria-valuenow", String(idx)); d.setAttribute("aria-valuetext", t.name); });
      $$("i", ticks).forEach((k, i) => k.classList.toggle("on", i === idx));
      $$("b", ticks).forEach((k, i) => k.classList.toggle("on", i === idx));
      // phones: the cards are a rail; the chosen one slides in (the rail scrolls, the page never does)
      const card = $$(".tcard", grid)[idx];
      if (card && grid.scrollWidth > grid.clientWidth + 4) grid.scrollTo({ left: Math.max(0, card.offsetLeft - grid.offsetLeft - parseFloat(getComputedStyle(grid).paddingLeft || 0)), behavior: TZ.calm || !animate ? "auto" : "smooth" });
      $$("i", segs).forEach((b, i) => b.classList.toggle("on", i === idx));
      $$(".tcard", grid).forEach((c, i) => c.setAttribute("aria-current", i === idx ? "true" : "false"));
      setText(name, t.name);
      target = angle(idx);
      if (TZ.calm || !animate) { knob.x = target; knob.v = 0; dial.style.setProperty("--rot", target + "deg"); }
      else sched.add(spin);
    }
    function spin(t, dt) {
      TZ.springStep(knob, target, "pull-in", dt);
      dial.style.setProperty("--rot", knob.x.toFixed(2) + "deg");
      return Math.abs(knob.x - target) > .05 || Math.abs(knob.v) > .05;
    }
    let outGen = 0;
    async function select(i, user) {
      i = clamp(i, 0, tones.length - 1);
      if (i === idx && outEl.textContent === tones[i].text) return;
      idx = i; paintSel(true);
      vibrate(8);
      if (user) { turned = true; track("tz_chip", { section: "tone", value: tones[i].name }); }
      TZ.blip.mood("confirm", 700);
      const g = ++outGen, t = tones[i];
      if (TZ.calm) { outEl.textContent = t.text; if (t.secret) tagPirate(); return; }
      // the line dissolves into dots and re-forms in that voice
      const ghost = outEl.cloneNode(true); ghost.removeAttribute("id"); ghost.setAttribute("aria-hidden", "true");
      const r = outEl.getBoundingClientRect(), pr = outEl.offsetParent ? outEl.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
      void pr; void r;
      const pts = TZ.sample(outEl, 3, 700);
      outEl.textContent = t.text;
      if (t.secret) tagPirate();
      const tw = words(outEl);
      if (g !== outGen) return;
      outEl.classList.add("run"); outEl.classList.remove("done");
      await pour(null, outEl, { sources: pts, color: TZ.INK, plan: { wrote: tw.map(() => ({ k: "fix" })), said: [] } });
      if (g === outGen) outEl.classList.add("done");
    }
    function tagPirate() { const tg = el("span", "tag lbl", "Tone: pirate · an example of the app's Pirate voice"); outEl.insertBefore(tg, outEl.firstChild); }
    // keys: arrows, Home, End
    const keys = (e) => {
      const k = e.key; let n = null;
      if (k === "ArrowRight" || k === "ArrowUp") n = idx + 1; else if (k === "ArrowLeft" || k === "ArrowDown") n = idx - 1; else if (k === "Home") n = 0; else if (k === "End") n = tones.length - 1;
      if (n === null) return; e.preventDefault(); select(n, true);
    };
    dial.addEventListener("keydown", keys); segs.addEventListener("keydown", keys);
    // the pointer: turn it; it snaps to detents on the pull-in spring
    let drag = false;
    function angleAt(e) {
      const r = dial.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let a = Math.atan2(e.clientX - cx, cy - e.clientY) * 180 / Math.PI;
      return clamp(a, -SPAN / 2, SPAN / 2);
    }
    dial.addEventListener("pointerdown", (e) => { drag = true; dial.setPointerCapture && dial.setPointerCapture(e.pointerId); dial.focus({ preventScroll: true }); move(e); });
    function move(e) {
      if (!drag) return;
      const a = angleAt(e), st = SPAN / Math.max(1, tones.length - 1);
      const n = Math.round((a + SPAN / 2) / st);
      if (!TZ.calm) { knob.x = a; dial.style.setProperty("--rot", a + "deg"); }
      if (n !== idx) select(n, true);
    }
    dial.addEventListener("pointermove", move);
    const up = () => { if (!drag) return; drag = false; target = angle(idx); sched.add(spin); };
    dial.addEventListener("pointerup", up); dial.addEventListener("pointercancel", up);
    build();
    TZ.on("pirate", () => { build(); });
    TZ.on("paint", () => { if (!tones.length) build(); });
    once(dial.offsetParent ? dial : segs, () => { if (!TZ.calm) setTimeout(() => { if (!turned) select(1, false); }, 300); }, .35);
  })();

  /* ---------------------------------------------------------------- #desk: the app's pill, the meeting */
  (function desk() {
    const stage = $("deskStage"), typed = $("deskTyped"), listenB = $("deskListen"), liveNote = $("deskLiveNote");
    if (!stage) return;
    let frame = null, ready = null, busy = false, ran = false;
    function ensure() {
      if (frame) return ready;
      const p = TZ.pillFrame(stage, "");
      frame = p.f; frame.id = "deskPill"; ready = p.ready;
      fit(); window.addEventListener("resize", fit, { passive: true });
      return ready;
    }
    const tell = (m) => TZ.tellPill(frame, m);
    // The pill at the stage's scale: the frame's own window is the "screen",
    // drawn 1.6× (CSS zoom on px sizes, the same in every engine) so the
    // app's real pill reads on a stage that stands for a whole desktop.
    function fit() {
      if (!frame) return;
      const Z = mqPhone.matches ? 1.25 : 2.2, w = stage.clientWidth, h = stage.clientHeight * .3;
      frame.classList.toggle("z", "zoom" in frame.style);
      frame.style.setProperty("zoom", String(Z));
      frame.style.setProperty("width", (w / Z).toFixed(1) + "px"); frame.style.setProperty("height", (h / Z).toFixed(1) + "px");
    }
    const SAID = "um so like can we push the call to…";
    async function run(how) {
      if (busy) return;
      busy = true; TZ.deskOpen = true;
      await ensure();
      const caseSaid = get("comb.said") || "um so like can we push the call to four";
      const k = (TZ.C.cases || []).find((c) => c.said === caseSaid);
      const wrote = (k && k.wrote) || "Can we push the call to four?";
      typed.textContent = "";
      TZ.blip.go("desk"); TZ.blip.mood("listening");
      tell({ pill: { state: "rest", hint: "", rest: true } });
      await sleep(TZ.calm ? 0 : 330);
      tell({ pill: { state: "listening" } });
      const live = TZ.micLive && TZ.micLive();
      const lv = setInterval(() => {
        const L = TZ.micBands ? TZ.micBands() : null;
        const b = []; for (let i = 0; i < 16; i++) b.push(L ? L[i % L.length] : .35 + .5 * Math.abs(Math.sin(performance.now() / 90 + i)));
        tell({ level: { bands: b } });
      }, 60);
      const ws = SAID.split(" ");
      for (let i = 1; i <= ws.length; i++) { tell({ pill: { state: "caption", text: ws.slice(0, i).join(" ") } }); await sleep(TZ.calm ? 20 : 170); if (i === 4) tell({ pill: { state: "flash" } }); }
      await sleep(TZ.calm ? 50 : 500);
      clearInterval(lv);
      tell({ level: { bands: Array(16).fill(0) } });
      tell({ pill: { state: "writing" } });
      // it lands at the caret, a word at a time, and Blip reads over the field
      const W = wrote.split(" ");
      for (let i = 1; i <= W.length; i++) { typed.textContent = W.slice(0, i).join(" "); TZ.blip.refresh(); TZ.blip.inst && TZ.blip.inst.nod(); await sleep(TZ.calm ? 0 : 85); }
      tell({ pill: { state: "done", words: W.length } });
      TZ.blip.mood("done", 900);
      await sleep(TZ.calm ? 200 : 1400);
      // back to the app's rest pill, shown: a dark sliver at the stage's foot that opens on hover and takes a press
      tell({ pill: { state: "rest", hint: fine() ? (get("desk.hint") || "Tap Ctrl twice to talk") : "", rest: true } });
      busy = false; TZ.deskOpen = false;
      void live; void how;
    }
    TZ.deskTry = (how) => run(how);
    // the pill itself is a button, as in the app: a press at rest starts it (on phones, the tap)
    window.addEventListener("message", (e) => {
      if (!frame || e.source !== frame.contentWindow || e.origin !== location.origin) return;
      const m = e.data || {};
      if (m.pill === "action" && m.a === "start" && !busy) { track("tz_pill_try", { how: "pill" }); run("pill"); }
    });
    // phones have no Ctrl: the keycap says what it does
    if (!fine()) {
      const k = $("deskKeys"), kb = $$("kbd", k);
      setText(kb[0], get("desk.tryTouch") || "Try the pill"); kb.slice(1).forEach((x) => x.remove());
      const hl = $("deskTryLine"); if (hl) hl.hidden = true;
      k.removeAttribute("aria-describedby"); k.classList.add("touch");
    }
    $("deskKeys").addEventListener("click", () => { $$("#deskKeys kbd").forEach((k, i) => setTimeout(() => { k.classList.add("down"); setTimeout(() => k.classList.remove("down"), 110); }, i * 130)); track("tz_pill_try", { how: "button" }); run("button"); });
    inView(stage, (on) => { if (on) ensure(); }, 0);
    once(stage, () => { if (!ran) { ran = true; setTimeout(() => run("auto"), 400); } }, .8);
    // "Let it hear you": the level only (js/mic.js)
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { listenB.hidden = true; setText(liveNote, ""); }
    else listenB.addEventListener("click", () => TZ.loadMic().then((m) => m && m.toggleDesk(listenB, liveNote, run)));

    // a phone: "Send this to my laptop" (the share sheet, or the link copied), and Other devices
    const share = $("deskShare"), shareB = $("deskShareBtn"), URL_DL = "https://tailzu.space/download";
    if (share && (navigator.share || (navigator.clipboard && navigator.clipboard.writeText))) {
      document.documentElement.classList.add("can-share");
      shareB.addEventListener("click", async () => {
        track("tz_cta_click", { place: "desk-share", kind: "share" });
        try {
          if (navigator.share) { await navigator.share({ title: "Tailzu", text: get("desk.shareText") || "Tailzu for my laptop", url: URL_DL }); return; }
        } catch (e) { if (e && e.name === "AbortError") return; }
        try { await navigator.clipboard.writeText(URL_DL); toast(get("desk.copied") || "Link copied. Open it on your laptop."); } catch (e) { toast(URL_DL); }
      });
    }

    // THE MEETING (W13): as the transcript passes, the small talk is bleeped
    const list = $("deskNotes"), kept = $("bleep");
    function bars() {
      $$("li", list).forEach((li) => {
        if (li.querySelector(".bar, .pt")) return;
        const t = li.textContent;
        if (li.classList.contains("point")) { li.textContent = ""; const pt = el("span", "pt", t); pt.setAttribute("data-tag", get("comb.kept") || "Kept"); li.appendChild(pt); return; }
        const w = t.split(" ");
        if (w.length < 3) return;
        li.textContent = "";
        li.appendChild(doc.createTextNode(w[0] + " "));
        const mid = el("span", "mid", w.slice(1, -1).join(" ")), b = el("span", "bar"); b.setAttribute("aria-hidden", "true"); mid.appendChild(b);
        li.appendChild(mid); li.appendChild(doc.createTextNode(" " + w[w.length - 1]));
      });
    }
    bars();
    TZ.on("paint", bars);
    let br = 0;
    function bleep() {
      br = 0;
      const lis = $$("li:not(.point)", list), r = list.getBoundingClientRect();
      const p = TZ.calm ? 1 : clamp((innerHeight * .8 - r.top) / (r.height + innerHeight * .1), 0, 1);
      lis.forEach((li, k) => { const b = li.querySelector(".bar"); if (b) b.style.setProperty("--b", clamp(p * (lis.length + 1) - k, 0, 1).toFixed(3)); });
      kept.classList.toggle("on", p > .92); list.classList.toggle("kept", p > .92);
    }
    window.addEventListener("scroll", () => { if (!br) br = requestAnimationFrame(bleep); }, { passive: true });
    TZ.on("calm", bleep);
    bleep();
  })();

  /* ---------------------------------------------------------------- #llm, #dev: the tabs, the prompt */
  (function llm() {
    const tabs = $("llmTabs"), panel = $("llmPanel"), heard = $("llmHeard"), text = $("llmText");
    if (!tabs) return;
    let i = 0, timer = 0, touched = false, visible = false, gen = 0;
    const btns = () => $$('[role="tab"]', tabs);
    async function select(n, user, focus) {
      const B = btns(); if (!B.length) return;
      n = (n + B.length) % B.length;
      i = n;
      B.forEach((b, k) => { b.setAttribute("aria-selected", k === n ? "true" : "false"); b.tabIndex = k === n ? 0 : -1; });
      panel.setAttribute("aria-labelledby", B[n].id);
      if (focus) B[n].focus();
      if (user) { touched = true; clearInterval(timer); track("tz_chip", { section: "llm", value: B[n].textContent }); }
      const L = TZ.C.llm || {}, p = (L.prompts && L.prompts[n]) || L;
      setText("llmName", (L.targets || [])[n]);
      const g = ++gen;
      TZ.llmBusy = true;
      heard.textContent = p.said || ""; text.textContent = p.wrote || "";
      if (TZ.calm) { TZ.llmBusy = false; return; }
      panel.classList.add("run"); panel.classList.remove("done");
      words(heard).forEach((w, k) => setTimeout(() => w.classList.add("on"), k * 50));
      words(text);
      await sleep(Math.min(700, words(heard).length * 50 + 200));
      if (g !== gen) return;
      words(heard).forEach((w) => w.classList.add("gone"));
      await pour(heard, text, { color: TZ.CREAM });
      if (g === gen) { panel.classList.add("done"); TZ.llmBusy = false; }
    }
    tabs.addEventListener("click", (e) => { const b = e.target.closest('[role="tab"]'); if (b) select(btns().indexOf(b), true); });
    tabs.addEventListener("keydown", (e) => {
      const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: btns().length - 1 }[e.key];
      if (n === undefined) return; e.preventDefault(); select(n, true, true);
    });
    function auto() {
      clearInterval(timer);
      if (touched || TZ.calm || !visible) return;
      timer = setInterval(() => { if (!visible || TZ.calm || touched || doc.hidden) { clearInterval(timer); return; } select(i + 1, false); }, 6000);
    }
    inView(panel, (on) => { visible = on; if (on) auto(); else clearInterval(timer); }, .4);
    once(panel, () => { if (!touched) select(0, false); }, .4);
    TZ.on("calm", (c) => { if (c) clearInterval(timer); });
    // #dev: one instruction, poured into the editor once
    const dh = $("devHeard"), dt = $("devText");
    once(dt, async () => {
      if (TZ.calm) return;
      TZ.devBusy = true;
      const ed = dt.closest(".editor");
      ed.classList.add("run"); ed.classList.remove("done");
      words(dh).forEach((w, k) => setTimeout(() => w.classList.add("on"), k * 45));
      words(dt);
      await sleep(600);
      words(dh).forEach((w) => w.classList.add("gone"));
      await pour(dh, dt, { color: "207,227,184" });
      ed.classList.add("done"); TZ.devBusy = false;
    }, .4);
  })();

  /* ---------------------------------------------------------------- #ask: only when the flag says so */
  (function ask() {
    const sec = $("ask");
    if (!sec) return;
    let painted = false, frame = null, runI = 0, played = false;
    function paint() {
      const flag = TZ.site.ask;
      if (flag !== "soon" && flag !== "live") return;
      const A = TZ.C.ask || {};
      setText("askTag", flag === "live" ? A.live : A.soon);
      TZ.paintTitle($("askTitle"), A.title, A.human, false);
      setText("askLede", A.lede);
      const note = $("askNote"); if (flag === "soon") setText(note, A.note); else note.textContent = "";
      if (painted) return;
      painted = true;
      const lede = $("askLede");
      const pv = el("a", "ghost ask-priv", A.privacy || "What Ask sees, and when"); pv.href = "/privacy"; lede.parentNode.appendChild(pv);
      // the poster: the app's own frame, drawn on (a still, until the preview plays)
      const pic = $("askPoster");
      const lz = (n) => TZ.lazyUrl("/media/" + n);
      const P = doc.createElement("picture");
      const s = doc.createElement("source"); s.type = "image/avif"; s.srcset = lz("ask-pic-drawn-960.avif") + " 960w, " + lz("ask-pic-drawn-1440.avif") + " 1440w"; s.sizes = "(max-width: 1120px) 100vw, 1120px";
      const im = doc.createElement("img"); im.alt = A.preview || ""; im.src = lz("ask-pic-drawn-960.webp"); im.srcset = lz("ask-pic-drawn-960.webp") + " 960w, " + lz("ask-pic-drawn-1440.webp") + " 1440w"; im.sizes = s.sizes; im.loading = "lazy";
      P.appendChild(s); P.appendChild(im); pic.appendChild(P);
      const play = $("askPlay"); setText(play, A.play); play.hidden = false;
      play.addEventListener("click", () => { open(); runNext("picture"); });
      const runs = $("askRuns"); runs.textContent = "";
      (A.runs || []).forEach((r) => { const b = el("button", "chip", r.label); b.type = "button"; b.addEventListener("click", () => { open(); runNext(r.id, b); }); runs.appendChild(b); });
      if (flag === "live") {
        const pills = $("askPills");
        $$("#deskPills .pill").slice(0, 3).forEach((p) => { if (/win|mac/.test(p.dataset.os)) pills.appendChild(p.cloneNode(true)); });
      }
      const io = new IntersectionObserver((es) => es.forEach((en) => {
        if (en.intersectionRatio >= .5 && fine() && !TZ.saveData && !played) { played = true; open(); setTimeout(() => runNext("picture"), 600); }
      }), { threshold: [.5] });
      io.observe($("askStage"));
    }
    function open() {
      if (frame) return;
      frame = el("iframe"); frame.id = "askFrame"; frame.title = (TZ.C.ask || {}).preview || "Ask, a preview";
      const u = TZ.lazyUrl("/demo/ask.html");
      frame.src = u + (TZ.calm ? (u.indexOf("?") >= 0 ? "&" : "?") + "calm=1" : "");
      // ready from its own load, whoever asks for a run, and whenever (a frame that loads before
      // the first run is asked for would otherwise never hear one)
      frame.addEventListener("load", () => { frame._ready = true; }, { once: true });
      $("askStage").appendChild(frame);
      $("askPlay").hidden = true;
      TZ.blip.go("ask");
    }
    function runNext(id, chip) {
      const R = (TZ.C.ask && TZ.C.ask.runs) || [];
      if (!id) { id = (R[runI % Math.max(1, R.length)] || {}).id || "picture"; runI++; }
      track("tz_ask_run", { run: id });
      const go = () => { try { frame.contentWindow.postMessage({ run: id, calm: !!TZ.calm }, location.origin); } catch (e) { /* none */ } };
      if (frame._ready) go(); else frame.addEventListener("load", () => setTimeout(go, 200), { once: true });
      if (chip) { $$("#askRuns .chip").forEach((c) => c.classList.toggle("playing", c === chip)); }
    }
    TZ.on("frame", (e) => { if (frame && e.source === frame.contentWindow && e.data && e.data.done) { $$("#askRuns .chip.playing").forEach((c) => { c.classList.remove("playing"); }); } });
    TZ.on("alt2", () => {
      const r = sec.getBoundingClientRect();
      if (!sec.hidden && r.top < innerHeight && r.bottom > 0) { open(); runNext(); }
      else toast((TZ.C.ask || {}).egg);
    });
    TZ.on("site", paint);
    paint();
  })();

  /* ---------------------------------------------------------------- #questions: Blip reads over your shoulder */
  (function questions() {
    const faq = $("faq");
    if (!faq) return;
    faq.addEventListener("pointerover", (e) => {
      if (!fine() || TZ.calm) return;
      const qa = e.target.closest(".qa");
      if (qa && qa !== TZ.qaHover) { TZ.qaHover = qa; TZ.blip.refresh(); }
    });
  })();

  /* ---------------------------------------------------------------- #free: the finale */
  (function finale() {
    const box = $("finale"), no = $("finaleNo"), yes = $("finaleYes"), fine2 = $("finaleFine"), thrSvg = $("finaleThread");
    if (!box) return;
    const S = { x: 0, v: 0 };
    let target = 0, shut = false;
    const thread = PS.createThread(), path = thrSvg.querySelector("path");
    function measure() {
      const W = box.getBoundingClientRect().width, nw = no.querySelector(".disc").getBoundingClientRect().width, yw = yes.getBoundingClientRect().width - (yes._pill ? (yes._pill.full ? 0 : yes._pill.gap) : 0);
      if (mqPhone.matches) { box.style.setProperty("--dn", "0px"); box.style.setProperty("--dy", "0px"); return; }
      // at rest one whole pill, where the eye already is (left, under the h2); it comes apart edge to edge
      const left = 0; void yw;
      box.style.setProperty("--dn", left.toFixed(1) + "px");
      // the link's right edge sits at the box's right less its own reserve
      const yLeftFinal = W - yes.getBoundingClientRect().width, yLeftJoined = left + nw;
      box.style.setProperty("--dy", (yLeftJoined - yLeftFinal).toFixed(1) + "px");
    }
    function draw(t) {
      const e = S.x;
      box.style.setProperty("--e", Math.max(0, e).toFixed(4));
      const br = box.getBoundingClientRect(), nr = (mqPhone.matches ? no.querySelector(".disc") : no).getBoundingClientRect(), yr = yes.querySelector(".pb").getBoundingClientRect();
      const x1 = nr.right - br.left, x2 = yr.left - br.left, cy = br.height / 2;
      if (x2 - x1 < 4) { path.setAttribute("d", ""); return; }
      const pts = thread.points(x1, x2, cy, t, 64, TZ.calm ? null : PS.tremor(Math.floor(t * 12), .4), TZ.calm ? { amp: 0, sag: 0 } : {});
      path.setAttribute("d", "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L"));
    }
    function job(t, dt) {
      if (TZ.calm) { S.x = target; S.v = 0; } else PS.spring(S, target, null, dt);
      thread.step(dt, [], false, {});
      draw(t);
      const moving = PS.springMoving(S, target) || thread.energy() > .05;
      if (!moving || (!job._b && Math.abs(S.x - target) < .02)) { job._b = true; TZ.blip.refresh(); }   // Blip takes its seat once the halves are where they go
      if (moving && Math.abs(S.x - target) > .1) job._b = false;
      return moving;
    }
    function split() {
      if (shut) return;
      if (mqPhone.matches) {
        // a phone has no edges to spare: the pill opens in its own box, once (900 ms), and snaps home ringing
        const p = yes._pill; if (!p || TZ.calm) return;
        p.teach = true; p.wake(); setTimeout(() => { p.teach = false; p.thread.pluck(1, { amp: 6 }); p.wake(); }, 900);
        return;
      }
      target = 1; thread.pluck(1); sched.add(job); TZ.blip.refresh();
    }
    measure(); draw(0);
    window.addEventListener("resize", () => { measure(); draw(0); }, { passive: true });
    once(box, () => setTimeout(split, 120), .4);
    if (TZ.calm) { S.x = 1; target = 1; measure(); draw(0); }
    no.addEventListener("click", () => {
      // the pill slides home under a still pointer: it does not split for that pointer until it leaves
      const p = yes._pill; if (p) { p.mute = true; p.hover = false; p.wake(); }
      shut = true; target = 0; thread.pluck(1); sched.add(job);
      setText(fine2, get("free.fine"));
      TZ.blip.mood("done", 900);
    });
    TZ.on("calm", () => { measure(); sched.add(job); });

    // THE EARNED SECRET (W14): a line that exists only if you spoke (or typed hi)
    const sec = $("secret"), sayB = $("secretSay"), sayLab = $("secretSayLab"), typeB = $("secretType");
    function reveal(how) {
      if (sec.classList.contains("got")) return;
      sec.classList.add("got");
      egg("secret");
      const line = $("secretLine");
      // typed, it says so: the typed path has its own line
      setText(line, how === "type" ? (get("free.typed") || get("free.heard")) : get("free.heard"));
      TZ.blip.mood("done", 1400);
      if (!TZ.calm) { line.classList.add("run"); const ws = words(line); ws.forEach((w, i) => setTimeout(() => w.classList.add("on"), i * 70)); setTimeout(() => line.classList.add("done"), ws.length * 70 + 300); }
      say(line.textContent);
      void how;
    }
    TZ.secretReveal = (how) => { const r = sec.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) reveal(how); };
    typeB.addEventListener("click", () => reveal("type"));
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      sayB.hidden = false; sayLab.hidden = false;
      sayB.setAttribute("aria-labelledby", "secretSayLab");
      sayB.addEventListener("click", () => TZ.loadMic().then((m) => m && m.toggleSecret(sayB, () => reveal("voice"))));
    }
    once(sec, () => { if (TZ.heardVoice) reveal("voice"); }, .2);
    TZ.on("voice", () => { const r = sec.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) reveal("voice"); });
  })();

  /* ---------------------------------------------------------------- the knot (W16) */
  (function knot() {
    const k = $("knot");
    if (!k) return;
    const cord = k.querySelector(".cord");
    let y0 = null, pull = { x: 0, v: 0 }, target = 0, pulled = false, moved = false;
    function rewind() {
      egg("knot");
      if (TZ.spineTaut) TZ.spineTaut(TZ.calm ? 0 : 1100);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: TZ.calm ? "auto" : "smooth" });
        const h = $("hero"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      }, TZ.calm ? 0 : 420);
    }
    function paint() {
      const d = pull.x;
      k.style.setProperty("--pull", d.toFixed(1) + "px");
      k.style.setProperty("--tight", (1 - Math.min(.22, d / 160)).toFixed(3));
      // the cord stays tied to the spine above as the knot is pulled down: the thread stretches
      cord.setAttribute("d", "M12 " + (-d / (k.offsetHeight / 84 || 1)).toFixed(1) + "V26");
    }
    function spring(t, dt) {
      TZ.springStep(pull, target, "pull-in", dt); paint();
      return Math.abs(pull.x - target) > .2 || Math.abs(pull.v) > .2;
    }
    k.addEventListener("click", () => { if (!moved) rewind(); moved = false; });
    k.addEventListener("pointerdown", (e) => { y0 = e.clientY; moved = false; pulled = false; k.setPointerCapture && k.setPointerCapture(e.pointerId); });
    k.addEventListener("pointermove", (e) => {
      if (y0 === null) return;
      const d = Math.max(0, e.clientY - y0);
      if (d > 3) moved = true;
      // rubber: it gives, then tightens
      pull.x = TZ.calm ? 0 : 64 * (1 - Math.exp(-d / 64)); pull.v = 0; paint();
      if (d > 24 && !pulled) pulled = true;
    });
    const up = () => {
      if (y0 === null) return;
      y0 = null;
      target = 0; sched.add(spring);
      if (pulled) { pulled = false; rewind(); }
    };
    k.addEventListener("pointerup", up); k.addEventListener("pointercancel", up);
  })();

  TZ.emit("sections");
})();
