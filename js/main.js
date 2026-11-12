// The page: one sheet of paper, drawn every frame. This file only wires the parts together.
import { reduced, view } from "./util.js";
import { paintGrain } from "./paper/grain.js";
import { makeField, stepField } from "./paper/water.js";
import { fitWords, drawWords, redrawWords } from "./paper/words.js";
import { initGlitch } from "./paper/glitch.js";
import { opening, fitOpening, resetOpening, walkingIn, recenter, stepOpening, drawOpening } from "./page/opening.js";
import { revealKey, hideKey, keyShown } from "./page/key.js";

const root = document.documentElement;
// The fonts load as a print sheet, so they never hold up the first paint,
// and join the page once in (the CSP refuses an onload attribute).
const fontCss = document.getElementById("fonts");
if (fontCss) { if (fontCss.sheet) fontCss.media = "all"; else fontCss.addEventListener("load", () => { fontCss.media = "all"; }, { once: true }); }

paintGrain(document.getElementById("plane"));
initGlitch();

function fit() {
  view.w = root.clientWidth || innerWidth; view.h = innerHeight; view.dpr = Math.min(2, devicePixelRatio || 1);
  fitWords(); makeField(); fitOpening();
}

let lastMs = 0;
function frame(ms) {
  const dt = Math.min(.05, lastMs ? (ms - lastMs) / 1000 : .016); lastMs = ms;
  stepOpening(dt);
  if (!reduced) stepField();
  drawWords();
  drawOpening();
  // Once he has said hello, the key arrives.
  if (opening.introDone && !keyShown()) revealKey();
  requestAnimationFrame(frame);
}

/** The opening again from the top (a resize while he was still walking in). */
function replay() {
  hideKey(); makeField(); lastMs = 0;
  resetOpening(); redrawWords();
}

let rz = 0;
addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { const x = walkingIn(); fit(); if (x) replay(); else { recenter(); redrawWords(); } }, 120); });
fit(); resetOpening(); requestAnimationFrame(frame);
