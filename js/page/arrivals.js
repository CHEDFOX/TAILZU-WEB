// How the bots get onto the devices' screens: they walk in off the page.
//
// One at a time, a bot comes on at the edge of the WINDOW — out on the sheet
// of words, where Blip himself walks, its steps sending the same rings
// through the water — and walks across the page to the device it is heading
// for. It is the size it will be on the glass, and it walks along the line
// its floor will be on, so when it reaches the device nothing about it
// changes. The devices are painted over this canvas, so the last of the walk
// happens behind the frame: it slips behind the bezel on the page and comes
// out on the screen, where page/crowd.js takes it over and it joins the
// milling about.
//
// There is no floor drawn anywhere on the page — Blip walks on an invisible
// line too — so the walk reads as the bots arriving out of the paper.
import { clamp, reduced, view } from "../util.js";
import { makeWalker } from "../blip/walker.js";
import { makeDots } from "../blip/dots.js";
import { splash } from "../paper/water.js";
import { BOTS, WALKS, pickOf, seed, inkOf, litOf, cellFor, freshState } from "./crowd.js";

const cv = document.createElement("canvas");
cv.id = "walkers";
cv.setAttribute("aria-hidden", "true");
document.body.appendChild(cv);
const g = cv.getContext("2d");

/** One device: its crowd, where its glass is on the page, and who is still on the way. */
const stages = new Map();
let T = 0;

export function register(kind, crowd) { stages.set(kind, { crowd, rect: null, queue: [], walking: [], on: false, rush: false }); }
export function setRect(kind, rect) { const s = stages.get(kind); if (s) s.rect = rect; }

/** The page canvas follows the window. */
export function fitPage() {
  cv.width = Math.round(view.w * view.dpr); cv.height = Math.round(view.h * view.dpr);
}

/** Which edge of the window a bot heading for this glass comes on at. */
function sideFor(rect) {
  const cx = rect.x + rect.w / 2;
  const left = cx < view.w * .45 ? .88 : cx > view.w * .55 ? .12 : .5;
  return Math.random() < left;
}

/** The device is in place: the bots start making their way over. */
export function start(kind) {
  const s = stages.get(kind);
  if (!s || s.on || !s.rect) return;
  s.on = true; s.rush = false;
  const n = s.crowd.capacity();
  s.queue = [];
  for (let i = 0; i < n; i++) {
    const def = BOTS[i % BOTS.length];
    // The gap after the one before, not a time from the start: they come over
    // in a straggling line, not all at once and not over half a minute.
    const gap = i === 0 ? .2 : (kind === "phone" ? .42 : .2) * (.6 + Math.random());
    s.queue.push({ def, tag: def.name + "/" + Math.floor(i / BOTS.length), wait: gap });
  }
  // Nobody walks under reduced motion: they are simply on the glass already.
  if (reduced) { for (const q of s.queue) s.crowd.admit(q.def, q.tag, true); s.queue = []; }
}

/** The device is going: whoever is still on their way turns round and is gone. */
export function stop(kind) {
  const s = stages.get(kind);
  if (!s) return;
  s.on = false; s.rush = false; s.queue = []; s.walking = [];
}

/**
 * The page has been asked to move on: nobody is left out, but they stop
 * dawdling — whoever is waiting their turn comes at once and whoever is on the
 * way puts their head down.
 */
export function rush(kind) {
  const s = stages.get(kind);
  if (!s || s.rush) return;
  s.rush = true;
  for (let i = 0; i < s.queue.length; i++) s.queue[i].wait = .05 + i * .07;
  for (const b of s.walking) b.sp *= 2.2;
}

/**
 * Anyone still to come to this device: waiting their turn, on the way, or —
 * before the device has even landed — all of them.
 */
export function pending(kind) { const s = stages.get(kind); return !!s && (!s.on || s.queue.length > 0 || s.walking.length > 0); }

function spawn(s, q) {
  const H = s.crowd.arrivalH(q.tag), fromLeft = sideFor(s.rect);
  const k = pickOf(WALKS), r = seed(q.tag);
  // It has a whole page to cross, so however it walks it does not dawdle.
  const sp = Math.max(H * 1.7, H * k.sp * (.85 + r * .5)) * (s.rush ? 2.2 : 1);
  const b = {
    def: q.def, tag: q.tag, fromLeft, dots: makeDots(),
    ink: inkOf(q.def.c), lit: litOf(q.def.c),
    H, gy: 0, hopK: k.hop, sp, st: freshState(),
  };
  b.w = makeWalker({
    H: () => b.H, ground: () => b.gy,
    speed: () => b.sp, slow: () => 1,              // no pulling up: it walks straight on
    splash,                                        // out here its steps DO move the page's water
  });
  b.w.st = b.st;
  b.w.x = fromLeft ? -H * .8 : view.w + H * .8;
  b.w.mirror = !fromLeft;
  b.w.phase = r * 6;
  s.walking.push(b);
}

export function step(dt) {
  if (reduced) return;
  T += dt;
  for (const s of stages.values()) {
    if (!s.rect) continue;
    if (s.on && s.queue.length) {
      s.queue[0].wait -= dt;
      if (s.queue[0].wait <= 0) spawn(s, s.queue.shift());
    }
    for (let i = s.walking.length - 1; i >= 0; i--) {
      const b = s.walking[i];
      // Read from the rect every frame, so a resize moves the door, not the walker.
      b.gy = s.rect.y + s.crowd.entryFloor();
      const door = b.fromLeft ? s.rect.x : s.rect.x + s.rect.w;
      // It walks at the far side of the glass, never at the near edge: aimed at
      // the edge itself it would step over it and back, frame after frame,
      // because out here it never slows down. Crossing the near edge is what
      // counts as arriving.
      b.w.stride(dt, b.fromLeft ? s.rect.x + s.rect.w : s.rect.x);
      b.w.gait(dt);
      if (b.hopK) b.st.drop -= b.H * .055 * b.hopK * Math.max(0, Math.sin(b.w.phase));
      if (b.fromLeft ? b.w.x >= door : b.w.x <= door) {
        s.crowd.admit(b.def, b.tag, b.fromLeft);
        s.walking.splice(i, 1);
      }
    }
  }
}

let painted = false;
export function draw() {
  // The page canvas is the size of the window: only touch it while there is
  // someone on it, and once more to wipe them when the last one is in.
  let any = false;
  for (const s of stages.values()) if (s.walking.length) { any = true; break; }
  if (!any && !painted) return;
  painted = any;
  g.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  g.clearRect(0, 0, view.w, view.h);
  if (reduced) return;
  for (const s of stages.values()) {
    for (const b of s.walking) {
      b.dots(g, {
        H: b.H, cell: cellFor(b.H), x: b.w.x, y: b.gy, mirror: b.w.mirror, squash: 0,
        land: b.w.land || 0, air: b.w.air || 0, st: b.st, t: T, glow: 0, ink: b.ink, lit: b.lit,
      });
    }
  }
}

/** Anyone still out on the page (the page keeps drawing while there is). */
export const walking = () => { for (const s of stages.values()) if (s.walking.length || s.queue.length) return true; return false; };
