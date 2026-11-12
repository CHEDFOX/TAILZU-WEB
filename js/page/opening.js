// The opening: he walks in from the right to the middle and waves; then he
// watches the pointer, and the pointer moves the water.
import { TAU, clamp, lerp, easeOut, easeIO, reduced, view } from "../util.js";
import { makeWalker } from "../blip/walker.js";
import { makeDots } from "../blip/dots.js";
import { splash } from "../paper/water.js";

const botCv = document.getElementById("bot"), bctx = botCv.getContext("2d");
const hero = document.getElementById("hero");

/** What the rest of the page reads: he has said hello (the key may come). */
export const opening = { introDone: false };

// ---- The opening's walker: in from the right, to the middle, a wave --------
let BH = 240, cellPx = 3;
const ground = () => Math.round(view.h * (view.w < 640 ? .6 : .56) + BH * .44);
let T = 0;
const SPEED = () => Math.max(170, Math.min(290, view.w * .19));
const B = makeWalker({ H: () => BH, ground, speed: SPEED, slow: () => Math.min(190, view.w * .17), splash });
function resetBot() {
  Object.assign(B, {
    x: view.w + BH * .5, phase: 0, A: 0, v: 0, mirror: true, flipK: 1, squash: 0,
    st: { ra: [.16, .12], la: [.16, .12], brows: .3, tilt: 0, mouth: "smile", legs: [{ th: 0, lift: 0 }, { th: 0, lift: 0 }], drop: 0, bob: 0, swayK: 1, antWob: 0, walkK: 1, look: [1, .15] },
    glow: 0, mode: reduced ? "idle" : "wait", t0: 0, waveN: 0,
  });
  if (reduced) { opening.introDone = true; B.x = view.w / 2; B.mirror = false; B.st.walkK = 0; B.st.look = [0, 0]; B.st.ra = [2.5, -.55]; B.st.mouth = "grin"; B.st.brows = .7; }
}

function updateBot(dt) {
  const st = B.st, t = T;
  st.bob = Math.sin(t * TAU * .9) * .008 * BH * (1 - st.walkK);
  if (B.mode === "wait") { if (t > .5) B.mode = "walk"; return; }
  if (B.mode === "walk" && B.stride(dt, view.w / 2)) { B.mode = "settle"; B.t0 = t; }
  if (B.mode === "settle") {
    B.A *= Math.pow(.02, dt);
    if (t - B.t0 > .34) { B.mode = "turn"; B.t0 = t; }
  }
  if (B.mode === "turn") {
    const k = clamp((t - B.t0) / .2);
    B.squash = Math.sin(Math.PI * k) * .18;
    if (k > .5 && B.mirror) B.mirror = false;
    st.walkK = 1 - easeOut(k);
    st.look = [lerp(1, 0, k), lerp(.15, 0, k)];
    if (k >= 1) { B.squash = 0; B.mode = "wave"; B.t0 = t; B.waveN = 0; }
  }
  B.gait(dt);
  if (B.mode === "wave" || B.mode === "idle") {
    const k = B.mode === "wave" ? t - B.t0 : 99;
    const up = reduced ? 1 : easeOut(k / .45) - easeIO((k - 3.4) / .55);
    const osc = k > .35 && k < 3.5 ? Math.sin((k - .35) * TAU * 1.45) : 0;
    st.ra = [lerp(.16, 2.5, up), lerp(.12, -.55, up) + .34 * osc * up];
    st.la = [.16, .12];
    st.mouth = up > .3 ? "grin" : "smile"; st.brows = lerp(.3, .75, up); st.tilt = -.06 * up;
    B.glow = Math.max(0, up);
    // Each wave of the hand sends a small ring out of it.
    const n = Math.floor(Math.max(0, k - .35) * 1.45 + .25);
    if (B.mode === "wave" && k > .45 && k < 3.4 && n > B.waveN && last.hand) { B.waveN = n; splash(last.hand[0], last.hand[1], .8, 3.2); }
    if (B.mode === "wave" && k > 4.1) { B.mode = "idle"; opening.introDone = true; }
  }
  if (B.mode === "idle") {
    st.look = [lerp(st.look[0], lookAim[0], .08), lerp(st.look[1], lookAim[1], .08)];
    B.glow *= .97;
  }
}

const last = { hand: null, ball: null };
const heroDots = makeDots();
function drawBot(t) {
  const g = bctx;
  g.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); g.clearRect(0, 0, view.w, view.h);
  if (B.mode === "wait") return;
  const f = B.draw(g, heroDots, t, cellPx, B.glow);
  last.hand = f.hand; last.ball = f.ball;
}

// ---- The visitor's hand on the water, once the bot has said hello --------
const lookAim = [0, 0];
let lastPt = null;
addEventListener("pointermove", (e) => {
  const now = performance.now();
  if (opening.introDone) {
    const H = BH, cx = B.x, cy = ground() - H * .7;
    lookAim[0] = clamp((e.clientX - cx) / (view.w * .35), -1, 1); lookAim[1] = clamp((e.clientY - cy) / (view.h * .35), -1, 1);
  }
  if (!opening.introDone || reduced) { lastPt = null; return; }
  if (lastPt && now - lastPt.t > 22) {
    const d = Math.hypot(e.clientX - lastPt.x, e.clientY - lastPt.y), sp = d / (now - lastPt.t) * 1000;
    if (sp > 40) splash(e.clientX, e.clientY, Math.min(.75, sp / 2600), 2);
    lastPt = { x: e.clientX, y: e.clientY, t: now };
  } else if (!lastPt) lastPt = { x: e.clientX, y: e.clientY, t: now };
}, { passive: true });
addEventListener("pointerdown", (e) => { if (opening.introDone && !reduced) splash(e.clientX, e.clientY, 1.6, 2.6); }, { passive: true });

// ---- For main.js ----------------------------------------------------------
/** Sizes him and his canvas to the window. */
export function fitOpening() {
  BH = Math.round(clamp(Math.min(view.h * .24, view.w * .38), 120, 225));
  cellPx = Math.max(2, Math.round(BH / 92 * view.dpr)) / view.dpr;
  botCv.width = Math.round(view.w * view.dpr); botCv.height = Math.round(view.h * view.dpr);
  hero.style.height = view.h + "px";
}
/** From the top: off to the right, about to walk in. */
export function resetOpening() { T = 0; opening.introDone = false; lastPt = null; lookAim[0] = lookAim[1] = 0; resetBot(); }
/** Still on his way in (a resize then starts the opening again). */
export const walkingIn = () => B.mode === "wait" || B.mode === "walk";
/** Back to the middle of a window that changed size. */
export function recenter() { B.x = view.w / 2; }
export function stepOpening(dt) { T += dt; updateBot(dt); }
export function drawOpening() { drawBot(T); }
