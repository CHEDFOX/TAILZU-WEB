// The use cases as little scenes on the devices' glass, one after another,
// for as long as the devices are up.
//
// Two rules. They are ABSTRACT: nothing here draws the real thing, because
// the app itself does not — TAILZU-BACKEND docs/show.md draws every picture as
// monochrome dot art, "ink on paper, greys, no colour, dots wherever there is
// a picture". And they are PHYSICAL: not one of these dots is on a curve.
// Each is a mass on a spring with its own stiffness and damping, or in free
// fall, and what moves it is a force (page/springs.js). A scene says what to
// pull and when; the solver says how it gets there, and it overshoots and
// settles the way a weight on a spring does.
//
// The only words in a frame are who is working and what it is doing.
import { TAU, clamp, reduced, view } from "../util.js";
import { makeField, atRest } from "./springs.js";

const INK = "28,26,23";
const GREEN = "#2F7D22";
const RUST = "#C2452E";
const ink = (a) => `rgba(${INK},${a})`;
/** Noise, not a sequence: consecutive dots must not land on a line. */
const rnd = (i, j) => {
  let h = ((i + 1) * 374761393 + (j + 1) * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** The two words a scene is allowed: whose it is, and where it has got to. */
function chrome(g, W, H, name, state, lit, hue) {
  const s = W / 1280;
  g.textBaseline = "middle";
  g.font = `600 ${46 * s}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  g.fillStyle = ink(.42);
  g.fillText(name, 74 * s, 84 * s);
  if (!state) return;
  const w = g.measureText(state).width;
  const C = hue || GREEN;
  g.fillStyle = lit ? C : ink(.42);
  g.fillText(state, W - 74 * s - w, 84 * s);
  g.beginPath(); g.arc(W - 100 * s - w, 84 * s, 11 * s, 0, TAU);
  if (lit) { g.fillStyle = C; g.fill(); } else { g.strokeStyle = ink(.3); g.lineWidth = 3.4 * s; g.stroke(); }
}
const paint = (g, p, c) => { if (p.dead || p.r <= .05) return; g.fillStyle = c || ink(p.tone); g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill(); };

// ---- Xode: it finds the one thing that is wrong, and fills it ------------------
// A line of dots with a hole in it. The one that is missing falls in, bounces
// on the line, and is caught; everything near where it lands is knocked and
// has to settle again. The knock is the whole scene — nothing else says
// "something just happened here" as plainly, and nothing about it is drawn.
const gap = {
  secs: 6.4, name: "Xode",
  build(F, W, H) {
    const s = W / 1280, n = 11, p = 104 * s, y = H * .56, x0 = (W - (n - 1) * p) / 2;
    this.miss = 7; this.landed = false; this.y = y; this.s = s;
    for (let i = 0; i < n; i++) {
      if (i === this.miss) continue;
      F.add({ x: x0 + i * p, y: y - 150 * s, ty: y, tx: x0 + i * p, r: 21 * s, tone: .17 + rnd(i, 1) * .08,
        k: 150 + rnd(i, 2) * 90, c: 9 + rnd(i, 3) * 5, m: .8 + rnd(i, 4) * .5, hold: i * .035, g: 0 });
    }
    this.hole = { x: x0 + this.miss * p, y };
  },
  step(F, t) {
    if (t > 1.5 && !this.one) {
      // It arrives the only way something heavy can: by falling.
      this.one = F.add({ x: this.hole.x, y: -60, r: 24 * this.s, free: true, g: 1, floor: this.hole.y,
        bounce: .45, tx: this.hole.x, ty: this.hole.y, k: 420, c: 17, m: 1.4, tag: "one" });
      this.one.onBounce = (p) => { F.splash(p.x, 300, 560 * this.s); };
      this.one.onRest = (p) => { p.free = false; this.landed = true; this.ringAt = t; F.splash(p.x, 210, 700 * this.s); };
    }
  },
  draw(g, F, W, H, t) {
    for (const p of F.all) paint(g, p, p.tag === "one" ? GREEN : null);
    if (this.landed) {
      // One ring out of where it landed, and gone.
      const k = clamp((t - this.ringAt) / .9);
      if (k < 1) {
        g.strokeStyle = GREEN; g.globalAlpha = (1 - k) * .55; g.lineWidth = 3.4 * this.s;
        g.beginPath(); g.arc(this.hole.x, this.hole.y, 34 * this.s + k * 330 * this.s, 0, TAU); g.stroke();
        g.globalAlpha = 1;
      }
    }
    chrome(g, W, H, "Xode", t < 1.5 ? "Reading" : this.landed ? "Shipped" : "Writing", this.landed);
  },
};

// ---- Talk: you talk, and it comes out straight ---------------------------------
// The dots drift the way breath does, with no spring on them at all; then the
// springs take hold and they stream into one line, each at its own stiffness,
// so they arrive raggedly and settle true.
const order = {
  secs: 6.6, name: "X0",
  build(F, W, H) {
    const s = W / 1280, n = 16, p = 72 * s, y = H * .56, x0 = (W - (n - 1) * p) / 2;
    this.s = s; this.on = false;
    for (let i = 0; i < n; i++) {
      // Scattered across the whole of it, not on a ring: this is breath, not a pattern.
      F.add({ x: W * .1 + rnd(i, 5) * W * .8, y: y + (rnd(i, 6) - .5) * H * .62,
        vx: (rnd(i, 7) - .5) * 130, vy: (rnd(i, 8) - .5) * 130,
        tx: x0 + i * p, ty: y, r: 17 * s, tone: .16 + rnd(i, 9) * .1,
        k: 0, c: 1.4, m: .6 + rnd(i, 10) * .8, g: 0 });
    }
  },
  step(F, t) {
    if (t > 1.6 && !this.on) {
      this.on = true;
      F.all.forEach((p, i) => { p.k = 120 + rnd(i, 11) * 150; p.c = 10 + rnd(i, 12) * 6; });
    }
    this.done = this.on && F.all.every((p) => atRest(p, 1.2));
  },
  draw(g, F, W, H, t) {
    for (const p of F.all) paint(g, p);
    chrome(g, W, H, "X0", this.done ? "English" : "Hinglish", this.done);
  },
};

// ---- Mail: it got through the lot; three it will not decide --------------------
// Forty-five dots. One by one the spring under each lets go and it drops out
// of the frame. Three of them do the opposite: they are pulled up out of the
// grid and left hanging, wobbling, in rust. The count is the only word.
const fortyfive = {
  secs: 7.6, name: "Mail",
  build(F, W, H) {
    const s = W / 1280, cols = 15, p = 74 * s, x0 = (W - (cols - 1) * p) / 2, y0 = H * .36;
    this.s = s; this.gone = 0; this.flag = [7, 22, 36];
    this.dots = [];
    for (let i = 0; i < 45; i++) {
      const d = F.add({ x: x0 + (i % cols) * p, y: y0 + Math.floor(i / cols) * p - 120 * s,
        tx: x0 + (i % cols) * p, ty: y0 + Math.floor(i / cols) * p,
        r: 17 * s, tone: .2, k: 190 + rnd(i, 13) * 70, c: 11, m: .9, hold: i * .012, g: 0 });
      this.dots.push(d);
    }
  },
  step(F, t, W, H) {
    const n = Math.min(45, Math.max(0, Math.floor((t - 1.2) / .052)));
    while (this.gone < n) {
      const d = this.dots[this.gone++];
      if (this.flag.includes(this.gone - 1)) {
        // Not this one: up, out of the grid, and left hanging.
        d.ty = H * .78; d.k = 80; d.c = 5.5; d.m = 1.3; d.tone = 1; d.tag = "flag";
        d.vy = -260;
      } else { d.free = true; d.g = 1; d.vy = 20; d.tag = "gone"; }
    }
  },
  draw(g, F, W, H, t) {
    for (const p of F.all) { if (p.y > H + 40) continue; paint(g, p, p.tag === "flag" ? RUST : null); }
    const n = Math.min(45, Math.max(0, Math.floor((t - 1.2) / .052)));
    chrome(g, W, H, "Mail", n < 45 ? String(n) : "3", n >= 45, RUST);
  },
};

// ---- Meetings: four in the call, one of them ours ------------------------------
// Four dots breathing on soft springs. Whoever is talking is kicked, and
// bobs; ours is the ring. At the end the note writes itself underneath, every
// dot of it dropped in and caught.
const table = {
  secs: 7.2, name: "X0",
  build(F, W, H) {
    const s = W / 1280, n = 4, p = 230 * s, y = H * .40, x0 = (W - (n - 1) * p) / 2;
    this.s = s; this.y = y; this.seats = []; this.said = 0; this.note = [];
    for (let i = 0; i < n; i++) {
      this.seats.push(F.add({ x: x0 + i * p, y: y - 160 * s, tx: x0 + i * p, ty: y, r: (i === 3 ? 30 : 27) * s,
        tone: .2, k: 120, c: 6, m: 1, hold: i * .12, g: 0, tag: i === 3 ? "ours" : "them" }));
    }
    this.noteY = H * .68;
  },
  step(F, t, W) {
    // Somebody speaks: a kick, and the spring argues it back.
    const turn = Math.floor((t - .6) / 1.15);
    if (turn >= 0 && turn > this.said - 1 && turn < 4) {
      const who = this.seats[[0, 2, 1, 3][turn % 4]];
      if (who) { who.vy -= 420; this.said = turn + 1; }
    }
    if (t > 4.4) {
      const m = 18, want = Math.min(m, Math.floor((t - 4.4) / .055));
      const s = this.s, pitch = 54 * s, x0 = (W - (m - 1) * pitch) / 2;
      while (this.note.length < want) {
        const i = this.note.length;
        this.note.push(F.add({ x: x0 + i * pitch, y: this.noteY - 260 * s, tx: x0 + i * pitch, ty: this.noteY,
          r: 11 * s, tone: .22, k: 300, c: 12, m: .5, g: 0, vy: 40 }));
      }
    }
  },
  draw(g, F, W, H, t) {
    for (const p of F.all) {
      if (p.tag === "ours") {
        g.strokeStyle = GREEN; g.lineWidth = 3.6 * this.s;
        g.beginPath(); g.arc(p.x, p.y, 62 * this.s, 0, TAU); g.stroke();
        paint(g, p, GREEN);
      } else paint(g, p);
    }
    chrome(g, W, H, "X0", t > 4.4 ? "Noted" : "Listening", t > 4.4);
  },
};

const SCENES = { gap, order, fortyfive, table };
const CYCLES = { desk: ["gap", "order", "fortyfive", "table"], phone: ["order", "fortyfive"] };

/** The scenes one device's glass plays, over and over. */
export function makeVignette(which) {
  const cv = document.createElement("canvas");
  cv.className = "vg";
  const g = cv.getContext("2d");
  const names = CYCLES[which] || [which];
  let W = 0, H = 0, i = 0, t = 0, tick = 0, F = makeField({ gravity: 1500 }), S = null;

  function start(n) {
    i = n % names.length; t = 0; S = Object.create(SCENES[names[i]]);
    F.clear(); S.build(F, W, H);
    if (reduced) { S.step(F, S.secs - 1, W, H); F.settle(); }
  }
  return {
    el: cv,
    fit(w, h, k) {
      W = Math.max(1, Math.round(w)); H = Math.max(1, Math.round(h));
      cv.style.width = W + "px"; cv.style.height = H + "px";
      cv.width = Math.max(1, Math.round(W * k * view.dpr)); cv.height = Math.max(1, Math.round(H * k * view.dpr));
      start(i);
      this.draw();
    },
    reset() { start(0); this.draw(); },
    /** Come back to it and the first scene is already played out. */
    finish() { start(0); if (!reduced) { S.step(F, S.secs - 1, W, H); F.settle(); t = S.secs - 1.2; } this.draw(); },
    /** The first scene has played: the page may move on, and these keep going. */
    done() { return reduced || t >= Math.min(3.2, S.secs - 1); },
    step(dt) {
      if (reduced || !S) return;
      t += dt;
      S.step(F, t, W, H);
      F.step(dt);
      if (t >= S.secs) start(i + 1);
      if ((tick = (tick + 1) % 2) === 0) this.draw();
    },
    draw() {
      if (!W || !S) return;
      const k = cv.width / W;
      g.setTransform(k, 0, 0, k, 0, 0);
      g.clearRect(0, 0, W, H);
      // A scene arrives and leaves; in between it holds.
      g.globalAlpha = Math.min(clamp(t / .45), clamp((S.secs - t) / .45));
      S.draw(g, F, W, H, t);
      g.globalAlpha = 1;
    },
  };
}
