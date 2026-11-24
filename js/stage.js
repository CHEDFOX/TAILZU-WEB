// The stage: what the fabric is wired into, before the film and the views run on it.
//
//   1. the fabric's own frame loop (grain, water, words, glitch)
//   2. the visitor's hand on the water
//   3. the page's own scroll on the water (quiet while the page scrolls itself)
//   4. the key: "Take me home", to what this device installs, and the cap leaning towards the pointer
import { reduced, view } from "./util.js";
import { paintGrain } from "./paper/grain.js";
import { makeField, stepField, splash } from "./paper/water.js";
import { fitWords, drawWords, redrawWords } from "./paper/words.js";
import { initGlitch } from "./paper/glitch.js";

/** Set while the page scrolls itself (main.js): that is not a hand on the water. */
export const scroll = { quiet: false };

const root = document.documentElement;

// ---- 1. the fabric -------------------------------------------------------
paintGrain(document.getElementById("plane"));
initGlitch();

function fit() {
  view.w = root.clientWidth || innerWidth;
  view.h = innerHeight;
  view.dpr = Math.min(2, devicePixelRatio || 1);
  fitWords();
  makeField();
}

let lastMs = 0;
function frame(ms) {
  requestAnimationFrame(frame);
  lastMs = ms;
  if (!reduced) stepField();
  drawWords();
}

let rz = 0;
addEventListener("resize", () => {
  clearTimeout(rz);
  rz = setTimeout(() => { fit(); redrawWords(); }, 120);
});
fit();
requestAnimationFrame(frame);

// ---- 1b. the dark half -------------------------------------------------------
// Each view says where its dark is (u across the window, v down the view, 0..1); across the seam between two views the
// two are blended, so the shade flows from one into the next as the page scrolls. Drawn into a small canvas (white,
// as opaque as it is dark), stretched over the window and laid on the fabric as a difference: see #shade in site.css.
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const SHADE = [
  ["#stage", (u, v) => sm(.5, .82, v)],                                  // the film: dark along the bottom, under the card
  ["#roam", (u, v) => sm(.5, .74, u + (.5 - v) * .14)],                 // the roam: dark on the right, behind the film, a slant
  [".band.two", () => 0],
  [".band.plans", (u, v) => sm(.62, 1.05, v)],                           // the plans: going dark under its words, into the close
  [".band.close", () => 1],                                              // the close: dark
].map(([q, f]) => [document.querySelector(q), f]).filter(([el]) => el);
const shadeCv = document.getElementById("shade"), sg = shadeCv && shadeCv.getContext("2d");
const mast = document.querySelector(".mast");
let shadeIm = null, shadeQueued = false;
function darkAt(u, y, rects, M) {
  let d = 0, w = 0;
  for (let i = 0; i < rects.length; i++) {
    const [t, b, f] = rects[i];
    // the first view runs on up past the top of the page, the last on down past its end
    const k = (i === 0 ? 1 : sm(t - M, t + M, y)) * (i === rects.length - 1 ? 1 : 1 - sm(b - M, b + M, y));
    if (k <= 0) continue;
    d += k * f(u, Math.max(0, Math.min(1, (y - t) / (b - t)))); w += k;
  }
  return w > 0 ? d / Math.max(1, w) : 0;
}
function drawShade() {
  shadeQueued = false;
  if (!sg) return;
  const W = 96, H = Math.max(24, Math.round(96 * view.h / Math.max(1, view.w)));
  if (shadeCv.width !== W || shadeCv.height !== H) { shadeCv.width = W; shadeCv.height = H; shadeIm = sg.createImageData(W, H); }
  const rects = SHADE.map(([el, f]) => { const r = el.getBoundingClientRect(); return [r.top, r.bottom, f]; });
  const M = view.h * .16, px = shadeIm.data;
  for (let y = 0; y < H; y++) {
    const yy = (y + .5) / H * view.h;
    for (let x = 0; x < W; x++) {
      const a = darkAt((x + .5) / W, yy, rects, M), i = (y * W + x) * 4;
      px[i] = 255; px[i + 1] = 251; px[i + 2] = 245; px[i + 3] = Math.round(a * 255);   // a warm white: the dark comes out warm
    }
  }
  sg.putImageData(shadeIm, 0, 0);
  if (mast) mast.classList.toggle("dark", darkAt(.5, 30, rects, M) > .5);
}
const queueShade = () => { if (!shadeQueued) { shadeQueued = true; requestAnimationFrame(drawShade); } };
addEventListener("scroll", queueShade, { passive: true });
addEventListener("resize", queueShade);
queueShade();
// the views change height as fonts and media arrive
if (typeof ResizeObserver !== "undefined") { const ro = new ResizeObserver(queueShade); SHADE.forEach(([el]) => ro.observe(el)); }

// ---- 2. the visitor's hand on the water ----------------------------------
// The water answers the pointer from the first frame.
let lastPt = null;
addEventListener("pointermove", (e) => {
  if (reduced) return;
  const now = performance.now();
  if (lastPt && now - lastPt.t > 22) {
    const d = Math.hypot(e.clientX - lastPt.x, e.clientY - lastPt.y);
    const sp = d / (now - lastPt.t) * 1000;
    if (sp > 40) splash(e.clientX, e.clientY, Math.min(.75, sp / 2600), 2);
    lastPt = { x: e.clientX, y: e.clientY, t: now };
  } else if (!lastPt) lastPt = { x: e.clientX, y: e.clientY, t: now };
}, { passive: true });
addEventListener("pointerdown", (e) => {
  if (!reduced) splash(e.clientX, e.clientY, 1.6, 2.6);
}, { passive: true });


// ---- 3. the scroll on the water ------------------------------------------
// The page's own movement drives the field: a scroll drags a line of disturbance across the plane, in the direction it
// is going, strongest where the pointer last was.
let sy = scrollY, px = -1;
addEventListener("pointermove", (e) => { px = e.clientX; }, { passive: true });
addEventListener("scroll", () => {
  if (reduced) return;
  const d = scrollY - sy; sy = scrollY;
  if (scroll.quiet) return;
  const k = Math.min(1, Math.abs(d) / 90);
  if (k < .06) return;
  const x = px < 0 ? view.w * .5 : px;
  const y = d > 0 ? view.h * .88 : view.h * .12;
  splash(x, y, .5 * k, 3.4);
  splash(view.w - x * .6, y, .3 * k, 4.2);
}, { passive: true });

// ---- 4. the key ------------------------------------------------------------
// It always says "Take me home"; under it, the device it is for, and it goes to what that device installs
// (/v1/site's own `stores` and `downloads`).
const GET = [
  [/iPhone|iPad|iPod/i, "X0 Bot for iPhone", "https://apps.apple.com/app/id6784811357"],
  [/Android/i, "X0 Bot for Android", "https://play.google.com/store/apps/details?id=com.tulmi.app"],
  [/Macintosh|Mac OS X/i, "X0 Bot for Mac", "https://api.x0bot.com/downloads/Tailzu.dmg"],
  [/Windows/i, "X0 Bot for Windows", "https://get.microsoft.com/installer/download/9N3GX0XHQ7MX?referrer=appbadge&source=x0bot.com"],
  [/Linux|X11/i, "X0 Bot for Linux", "https://api.x0bot.com/downloads/Tailzu.AppImage"],
];
const ua = navigator.userAgent;
const mine = GET.find(([re]) => re.test(ua)) || ["", "X0 Bot for every device", "https://x0bot.com/download"];
document.querySelectorAll("[data-get]").forEach((a) => {
  a.href = mine[2];
  const o = a.querySelector("[data-get-os]"); if (o) o.textContent = mine[1];
});

// A keycap leans towards the pointer.
document.querySelectorAll("[data-lean]").forEach((k) => {
  k.addEventListener("pointermove", (e) => {
    const b = k.getBoundingClientRect();
    k.style.setProperty("--mx", (((e.clientX - b.left) / b.width - .5) * 7).toFixed(2) + "px");
    k.style.setProperty("--my", (((e.clientY - b.top) / b.height - .5) * 5).toFixed(2) + "px");
  });
  k.addEventListener("pointerleave", () => {
    k.style.setProperty("--mx", "0px"); k.style.setProperty("--my", "0px");
  });
});
