// Blip into his antenna and back out again. Every dot of him becomes a
// particle, each on a spring of its own. Going in, the dots nearest the
// antenna's ball let go first (his head, then his body, his legs last), each
// pulled into the ball with a little swirl, shrinking as it arrives; the ball
// swells and jiggles with each one it swallows. When nearly all of him is in,
// the stalk lets go of where his head was and drops to the floor, where it
// stands: a springy rod with the ball on top that never quite keeps still.
// Coming out is the same backwards: the antenna floats up to where his head
// will be, and the ball throws the dots back to their places, head first,
// each on a loose spring, so he settles with a little wobble and is himself
// again on the frame the last dot lands.
//
// It only animates; the page says when (suck, blow) and where (place; the
// figure to come out as, from makeDots' capture). Under reduced motion every
// change is instant and the antenna stands still.
import { TAU, clamp, reduced } from "../util.js";
import { BAYER } from "./figure.js";

const INK = "#151311", LIT = "#F3E2C6";
const W_IN = TAU * 1.75, Z_IN = .8, SWIRL = .38;     // the pull into the ball (each dot's own: ±20%)
const W_OUT = TAU * 1.9, Z_OUT = .56;                // the throw back out (under-damped: a wobble)
const W_BALL = TAU * 2.1, Z_BALL = .42;              // the ball on its stalk
const W_BASE = TAU * 1.6, Z_BASE = .78;              // the stalk's foot, between his head and the floor
const W_SIZE = TAU * 3.1, Z_SIZE = .3;               // the ball's size (a gulp, a pop)
const LEAN_HEAD = .32;                               // on his head the antenna leans left; on the floor it stands straight
const BALL = .11, STALK = .62;                       // the standing antenna's ball (radius) and stalk, per height of the Blip it holds

const smooth = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
/** One step of a damped spring: x toward to, v its speed. Returns [x, v]. */
function spring(x, v, to, w, z, h) { v += (w * w * (to - x) - 2 * z * w * v) * h; return [x + v * h, v]; }
/** A steady number in [0, 1) for particle i (so each has its own spring, the same every time). */
const hash = (i, k) => (((i + 1) * (2654435761 + k * 40503)) >>> 0) % 4096 / 4096;

export function makeAntenna(splash) {
  let N = 0, cap = 0;
  let px, py, vx, vy, hx, hy, rad, dl, wf, kind, live;
  const A = { state: "off", t: 0, done: 0, H: 100, cell: 2, feet: [0, 0], maxDl: 0, glide: false, to: null, clock: 0, glowIn: 0, lean: LEAN_HEAD, headLean: LEAN_HEAD, size: 100 };
  // The antenna: its foot (base), the ball on its stalk, the ball's size.
  const base = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, drop: false, t0: 0 };
  const ball = { x: 0, y: 0, vx: 0, vy: 0, R: 3, Rv: 0, Rt: 3 };
  let L = 20, Lt = 20, r0 = 3, Rmax = 8, rest = [0, 0];

  function alloc(n) {
    if (n <= cap) return;
    cap = Math.ceil(n * 1.2);
    px = new Float32Array(cap); py = new Float32Array(cap); vx = new Float32Array(cap); vy = new Float32Array(cap);
    hx = new Float32Array(cap); hy = new Float32Array(cap); rad = new Float32Array(cap); dl = new Float32Array(cap); wf = new Float32Array(cap);
    kind = new Uint8Array(cap); live = new Uint8Array(cap);
  }
  /** One particle per dot of a captured figure, at home, waiting its turn (nearest the ball first). */
  function load(c, spread) {
    const n = (c.ink.length + c.lit.length) / 2;
    alloc(n); N = n; A.done = 0; A.cell = c.cell; A.H = c.H;
    let maxD = 1;
    const put = (list, k, r, off) => {
      for (let j = 0; j < list.length; j += 2) {
        const i = off + j / 2;
        hx[i] = px[i] = list[j]; hy[i] = py[i] = list[j + 1]; vx[i] = vy[i] = 0; kind[i] = k; rad[i] = r;
        const d = Math.hypot(list[j] - c.ball[0], list[j + 1] - c.ball[1]); dl[i] = d; if (d > maxD) maxD = d;
      }
    };
    put(c.ink, 0, c.cell * .64, 0); put(c.lit, 1, c.cell * .46, c.ink.length / 2);
    // The order they go (or come): by distance from the ball, with a touch of noise so no ring shows.
    A.maxDl = 0;
    for (let i = 0; i < N; i++) {
      dl[i] = .04 + spread * Math.pow(dl[i] / maxD, 1.1) + hash(i, 1) * .045;
      wf[i] = .8 + .4 * hash(i, 2);
      if (dl[i] > A.maxDl) A.maxDl = dl[i];
    }
  }
  /** Where his antenna's stalk meets his head, for a figure H tall with its feet at (x, y). */
  const headTop = (x, y, H) => [x - .05 * H, y - H + .156 * H];
  /** Where the ball would rest on its stalk: up from the foot, leaning as it leans. */
  function anchor() { const k = 1 / Math.hypot(A.lean, 1); return [base.x - A.lean * k * L, base.y - k * L]; }
  function dropBase() { if (!base.drop) { base.drop = true; base.t0 = A.t; } }
  /** The antenna standing on the floor where it was put, at the size it was given. */
  function standAtRest() { base.tx = rest[0]; base.ty = rest[1]; Lt = Math.max(18, A.size * STALK); ball.Rt = Rmax; }

  const api = {
    get state() { return A.state; },
    /** How much of him has gone in (0 to 1). */
    get poured() { return A.state === "in" ? A.done / Math.max(1, N) : A.state === "orb" ? 1 : 0; },
    /**
     * Into the antenna: `from` is the figure as he stands now (a capture), `at`
     * where the antenna then stands (its foot, on the floor), `size` how tall a
     * Blip it is made for (the ball and stalk are sized from it).
     */
    suck(from, at, size) {
      load(from, .9);
      A.state = "in"; A.t = 0; A.feet = [from.x, from.y]; A.glowIn = 0;
      for (let i = 0; i < N; i++) live[i] = 1;
      const [bx0, by0] = headTop(from.x, from.y, from.H);
      Object.assign(base, { x: bx0, y: by0, vx: 0, vy: 0, tx: bx0, ty: by0, drop: false, t0: 0 });
      Object.assign(ball, { x: from.ball[0], y: from.ball[1], vx: 0, vy: 0 });
      r0 = Math.max(1.6, from.H * .024); ball.R = ball.Rt = r0; ball.Rv = 0;
      L = Lt = Math.hypot(from.ball[0] - bx0, from.ball[1] - by0);
      // Leaning just as his does, so the ball starts exactly where his was.
      A.lean = A.headLean = by0 - from.ball[1] > 1 ? (bx0 - from.ball[0]) / (by0 - from.ball[1]) : LEAN_HEAD;
      rest = at; A.size = size; Rmax = Math.max(5, size * BALL);
      if (reduced) finishIn();
    },
    /** Out of the antenna, as `to` (a capture of the figure he comes out as, where he will stand). */
    blow(to) {
      A.to = to; A.state = "out"; A.t = 0; A.glide = true; N = 0;
      r0 = Math.max(1.6, to.H * .024);
      if (reduced) { A.state = "off"; return; }
      // Up to where his head will be, his own short stalk again.
      const [bx, by] = headTop(to.x, to.y, to.H);
      base.tx = bx; base.ty = by; base.drop = true; base.t0 = 0;
      Lt = Math.hypot(to.ball[0] - bx, to.ball[1] - by);
    },
    /** Where the antenna stands while he is inside it, and how big (a resize moves it). Coming out, a resize ends it at once. */
    place(at, size) {
      rest = at; A.size = size; Rmax = Math.max(5, size * BALL);
      if (A.state === "orb") standAtRest();
      if (A.state === "out") A.state = "off";
    },
    step(dt) {
      if (A.state === "off") return;
      if (reduced) {
        base.x = rest[0]; base.y = rest[1]; A.lean = 0; L = Lt = Math.max(18, A.size * STALK); ball.R = ball.Rt = Rmax;
        const [ax, ay] = anchor(); ball.x = ax; ball.y = ay; A.glowIn = 1;
        return;
      }
      A.clock += dt;
      const n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n;
      for (let s = 0; s < n; s++) sub(h);
    },
    draw(g) { if (A.state !== "off") paint(g); },
  };

  function finishIn() {
    for (let i = 0; i < N; i++) live[i] = 0;
    A.done = N; A.state = "orb"; dropBase(); standAtRest();
    if (reduced) return;
    ball.Rv += Rmax * 4; splash(ball.x, ball.y, .9, 3.4);
  }

  function sub(h) {
    A.t += h;
    const t = A.t;
    A.glowIn = Math.min(1, A.glowIn + h / .3);
    // On the floor the antenna stands straight; on his head it leans as his does.
    const leanTo = A.state === "orb" || (A.state === "in" && base.drop) ? 0 : A.state === "in" ? A.headLean : LEAN_HEAD;
    A.lean += (leanTo - A.lean) * Math.min(1, h * 3);
    // The stalk's foot: on his head until it lets go, then on a spring that tightens over a third of a second (it falls, it is not yanked).
    if (base.drop) {
      const w = W_BASE * Math.min(1, .15 + (t - base.t0) / .35);
      [base.x, base.vx] = spring(base.x, base.vx, base.tx, w, Z_BASE, h);
      [base.y, base.vy] = spring(base.y, base.vy, base.ty, w, Z_BASE, h);
    }
    L += (Lt - L) * Math.min(1, h * (A.state === "out" ? 4 : 2.2));
    // The ball on its stalk: a mass on a spring, never quite still (a slow drift
    // it chases), and thrown about when the foot moves (it lags, then catches up).
    // Coming out it heads for exactly where his own ball will be.
    const [ax, ay] = anchor(), c = A.clock, amp = ball.R * (A.state === "orb" ? .55 : A.state === "in" ? .2 : 0);
    const tx = A.state === "out" ? A.to.ball[0] : ax + amp * (Math.sin(c * 1.3) + .45 * Math.sin(c * 2.9 + 1.1));
    const ty = A.state === "out" ? A.to.ball[1] : ay + amp * (.6 * Math.cos(c * 1.1) + .3 * Math.sin(c * 2.3 + .4));
    [ball.x, ball.vx] = spring(ball.x, ball.vx, tx, W_BALL, Z_BALL, h);
    [ball.y, ball.vy] = spring(ball.y, ball.vy, ty, W_BALL, Z_BALL, h);
    // The stalk is a springy rod, not a string: it gives a little, then holds the ball (what pulled outward is lost).
    const sx = ball.x - base.x, sy = ball.y - base.y, sl = Math.hypot(sx, sy), lim = L * 1.22 + 2;
    if (sl > lim) {
      const ux = sx / sl, uy = sy / sl, outward = (ball.vx - base.vx) * ux + (ball.vy - base.vy) * uy;
      ball.x = base.x + ux * lim; ball.y = base.y + uy * lim;
      if (outward > 0) { ball.vx -= outward * ux; ball.vy -= outward * uy; }
    }
    [ball.R, ball.Rv] = spring(ball.R, ball.Rv, ball.Rt, W_SIZE, Z_SIZE, h);
    ball.R = clamp(ball.R, r0 * .6, Rmax * 1.25);

    if (A.state === "in") {
      for (let i = 0; i < N; i++) {
        if (!live[i]) continue;
        if (t < dl[i]) {
          // Still part of him, stretched a little toward the ball.
          const k = .1 * smooth(t / dl[i]);
          px[i] = hx[i] + (ball.x - hx[i]) * k; py[i] = hy[i] + (ball.y - hy[i]) * k;
          continue;
        }
        // Its own spring to the ball, damped against the ball's motion (so it follows the ball, not trails it).
        const w = W_IN * wf[i] * Math.min(1, (t - dl[i]) / .22), dx = ball.x - px[i], dy = ball.y - py[i];
        const sw = SWIRL * clamp(Math.hypot(dx, dy) / (A.H * .4));
        vx[i] += (w * w * (dx - sw * dy) + 2 * Z_IN * w * (ball.vx - vx[i])) * h;
        vy[i] += (w * w * (dy + sw * dx) + 2 * Z_IN * w * (ball.vy - vy[i])) * h;
        px[i] += vx[i] * h; py[i] += vy[i] * h;
        // Inside the ball it is gone (it has already shrunk to nothing on the way in).
        const gone = Math.max(ball.R * .6, A.cell);
        if (dx * dx + dy * dy < gone * gone) {
          live[i] = 0; A.done++;
          // Each one it swallows nudges it (its share of his weight): the ball wobbles as he pours in.
          ball.vx += vx[i] * .9 / N; ball.vy += vy[i] * .9 / N; ball.Rv += Rmax * 5 / N;
        }
      }
      ball.Rt = r0 + (Rmax - r0) * Math.sqrt(A.done / Math.max(1, N));
      // When nearly all of him is in, the stalk lets go of where his head was.
      if (A.done > N * .9) { dropBase(); standAtRest(); ball.Rt = r0 + (Rmax - r0) * Math.sqrt(A.done / Math.max(1, N)); }
      if (A.done >= N || t > A.maxDl + 1.8) finishIn();
    } else if (A.state === "out") {
      const to = A.to;
      if (A.glide) {
        // First the antenna floats up to where his head will be; then he comes out of it.
        const ready = Math.hypot(ball.x - to.ball[0], ball.y - to.ball[1]) < 3 && Math.hypot(ball.vx, ball.vy) < 50;
        if (ready || t > 1.1) {
          A.glide = false; A.t = 0; load(to, .5);
          for (let i = 0; i < N; i++) {
            live[i] = 0;
            const a = (i * 2.399963) % TAU, r = Math.sqrt(hash(i, 3)) * ball.R * .55;
            px[i] = ball.x + Math.cos(a) * r; py[i] = ball.y + Math.sin(a) * r;
          }
        }
        return;
      }
      let out = 0, home = 0;
      for (let i = 0; i < N; i++) {
        if (live[i] === 2) { home++; out++; continue; }
        if (live[i] === 0) {
          if (t < dl[i]) { px[i] = ball.x; py[i] = ball.y; continue; }
          // Thrown out toward its place, a little off the straight line.
          live[i] = 1;
          const dx = hx[i] - px[i], dy = hy[i] - py[i], s = 3.4 + hash(i, 4) * 1.3, j = (hash(i, 5) - .5) * .6;
          vx[i] = (dx - j * dy) * s; vy[i] = (dy + j * dx) * s;
        }
        out++;
        const w = W_OUT * wf[i];
        vx[i] += (w * w * (hx[i] - px[i]) - 2 * Z_OUT * w * vx[i]) * h;
        vy[i] += (w * w * (hy[i] - py[i]) - 2 * Z_OUT * w * vy[i]) * h;
        px[i] += vx[i] * h; py[i] += vy[i] * h;
        const ex = hx[i] - px[i], ey = hy[i] - py[i];
        if (t > dl[i] + .3 && ex * ex + ey * ey < .09 && vx[i] * vx[i] + vy[i] * vy[i] < 36) { live[i] = 2; px[i] = hx[i]; py[i] = hy[i]; }
      }
      A.done = home;
      ball.Rt = r0 + (Rmax - r0) * Math.sqrt(1 - out / Math.max(1, N));
      // Every dot home (or the stragglers put home): he is himself again, on this very frame.
      if (home >= N || t > A.maxDl + 1.9) { A.state = "off"; splash(to.x, to.y - 2, .9, 4); }
    }
  }

  function paint(g) {
    const cell = A.cell, out = A.state === "out" && !A.glide;
    // His shadow, as much of it as there is of him.
    const there = A.state === "in" ? 1 - A.done / Math.max(1, N) : out ? A.done / Math.max(1, N) : 0;
    if (there > .01) {
      const f = out ? [A.to.x, A.to.y] : A.feet, H = A.H;
      g.fillStyle = `rgba(28,24,18,${.1 * there})`; g.beginPath(); g.ellipse(f[0], f[1] - .004 * H, H * .2 * (.4 + .6 * there), H * .022, 0, 0, TAU); g.fill();
    }
    // The antenna's own small shadow on the floor while it stands there.
    if (A.state === "orb" || (A.state === "in" && base.drop)) {
      const k = A.state === "orb" ? 1 : smooth((A.t - base.t0) / .4);
      g.fillStyle = `rgba(28,24,18,${.08 * k})`; g.beginPath(); g.ellipse(base.x, base.y, Math.max(3, Rmax * .9), Math.max(1.2, Rmax * .22), 0, 0, TAU); g.fill();
    }
    // Coming out the antenna is behind him (he forms in front of it); going in it is in front (he pours into it).
    if (out) paintAntenna(g, cell);
    if (N && (A.state === "in" || out)) {
      for (let pass = 0; pass < 2; pass++) {
        g.fillStyle = pass ? LIT : INK; g.beginPath();
        for (let i = 0; i < N; i++) {
          if (kind[i] !== pass) continue;
          let r = rad[i];
          if (A.state === "in") {
            if (!live[i]) continue;
            // Shrinking to nothing as it reaches the ball; the pale ones dim into the stream as they travel.
            const d = Math.hypot(ball.x - px[i], ball.y - py[i]);
            r *= clamp((d - ball.R * .6) / (ball.R * 1.6), 0, 1);
            if (pass) r *= 1 - .45 * clamp(Math.hypot(px[i] - hx[i], py[i] - hy[i]) / (A.H * .15));
            if (r < .15) continue;
          } else {
            if (live[i] === 0) continue;
            r *= clamp((A.t - dl[i]) / .14, .2, 1);
          }
          g.moveTo(px[i] + r, py[i]); g.arc(px[i], py[i], r, 0, TAU);
        }
        g.fill();
      }
    }
    if (!out) paintAntenna(g, cell);
  }

  /** The stalk (a curve from its foot to the ball) and the ball, in his dots, with the green glow. */
  function paintAntenna(g, cell) {
    const bx = base.x, by = base.y, ex = ball.x, ey = ball.y, R = ball.R;
    const dx = ex - bx, dy = ey - by, len = Math.hypot(dx, dy) || 1;
    // The stalk curls a little (left, as his does), and bends the way the ball is thrown.
    const [ax] = anchor(), bend = (ex - ax) * .5, curl = len * (.08 + .1 * A.lean / LEAN_HEAD);
    const cx = bx + dx * .5 - (dy / len) * curl - bend, cy = by + dy * .5 + (dx / len) * curl;
    const steps = Math.max(3, Math.ceil(len / (cell * .9)));
    g.fillStyle = INK; g.beginPath();
    for (let k = 0; k <= steps; k++) {
      const s = k / steps, u = 1 - s, x = u * u * bx + 2 * u * s * cx + s * s * ex, y = u * u * by + 2 * u * s * cy + s * s * ey;
      g.moveTo(x + cell * .64, y); g.arc(x, y, cell * .64, 0, TAU);
    }
    g.fill();
    g.fillStyle = LIT; g.beginPath();
    for (let k = 1; k < steps; k += 2) {
      const s = k / steps, u = 1 - s, x = u * u * bx + 2 * u * s * cx + s * s * ex, y = u * u * by + 2 * u * s * cy + s * s * ey;
      g.moveTo(x + cell * .3, y); g.arc(x, y, cell * .3, 0, TAU);
    }
    g.fill();
    // The ball: dots on a grid that rides with it, an ink rim, lit inside where the light falls (top left).
    const n = Math.ceil((R + cell) / cell);
    g.fillStyle = INK; g.beginPath();
    for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
      const x = ex + i * cell, y = ey + j * cell;
      if (Math.hypot(x - ex, y - ey) <= R + cell * .7) { g.moveTo(x + cell * .64, y); g.arc(x, y, cell * .64, 0, TAU); }
    }
    g.fill();
    g.fillStyle = LIT; g.beginPath();
    for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
      const x = ex + i * cell, y = ey + j * cell, d = Math.hypot(x - ex, y - ey) / Math.max(1, R);
      if (d > .92) continue;
      const lum = .98 - .42 * d * d - .14 * ((y - ey) / Math.max(1, R)) + .06 * ((ex - x) / Math.max(1, R));
      if (lum > (BAYER[((j + 64) & 7) * 8 + ((i + 64) & 7)] + .5) / 64) { g.moveTo(x + cell * .46, y); g.arc(x, y, cell * .46, 0, TAU); }
    }
    g.fill();
    // It glows green, breathing slowly, the same green as the water (the glow comes up as he starts to pour).
    const glow = (.55 + .2 * Math.sin(A.clock * 2.1)) * smooth(A.glowIn), r = R * 2 + 3;
    if (glow > .01) {
      const gr = g.createRadialGradient(ex, ey, 0, ex, ey, r);
      gr.addColorStop(0, `rgba(120,255,90,${.5 * glow})`); gr.addColorStop(.35, `rgba(57,255,20,${.2 * glow})`); gr.addColorStop(1, "rgba(57,255,20,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(ex, ey, r, 0, TAU); g.fill();
    }
  }

  return api;
}
