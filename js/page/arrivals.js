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
//
// BLIP GOES THE SAME WAY, and comes back. Once he is standing between the two
// devices the page lends him out (page/opening.js `lendBlip`) and he walks off
// to whichever screen is talking: as he goes he SHRINKS and his feet rise, so
// he walks away from us into it, slips behind the frame and comes out on the
// glass small, one of the troupe (page/crowd.js `admitGuest`) — roaming and
// throwing himself about with the same eighteen moves, in his own ink and
// bone. Then off the edge again, across to the other device, and at the end
// back to the middle, growing as he comes, where the page takes him back
// (`returnBlip`). The rise and the shrink are eased over the whole walk, so he
// curves away rather than climbing a slope: on a tall window the glass he is
// heading for is a long way above the floor he stands on.
import { clamp, easeIO, lerp, reduced, view } from "../util.js";
import { makeWalker } from "../blip/walker.js";
import { makeDots } from "../blip/dots.js";
import { splash } from "../paper/water.js";
import { BOTS, WALKS, pickOf, seed, inkOf, litOf, cellFor, freshState } from "./crowd.js";
import { blipAway, lendBlip, returnBlip } from "./opening.js";

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


// ---- Blip's own trip: out of the gap, onto a glass, and back ------------------
// One at a time, and he is the only figure here that goes both ways. `trip` is
// where he is being sent; while he is on the page it holds the walker, and the
// legs he walks (a swing out first when the way in is too short for the rise),
// with one eased ramp over the whole path from the size and floor he set off
// at to the size and floor he arrives at.
let trip = null;

/** Which screen he is on, if any. */
function onGlass() { for (const [k, s] of stages) if (s.crowd.guestOn()) return k; return null; }

function makeGuest(from) {
  const b = { dots: makeDots(), H: from.H, gy: from.gy, sp: 200, slow: 1, st: freshState() };
  b.w = makeWalker({ H: () => b.H, ground: () => b.gy, speed: () => b.sp, slow: () => b.slow, splash });
  b.w.st = b.st; b.w.x = from.x; b.w.phase = 0;
  return b;
}

/** The legs from where he is to where he is going, and the ramp over the lot. */
function plan(from) {
  let door, far, rightIn, H1, gy1;
  if (trip.to) {
    const s = stages.get(trip.to), r = s.rect;
    H1 = s.crowd.guestH(); gy1 = r.y + s.crowd.entryFloor();
    // In by the edge he is nearer, aimed at the far one: aimed at the near
    // edge itself he would step over it and back, frame after frame.
    const right = from.x > r.x + r.w / 2;
    door = right ? r.x + r.w : r.x; far = right ? r.x : r.x + r.w; rightIn = !right;
  } else {
    const h = trip.home;
    H1 = h.H; gy1 = h.gy; door = h.x; far = null; rightIn = h.x > from.x;
  }
  // Enough of a run that the rise is a curve away from us, not a climb.
  const need = Math.abs(gy1 - from.gy) * 1.3 + H1 * .8;
  const x0 = clamp(door + (rightIn ? -need : need), from.H * .5, Math.max(from.H * .5, view.w - from.H * .5));
  const legs = [];
  if (rightIn ? from.x > x0 : from.x < x0) {
    // Not far enough out: he swings out first (and is already on his way away from us as he does).
    legs.push({ at: x0, tx: x0 + (rightIn ? -1 : 1) * from.H * .8, right: !rightIn, brake: false });
  }
  legs.push(far === null ? { at: door, tx: door, right: rightIn, brake: true }
                         : { at: door, tx: far, right: rightIn, brake: false });
  let total = 0, x = from.x;
  for (const l of legs) { l.from = x; l.len = Math.abs(l.at - x); total += l.len; x = l.at; }
  trip.legs = legs; trip.i = 0; trip.done0 = 0;
  trip.path = { total: Math.max(1, total), H0: from.H, H1, gy0: from.gy, gy1 };
}

function beginWalk(from) { trip.b = makeGuest(from); trip.phase = "walk"; plan(from); }

/**
 * Send him to a device's screen ("phone" or "desk"), or back to the middle
 * (null). `home` is where he stands between them ({ x, gy, H }); it is passed
 * every time, so a resize moves where he is heading, not him.
 */
export function guestTo(to, home) {
  const was = trip, on = onGlass();
  if (was && was.to === to) {
    was.home = home;
    if (was.phase === "walk") plan({ x: was.b.w.x, gy: was.b.gy, H: was.b.H });   // a resize: the same trip, the new places
    return;
  }
  trip = { to, home, phase: "out", from: on, b: null, legs: null, i: 0, done0: 0, path: null };
  if (reduced) {
    if (on) stages.get(on).crowd.leave();
    if (!blipAway()) lendBlip();
    if (to) stages.get(to).crowd.admitGuest(true); else returnBlip(home);
    trip.phase = "there";
    return;
  }
  if (on) {
    // Off the edge nearest where he is going next.
    const r = stages.get(on).rect, s2 = to && stages.get(to).rect;
    const aim = s2 ? s2.x + s2.w / 2 : home.x;
    stages.get(on).crowd.leaveGuest(aim < r.x + r.w / 2);
  } else if (was && was.b) beginWalk({ x: was.b.w.x, gy: was.b.gy, H: was.b.H });
  else beginWalk(lendBlip());
}

/** He has got where he was sent: onto that glass, or back to the middle (null). */
export function guestThere(to) { return !!trip && trip.to === to && trip.phase === "there"; }
/** He is out of the page's hands: on his way somewhere, or on a glass. */
export const guestBusy = () => !!trip && !(trip.to === null && trip.phase === "there");

function stepTrip(dt) {
  if (!trip) return;
  if (trip.phase === "out") {
    // Waiting for the glass to let him go; it answers on the frame he crosses its edge.
    const s = stages.get(trip.from), got = s && s.crowd.takeGuest();
    if (got) beginWalk({ x: s.rect.x + got.x, gy: s.rect.y + got.floor, H: got.H });
    return;
  }
  if (trip.phase !== "walk") return;
  const b = trip.b, L = trip.legs[trip.i], P = trip.path;
  // Away from us (or back toward us) over the whole walk, eased.
  const k = easeIO(clamp((trip.done0 + Math.abs(b.w.x - L.from)) / P.total));
  b.H = lerp(P.H0, P.H1, k); b.gy = lerp(P.gy0, P.gy1, k);
  b.sp = Math.max(80, b.H * 1.9);
  b.slow = L.brake ? Math.max(10, b.H * 1.1) : 1;
  const pulled = b.w.stride(dt, L.tx);
  b.w.gait(dt);
  const over = L.right ? b.w.x >= L.at : b.w.x <= L.at;
  if (!over && !(L.brake && pulled)) return;
  if (trip.i < trip.legs.length - 1) { trip.done0 += L.len; trip.i++; return; }
  // There: onto the glass as one of the troupe, or back into the page's hands.
  if (trip.to) stages.get(trip.to).crowd.admitGuest(L.right);
  else returnBlip(trip.home);
  trip.b = null; trip.phase = "there";
}

export function step(dt) {
  if (reduced) return;
  T += dt;
  stepTrip(dt);
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
  let any = !!(trip && trip.b);
  for (const s of stages.values()) if (s.walking.length) { any = true; break; }
  if (!any && !painted) return;
  painted = any;
  g.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  g.clearRect(0, 0, view.w, view.h);
  if (reduced) return;
  if (trip && trip.b) {
    const b = trip.b;
    b.dots(g, { H: b.H, cell: cellFor(b.H), x: b.w.x, y: b.gy, mirror: b.w.mirror, squash: 0,
      land: b.w.land || 0, air: b.w.air || 0, st: b.st, t: T, glow: 0 });
  }
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
