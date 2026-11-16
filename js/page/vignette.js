// The use cases as little motion graphics, looping, in the app's own language.
//
// Nothing here draws the real thing. docs/show.md in the backend says every
// picture a bot draws is MONOCHROME DOT ART — "ink on paper, greys, no
// colour, dots wherever there is a picture" — cut into pieces that spring in,
// one piece after another. So the site draws its use cases the same way: code
// is rows of dots, not code; a plan is beads on a thread; a mailbox is a
// column that empties. The one thing that matters in a scene is the only
// thing in colour.
//
// Each scene plays itself and starts again, for as long as it is on screen,
// so the screens are never still. One canvas each, drawn at the glass's own
// pixels.
import { TAU, clamp, reduced, view } from "../util.js";

const INK = [28, 26, 23];
const GREEN = "#4FAE2E";
const ink = (a) => `rgba(${INK[0]},${INK[1]},${INK[2]},${a})`;
/** Up from under and out from nothing, with a little overshoot: show.md's Rise. */
const rise = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.pow(1 - k, 3) * Math.cos(k * 7.2) * .55 - Math.pow(1 - k, 3));
/** A steady 0–1 from two numbers, so a scene is laid out the same every time. */
const hash = (i, j) => (((i + 1) * 374761393 + (j + 1) * 668265263) >>> 0) % 4096 / 4096;

// ---- The code scene ------------------------------------------------------------
// Rows of dots stand in for lines of code: it reads, it writes, one line is the
// one it changed, and it ships. The only words are the bot's name and what it
// is doing — nothing to read, so nothing to disbelieve.
const CODE = { W: 1280, H: 800, pitch: 15, dot: 5.4, row: 46 };
const STATUS = [[0, "Reading"], [1.5, "Writing"], [3.4, "Reviewing"], [4.6, "Shipped"]];

function codeRows() {
  const rows = [];
  for (let r = 0; r < 11; r++) {
    const bars = [], n = 1 + Math.round(hash(r, 0) * 2);
    let x = 40 + Math.round(hash(r, 9) * 3) * 56;              // the indent, in steps
    for (let b = 0; b < n; b++) {
      const w = Math.round((90 + hash(r, b + 1) * 300) / CODE.pitch) * CODE.pitch;
      bars.push({ x, w });
      x += w + CODE.pitch * 3;
    }
    rows.push(bars);
  }
  return rows;
}

function codeScene() {
  const rows = codeRows(), HIT = 5;                            // the line it changes
  const LOOP = 7.4;
  return {
    loop: LOOP,
    draw(g, W, H, t) {
      const k = W / CODE.W, px = (v) => v * k;
      const x0 = px(96), y0 = px(84), x1 = W - px(96), y1 = H - px(84);
      const out = clamp((t - (LOOP - .5)) / .5);                // it goes out at the end
      g.globalAlpha = 1 - out;
      // The panel it is all drawn on: a thin frame and four corner marks.
      g.strokeStyle = ink(.14); g.lineWidth = Math.max(1, px(1.4));
      g.strokeRect(x0, y0, x1 - x0, y1 - y0);
      g.fillStyle = ink(.3);
      const m = px(7);
      for (const [cx, cy] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) g.fillRect(cx - m / 2, cy - m / 2, m, m);
      // Its name, and what it is doing.
      g.textBaseline = "middle";
      g.font = `600 ${px(21)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
      g.fillStyle = ink(.5); g.fillText("Xode", x0 + px(28), y0 + px(34));
      let st = STATUS[0][1], done = false;
      for (const [at, word] of STATUS) if (t >= at) { st = word; done = word === "Shipped"; }
      const sw = g.measureText(st).width;
      g.fillStyle = done ? GREEN : ink(.5);
      g.fillText(st, x1 - px(28) - sw, y0 + px(34));
      g.beginPath(); g.arc(x1 - px(44) - sw, y0 + px(34), px(5), 0, TAU);
      if (done) { g.fillStyle = GREEN; g.fill(); } else { g.strokeStyle = ink(.35); g.lineWidth = px(1.6); g.stroke(); }
      // The lines: runs of dots, five at a time, row after row.
      const top = y0 + px(96);
      rows.forEach((bars, r) => {
        bars.forEach((bar, b) => {
          const n = Math.round(bar.w / CODE.pitch);
          for (let i = 0; i < n; i++) {
            const delay = r * .085 + b * .05 + Math.floor(i / 5) * .035;
            const a = rise(clamp((t - delay) / .5));
            if (a <= .001) continue;
            const hot = r === HIT && t > 2.2;
            const cx = x0 + px(bar.x + i * CODE.pitch), cy = top + px(r * CODE.row);
            g.fillStyle = hot ? GREEN : ink(.17 + hash(r, b) * .1);
            g.beginPath(); g.arc(cx, cy - px(10) * (1 - a), px(CODE.dot) * a * (hot ? 1.1 : 1), 0, TAU); g.fill();
          }
        });
      });
      // The one line it changed, picked out the way a canvas picks a thing out.
      if (t > 2.35) {
        const s = clamp((t - 2.35) / .35), bars = rows[HIT];
        const bx = x0 + px(bars[0].x - CODE.pitch), by = top + px(HIT * CODE.row);
        const last = bars[bars.length - 1];
        const bw = px(last.x + last.w - bars[0].x + CODE.pitch * 2) * s, bh = px(34);
        g.strokeStyle = GREEN; g.lineWidth = px(1.6);
        g.strokeRect(bx, by - bh / 2, bw, bh);
        if (s >= 1) {
          g.fillStyle = GREEN;
          const h = px(6);
          for (const [hx, hy] of [[bx, by - bh / 2], [bx + bw, by - bh / 2], [bx, by + bh / 2], [bx + bw, by + bh / 2]]) g.fillRect(hx - h / 2, hy - h / 2, h, h);
        }
      }
      g.globalAlpha = 1;
    },
  };
}

const SCENES = { code: codeScene };

/**
 * One looping scene on a device's glass. `name` picks it; the canvas is sized
 * to the glass and drawn at its real pixels.
 */
export function makeVignette(name) {
  const cv = document.createElement("canvas");
  cv.className = "vg";
  const g = cv.getContext("2d"), scene = SCENES[name]();
  let W = 0, H = 0, t = 0, tick = 0;
  return {
    el: cv,
    /**
     * `w` x `h` are the scene's own design pixels and `k` what the page scales
     * them by, so the canvas is backed at the glass's real pixels and the
     * scene is drawn in the one coordinate space it was laid out in.
     */
    fit(w, h, k) {
      W = Math.max(1, Math.round(w)); H = Math.max(1, Math.round(h));
      cv.style.width = W + "px"; cv.style.height = H + "px";
      cv.width = Math.max(1, Math.round(W * k * view.dpr)); cv.height = Math.max(1, Math.round(H * k * view.dpr));
      this.draw();
    },
    /** Back to the top of the loop. */
    reset() { t = 0; this.draw(); },
    /** All the way through once, for a scene come back to. */
    finish() { t = scene.loop - .9; this.draw(); },
    /** It has played itself through once (the page may move on; it keeps going). */
    done: () => t >= scene.loop - 1.2,
    step(dt) {
      if (reduced) return;
      t += dt;
      if (t >= scene.loop) t -= scene.loop;
      if ((tick = (tick + 1) % 2) === 0) this.draw();
    },
    draw() {
      if (!W) return;
      const k = cv.width / W;
      g.setTransform(k, 0, 0, k, 0, 0);
      g.clearRect(0, 0, W, H);
      scene.draw(g, W, H, reduced ? scene.loop - 1.2 : t);
    },
  };
}
