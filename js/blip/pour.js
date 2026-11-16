// A dotted figure taken apart: the small one's version of what Blip does when
// he pours into his antenna (blip/antenna.js).
//
// Every dot of a captured figure (blip/dots.js with o.capture) becomes a
// particle on a spring of its own, pulled into the figure's own antenna ball
// with a little swirl and shrinking as it arrives; the ones nearest the ball
// let go first, so it empties head downwards. The ball swells with each one it
// swallows, and when the last is in it pops and shrinks to nothing: the screen
// is blank again.
//
// It is only the coming apart — there is no standing antenna at the end and
// nothing comes back out — and it wears the figure's own colours, so a bot
// pours away green or rust or slate, not in Blip's ink and bone. One of these
// per figure; the owner steps it, draws it, and drops the figure when `done`.
import { TAU, clamp, reduced } from "../util.js";

const W_IN = TAU * 2.1, Z_IN = .8, SWIRL = .44;   // each dot's pull into the ball (its own: ±20%)
const W_R = TAU * 3.4, Z_R = .34;                 // the ball's size: a gulp, a pop
const POP = .26;                                  // how long the empty ball takes to go
/** A steady number in [0, 1) for particle i, so each keeps its own spring. */
const hash = (i, k) => (((i + 1) * (2654435761 + k * 40503)) >>> 0) % 4096 / 4096;
const spring = (x, v, to, w, z, h) => { v += (w * w * (to - x) - 2 * z * w * v) * h; return [x + v * h, v]; };

export function makePour() {
  let n = 0, cap = 0, px, py, vx, vy, rad, dl, kindOf, live;
  const S = {
    on: false, out: false, t: 0, delay: 0, done: 0, maxDl: 0, cell: 2, H: 100,
    ink: "#151311", lit: "#F3E2C6", feet: [0, 0], bx: 0, by: 0, bvy: 0, R: 2, Rt: 2, Rv: 0, Rmax: 8, pop: 0,
  };

  function alloc(m) {
    if (m <= cap) return;
    cap = Math.ceil(m * 1.2);
    px = new Float32Array(cap); py = new Float32Array(cap); vx = new Float32Array(cap); vy = new Float32Array(cap);
    rad = new Float32Array(cap); dl = new Float32Array(cap); kindOf = new Uint8Array(cap); live = new Uint8Array(cap);
  }

  return {
    /** Where its ball is, for whoever draws it (the glow goes there). */
    get ball() { return [S.bx, S.by]; },
    /** How much of the figure is still there (1 at the start, 0 when it has all gone in). */
    get there() { return S.on ? 1 - S.done / Math.max(1, n) : 0; },
    /** Every dot in, the ball popped: the figure can be dropped. */
    get done() { return S.out; },
    /**
     * Takes `c` (a capture) apart. `o`: the figure's own `ink` and `lit`, and
     * `delay` seconds before it starts (so a screenful of them goes in a ripple).
     */
    start(c, o) {
      const m = (c.ink.length + c.lit.length) / 2;
      alloc(m); n = m;
      S.on = true; S.out = reduced; S.t = 0; S.delay = reduced ? 0 : (o.delay || 0); S.done = 0;
      S.cell = c.cell; S.H = c.H; S.ink = o.ink; S.lit = o.lit; S.feet = [c.x, c.y]; S.pop = 0;
      S.bx = c.ball[0]; S.by = c.ball[1]; S.bvy = 0;
      S.R = S.Rt = Math.max(1.4, c.H * .022); S.Rv = 0; S.Rmax = Math.max(4, c.H * .1);
      let maxD = 1;
      const put = (list, k, r, off) => {
        for (let j = 0; j < list.length; j += 2) {
          const i = off + j / 2;
          px[i] = list[j]; py[i] = list[j + 1]; vx[i] = vy[i] = 0; kindOf[i] = k; rad[i] = r; live[i] = 1;
          const d = Math.hypot(list[j] - S.bx, list[j + 1] - S.by); dl[i] = d; if (d > maxD) maxD = d;
        }
      };
      put(c.ink, 0, c.cell * .64, 0); put(c.lit, 1, c.cell * .46, c.ink.length / 2);
      // The order they go: by how far they are from the ball, with a little noise so no ring shows.
      S.maxDl = 0;
      for (let i = 0; i < n; i++) { dl[i] = .03 + .5 * Math.pow(dl[i] / maxD, 1.1) + hash(i, 1) * .04; if (dl[i] > S.maxDl) S.maxDl = dl[i]; }
    },
    step(dt) {
      if (!S.on || S.out) return;
      if (S.delay > 0) { S.delay -= dt; return; }
      const h = Math.min(.025, dt);
      for (let s = 0; s < Math.max(1, Math.ceil(dt / .025)); s++) {
        S.t += h;
        // The ball jiggles on the spot with each dot it swallows, and grows with them.
        S.by += S.bvy * h; S.bvy *= Math.pow(.2, h);
        [S.R, S.Rv] = spring(S.R, S.Rv, S.Rt, W_R, Z_R, h);
        if (S.done >= n) {
          // Empty: it pops and shrinks away.
          S.pop += h / POP; S.Rt = 0;
          if (S.pop >= 1) { S.out = true; return; }
          continue;
        }
        for (let i = 0; i < n; i++) {
          if (!live[i]) continue;
          if (S.t < dl[i]) continue;                                  // still part of the figure, waiting its turn
          const w = W_IN * (.8 + .4 * hash(i, 2)) * Math.min(1, (S.t - dl[i]) / .18);
          const dx = S.bx - px[i], dy = S.by - py[i];
          const sw = SWIRL * clamp(Math.hypot(dx, dy) / (S.H * .4));
          vx[i] += (w * w * (dx - sw * dy) - 2 * Z_IN * w * vx[i]) * h;
          vy[i] += (w * w * (dy + sw * dx) - 2 * Z_IN * w * vy[i]) * h;
          px[i] += vx[i] * h; py[i] += vy[i] * h;
          const gone = Math.max(S.R * .6, S.cell);
          if (dx * dx + dy * dy < gone * gone) {
            live[i] = 0; S.done++;
            S.bvy += vy[i] * .5 / n; S.Rv += S.Rmax * 4 / n;        // its share of the figure's weight
          }
        }
        S.Rt = Math.max(1.4, S.H * .022) + (S.Rmax - Math.max(1.4, S.H * .022)) * Math.sqrt(S.done / Math.max(1, n));
        if (S.t > S.maxDl + 1.6) { for (let i = 0; i < n; i++) live[i] = 0; S.done = n; }
      }
    },
    draw(g) {
      if (!S.on || S.out || S.delay > 0) return;
      const R = Math.max(0, S.R);
      // What is left of the shadow it stood in.
      const there = 1 - S.done / Math.max(1, n);
      if (there > .01) {
        g.fillStyle = `rgba(28,24,18,${.24 * there})`;
        g.beginPath(); g.ellipse(S.feet[0], S.feet[1] - .004 * S.H, S.H * .2 * (.35 + .65 * there), S.H * .022, 0, 0, TAU); g.fill();
      }
      for (let pass = 0; pass < 2; pass++) {
        g.fillStyle = pass ? S.lit : S.ink; g.beginPath();
        for (let i = 0; i < n; i++) {
          if (kindOf[i] !== pass || !live[i]) continue;
          // Shrinking to nothing as it reaches the ball.
          const d = Math.hypot(S.bx - px[i], S.by - py[i]), r = rad[i] * clamp((d - R * .6) / (R * 1.8 + S.cell), 0, 1);
          if (r < .12) continue;
          g.moveTo(px[i] + r, py[i]); g.arc(px[i], py[i], r, 0, TAU);
        }
        g.fill();
      }
      // The ball itself, in the figure's own colours, with the green glow of its antenna.
      if (R > .2) {
        g.fillStyle = S.ink; g.beginPath(); g.arc(S.bx, S.by, R + S.cell * .3, 0, TAU); g.fill();
        g.fillStyle = S.lit; g.beginPath(); g.arc(S.bx - R * .12, S.by - R * .12, Math.max(.3, R * .78), 0, TAU); g.fill();
        const k = (1 - S.pop) * clamp(S.done / Math.max(1, n) + .25), r = R * 2.6 + 2;
        if (k > .02) {
          const gr = g.createRadialGradient(S.bx, S.by, 0, S.bx, S.by, r);
          gr.addColorStop(0, `rgba(120,255,90,${.5 * k})`); gr.addColorStop(.35, `rgba(57,255,20,${.2 * k})`); gr.addColorStop(1, "rgba(57,255,20,0)");
          g.fillStyle = gr; g.beginPath(); g.arc(S.bx, S.by, r, 0, TAU); g.fill();
        }
      }
    },
  };
}
