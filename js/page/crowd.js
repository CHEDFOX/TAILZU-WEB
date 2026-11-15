// What is on the phone's and the laptop's screens on step 1. Nothing, at
// first: both screens are empty white. Then the bots arrive — Xode,
// Keylessbord, Plan Ease, Travel bot, Oracle, Mail, Lingo, Meetings — each
// from its own side, each in its own way (one runs, one strolls, one skids in,
// one comes in hopping), and once in they wander the screen, stopping to wave,
// to look about, to stretch or to nod, and then moving on.
//
// Each wears its own colour, the one the app gives it (TAILZU-BACKEND
// src/bots/builtin.ts, with experience/bots/palette.ts for the hex): the dots
// are a pale wash of it, the sticker under them a dark one, so the dithered
// look is Blip's but no two bots read the same.
//
// They are drawn with the same renderer as Blip himself (blip/figure.js
// through blip/dots.js, walking on blip/walker.js), one buffer each. The Blip
// standing BETWEEN the two devices is not one of them: he is the page's own,
// and page/opening.js draws him, unchanged.
import { TAU, clamp, lerp, easeOut, easeIO, reduced, view } from "../util.js";
import { makeWalker } from "../blip/walker.js";
import { makeDots } from "../blip/dots.js";

/** The bots, in the order they come on. */
const BOTS = [
  { name: "Xode", c: "#4F7A3A" },
  { name: "Keylessbord", c: "#A9573A" },
  { name: "Plan Ease", c: "#8F6A1F" },
  { name: "Travel bot", c: "#3E6E8E" },
  { name: "Oracle", c: "#6E4A6B" },
  { name: "Mail", c: "#7A6440" },
  { name: "Lingo", c: "#6B6762" },
  { name: "Meetings", c: "#2F5D50" },
];
/** How each one comes in: its speed, how long it takes to stop, and how much it bounces. */
const WALKS = {
  run: { sp: 3.0, slow: 1.15, hop: 0 },
  dash: { sp: 4.3, slow: .42, hop: 0 },      // in fast and skids to a stop
  stroll: { sp: 1.25, slow: 1.5, hop: 0 },
  hop: { sp: 2.1, slow: 1.0, hop: 1 },
};
const WALK_IN = ["run", "stroll", "dash", "hop", "stroll", "run", "hop", "dash"];
const GESTURES = ["wave", "look", "stretch", "nod", "bounce", "look", "wave", "nod"];

const rgb = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
/** `hex` carried k of the way to [r,g,b]. */
const towards = (hex, to, k) => { const c = rgb(hex); return `rgb(${c.map((v, i) => Math.round(lerp(v, to[i], k))).join(",")})`; };
/** A stable 0–1 from a name, so a bot stands in the same lane on every window. */
function seed(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 10000) / 10000; }

function makeBot(def, i) {
  const b = {
    def, dots: makeDots(), i,
    r: seed(def.name), r2: seed(def.name + "·"),
    ink: towards(def.c, [21, 19, 17], .5),        // the sticker: the colour, most of the way to Blip's ink
    lit: towards(def.c, [255, 252, 244], .68),    // the dots: the colour, washed pale
    H: 10, gy: 10, x0: 0, sp: 10, slowK: 1, hopK: 0,
    mode: "off", t: 0, hold: 0, to: 0, gest: "wave", gt: 0, gdur: 1, glow: 0, turn: 0,
    st: null,
  };
  b.st = {
    ra: [.16, .12], la: [.16, .12], brows: .3, tilt: 0, mouth: "smile",
    legs: [{ th: 0, lift: 0 }, { th: 0, lift: 0 }], drop: 0, bob: 0, swayK: 1, antWob: 0, walkK: 1, look: [0, 0],
  };
  b.w = makeWalker({
    H: () => b.H, ground: () => b.gy,
    speed: () => b.sp, slow: () => Math.max(6, b.H * b.slowK),
    splash: () => {},                              // their steps are behind glass: the page's water never feels them
  });
  b.w.st = b.st;
  return b;
}

/** The gestures, each a shape over its own length. k runs 0 to 1. */
const GEST = {
  wave: { secs: 2.6, play(b, k, st) {
    const up = easeOut(k / .18) - easeIO((k - .76) / .2);
    const osc = k > .14 && k < .8 ? Math.sin((k - .14) * TAU * 3.1) : 0;
    st.ra = [lerp(.16, 2.5, up), lerp(.12, -.55, up) + .34 * osc * up];
    st.mouth = up > .3 ? "grin" : "smile"; st.brows = lerp(.3, .75, up); st.tilt = -.06 * up;
    b.glow = Math.max(b.glow, up);
  } },
  look: { secs: 2.9, play(b, k, st) {
    const s = Math.sin(k * TAU) * (k < .92 ? 1 : easeOut((1 - k) / .08));
    st.look = [s, .1 * Math.cos(k * TAU * 2)];
    st.tilt = .05 * s; st.brows = .45;
  } },
  stretch: { secs: 2.2, play(b, k, st) {
    const up = Math.sin(Math.PI * clamp(k / .85)) ** .7;
    st.ra = [lerp(.16, 2.9, up), lerp(.12, -.2, up)];
    st.la = [lerp(.16, 2.9, up), lerp(.12, -.2, up)];
    st.drop -= b.H * .02 * up; st.brows = lerp(.3, .8, up); st.mouth = up > .5 ? "grin" : "smile";
  } },
  nod: { secs: 1.9, play(b, k, st) {
    const n = Math.sin(k * TAU * 2) * (1 - k * .4);
    st.tilt = .12 * n; st.drop += b.H * .012 * Math.max(0, n); st.brows = .55; st.mouth = "grin";
  } },
  bounce: { secs: 1.8, play(b, k, st) {
    const n = Math.max(0, Math.sin(k * Math.PI * 3)) * (1 - k * .5);
    st.drop -= b.H * .09 * n;
    st.ra = [.16 + .5 * n, .12]; st.la = [.16 + .5 * n, .12];
    st.legs[0].lift = st.legs[1].lift = b.H * .02 * n; st.mouth = n > .4 ? "grin" : "smile";
  } },
};

/**
 * The crowd on one screen. `kind` is "phone" or "desk", which only decides how
 * many of them there is room for.
 */
export function makeCrowd(kind) {
  const cv = document.createElement("canvas");
  cv.className = "crowd";
  const g = cv.getContext("2d");
  let W = 0, H = 0, T = 0, live = false, bots = [], tick = 0;

  /**
   * The order the bands are handed out in: the first bot takes the leftmost,
   * the second the rightmost, the third the next one in from the left, and so
   * on, so each arrival comes from the other side of the screen to the last.
   */
  function bandOrder(n) {
    const o = [];
    for (let a = 0, z = n - 1; a <= z;) { o.push(a++); if (a <= z) o.push(z--); }
    return o;
  }

  /** The lanes: how far back a bot stands, how tall that makes it, and where its floor is. */
  function place(b, n, order) {
    const d = (b.i % n) / Math.max(1, n - 1);                 // 0 at the front, 1 at the back
    const depth = clamp(d * .82 + (b.r - .5) * .18, 0, 1);
    // Tall enough to carry a face, never so tall that n of them cannot stand on one screen.
    const base = Math.min(W * .34, H * .34, W / (n * .82));
    b.H = Math.max(18, base * lerp(1, .62, depth));
    b.gy = lerp(H * .965, H * .5, depth);
    b.depth = depth;
    // Each keeps to a band of its own, so the screen fills instead of them all
    // piling into the middle; the bands overlap, so they still pass each other.
    b.band = (order[b.i % n] + .5) / n;
    b.roam = Math.max(.13, .8 / n);
    b.x0 = (b.band < .34 ? -1 : b.band > .66 ? 1 : (b.r2 < .5 ? -1 : 1)) > 0 ? W + b.H * .7 : -b.H * .7;
  }

  /** A spot to walk to: somewhere in its own band, kept off the very edges. */
  const pick = (b) => {
    const m = b.H * .5;
    return clamp(W * (b.band + (Math.random() * 2 - 1) * b.roam), m, Math.max(m, W - m));
  };

  function reset() {
    T = 0; live = false;
    const n = clamp(Math.round(W / (kind === "phone" ? 72 : 58)), 3, BOTS.length);
    const order = bandOrder(n);
    bots = BOTS.slice(0, n).map((d, i) => makeBot(d, i));
    for (const b of bots) {
      place(b, n, order);
      b.w.x = b.x0; b.w.mirror = b.x0 > 0; b.w.phase = b.r * 6; b.w.A = 0; b.w.v = 0; b.w.squash = 0; b.w.land = 0; b.w.air = 0;
      b.mode = "off"; b.hold = .3 + b.i * .55 + b.r * .4; b.glow = 0; b.turn = 0;
      b.st.walkK = 1; b.st.look = [0, 0]; b.st.drop = 0; b.st.bob = 0;
    }
    // Back to front, so the ones further up the screen are behind.
    bots.sort((a, c) => c.depth - a.depth);
  }

  /** Under reduced motion nothing moves: they are simply there, standing, facing us. */
  function standStill() {
    for (const b of bots) {
      b.mode = "still"; b.w.x = clamp(W * b.band, b.H * .5, Math.max(b.H * .5, W - b.H * .5));
      b.w.mirror = false; b.st.walkK = 0; b.glow = 0;
    }
  }

  function startWalk(b, to, style) {
    const k = WALKS[style];
    b.sp = b.H * k.sp; b.slowK = k.slow; b.hopK = k.hop;
    b.to = to; b.w.mirror = to < b.w.x; b.mode = "walk";
  }
  function startGesture(b, name) {
    b.gest = name; b.gt = 0; b.gdur = GEST[name].secs; b.mode = "gesture"; b.turn = 0;
  }

  function stepBot(b, dt) {
    const st = b.st;
    if (b.mode === "off") { b.hold -= dt; if (b.hold <= 0) startWalk(b, pick(b), WALK_IN[b.i % WALK_IN.length]); return; }
    if (b.mode === "still") return;

    if (b.mode === "walk") {
      st.walkK = Math.min(1, st.walkK + dt * 6);
      if (b.w.stride(dt, b.to)) { startGesture(b, GESTURES[(b.i + Math.floor(T)) % GESTURES.length]); }
      b.w.gait(dt);
      // The hoppers leave the floor a little more than the walk alone would.
      if (b.hopK) st.drop -= b.H * .055 * b.hopK * Math.max(0, Math.sin(b.w.phase));
      b.glow *= Math.pow(.25, dt);
      return;
    }

    // Standing: it turns to face us, then plays its gesture, then waits a moment.
    b.w.A *= Math.pow(.02, dt);
    b.turn = Math.min(1, b.turn + dt * 4);
    st.walkK = 1 - easeOut(b.turn);
    for (const L of st.legs) { L.th *= Math.pow(.01, dt); L.lift = 0; }
    st.drop = 0; st.bob = Math.sin(T * TAU * .9 + b.r * 6) * .008 * b.H;
    st.ra = [.16, .12]; st.la = [.16, .12]; st.tilt = 0; st.brows = .3; st.mouth = "smile";
    st.look = [lerp(st.look[0], 0, .06), lerp(st.look[1], 0, .06)];
    st.antWob *= Math.pow(.05, dt);

    if (b.mode === "gesture") {
      b.gt += dt;
      GEST[b.gest].play(b, clamp(b.gt / b.gdur), st);
      if (b.gt >= b.gdur) { b.mode = "rest"; b.hold = .5 + Math.random() * 1.8; }
    } else if (b.mode === "rest") {
      b.hold -= dt;
      if (b.hold <= 0) startWalk(b, pick(b), Math.random() < .25 ? "run" : "stroll");
    }
    b.glow *= Math.pow(.35, dt);
  }

  return {
    el: cv,
    /** The screen is w × h CSS pixels. */
    fit(w, h) {
      w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
      const same = w === W && h === H;
      W = w; H = h;
      cv.style.width = w + "px"; cv.style.height = h + "px";
      cv.width = Math.round(w * view.dpr); cv.height = Math.round(h * view.dpr);
      if (same) { const o = bandOrder(bots.length); for (const b of bots) { place(b, bots.length, o); b.w.x = clamp(b.w.x, -b.H, W + b.H); } }
      else { reset(); if (live) this.enter(); }
      this.draw();
    },
    /** The device is on screen: they start coming in. */
    enter() {
      if (live) return;
      live = true;
      if (reduced) standStill();
    },
    /** The device is going: the screen is empty again. */
    leave() { reset(); this.draw(); },
    step(dt) {
      if (!live || reduced) return;
      T += dt;
      for (const b of bots) stepBot(b, dt);
    },
    draw() {
      g.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      if (!live) return;
      for (const b of bots) {
        if (b.mode === "off") continue;
        const cell = Math.max(1, Math.round(b.H / 64 * view.dpr)) / view.dpr;
        b.dots(g, {
          H: b.H, cell, x: b.w.x, y: b.gy, mirror: b.w.mirror, squash: b.w.squash,
          land: b.w.land || 0, air: b.w.air || 0, st: b.st, t: reduced ? 0 : T,
          glow: b.glow, ink: b.ink, lit: b.lit,
        });
      }
    },
    /** Half the frames are enough for figures this small; it halves what they cost. */
    due() { return (tick = (tick + 1) % 2) === 0; },
  };
}
