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
// It ends twice over. `settle` calls them in: each finishes what it is in the
// middle of, walks the short way to a spot that leaves room for the one beside
// it, turns to us and stands — and only then (`settled`) will the page move
// on. `vanish` takes them away the way Blip goes into his antenna: every dot a
// particle pulled into that bot's own ball, in that bot's own colours
// (blip/pour.js), until the screen is blank white again (`gone`).
//
// They are drawn with the same renderer as Blip himself (blip/figure.js
// through blip/dots.js, walking on blip/walker.js), one buffer each. The Blip
// standing BETWEEN the two devices is not one of them: he is the page's own,
// and page/opening.js draws him, unchanged.
import { TAU, clamp, lerp, easeOut, easeIO, reduced, view } from "../util.js";
import { makeWalker } from "../blip/walker.js";
import { makeDots } from "../blip/dots.js";
import { makePour } from "../blip/pour.js";

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
/** Blip himself when he comes onto a screen: no colour of his own, so the renderer draws him in his. */
const GUEST = { name: "Blip", c: null };

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

// ---- The things they do -------------------------------------------------------
// Each is given the bot, how far through it is (0 to 1) and the state to pose.
// `travel` carries it that many of its own heights the way it faces while it
// plays; `roll` and `rollAt` on the bot turn the whole figure over, which is
// what the flips and the cartwheels are made of. `big` marks the ones with
// real weight behind them, so they come up more often than the small talk.
const TAU2 = TAU;
const GEST = {
  // -- the showy ones ----------------------------------------------------------
  backflip: { secs: 1.25, big: 1, travel: -.5, play(b, k, st) {
    const crouch = clamp(k / .18), air = k > .18 && k < .84 ? Math.sin(Math.PI * (k - .18) / .66) : 0;
    const land = k > .84 ? Math.sin(Math.PI * (k - .84) / .16) : 0;
    b.roll = -TAU2 * easeIO(clamp((k - .16) / .68)) * (b.w.mirror ? -1 : 1);
    b.rollAt = .5;
    st.drop += b.H * .09 * crouch * (1 - k) - b.H * .40 * air + b.H * .07 * land;
    st.legs[0].th = st.legs[1].th = -.7 * air; st.legs[0].lift = st.legs[1].lift = b.H * .03 * air;
    st.ra = [.16 + 2.6 * air, .12 - .6 * air]; st.la = [.16 + 2.6 * air, .12 - .6 * air];
    st.mouth = "grin"; st.brows = .3 + .6 * air;
  } },
  cartwheel: { secs: 1.5, big: 1, travel: 2.2, play(b, k, st) {
    b.roll = TAU2 * easeIO(k) * (b.w.mirror ? -1 : 1); b.rollAt = .5;
    const out = Math.sin(Math.PI * clamp(k / .9)) ** .4;
    st.legs[0].th = .75 * out; st.legs[1].th = -.75 * out;
    st.ra = [2.7 * out + .16, .1]; st.la = [2.7 * out + .16, .1];
    st.drop -= b.H * .06 * out; st.mouth = "grin"; st.brows = .7;
  } },
  handstand: { secs: 2.3, big: 1, play(b, k, st) {
    const up = easeIO(clamp(k / .22)) - easeIO(clamp((k - .78) / .22));
    b.roll = Math.PI * up * (b.w.mirror ? -1 : 1); b.rollAt = .5;
    const wob = Math.sin(k * TAU2 * 3) * .07 * up;
    b.roll += wob;
    st.legs[0].th = .3 * up + wob; st.legs[1].th = -.25 * up - wob;
    st.ra = [2.9 * up + .16, .1]; st.la = [2.9 * up + .16, .1];
    st.mouth = up > .5 ? "grin" : "smile"; st.brows = .2;
  } },
  breakdance: { secs: 2.4, big: 1, play(b, k, st) {
    const inLow = Math.sin(Math.PI * clamp(k / .9)) ** .5;
    b.roll = TAU2 * 2 * easeIO(k) * (b.r2 < .5 ? -1 : 1) * inLow; b.rollAt = .22;
    st.drop += b.H * .16 * inLow;
    st.legs[0].th = .9 * inLow; st.legs[1].th = -.55 * inLow;
    st.ra = [1.9 * inLow + .16, .4]; st.la = [.9 * inLow + .16, -.3];
    st.mouth = "grin"; st.brows = .8;
  } },
  jump: { secs: 1.2, big: 1, play(b, k, st) {
    const crouch = Math.sin(Math.PI * clamp(k / .22)) * clamp(1 - k / .3);
    const air = k > .2 && k < .8 ? Math.sin(Math.PI * (k - .2) / .6) : 0;
    const land = k > .76 ? Math.max(0, Math.sin(Math.PI * (k - .76) / .24)) : 0;
    st.drop += b.H * .08 * crouch - b.H * .34 * air + b.H * .06 * land;
    st.ra = [.16 + 2.6 * air, .12 - .55 * air]; st.la = [.16 + 2.6 * air, .12 - .55 * air];
    st.legs[0].th = st.legs[1].th = -.5 * air;
    st.mouth = air > .25 ? "grin" : "smile"; st.brows = .3 + .55 * air;
  } },
  spin: { secs: 1.1, big: 1, play(b, k, st) {
    b.w.squash = Math.sin(Math.PI * k) * .95;
    if (k > .5 && !b.spun) { b.w.mirror = !b.w.mirror; b.spun = true; }
    const a = Math.sin(Math.PI * k);
    st.ra = [.16 + 1.9 * a, .12]; st.la = [.16 + 1.9 * a, .12];
    st.drop -= b.H * .07 * a; st.tilt = .12 * Math.sin(TAU2 * k); st.mouth = "grin";
  } },
  kick: { secs: 1.0, big: 1, play(b, k, st) {
    const out = Math.sin(Math.PI * clamp(k / .85)) ** .45;
    st.legs[0].th = 1.25 * out; st.legs[1].th = -.2 * out; st.legs[0].lift = b.H * .05 * out;
    st.tilt = -.22 * out; st.ra = [.16 + 1.4 * out, .5]; st.la = [.16 - .6 * out, .1];
    st.drop -= b.H * .02 * out; st.mouth = "grin"; st.brows = .8;
  } },
  dance: { secs: 3.0, big: 1, play(b, k, st) {
    const p = k * TAU2 * 3, hop = Math.max(0, Math.sin(p * 2));
    st.ra = [1.0 + .9 * Math.sin(p), .1 + .35 * Math.cos(p)];
    st.la = [1.0 - .9 * Math.sin(p), .1 - .35 * Math.cos(p)];
    st.tilt = .16 * Math.sin(p); st.drop -= b.H * .09 * hop;
    st.legs[0].lift = b.H * .03 * hop; st.legs[1].lift = b.H * .03 * (1 - hop);
    st.look = [.5 * Math.sin(p), 0]; st.mouth = "grin"; st.brows = .8;
    b.glow = Math.max(b.glow, .5 * hop);
  } },
  wave: { secs: 2.2, big: 1, play(b, k, st) {
    const up = easeOut(k / .18) - easeIO((k - .76) / .2);
    const osc = k > .14 && k < .8 ? Math.sin((k - .14) * TAU2 * 3.1) : 0;
    st.ra = [lerp(.16, 2.5, up), lerp(.12, -.55, up) + .34 * osc * up];
    st.mouth = up > .3 ? "grin" : "smile"; st.brows = lerp(.3, .75, up); st.tilt = -.06 * up;
    st.drop -= b.H * .02 * Math.abs(osc) * up;
    b.glow = Math.max(b.glow, up);
  } },
  moonwalk: { secs: 1.8, big: 1, travel: -1.6, play(b, k, st) {
    const p = k * TAU2 * 3.2;
    st.legs[0].th = .5 * Math.sin(p); st.legs[1].th = -.5 * Math.sin(p);
    st.legs[0].lift = b.H * .02 * Math.max(0, Math.sin(p));
    st.ra = [.5 + .3 * Math.cos(p), .3]; st.la = [.5 - .3 * Math.cos(p), .3];
    st.tilt = -.08; st.walkK = 1; st.mouth = "grin";
  } },
  // -- the small talk between them --------------------------------------------
  look: { secs: 1.5, play(b, k, st) {
    const s = Math.sin(k * TAU2) * (k < .9 ? 1 : easeOut((1 - k) / .1));
    st.look = [s, .12 * Math.cos(k * TAU2 * 2)]; st.tilt = .07 * s; st.brows = .45;
  } },
  stretch: { secs: 1.6, play(b, k, st) {
    const up = Math.sin(Math.PI * clamp(k / .85)) ** .7;
    st.ra = [lerp(.16, 2.9, up), lerp(.12, -.2, up)]; st.la = [lerp(.16, 2.9, up), lerp(.12, -.2, up)];
    st.drop -= b.H * .04 * up; st.brows = lerp(.3, .8, up); st.mouth = up > .5 ? "grin" : "smile";
  } },
  nod: { secs: 1.1, play(b, k, st) {
    const n = Math.sin(k * TAU2 * 2) * (1 - k * .4);
    st.tilt = .16 * n; st.drop += b.H * .018 * Math.max(0, n); st.brows = .55; st.mouth = "grin";
  } },
  bounce: { secs: 1.3, play(b, k, st) {
    const n = Math.max(0, Math.sin(k * Math.PI * 3)) * (1 - k * .4);
    st.drop -= b.H * .13 * n; st.ra = [.16 + .7 * n, .12]; st.la = [.16 + .7 * n, .12];
    st.legs[0].lift = st.legs[1].lift = b.H * .025 * n; st.mouth = n > .4 ? "grin" : "smile";
  } },
  point: { secs: 1.3, play(b, k, st) {
    const up = Math.sin(Math.PI * clamp(k / .9)) ** .5, sgn = b.r2 < .5 ? -1 : 1;
    st.ra = [lerp(.16, 1.62, up), lerp(.12, .04, up)];
    st.look = [sgn * up, 0]; st.tilt = .07 * sgn * up; st.brows = .6;
  } },
  shrug: { secs: 1.3, play(b, k, st) {
    const up = Math.sin(Math.PI * clamp(k / .88)) ** .6;
    st.ra = [lerp(.16, 1.15, up), lerp(.12, -.95, up)]; st.la = [lerp(.16, 1.15, up), lerp(.12, -.95, up)];
    st.drop -= b.H * .015 * up; st.brows = lerp(.3, .95, up);
  } },
  peer: { secs: 1.5, play(b, k, st) {
    const up = Math.sin(Math.PI * clamp(k / .9));
    st.tilt = .22 * up; st.look = [.25 * Math.sin(k * TAU2 * .8), -.85 * up]; st.brows = lerp(.3, .1, up);
  } },
  scratch: { secs: 1.4, play(b, k, st) {
    const up = Math.sin(Math.PI * clamp(k / .9)) ** .6, j = Math.sin(k * TAU2 * 5) * up;
    st.ra = [lerp(.16, 2.2, up), lerp(.12, -1.15, up) + .12 * j];
    st.tilt = -.09 * up; st.brows = .2; st.look = [.3 * up, -.2 * up];
  } },
};
const GEST_KEYS = Object.keys(GEST);
/** The showy ones go in twice, so they come up about twice as often. */
const GEST_BAG = GEST_KEYS.flatMap((k) => (GEST[k].big ? [k, k] : [k]));

/**
 * The crowd on one screen. `kind` is "phone" or "desk", which only decides how
 * many of them there is room for.
 */
export function makeCrowd(kind) {
  const cv = document.createElement("canvas");
  cv.className = "crowd";
  const g = cv.getContext("2d");
  let W = 0, H = 0, T = 0, bots = [], tick = 0, calm = false, guest = null, guestN = 0;

  /** How tall a bot of this build standing `d` deep is, and where its feet are. */
  const sizeAt = (r3, d) => Math.max(14, Math.min(W * .24, H * .28) * (1 + r3 * .22) * lerp(1, .55, d));
  const floorAt = (d) => lerp(H * .97, H * .42, d);

  function makeBot(def, tag) {
    const b = {
      def, tag, dots: makeDots(),
      r: seed(tag), r2: seed(tag + "·"), r3: seed("·" + tag),
      ink: def.c ? inkOf(def.c) : undefined, lit: def.c ? litOf(def.c) : undefined,
      H: 10, gy: 10, d: 0, sp: 10, slowK: 1, hopK: 0,
      d0: 0, d1: 0, xa: 0, span: 1,                // the leg it is on: depth from, depth to, where it set off
      mode: "walk", hold: 0, to: 0, whim: 0, cross: false,
      gest: "", gt: 0, gdur: 1, spun: false, glow: 0, turn: 0, run: 0,
      roll: 0, rollAt: .5, flair: .4, flairT: 9, flairK: 0,
      calm: false, home: null, pour: null, guest: false,
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
    // Blip keeps to the front of the glass, so he never wanders up into
    // whatever the screen is showing.
    b.d1 = clamp(b.d0 + (Math.random() * 2 - 1) * .55 + (Math.random() - .5) * .3, 0, b.guest ? .4 : 1);
    b.cross = mayCross && Math.random() < .07;
    const m = b.H * .45;
    b.to = b.cross ? (Math.random() < .5 ? -b.H : W + b.H) : m + Math.random() * Math.max(1, W - 2 * m);
    b.xa = b.w.x; b.span = Math.max(1, Math.abs(b.to - b.xa));
    b.w.squash = 0; b.roll = 0;                    // whatever a flip or a spin left it as
    const k = pickOf(WALKS);
    b.sp = b.H * k.sp * (.8 + b.r * .4); b.slowK = b.cross ? 3 : k.slow; b.hopK = k.hop;
    b.w.mirror = b.to < b.w.x;
    b.whim = .7 + Math.random() * 2.2;             // when it may change its mind
    b.mode = "walk";
  }

  /**
   * The next thing it does. It never just stands: when it is not walking it is
   * part way through one of these, and it strings two to five of them together
   * before it goes anywhere.
   */
  function startGesture(b) {
    b.w.squash = 0; b.roll = 0; b.rollAt = .5;
    let g = GEST_BAG[(Math.random() * GEST_BAG.length) | 0];
    if (g === b.gest) g = GEST_BAG[(Math.random() * GEST_BAG.length) | 0];   // not the same thing twice
    b.gest = g;
    b.gt = 0; b.gdur = GEST[g].secs * (.85 + Math.random() * .4);
    b.spun = false; b.turn = 0; b.mode = "gesture";
    if (b.run === undefined || b.run <= 0) b.run = 2 + ((Math.random() * 4) | 0);  // how many before it moves on
  }

  /**
   * Enough: it is called in to the spot `x`. Mid-walk it heads straight there;
   * mid-move it plays the rest of that move out, no more, and goes after. Then
   * it turns to us and stands.
   */
  function callIn(b, x) {
    if (b.calm) return;
    b.calm = true; b.home = x;
    if (b.mode === "walk") toHome(b);
    else if (b.mode === "breath") b.hold = Math.min(b.hold, b.gt + .05);
  }

  /** Over to the spot it was called to — a short, level walk — and stand there. */
  function toHome(b) {
    const m = b.H * .45, x = clamp(b.home === null ? b.w.x : b.home, m, Math.max(m, W - m));
    if (Math.abs(b.w.x - x) < b.H * .22) { rest(b); return; }
    b.d0 = b.d1 = b.d; b.cross = false; b.whim = 1e9;
    b.to = x; b.xa = b.w.x; b.span = Math.max(1, Math.abs(b.to - b.xa));
    b.sp = b.H * 1.6; b.slowK = 1.2; b.hopK = 0;
    b.w.mirror = b.to < b.w.x; b.w.squash = 0; b.roll = 0; b.mode = "walk";
  }

  /** Standing easy, facing us, waiting: the pose it settles into. */
  function rest(b) { b.mode = "rest"; b.turn = 0; b.run = 0; b.roll = 0; b.w.squash = 0; }

  /** Its dots pour away into its own antenna's ball, which then pops (blip/pour.js). */
  function startPour(b, delay) {
    const c = b.dots(null, {
      H: b.H, cell: cellFor(b.H), x: b.w.x, y: b.gy, mirror: b.w.mirror, squash: b.w.squash,
      land: b.w.land || 0, air: b.w.air || 0, st: b.st, t: reduced ? 0 : T, capture: true,
    });
    b.pour = makePour();
    b.pour.start(c, { ink: b.ink, lit: b.lit, delay });
    b.mode = "gone";
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
    if (b.mode === "gone") { b.pour.step(dt); return; }
    if (b.mode === "still") return;

    if (b.mode === "exit") {
      // The guest on his way off the glass: out to the edge, coming forward as he goes.
      depthNow(b);
      st.walkK = Math.min(1, st.walkK + dt * 6);
      b.w.stride(dt, b.to); b.w.gait(dt);
      b.glow *= Math.pow(.25, dt);
      return;
    }

    if (b.mode === "rest") {
      // Standing: turned to us, arms down, breathing, its eye wandering.
      b.turn = Math.min(1, b.turn + dt * 3.4);
      st.walkK = 1 - easeOut(b.turn);
      b.w.A *= Math.pow(.02, dt); b.w.squash *= Math.pow(.02, dt);
      for (const L of st.legs) { L.th *= Math.pow(.01, dt); L.lift = 0; }
      st.drop = 0; st.bob = Math.sin(T * TAU * .8 + b.r * 6) * .011 * b.H;
      st.ra = [.16, .12]; st.la = [.16, .12]; st.tilt = .02 * Math.sin(T * .9 + b.r2 * 6);
      st.brows = .35; st.mouth = "smile"; st.antWob *= Math.pow(.05, dt);
      st.look = [Math.sin(T * .7 + b.r * 9) * .45, .08 + .1 * Math.sin(T * .5 + b.r2 * 4)];
      b.glow *= Math.pow(.35, dt);
      return;
    }

    if (b.mode === "walk") {
      depthNow(b);
      st.walkK = Math.min(1, st.walkK + dt * 6);
      // A change of mind, part of the way there.
      b.whim -= dt;
      if (b.whim <= 0 && !b.cross) { if (Math.random() < .45) roam(b); else b.whim = 1 + Math.random() * 2; }
      const there = b.w.stride(dt, b.to);
      b.w.gait(dt);
      // Even on the way it is up to something: a hop, a skip, a wave as it goes.
      b.flair -= dt;
      if (b.flair <= 0) { b.flair = .5 + Math.random() * 1.4; b.flairT = 0; b.flairK = Math.random(); }
      if (b.flairT < .5) {
        b.flairT += dt;
        const a = Math.sin(Math.PI * clamp(b.flairT / .5));
        if (b.flairK < .4) st.drop -= b.H * .18 * a;                       // a skip
        else if (b.flairK < .7) { st.ra = [.16 + 2.3 * a, .12 - .5 * a]; b.glow = Math.max(b.glow, .7 * a); }  // a wave on the move
        else { st.tilt = .2 * a; st.look = [(b.r2 < .5 ? -1 : 1) * a, -.3 * a]; }                              // a look round
      }
      if (b.hopK) st.drop -= b.H * .055 * b.hopK * Math.max(0, Math.sin(b.w.phase));
      if (there) {
        // Off the edge: on again from the other side, still going.
        if (b.cross) { b.w.x = b.to < 0 ? W + b.H : -b.H; b.cross = false; roam(b, false); }
        else if (b.calm) toHome(b);
        else { b.run = 0; startGesture(b); }
      }
      b.glow *= Math.pow(.25, dt);
      return;
    }

    // On the spot. It is always part way through something; the pose starts
    // clean every frame and whatever it is doing writes over it.
    b.w.A *= Math.pow(.02, dt);
    b.turn = Math.min(1, b.turn + dt * 4);
    if (b.gest !== "spin") { st.walkK = 1 - easeOut(b.turn); b.w.squash *= Math.pow(.02, dt); }
    for (const L of st.legs) { L.th *= Math.pow(.01, dt); L.lift = 0; }
    st.drop = 0; st.bob = Math.sin(T * TAU * .9 + b.r * 6) * .008 * b.H;
    st.ra = [.16, .12]; st.la = [.16, .12]; st.tilt = 0; st.brows = .3; st.mouth = "smile";
    st.look = [lerp(st.look[0], 0, .06), lerp(st.look[1], 0, .06)];
    st.antWob *= Math.pow(.05, dt);
    b.roll = 0;

    if (b.mode === "gesture") {
      b.gt += dt;
      const G = GEST[b.gest], k = clamp(b.gt / b.gdur);
      G.play(b, k, st);
      // Some of them carry it along the floor as they play.
      if (G.travel) {
        b.w.x = clamp(b.w.x + G.travel * b.H * (b.w.mirror ? -1 : 1) * dt / b.gdur, -b.H * .4, W + b.H * .4);
      }
      if (b.gt >= b.gdur) {
        b.run--;
        // A breath between two of them, never a stand about: the catch-breath
        // is itself a move, and short.
        if (b.calm) toHome(b);
        else if (b.run > 0) { b.mode = "breath"; b.hold = .12 + Math.random() * .4; b.gt = 0; }
        else roam(b);
      }
    } else if (b.mode === "breath") {
      // Still going: it settles, looks about and gathers itself for the next.
      const a = clamp(b.gt / Math.max(.01, b.hold));
      st.drop -= b.H * .02 * Math.sin(Math.PI * a);
      st.look = [Math.sin(T * 2.2 + b.r * 6) * .35, .1];
      st.brows = .4;
      b.gt += dt;
      if (b.gt >= b.hold) { if (b.calm) toHome(b); else startGesture(b); }
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
      else if (calm) { b.calm = true; b.home = null; }   // called in already: it walks to the spot it picked and stands there
      bots.push(b);
    },
    /** How tall Blip is on this glass, and so how tall he is when he reaches it. */
    guestH: () => sizeAt(1, 0),
    /**
     * Blip comes on, from `fromLeft`'s side: the biggest build of all of them,
     * in his own ink and bone, and from then on he is one of the troupe —
     * roaming, and throwing himself about with the same eighteen moves.
     */
    admitGuest(fromLeft) {
      const b = makeBot(GUEST, "Blip/" + guestN++);
      b.r3 = 1; b.guest = true;
      b.d = 0; b.H = sizeAt(1, 0); b.gy = floorAt(0);
      b.w.x = fromLeft ? 0 : W; b.w.mirror = !fromLeft; b.w.phase = 0;
      roam(b, false);
      if (reduced) { b.mode = "rest"; b.turn = 1; b.w.x = W * .5; b.w.mirror = false; b.st.walkK = 0; }
      bots.push(b); guest = b;
    },
    /** He is on this glass (and not on his way off it). */
    guestOn: () => !!guest && guest.mode !== "exit",
    /** Off you go: he breaks off whatever he is doing and walks off `left`'s edge. */
    leaveGuest(left) {
      if (!guest || guest.mode === "exit") return;
      const b = guest;
      b.calm = false; b.cross = false; b.whim = 1e9;
      b.d0 = b.d; b.d1 = 0;                        // forward again on the way out, so he leaves at the size he came in
      b.to = left ? -b.H * 1.2 : W + b.H * 1.2;
      b.xa = b.w.x; b.span = Math.max(1, Math.abs(b.to - b.xa));
      b.sp = b.H * 2.4; b.slowK = 1; b.hopK = 0;
      b.w.mirror = left; b.w.squash = 0; b.roll = 0; b.mode = "exit";
    },
    /**
     * He has crossed the edge of the glass: where he was, for whoever picks him
     * up on the page. Null until then, and only once (he is off the screen's
     * books from the frame it answers).
     */
    takeGuest() {
      if (!guest || guest.mode !== "exit") return null;
      const b = guest, left = b.to < 0;
      if (left ? b.w.x > 0 : b.w.x < W) return null;
      bots = bots.filter((o) => o !== b); guest = null;
      return { x: b.w.x, H: b.H, floor: b.gy, left };
    },
    /**
     * That is enough roaming: each of them finishes what it is doing, pulls up,
     * turns to us and stands. Whoever walks on after this is called in too.
     */
    settle() {
      if (calm) return;
      calm = true;
      // They pull up spread along the floor, not in a heap: each takes the
      // nearest spot that leaves room for the one beside it.
      const line = bots.filter((b) => !b.guest).sort((a, c) => a.w.x - c.w.x);
      const at = line.map((b) => b.w.x);
      for (let i = 1; i < line.length; i++) at[i] = Math.max(at[i], at[i - 1] + (line[i].H + line[i - 1].H) * .34);
      for (let i = line.length - 2; i >= 0; i--) at[i] = Math.min(at[i], at[i + 1] - (line[i].H + line[i + 1].H) * .34);
      line.forEach((b, i) => callIn(b, at[i]));
    },
    /** Everyone who is on is standing (and nothing is left to do). */
    settled() { if (reduced) return true; return calm && bots.every((b) => b.guest || (b.mode === "rest" && b.turn >= 1)); },
    /** They go the way Blip does: every dot into its own antenna's ball, which pops. */
    vanish() {
      if (reduced) { bots = []; this.draw(); return; }
      let i = 0;
      for (const b of [...bots].sort((a, c) => a.w.x - c.w.x)) { if (!b.guest && b.mode !== "gone") startPour(b, (i++) * .045 + Math.random() * .06); }
    },
    /** Nothing of them left: the screen is blank white again. */
    gone() { return bots.every((b) => b.guest || (b.mode === "gone" && b.pour.done)); },
    /** The device is going: the screen is empty again. */
    leave() { bots = []; guest = null; T = 0; calm = false; this.draw(); },
    step(dt) {
      if (reduced) return;
      T += dt;
      for (const b of bots) stepBot(b, dt);
      // Whoever has finished pouring away is dropped.
      if (bots.some((b) => b.mode === "gone" && b.pour.done)) bots = bots.filter((b) => !(b.mode === "gone" && b.pour.done));
    },
    draw() {
      g.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      // Back to front, by where their feet are: the nearer ones pass over the rest.
      for (const b of [...bots].sort((a, c) => a.gy - c.gy)) {
        if (b.mode === "gone") { b.pour.draw(g); continue; }
        b.dots(g, {
          H: b.H, cell: cellFor(b.H), x: b.w.x, y: b.gy, mirror: b.w.mirror, squash: b.w.squash,
          land: b.w.land || 0, air: b.w.air || 0, st: b.st, t: reduced ? 0 : T,
          glow: b.glow, ink: b.ink, lit: b.lit, roll: b.roll || 0, rollAt: b.rollAt,
          shade: 2.4, hop: clamp(-b.st.drop / (b.H * .4)),
        });
      }
    },
    /**
     * Half the frames are enough for figures this small; it halves what they
     * cost. While they are pouring away every frame is drawn: the dots move too
     * fast for half of them.
     */
    due() { if (guest || bots.some((b) => b.mode === "gone")) return true; return (tick = (tick + 1) % 2) === 0; },
  };
}
