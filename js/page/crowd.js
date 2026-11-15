// The crowd on one device's screen: the bots that have walked in off the page
// and the milling about they do once they are on.
//
// Nothing about it is laid out. A bot walks to a spot it picked at random, at
// a speed it picked at random, changing its mind on the way as often as not;
// wherever it stops it does one of a dozen things — waves, looks about,
// stretches, nods, jumps, spins on the spot, dances, points, shrugs, peers,
// bounces, scratches — waits as long as it likes, and goes somewhere else. It
// roams in two directions, not one: every walk also carries it nearer or
// further, which makes it bigger or smaller and moves its floor up or down the
// screen, and the ones in front pass over the ones behind. Now and then one
// walks clean off an edge and comes back on from the other.
//
// It does not put itself on the screen: page/arrivals.js walks each bot across
// the page to the device and hands it over with `admit`. Past the end of the
// roster the troupe starts it again, and the second Xode is not the first one:
// every bot draws its size, its pace and its habits from its own seed.
//
// They are drawn with the same renderer as Blip himself (blip/figure.js
// through blip/dots.js, walking on blip/walker.js), one buffer each. The Blip
// standing BETWEEN the two devices is not one of them: he is the page's own,
// and page/opening.js draws him, unchanged.
import { TAU, clamp, lerp, easeOut, easeIO, reduced, view } from "../util.js";
import { makeWalker } from "../blip/walker.js";
import { makeDots } from "../blip/dots.js";

/** The bots, in the order they first come on. The troupe cycles it. */
export const BOTS = [
  { name: "Xode", c: "#4F7A3A" },
  { name: "Keylessbord", c: "#A9573A" },
  { name: "Plan Ease", c: "#8F6A1F" },
  { name: "Travel bot", c: "#3E6E8E" },
  { name: "Oracle", c: "#6E4A6B" },
  { name: "Mail", c: "#7A6440" },
  { name: "Lingo", c: "#6B6762" },
  { name: "Meetings", c: "#2F5D50" },
];
/** How a bot covers a stretch: its speed, how long it takes to pull up, how much it bounces. */
export const WALKS = [
  { k: "run", sp: 3.0, slow: 1.15, hop: 0 },
  { k: "dash", sp: 4.4, slow: .4, hop: 0 },        // and skids to a stop
  { k: "stroll", sp: 1.2, slow: 1.6, hop: 0 },
  { k: "amble", sp: .8, slow: 1.8, hop: 0 },
  { k: "hop", sp: 2.1, slow: 1.0, hop: 1 },
  { k: "bound", sp: 2.9, slow: .8, hop: 1.5 },
];
export const pickOf = (a) => a[(Math.random() * a.length) | 0];

const rgb = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
/** `hex` carried k of the way to [r,g,b]. */
const towards = (hex, to, k) => { const c = rgb(hex); return `rgb(${c.map((v, i) => Math.round(lerp(v, to[i], k))).join(",")})`; };
/** A stable 0–1 from a string, so a bot keeps its own build through a resize. */
export function seed(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 10000) / 10000; }
/** The sticker's colour and the dots', from a bot's own. */
export const inkOf = (c) => towards(c, [21, 19, 17], .5);
export const litOf = (c) => towards(c, [255, 252, 244], .68);
/** About 54 dots tall whatever its size, and never finer than one device pixel. */
export const cellFor = (H) => Math.max(1 / view.dpr, H / 54);
/** The state a figure is posed through. */
export const freshState = () => ({
  ra: [.16, .12], la: [.16, .12], brows: .3, tilt: 0, mouth: "smile",
  legs: [{ th: 0, lift: 0 }, { th: 0, lift: 0 }], drop: 0, bob: 0, swayK: 1, antWob: 0, walkK: 1, look: [0, 0],
});

// ---- The things they do when they stop ----------------------------------------
// Each is given the bot, how far through it is (0 to 1) and the state to pose.
const GEST = {
  wave: { secs: 2.4, play(b, k, st) {
    const up = easeOut(k / .18) - easeIO((k - .76) / .2);
    const osc = k > .14 && k < .8 ? Math.sin((k - .14) * TAU * 3.1) : 0;
    st.ra = [lerp(.16, 2.5, up), lerp(.12, -.55, up) + .34 * osc * up];
    st.mouth = up > .3 ? "grin" : "smile"; st.brows = lerp(.3, .75, up); st.tilt = -.06 * up;
    b.glow = Math.max(b.glow, up);
  } },
  look: { secs: 2.7, play(b, k, st) {
    const s = Math.sin(k * TAU) * (k < .92 ? 1 : easeOut((1 - k) / .08));
    st.look = [s, .1 * Math.cos(k * TAU * 2)]; st.tilt = .05 * s; st.brows = .45;
  } },
  stretch: { secs: 2.1, play(b, k, st) {
    const up = Math.sin(Math.PI * clamp(k / .85)) ** .7;
    st.ra = [lerp(.16, 2.9, up), lerp(.12, -.2, up)]; st.la = [lerp(.16, 2.9, up), lerp(.12, -.2, up)];
    st.drop -= b.H * .02 * up; st.brows = lerp(.3, .8, up); st.mouth = up > .5 ? "grin" : "smile";
  } },
  nod: { secs: 1.7, play(b, k, st) {
    const n = Math.sin(k * TAU * 2) * (1 - k * .4);
    st.tilt = .12 * n; st.drop += b.H * .012 * Math.max(0, n); st.brows = .55; st.mouth = "grin";
  } },
  bounce: { secs: 1.7, play(b, k, st) {
    const n = Math.max(0, Math.sin(k * Math.PI * 3)) * (1 - k * .5);
    st.drop -= b.H * .09 * n; st.ra = [.16 + .5 * n, .12]; st.la = [.16 + .5 * n, .12];
    st.legs[0].lift = st.legs[1].lift = b.H * .02 * n; st.mouth = n > .4 ? "grin" : "smile";
  } },
  jump: { secs: 1.5, play(b, k, st) {
    // Down, up and off the floor, then a squash as it lands.
    const crouch = Math.sin(Math.PI * clamp(k / .22)) * clamp(1 - k / .3);
    const air = k > .22 && k < .78 ? Math.sin(Math.PI * (k - .22) / .56) : 0;
    const land = k > .74 ? Math.max(0, Math.sin(Math.PI * (k - .74) / .26)) : 0;
    st.drop += b.H * .07 * crouch - b.H * .3 * air + b.H * .05 * land;
    st.ra = [.16 + 2.4 * air, .12 - .5 * air]; st.la = [.16 + 2.4 * air, .12 - .5 * air];
    st.legs[0].th = st.legs[1].th = -.45 * air; st.mouth = air > .3 ? "grin" : "smile"; st.brows = .3 + .5 * air;
  } },
  spin: { secs: 1.3, play(b, k, st) {
    // Through side-on and round the other way.
    b.w.squash = Math.sin(Math.PI * k) * .92;
    if (k > .5 && !b.spun) { b.w.mirror = !b.w.mirror; b.spun = true; }
    st.ra = [.16 + .8 * Math.sin(Math.PI * k), .12]; st.la = [.16 + .8 * Math.sin(Math.PI * k), .12];
    st.tilt = .1 * Math.sin(TAU * k); st.mouth = "grin";
  } },
  dance: { secs: 3.2, play(b, k, st) {
    const p = k * TAU * 3;
    st.ra = [.9 + .7 * Math.sin(p), .1 + .3 * Math.cos(p)];
    st.la = [.9 - .7 * Math.sin(p), .1 - .3 * Math.cos(p)];
    st.tilt = .11 * Math.sin(p); st.drop -= b.H * .03 * Math.abs(Math.sin(p));
    st.look = [.4 * Math.sin(p), 0]; st.mouth = "grin"; st.brows = .7;
  } },
  point: { secs: 2.2, play(b, k, st) {
    const up = Math.sin(Math.PI * clamp(k / .9)) ** .5, s = b.r2 < .5 ? -1 : 1;
    st.ra = [lerp(.16, 1.62, up), lerp(.12, .04, up)];
    st.look = [s * up, 0]; st.tilt = .05 * s * up; st.brows = .6;
  } },
  shrug: { secs: 2.0, play(b, k, st) {
    const up = Math.sin(Math.PI * clamp(k / .88)) ** .6;
    st.ra = [lerp(.16, 1.15, up), lerp(.12, -.95, up)]; st.la = [lerp(.16, 1.15, up), lerp(.12, -.95, up)];
    st.drop -= b.H * .012 * up; st.brows = lerp(.3, .95, up); st.mouth = "smile";
  } },
  peer: { secs: 2.6, play(b, k, st) {
    // Leans in, has a good look up, leans back.
    const up = Math.sin(Math.PI * clamp(k / .9));
    st.tilt = .18 * up; st.look = [.25 * Math.sin(k * TAU * .8), -.85 * up]; st.brows = lerp(.3, .1, up);
  } },
  scratch: { secs: 2.3, play(b, k, st) {
    const up = Math.sin(Math.PI * clamp(k / .9)) ** .6, j = Math.sin(k * TAU * 5) * up;
    st.ra = [lerp(.16, 2.2, up), lerp(.12, -1.15, up) + .12 * j];
    st.tilt = -.07 * up; st.brows = .2; st.look = [.3 * up, -.2 * up];
  } },
};
const GEST_KEYS = Object.keys(GEST);

/**
 * The crowd on one screen. `kind` is "phone" or "desk", which only decides how
 * many of them there is room for.
 */
export function makeCrowd(kind) {
  const cv = document.createElement("canvas");
  cv.className = "crowd";
  const g = cv.getContext("2d");
  let W = 0, H = 0, T = 0, bots = [], tick = 0;

  /** How tall a bot of this build standing `d` deep is, and where its feet are. */
  const sizeAt = (r3, d) => Math.max(14, Math.min(W * .24, H * .28) * (1 + r3 * .22) * lerp(1, .55, d));
  const floorAt = (d) => lerp(H * .97, H * .42, d);

  function makeBot(def, tag) {
    const b = {
      def, tag, dots: makeDots(),
      r: seed(tag), r2: seed(tag + "·"), r3: seed("·" + tag),
      ink: inkOf(def.c), lit: litOf(def.c),
      H: 10, gy: 10, d: 0, sp: 10, slowK: 1, hopK: 0,
      d0: 0, d1: 0, xa: 0, span: 1,                // the leg it is on: depth from, depth to, where it set off
      mode: "walk", hold: 0, to: 0, whim: 0, cross: false,
      gest: "wave", gt: 0, gdur: 1, spun: false, glow: 0, turn: 0,
      st: freshState(),
    };
    b.w = makeWalker({
      H: () => b.H, ground: () => b.gy,
      speed: () => b.sp, slow: () => Math.max(6, b.H * b.slowK),
      splash: () => {},                            // their steps are behind glass: the page's water never feels them
    });
    b.w.st = b.st;
    return b;
  }

  /** Sets its size and its floor from where it is along the leg it is walking. */
  function depthNow(b) {
    const p = b.span > 1 ? clamp(1 - Math.abs(b.w.x - b.to) / b.span) : 1;
    b.d = lerp(b.d0, b.d1, easeIO(p));
    b.H = sizeAt(b.r3, b.d); b.gy = floorAt(b.d);
  }

  /** Somewhere else to be: anywhere at all, at any depth, now and then clean off the edge. */
  function roam(b, mayCross = true) {
    b.d0 = b.d;
    b.d1 = clamp(b.d0 + (Math.random() * 2 - 1) * .55 + (Math.random() - .5) * .3, 0, 1);
    b.cross = mayCross && Math.random() < .07;
    const m = b.H * .45;
    b.to = b.cross ? (Math.random() < .5 ? -b.H : W + b.H) : m + Math.random() * Math.max(1, W - 2 * m);
    b.xa = b.w.x; b.span = Math.max(1, Math.abs(b.to - b.xa));
    b.w.squash = 0;                                // whatever a spin left it as
    const k = pickOf(WALKS);
    b.sp = b.H * k.sp * (.8 + b.r * .4); b.slowK = b.cross ? 3 : k.slow; b.hopK = k.hop;
    b.w.mirror = b.to < b.w.x;
    b.whim = .7 + Math.random() * 2.2;             // when it may change its mind
    b.mode = "walk";
  }

  function startGesture(b) {
    b.w.squash = 0;
    b.gest = GEST_KEYS[(Math.random() * GEST_KEYS.length) | 0];
    b.gt = 0; b.gdur = GEST[b.gest].secs * (.8 + Math.random() * .5);
    b.spun = false; b.turn = 0; b.mode = "gesture";
  }

  /** Under reduced motion nothing moves: they are simply there, standing, facing us. */
  function standStill(b, i, n) {
    b.mode = "still";
    b.d = (i + .5) / n; b.H = sizeAt(b.r3, b.d); b.gy = floorAt(b.d);
    b.w.x = clamp(W * ((b.r2 + i * .37) % 1), b.H * .5, Math.max(b.H * .5, W - b.H * .5));
    b.w.mirror = false; b.st.walkK = 0; b.glow = 0;
  }

  function stepBot(b, dt) {
    const st = b.st;
    if (b.mode === "still") return;

    if (b.mode === "walk") {
      depthNow(b);
      st.walkK = Math.min(1, st.walkK + dt * 6);
      // A change of mind, part of the way there.
      b.whim -= dt;
      if (b.whim <= 0 && !b.cross) { if (Math.random() < .45) roam(b); else b.whim = 1 + Math.random() * 2; }
      if (b.w.stride(dt, b.to)) {
        // Off the edge: on again from the other side, still going.
        if (b.cross) { b.w.x = b.to < 0 ? W + b.H : -b.H; b.cross = false; roam(b, false); }
        else startGesture(b);
      }
      b.w.gait(dt);
      if (b.hopK) st.drop -= b.H * .055 * b.hopK * Math.max(0, Math.sin(b.w.phase));
      b.glow *= Math.pow(.25, dt);
      return;
    }

    // Standing: it turns to face us, does its thing, then waits as long as it likes.
    b.w.A *= Math.pow(.02, dt);
    b.turn = Math.min(1, b.turn + dt * 4);
    if (b.gest !== "spin") { st.walkK = 1 - easeOut(b.turn); b.w.squash *= Math.pow(.02, dt); }
    for (const L of st.legs) { L.th *= Math.pow(.01, dt); L.lift = 0; }
    st.drop = 0; st.bob = Math.sin(T * TAU * .9 + b.r * 6) * .008 * b.H;
    st.ra = [.16, .12]; st.la = [.16, .12]; st.tilt = 0; st.brows = .3; st.mouth = "smile";
    st.look = [lerp(st.look[0], 0, .06), lerp(st.look[1], 0, .06)];
    st.antWob *= Math.pow(.05, dt);

    if (b.mode === "gesture") {
      b.gt += dt;
      GEST[b.gest].play(b, clamp(b.gt / b.gdur), st);
      // Sometimes one thing straight after another, sometimes a pause, sometimes off at once.
      if (b.gt >= b.gdur) {
        if (Math.random() < .3) startGesture(b);
        else { b.mode = "rest"; b.hold = .2 + Math.random() * 2.6; }
      }
    } else if (b.mode === "rest") {
      b.hold -= dt;
      if (b.hold <= 0) { if (Math.random() < .18) startGesture(b); else roam(b); }
    }
    b.glow *= Math.pow(.35, dt);
  }

  return {
    el: cv,
    /** How many the screen has room for, and how big and how high one comes on. */
    capacity: () => clamp(Math.round(W / (kind === "phone" ? 40 : 32)), 4, 18),
    arrivalH: (tag) => sizeAt(seed("·" + tag), 0),
    entryFloor: () => floorAt(0),
    /** The screen is w × h CSS pixels. */
    fit(w, h) {
      W = Math.max(1, Math.round(w)); H = Math.max(1, Math.round(h));
      cv.style.width = W + "px"; cv.style.height = H + "px";
      cv.width = Math.round(W * view.dpr); cv.height = Math.round(H * view.dpr);
      for (const b of bots) { b.H = sizeAt(b.r3, b.d); b.gy = floorAt(b.d); b.w.x = clamp(b.w.x, -b.H, W + b.H); }
      this.draw();
    },
    /** A bot has reached the glass off the page: it walks on from `fromLeft`'s side. */
    admit(def, tag, fromLeft) {
      const b = makeBot(def, tag);
      b.d = 0; b.H = sizeAt(b.r3, 0); b.gy = floorAt(0);
      b.w.x = fromLeft ? 0 : W; b.w.mirror = !fromLeft; b.w.phase = seed(tag) * 6;
      roam(b, false);
      if (reduced) standStill(b, bots.length, Math.max(1, this.capacity()));
      bots.push(b);
    },
    /** The device is going: the screen is empty again. */
    leave() { bots = []; T = 0; this.draw(); },
    step(dt) {
      if (reduced) return;
      T += dt;
      for (const b of bots) stepBot(b, dt);
    },
    draw() {
      g.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      // Back to front, by where their feet are: the nearer ones pass over the rest.
      for (const b of [...bots].sort((a, c) => a.gy - c.gy)) {
        b.dots(g, {
          H: b.H, cell: cellFor(b.H), x: b.w.x, y: b.gy, mirror: b.w.mirror, squash: b.w.squash,
          land: b.w.land || 0, air: b.w.air || 0, st: b.st, t: reduced ? 0 : T,
          glow: b.glow, ink: b.ink, lit: b.lit,
        });
      }
    },
    /** Half the frames are enough for figures this small; it halves what they cost. */
    due() { return (tick = (tick + 1) % 2) === 0; },
  };
}
