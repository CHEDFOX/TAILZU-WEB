// The page never scrolls. A scroll, a swipe or a key moves it one step:
//   0  the opening: he walks in and waves
//   1  he pours into his antenna, which then stands in the middle, and the
//      phone and the laptop come in either side of it with the app's first screen
//   2  he comes back out of the antenna, standing between them
// The first time step 1 settles, step 2 also comes by itself a few seconds
// later. Up goes back the same way. One change at a time: moves made during
// one are kept, counted, and played after it.
import { view } from "../util.js";
import { canTake, blipForm, blipPoured, intoAntenna, outOfAntenna, moveAntenna, moveSpot } from "./opening.js";
import { layoutScreens, showScreens, hideScreens, screensEnterAt } from "./screens.js";
import { revealKey, keyShown, settleKey } from "./key.js";

const AUTO = 4;                 // seconds on step 1, the first time, before he comes out by himself
const LAST = 2;
const say = document.getElementById("say"), botCv = document.getElementById("bot");
const SAID = [
  "",
  "Blip pours into his antenna. On a phone and a computer, the app's first screen: Hi, I'm X0. Everything here is a bot. Tell them what you need; they do the work.",
  "Blip comes back out of his antenna and stands between the phone and the computer.",
];
const LABEL = [
  botCv.getAttribute("aria-label"),
  "Blip, poured into his antenna, which stands swaying between the phone and the computer.",
  "Blip, standing between the phone and the computer.",
];
let step = 0, want = 0, busy = null, idle = 0, auto = false, L = null;

/** Lays the screens out for this window; whatever is between them moves with them. */
export function layoutSteps() {
  L = layoutScreens();
  if (step > 0 || busy) { moveAntenna(L.foot, L.blip.H); moveSpot(L.blip); }
}

function go(dir) {
  // Counted from where the page was last asked to go, so two quick moves are two steps.
  want = Math.max(0, Math.min(LAST, want + dir));
  idle = 0; auto = false;
}

function start(to) {
  const from = step;
  if (from === 0 && to === 1) {
    if (!keyShown()) revealKey(true); else settleKey();
    intoAntenna(L.foot, L.blip.H);
    busy = { to, shown: false, done: () => busy.shown && blipForm() === "orb" };
    auto = true;
  } else if (from === 1 && to === 2) {
    outOfAntenna(L.blip);
    busy = { to, done: () => blipForm() === "figure" };
  } else if (from === 2 && to === 1) {
    intoAntenna(L.foot, L.blip.H);
    busy = { to, done: () => blipForm() === "orb" };
  } else if (from === 1 && to === 0) {
    hideScreens(); outOfAntenna(null);
    busy = { to, done: () => blipForm() === "figure" };
  }
}

export function stepSteps(dt) {
  if (busy) {
    // The screens come in once enough of him has gone in that they cannot cover him.
    if (busy.to === 1 && busy.shown === false && blipPoured() >= screensEnterAt()) { busy.shown = true; showScreens(); }
    if (busy.done()) {
      step = busy.to; busy = null; idle = 0;
      say.textContent = SAID[step]; botCv.setAttribute("aria-label", LABEL[step]);
    }
    return;
  }
  if (step === 1 && want === 1 && auto) { idle += dt; if (idle > AUTO) { want = 2; auto = false; } }
  if (want === step) return;
  const to = step + Math.sign(want - step);
  // Out of the opening only once he is in the middle (a move made while he walks in waits for him).
  if (step === 0 && !canTake()) return;
  start(to);
}

// ---- What moves it ------------------------------------------------------------
// A wheel or a trackpad: one step per gesture. The first event of a new
// gesture steps at once (a mouse's single notch can be only a few pixels); a
// trackpad keeps sending its glide for a second after the fingers lift, and
// a pause in the stream ends the gesture.
let lastWheel = -1e9;
addEventListener("wheel", (e) => {
  if (e.ctrlKey) return;                                    // a pinch to zoom
  const now = performance.now(), d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * view.h : e.deltaY;
  const fresh = now - lastWheel > 240;
  lastWheel = now;
  if (fresh && Math.abs(d) >= 1) go(Math.sign(d));
}, { passive: true });
// A swipe: up for the next step, down for the one before. The page itself never moves under the finger.
let ty = null, tx = 0;
addEventListener("touchstart", (e) => { if (e.touches.length !== 1) { ty = null; return; } ty = e.touches[0].clientY; tx = e.touches[0].clientX; }, { passive: true });
addEventListener("touchmove", (e) => { if (ty !== null && e.touches.length === 1 && e.cancelable) e.preventDefault(); }, { passive: false });
addEventListener("touchend", (e) => {
  if (ty === null) return;
  const t = e.changedTouches[0], dy = ty - t.clientY, dx = tx - t.clientX;
  ty = null;
  if (Math.abs(dy) > 34 && Math.abs(dy) > Math.abs(dx) * 1.2) go(Math.sign(dy));
}, { passive: true });
// Keys: the ones that would scroll a page.
addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const k = e.key;
  if (k === "ArrowDown" || k === "PageDown" || (k === " " && !e.shiftKey)) { e.preventDefault(); go(1); }
  else if (k === "ArrowUp" || k === "PageUp" || (k === " " && e.shiftKey)) { e.preventDefault(); go(-1); }
});
