// The page never scrolls. A scroll, a swipe or a key moves it one step:
//   0  the opening: he walks in and waves
//   1  he pours into his antenna, which then stands in the middle, the phone
//      and the laptop come in either side of it with empty screens, and the
//      bots walk on off the page and roam about on them until they settle
//   2  he comes back out of the antenna, whole, standing between them, and the
//      troupe pours away the same way he went in: both screens blank again
//   3  the laptop: a terminal, Xode installed on a project. He walks away off
//      the page into that screen, small, and roams and throws himself about on
//      it while the terminal types itself and freezes
//   4  the phone: the "Bots at work" Live Activity, ready to ship. He walks off
//      the laptop, across, and onto that screen instead
//   5  he comes back off the glass to the middle, growing as he comes, and both
//      screens clear
//
// Nothing waits for a scroll. A step that has finished arriving comes on by
// itself a beat later, so the whole thing plays through on its own; a scroll
// pushes it along (at step 1 it asks the bots to settle first, and goes once
// they have), and a scroll back stops it playing by itself. Up goes back the
// same way. One change at a time: moves made during one are kept, counted,
// and played after it.
import { view } from "../util.js";
import { canTake, blipForm, blipPoured, intoAntenna, outOfAntenna, moveAntenna, moveSpot } from "./opening.js";
import {
  layoutScreens, showScreens, hideScreens, screensEnterAt,
  settleScreens, screensSettled, screensFilling, vanishCrowds, crowdsGone, restartCrowds,
  showBeat, hideBeats, beatDone, beatsOff, blipTo, blipThere, blipOut,
} from "./screens.js";
import { revealKey, keyShown, settleKey } from "./key.js";

// How long a step that has arrived holds before the next comes by itself.
const AUTO = [0, 1.6, 1.1, 4.6, 4.6, 0];
const ROAM = 2.4;               // seconds of roaming after the last bot is on, before they settle by themselves
const LAST = 5;
const say = document.getElementById("say"), botCv = document.getElementById("bot");
const SAID = [
  "",
  "Blip pours into his antenna. A phone and a computer come in either side of it, their screens empty, and the bots walk in off the page and roam about on them.",
  "The bots pour away into their own antennas, and Blip comes back out of his and stands between the phone and the computer. Both screens are blank.",
  "On the computer, a terminal: Xode installed with one line, and run in a project's folder. Blip walks into that screen, small, and plays about on it.",
  "On the phone, the Bots at work Live Activity: ready to ship, a pull request opened. It codes while you rest. Blip crosses to that screen and plays about on that one.",
  "Blip comes back to the middle, and both screens clear.",
];
const LABEL = [
  botCv.getAttribute("aria-label"),
  "Blip, poured into his antenna, which stands swaying between the phone and the computer.",
  "Blip, standing between the phone and the computer.",
  "Blip, small, on the computer's screen in front of the terminal.",
  "Blip, small, on the phone's screen under the notice.",
  "Blip, back in the middle between the phone and the computer.",
];
let step = 0, want = 0, busy = null, idle = 0, auto = false, dwell = 0, L = null;

/** Which screen he is on at each step (null: standing in the middle). */
const whereOn = (n) => (n === 3 ? "desk" : n === 4 ? "phone" : null);

/** Lays the screens out for this window; whatever is between them moves with them. */
export function layoutSteps() {
  L = layoutScreens();
  if (step > 0 || busy) { moveAntenna(L.foot, L.blip.H); moveSpot(L.blip); }
  // He is off to one of the screens: the same trip, where that screen is now.
  const n = busy ? busy.to : step;
  if (n >= 3 || blipOut()) blipTo(whereOn(n), L.blip);
}

function go(dir) {
  // Counted from where the page was last asked to go, so two quick moves are two steps.
  want = Math.max(0, Math.min(LAST, want + dir));
  idle = 0;
  // Forward, it keeps playing itself; back, it waits for you from then on.
  auto = dir > 0;
}

function start(to) {
  const from = step;
  if (from === 0 && to === 1) {
    if (!keyShown()) revealKey(true); else settleKey();
    intoAntenna(L.foot, L.blip.H);
    busy = { to, shown: false, done: () => busy.shown && blipForm() === "orb" };
  } else if (from === 1 && to === 2) {
    // He comes out whole as they go: one moment, both ways.
    outOfAntenna(L.blip); vanishCrowds();
    busy = { to, done: () => blipForm() === "figure" && crowdsGone() };
  } else if (to === 3 || to === 4) {
    // Forward the beat types (or drops) itself; coming back to it, it is
    // simply there, finished. The laptop keeps its terminal while the phone
    // has its turn, and loses it on the way back out. He walks off the page
    // and onto that screen, small, and joins in on it.
    const back = from > to, kind = whereOn(to);
    if (to === 3) { showBeat("desk", back); if (back) hideBeats("phone"); }
    else { showBeat("desk", true); showBeat("phone", back); }
    blipTo(kind, L.blip);
    busy = { to, done: () => beatDone(kind) && blipThere(kind) };
  } else if ((from === 4 && to === 5) || (from === 3 && to === 2)) {
    // Off the glass, back across the page, growing as he comes.
    hideBeats(); blipTo(null, L.blip);
    busy = { to, done: () => beatsOff() && blipThere(null) };
  } else if (from === 2 && to === 1) {
    // Back the other way: into the antenna, and the screens fill again.
    intoAntenna(L.foot, L.blip.H); restartCrowds();
    busy = { to, done: () => blipForm() === "orb" };
  } else if (from === 1 && to === 0) {
    hideScreens(); outOfAntenna(null);
    busy = { to, done: () => blipForm() === "figure" };
  }
}

/** This step has finished arriving: what it was going to do, it has done. */
function arrived() {
  if (step === 1) return screensSettled();
  if (step === 3) return beatDone("desk");
  if (step === 4) return beatDone("phone");
  return true;
}

export function stepSteps(dt) {
  if (busy) {
    // The screens come in once enough of him has gone in that they cannot cover him.
    if (busy.to === 1 && busy.shown === false && blipPoured() >= screensEnterAt()) { busy.shown = true; showScreens(); }
    if (busy.done()) {
      step = busy.to; busy = null; idle = 0; dwell = 0;
      say.textContent = SAID[step]; botCv.setAttribute("aria-label", LABEL[step]);
    }
    return;
  }
  // Step 1: once everyone is on they roam a few seconds more, then come to a stop by themselves.
  if (step === 1) { if (screensFilling()) dwell = 0; else { dwell += dt; if (dwell > ROAM) settleScreens(); } }
  if (want === step && auto && AUTO[step] && arrived()) { idle += dt; if (idle > AUTO[step]) { want = step + 1; idle = 0; } }
  if (want === step) return;
  const to = step + Math.sign(want - step);
  // Out of the opening only once he is in the middle (a move made while he walks in waits for him).
  if (step === 0 && !canTake()) return;
  // On, out of the bots' own scene, only once they have settled: asked to move
  // on it calls them in, and goes the moment they are standing.
  if (step === 1 && to === 2 && !screensSettled()) { settleScreens(); return; }
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
