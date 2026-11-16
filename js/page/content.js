// What the devices show once the bots have gone: the beats, built as DOM over
// the white screen (text, so it stays crisp at whatever size the device is) at
// a fixed design width, scaled to the glass like the phone's status bar.
//
//   the laptop   term  a terminal: Xode installed on a project, the real
//                      install line and the real words install.sh prints
//                meet  a video call, the meeting bot sitting in it with the
//                      others and answering out loud
//   the phone    live  the "Bots at work" Live Activity, done: ready to ship
//                plan  what the meeting came to, waiting to be approved
//
// Each arrives (the terminal types itself, a card drops in, the captions come
// up) and then FREEZES: finished, holding, nothing moving but the cursor and
// the people on the call. The page asks for one of its device's beats
// (`show`), is told when it has finished arriving (`done`), and clears it
// again (`hide`). Under reduced motion a beat is simply there, finished, on
// the frame it is asked for.
import { clamp, reduced, view } from "../util.js";
import { makeDots } from "../blip/dots.js";
import { freshState } from "./crowd.js";
import { makeVignette } from "./vignette.js";

const DW = { desk: 1280, phone: 390 };          // the design width each is drawn at
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const NS = "http://www.w3.org/2000/svg";
const svg = (d, cls) => {
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("viewBox", "0 0 24 24"); if (cls) s.setAttribute("class", cls);
  const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); p.setAttribute("fill", "currentColor");
  s.appendChild(p); return s;
};

// ---- The laptop's terminal ----------------------------------------------------
// `at` is where it is run, `type` is typed a character at a time; `out` is what
// comes back, a line at a time. The words are install.sh's own.
const TERM = [
  { at: "~/apollo", type: "curl -fsSL https://x0bot.com/install.sh | bash", wait: .35 },
  { out: "Installing xode…", wait: .5 },
  { out: "added 1 package in 4s", wait: 1.1, dim: true },
  { out: "Done. In your project's folder, run:", wait: .45 },
  { out: "  xode", wait: .1, lit: true },
  { at: "~/apollo", type: "xode", wait: .5 },
  { prompt: true, wait: .4 },
];
const TYPE = 26;                                 // characters a second

function terminal() {
  const root = el("div", "tm"), bar = el("div", "tm-bar"), body = el("div", "tm-body");
  for (const c of ["a", "b", "c"]) bar.appendChild(el("i", "tm-d tm-" + c));
  bar.appendChild(el("span", "tm-t", "apollo — xode"));
  root.append(bar, body);
  const rows = TERM.map((s) => {
    const row = el("div", "tm-r" + (s.dim ? " tm-dim" : s.lit ? " tm-lit" : ""));
    if (s.at) { row.appendChild(el("span", "tm-at", s.at)); row.appendChild(el("span", "tm-sh", "$")); row.appendChild(el("span", "tm-in", "")); }
    else if (s.prompt) { row.appendChild(el("span", "tm-ps", "›")); row.appendChild(el("b", "tm-cur", "")); }
    else row.appendChild(el("span", "tm-ou", s.out));
    body.appendChild(row);
    return row;
  });
  let i = 0, t = 0, chars = 0;
  return {
    el: root,
    reset() {
      i = 0; t = 0; chars = 0;
      rows.forEach((r, n) => { r.style.display = "none"; if (TERM[n].at) r.lastChild.textContent = ""; });
    },
    finish() {
      i = TERM.length;
      rows.forEach((r, n) => { r.style.display = ""; if (TERM[n].at) r.lastChild.textContent = TERM[n].type; });
    },
    done: () => i >= TERM.length,
    step(dt) {
      if (i >= TERM.length) return;
      const s = TERM[i];
      t += dt;
      if (t < s.wait) return;
      rows[i].style.display = "";
      if (s.type) {
        chars += dt * TYPE;
        const n = Math.min(s.type.length, Math.floor(chars));
        rows[i].lastChild.textContent = s.type.slice(0, n);
        if (n < s.type.length) return;
      }
      i++; t = 0; chars = 0;
    },
  };
}

// ---- The laptop's video call ---------------------------------------------------
// Three people on their cameras and the meeting bot in with them, which is
// where Blip's own face turns up inside the product: it joins the call, listens,
// and answers out loud (TAILZU-BACKEND src/meet). Its one rule in the call is to
// say first what was decided and who does what, which is what it says here. In
// the call it goes by X0, the brand's own name, not by the bot's name in the
// app ("Meetings"): on somebody else's call it is X0 that turned up.
//
// The three are real footage (media/meet, Mixkit's free stock video), muted
// and looping, fetched only when the beat is first asked for so the page's
// first load carries none of it. Behind each one a drawn figure in a lit room
// stands in until (or instead of) the clip: with no network, no autoplay or no
// video at all the tile still reads as somebody on a camera.
const PEOPLE = [
  { n: "Ravi", k: "p1", v: "/media/meet/call-1.mp4" },
  { n: "Tom", k: "p2", v: "/media/meet/call-2.mp4" },
  { n: "Ana", k: "p3", v: "/media/meet/call-3.mp4" },
];
const SAID_IN = [
  { who: "Priya", line: "So — X0, what did we land on?", wait: .9, bot: false },
  { who: "X0", line: "Four follow-up emails, and the cart bug fixed before Friday.", wait: .7, bot: true },
];

/** Blip's face on the call: the figure drawn big and cropped to his head, like a camera on him. */
function botFace() {
  const cv = el("canvas", "mt-face"), g = cv.getContext("2d"), dots = makeDots();
  const st = freshState();
  let W = 0, H = 0, t = 0, talk = 0, tick = 0;
  st.walkK = 0;
  return {
    el: cv,
    /** The tile is w × h design pixels; the canvas is backed at the real ones. */
    fit(w, h, k) {
      W = w; H = h;
      cv.style.width = w + "px"; cv.style.height = h + "px";
      cv.width = Math.max(1, Math.round(w * k * view.dpr)); cv.height = Math.max(1, Math.round(h * k * view.dpr));
      this.draw();
    },
    talking(on) { talk = on ? 1 : 0; },
    step(dt) {
      t += dt;
      // Listening, then answering: his eye wanders, he nods a little as he talks.
      st.bob = Math.sin(t * 1.7) * .006;
      st.look = [Math.sin(t * .8) * .3, .06 + Math.sin(t * .55) * .12];
      st.tilt = .03 * Math.sin(t * .9) + (talk ? .05 * Math.sin(t * 7.5) : 0);
      st.brows = talk ? .6 : .35; st.mouth = talk ? "grin" : "smile";
      if ((tick = (tick + 1) % 2) === 0) this.draw();
    },
    draw() {
      if (!W) return;
      const k = cv.width / Math.max(1, W);
      g.setTransform(k, 0, 0, k, 0, 0);
      g.clearRect(0, 0, W, H);
      // Framed like a camera on him: his head in the upper half, his shoulders
      // coming in at the bottom, the rest of him below the tile.
      const bh = H * 1.75, cell = Math.max(.6, bh / 54);
      dots(g, {
        H: bh, cell, x: W * .5, y: H * .52 + bh * .7, mirror: false, squash: 0, land: 0, air: 0,
        st, t: reduced ? 0 : t, glow: talk ? .55 + .25 * Math.sin(t * 6) : .12, shade: 0,
      });
    },
  };
}

function meeting() {
  const root = el("div", "mt");
  const top = el("div", "mt-top");
  top.append(el("b", "mt-ttl", "Weekly — Growth"), el("span", "mt-clock", "31:04"), el("span", "mt-rec", "REC"));
  const grid = el("div", "mt-grid"), vids = [];
  for (const p of PEOPLE) {
    const tile = el("div", "mt-cam " + p.k), fig = el("span", "mt-fig");
    fig.append(el("i", "mt-sh"), el("i", "mt-nk"), el("i", "mt-hd"), el("i", "mt-hr"));
    const v = el("video", "mt-vid");
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
    v.addEventListener("loadeddata", () => { v.style.opacity = "1"; }, { once: true });
    vids.push([v, p.v]);
    tile.append(el("i", "mt-wall"), el("i", "mt-lamp"), fig, v, el("i", "mt-vg"), el("b", "mt-name", p.n));
    grid.appendChild(tile);
  }
  const face = botFace();
  const bot = el("div", "mt-cam mt-bot");
  const ring = el("i", "mt-ring");
  bot.append(el("i", "mt-bg"), face.el, ring, el("b", "mt-name mt-bn", "X0"));
  grid.appendChild(bot);
  const cc = el("div", "mt-cc"), who = el("span", "mt-who", ""), line = el("span", "mt-line", "");
  cc.append(who, line);
  const bar = el("div", "mt-bar");
  const BTN = [
    ["M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zm7 9a7 7 0 0 1-6 6.93V22h-2v-3.07A7 7 0 0 1 5 12h2a5 5 0 0 0 10 0z", ""],
    ["M4 6h10a2 2 0 0 1 2 2v2.2l4.2-2.6a.6.6 0 0 1 .9.5v7.8a.6.6 0 0 1-.9.5L16 13.8V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z", ""],
    ["M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-7v2h3v2H7v-2h3v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z", ""],
    ["M12 2a2 2 0 0 1 2 2v7h1V6a2 2 0 0 1 4 0v8a8 8 0 0 1-8 8 8 8 0 0 1-8-8v-3a2 2 0 0 1 4 0v-1a2 2 0 0 1 3-1.7V4a2 2 0 0 1 2-2z", ""],
    ["M12 9c-3.9 0-7.3 1.3-9.5 3.4a1.7 1.7 0 0 0-.1 2.4l1.6 1.7c.6.6 1.5.7 2.2.2l2-1.4c.4-.3.6-.7.6-1.2v-1.5c2.1-.7 4.3-.7 6.4 0v1.5c0 .5.2.9.6 1.2l2 1.4c.7.5 1.6.4 2.2-.2l1.6-1.7a1.7 1.7 0 0 0-.1-2.4C19.3 10.3 15.9 9 12 9z", "mt-end"],
  ];
  for (const [d, cls] of BTN) { const b = el("i", "mt-b " + cls); b.appendChild(svg(d)); bar.appendChild(b); }
  root.append(top, grid, cc, bar);

  /**
   * The clips are only fetched the first time the call is asked for, and
   * stopped when it goes. Under reduced motion they load and hold on their
   * first frame: a still of somebody on a camera, and nothing moving.
   */
  function rolling(on) {
    for (const [v, src] of vids) {
      if (!on) { v.pause(); continue; }
      if (!v.getAttribute("src")) { v.preload = "auto"; v.setAttribute("src", src); }
      if (reduced) v.pause();
      else { const q = v.play(); if (q && q.catch) q.catch(() => {}); }
    }
  }

  let i = 0, t = 0, chars = 0;
  const put = (n, all) => {
    const s = SAID_IN[n];
    who.textContent = s.who; who.className = "mt-who" + (s.bot ? " mt-wbot" : "");
    line.textContent = all ? s.line : "";
    ring.style.opacity = s.bot ? "1" : "0";
    face.talking(s.bot);
  };
  return {
    el: root,
    face,
    reset() { i = 0; t = 0; chars = 0; who.textContent = ""; line.textContent = ""; ring.style.opacity = "0"; face.talking(false); },
    finish() { i = SAID_IN.length; put(SAID_IN.length - 1, true); },
    wake() { rolling(true); },
    still() { rolling(false); },
    done: () => i >= SAID_IN.length,
    step(dt) {
      face.step(dt);
      if (i >= SAID_IN.length) return;
      const s = SAID_IN[i];
      t += dt;
      if (t < s.wait) return;
      if (chars === 0) put(i, false);
      chars += dt * 38;
      const n = Math.min(s.line.length, Math.floor(chars));
      line.textContent = s.line.slice(0, n);
      if (n < s.line.length) return;
      i++; t = 0; chars = 0;
    },
  };
}

// ---- The phone's Live Activity -------------------------------------------------
const STAGES = ["Plan", "Code", "Test", "Ship"];

function activity() {
  const root = el("div", "la"), card = el("div", "la-card");
  const head = el("div", "la-head"), mark = el("i", "la-mark");
  head.append(mark, el("span", "la-who", "Xode"), el("span", "la-when", "now"));
  const bar = el("div", "la-bar"), fill = el("i", "la-fill");
  bar.appendChild(fill);
  const steps = el("div", "la-steps"), tags = STAGES.map((s) => el("span", "", s));
  for (const t of tags) steps.appendChild(t);
  card.append(head, el("div", "la-big", "Ready to ship"), el("div", "la-sub", "Codes while you rest"), bar, steps, el("div", "la-foot", "Pull request #128 · 6 min"));
  root.appendChild(card);
  let t = 0;
  const paint = () => {
    // It drops in, then the stages fill behind it.
    const inK = reduced ? 1 : clamp(t / .42), fillK = reduced ? 1 : clamp((t - .3) / .8);
    card.style.transform = `translateY(${((1 - inK) * -34).toFixed(2)}px) scale(${(.96 + .04 * inK).toFixed(4)})`;
    card.style.opacity = inK.toFixed(3);
    fill.style.width = (fillK * 100).toFixed(1) + "%";
    // Each stage lights as the bar reaches it; the last one, Ship, is green.
    tags.forEach((e, i) => {
      const k = clamp((fillK - i / STAGES.length) * STAGES.length);
      e.style.color = i === STAGES.length - 1 && k > .9 ? "#5FD13C" : `rgba(243,226,198,${(.35 + .5 * k).toFixed(3)})`;
    });
  };
  return {
    el: root,
    reset() { t = 0; paint(); },
    finish() { t = 9; paint(); },
    done: () => t >= 1.25,
    step(dt) { if (t < 1.4) { t += dt; paint(); } },
  };
}

// ---- The phone's plan, straight out of the meeting ------------------------------
// What the call came to, waiting for a word: the two things it says it will do,
// and the app's own button for letting it start.
const TODO = [
  { i: "M3 6h18v12H3zM3 6l9 7 9-7", n: "Send 4 follow-up emails", s: "Growth sync" },
  { i: "M12 2 3 20h18zM12 9v5M12 16.5v.5", n: "Fix the cart bug", s: "checkout #412" },
];

function planCard() {
  const root = el("div", "la pl"), card = el("div", "la-card");
  const head = el("div", "la-head");
  head.append(el("i", "la-mark"), el("span", "la-who", "X0"), el("span", "la-when", "now"));
  card.append(head, el("div", "la-big", "Meeting done"), el("div", "la-sub", "Weekly — Growth · 31 min. Here is the plan."));
  const list = el("ul", "pl-list"), rows = TODO.map((d) => {
    const li = el("li", "pl-r"), ic = el("i", "pl-i");
    ic.appendChild(svg(d.i));
    li.append(ic, el("span", "pl-n", d.n), el("b", "pl-s", d.s));
    list.appendChild(li);
    return li;
  });
  const act = el("div", "pl-act");
  act.append(el("b", "pl-go", "Approve and start"), el("span", "pl-no", "Change it"));
  card.append(list, act);
  root.appendChild(card);
  let t = 0;
  const paint = () => {
    const T = reduced ? 9 : t;
    const inK = clamp(T / .42);
    card.style.transform = `translateY(${((1 - inK) * -34).toFixed(2)}px) scale(${(.96 + .04 * inK).toFixed(4)})`;
    card.style.opacity = inK.toFixed(3);
    // The two things it will do come up one after the other, then the button.
    rows.forEach((r, i) => {
      const k = clamp((T - .45 - i * .35) / .3);
      r.style.opacity = k.toFixed(3);
      r.style.transform = `translateX(${((1 - k) * 10).toFixed(2)}px)`;
    });
    const a = clamp((T - 1.3) / .3);
    act.style.opacity = a.toFixed(3);
  };
  return {
    el: root,
    reset() { t = 0; paint(); },
    finish() { t = 9; paint(); },
    done: () => t >= 1.75,
    step(dt) { if (t < 2) { t += dt; paint(); } },
  };
}

// ---- The phone again, a couple of days later -----------------------------------
// The mail bot's own notice. Not a job finishing: it has been answering mail
// for two days without being asked anything, and across those answers it has
// SEEN something — the same complaint three times — which it does not decide
// on. It hands that one back.
function mailCard() {
  const root = el("div", "la pl mf"), card = el("div", "la-card");
  const head = el("div", "la-head");
  head.append(el("i", "la-mark"), el("span", "la-who", "Mail"), el("span", "la-when", "now"));
  card.append(head, el("div", "la-big", "45 emails answered"), el("div", "la-sub", "Two days. None of them needed you."));
  const flag = el("div", "mf-flag"), ic = el("i", "mf-i");
  ic.appendChild(svg("M12 2 2 20h20zM12 9v5M12 16.6v.6"));
  const txt = el("div", "mf-t");
  txt.append(el("b", "", "3 distributors got defective material"), el("span", "", "Same batch, three days apart. I did not answer these."));
  flag.append(ic, txt);
  const act = el("div", "pl-act");
  act.append(el("b", "pl-go mf-go", "Look into it"), el("span", "pl-no", "Not now"));
  card.append(flag, act);
  root.appendChild(card);
  let t = 0;
  const paint = () => {
    const T = reduced ? 9 : t, inK = clamp(T / .42);
    card.style.transform = `translateY(${((1 - inK) * -34).toFixed(2)}px) scale(${(.96 + .04 * inK).toFixed(4)})`;
    card.style.opacity = inK.toFixed(3);
    // The count settles, then the one thing it wants you to see.
    const f = clamp((T - .55) / .35);
    flag.style.opacity = f.toFixed(3);
    flag.style.transform = `translateX(${((1 - f) * 10).toFixed(2)}px)`;
    act.style.opacity = clamp((T - 1.15) / .3).toFixed(3);
  };
  return {
    el: root,
    reset() { t = 0; paint(); },
    finish() { t = 9; paint(); },
    done: () => t >= 1.6,
    step(dt) { if (t < 1.8) { t += dt; paint(); } },
  };
}

const MAKE = {
  desk: { term: terminal, meet: meeting, code: () => makeVignette("code") },
  phone: { live: activity, plan: planCard, mail: mailCard },
};

/** The beats this device has. `kind` is "phone" or "desk". */
export function makeContent(kind) {
  const root = el("div", "ct ct-" + kind);
  const beats = {};
  for (const name in MAKE[kind]) {
    const b = MAKE[kind][name]();
    b.el.style.display = "none";
    root.appendChild(b.el);
    beats[name] = b; b.reset();
  }
  root.style.display = "none";
  let cur = null, out = null, fade = 0, scale = 1;
  // display is cleared, never set to block: these elements have their own in
  // the stylesheet (the call is a flex column), and an inline one would beat it.
  const hideNow = (b) => { b.el.style.display = "none"; b.el.style.opacity = "1"; b.reset(); if (b.still) b.still(); };
  return {
    el: root,
    /** The glass is `w` CSS pixels wide: the beats are drawn at their design width and scaled to it. */
    fit(w) {
      scale = w / DW[kind];
      root.style.transform = `scale(${scale.toFixed(5)})`;
      if (beats.meet) beats.meet.face.fit(298, 176, scale);
      if (beats.code) beats.code.fit(DW[kind], Math.round(DW[kind] * .625), scale);
    },
    /** One of this device's beats arrives — or, `now`, is simply there, finished. */
    show(name, now) {
      root.style.display = "";
      if (cur === name) { if (now) beats[name].finish(); return; }
      if (cur) { out = cur; fade = 0; }
      cur = name;
      const b = beats[name];
      b.el.style.display = ""; b.el.style.opacity = "1";
      if (now || reduced) b.finish(); else b.reset();
      if (b.wake) b.wake();
    },
    /** Whatever is on goes, and the screen is blank white again. */
    hide() {
      if (!cur) return;
      if (reduced) hideNow(beats[cur]); else { out = cur; fade = 0; }
      cur = null;
    },
    /** Off this instant, mid-fade or not (the device itself has gone). */
    clear() {
      cur = null; out = null; fade = 0;
      for (const n in beats) hideNow(beats[n]);
      root.style.display = "none";
    },
    shown: () => cur !== null || out !== null,
    /** Arrived and holding: the freeze. */
    done: () => cur !== null && beats[cur].done(),
    step(dt) {
      if (cur) beats[cur].step(dt);
      if (out) {
        fade += dt;
        const b = beats[out];
        b.el.style.opacity = (1 - clamp(fade / .3)).toFixed(3);
        if (fade >= .3) { hideNow(b); out = null; if (!cur) root.style.display = "none"; }
      }
    },
  };
}
