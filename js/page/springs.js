// The little physics every scene on the screens is made of.
//
// Nothing on the glass is on a curve. Every dot is a mass with a position and
// a velocity, and whatever moves it is a FORCE: a spring to where it is
// meant to be (its own stiffness, damping and mass, so two dots never arrive
// together), gravity while it is falling, drag through the air, a floor it
// bounces off, and the knock it takes when something lands beside it. The
// scenes only say what to pull and when; how it gets there is the solver's,
// and it overshoots and settles the way a weight on a spring does — which is
// what the app's own pictures do (TAILZU-BACKEND docs/show.md).
//
// Fixed steps of 1/240 s, whatever the frame rate, so a slow frame cannot
// blow a stiff spring up.
const STEP = 1 / 240;

export function makeField(o = {}) {
  const P = [];
  const G = o.gravity === undefined ? 0 : o.gravity;   // px/s², down
  let carry = 0;

  const F = {
    all: P,
    /**
     * A dot. `x, y` where it starts; `tx, ty` where its spring pulls it (null:
     * no spring, it is free); `k` stiffness, `c` damping, `m` mass; `r` its
     * radius; `tone` for whoever draws it. Everything else is the solver's.
     */
    add(d) {
      const p = {
        x: d.x, y: d.y, vx: d.vx || 0, vy: d.vy || 0,
        tx: d.tx === undefined ? d.x : d.tx, ty: d.ty === undefined ? d.y : d.ty,
        k: d.k === undefined ? 260 : d.k, c: d.c === undefined ? 14 : d.c, m: d.m || 1,
        r: d.r === undefined ? 4 : d.r, tone: d.tone === undefined ? .22 : d.tone,
        free: !!d.free, g: d.g === undefined ? 1 : d.g, floor: d.floor, bounce: d.bounce === undefined ? .42 : d.bounce,
        hold: d.hold || 0, dead: false, tag: d.tag,
      };
      P.push(p);
      return p;
    },
    /**
     * What something landing does to a surface: everything near it is pushed
     * DOWN, hardest at the point of impact, and its own spring throws it back
     * — so a wave runs out along the row instead of the row being shoved apart.
     */
    splash(x, power, reach) {
      for (const p of P) {
        const d = Math.abs(p.x - x);
        if (d > reach) continue;
        p.vy += power * (1 - d / reach) ** 1.6 / p.m;
      }
    },
    /** A knock outward from (x, y): what a landing does to everything near it. */
    knock(x, y, power, reach) {
      for (const p of P) {
        const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy);
        if (d > reach || d < .001) continue;
        const f = power * (1 - d / reach) / p.m;
        p.vx += (dx / d) * f; p.vy += (dy / d) * f;
      }
    },
    /** Everything back where it belongs, at rest: what Reduce Motion gets. */
    settle() { for (const p of P) { p.x = p.tx; p.y = p.ty; p.vx = p.vy = 0; p.free = false; p.hold = 0; } },
    clear() { P.length = 0; carry = 0; },
    step(dt) {
      carry += Math.min(.1, dt);
      while (carry >= STEP) { carry -= STEP; sub(STEP); }
    },
  };

  function sub(h) {
    for (const p of P) {
      if (p.dead) continue;
      if (p.hold > 0) { p.hold -= h; continue; }
      let ax = 0, ay = 0;
      if (p.free) ay += G * p.g;
      else {
        // The spring, and the damping that stops it ringing for ever.
        ax += (p.k * (p.tx - p.x) - p.c * p.vx) / p.m;
        ay += (p.k * (p.ty - p.y) - p.c * p.vy) / p.m;
        if (p.g) ay += G * p.g * .06;                   // it still has weight on the spring
      }
      p.vx += ax * h; p.vy += ay * h;
      p.x += p.vx * h; p.y += p.vy * h;
      // A floor to land on, with a little of the fall given back.
      if (p.floor !== undefined && p.y > p.floor && p.vy > 0) {
        p.y = p.floor; p.vy = -p.vy * p.bounce;
        if (Math.abs(p.vy) < 24) { p.vy = 0; if (p.onRest) p.onRest(p); }
        else if (p.onBounce) p.onBounce(p);
      }
    }
  }

  return F;
}

/** How far a dot still is from where it is meant to be, and how fast: is it done? */
export const atRest = (p, eps = .6) => Math.abs(p.x - p.tx) < eps && Math.abs(p.y - p.ty) < eps && Math.hypot(p.vx, p.vy) < 8;
