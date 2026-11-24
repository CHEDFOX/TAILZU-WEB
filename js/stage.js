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
// One composition on the window, not on the page: the page slides over it and it stays, breathing. Dark lies across
// the lower right, light across the upper left, and the edge between them is read through a slow warp (a few sines
// over the window and the clock), so it bends and travels like slow liquid and never sits still; where it sits
// comes and goes a little too. Drawn into a small canvas (warm white, as opaque as it is dark), stretched over the
// window and laid on the fabric as a difference: see #shade in site.css. The page's own words over it turn with it
// (the same difference, .on-field in site.css).
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const shadeCv = document.getElementById("shade"), sg = shadeCv && shadeCv.getContext("2d");
const mast = document.querySelector(".mast");
let shadeIm = null;
function darkAt(u, yn, t) {
  // the slow warp
  const wu = u + .05 * Math.sin(yn * 4.6 + t * .33) + .03 * Math.sin(yn * 10.8 - t * .57 + u * 3.1);
  const wy = yn + .05 * Math.sin(u * 4.1 - t * .27) + .028 * Math.sin(u * 9.4 + t * .49 + yn * 2.3);
  // the diagonal, breathing
  const s = .62 * wu + .8 * wy + .035 * Math.sin(t * .21);
  // a narrowish edge: soft, but little of it is the mid-grey where words on it would be grey on grey
  return sm(.67 + .03 * Math.sin(t * .17 + 2), .79 + .03 * Math.sin(t * .13), s);
}
function drawShade(now) {
  if (!sg) return;
  const t = reduced ? 0 : (now || performance.now()) / 1000;
  const W = 96, H = Math.max(24, Math.round(96 * view.h / Math.max(1, view.w)));
  if (shadeCv.width !== W || shadeCv.height !== H) { shadeCv.width = W; shadeCv.height = H; shadeIm = sg.createImageData(W, H); }
  const px = shadeIm.data;
  for (let y = 0; y < H; y++) {
    const yn = (y + .5) / H;
    for (let x = 0; x < W; x++) {
      const a = darkAt((x + .5) / W, yn, t), i = (y * W + x) * 4;
      px[i] = 255; px[i + 1] = 251; px[i + 2] = 245; px[i + 3] = Math.round(a * 255);   // a warm white: the dark comes out warm
    }
  }
  sg.putImageData(shadeIm, 0, 0);
  if (mast) mast.classList.toggle("dark", darkAt(.5, 30 / Math.max(1, view.h), t) > .5);
}
addEventListener("resize", () => drawShade());
drawShade();
// alive: redrawn all the time (every other frame is plenty for something this slow and this soft)
if (!reduced) { let odd = false; (function flowing(now) { requestAnimationFrame(flowing); if ((odd = !odd)) drawShade(now); })(); }

// ---- 1c. the water, never quite still: a soft ripple somewhere every couple of seconds ----
if (!reduced) {
  const drop = () => {
    splash(Math.random() * view.w, Math.random() * view.h, .18 + Math.random() * .22, 2.4 + Math.random() * 2.4);
    setTimeout(drop, 900 + Math.random() * 1700);
  };
  setTimeout(drop, 1500);
}

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
