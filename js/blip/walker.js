import { clamp, lerp, easeIO } from "../util.js";

// ---- The walker: his state, and his bouncy walk ---------------------------
// One walk for every scene he walks into: a step per π of phase with a
// little hop in each, the lead foot landing out in front (the water feels
// it), braking to a stop. The scene says how tall he is, where the ground
// is, how fast he goes, and where its water is (o.splash).
const A0 = .62;
export function makeWalker(o) {
  const w = { x: 0, phase: 0, A: 0, v: 0, mirror: false, squash: 0, land: 0, air: 0, st: null };
  // Where a point in the figure's box lands on the screen.
  w.toScreen = (fx, fy) => {
    const H = o.H(), W = H * .84, ox = w.x - W / 2, oy = o.ground() - H;
    const lx = w.mirror ? W - fx : fx;
    return [ox + W / 2 + (lx - W / 2) * (1 - w.squash), oy + fy];
  };
  /** One frame of walking towards x = to. True on arrival. */
  w.stride = (dt, to) => {
    const H = o.H(), sp = o.speed(), slow = o.slow(), d = Math.abs(w.x - to);
    // Constant braking over the last stretch: v = √(2·a·d).
    w.v = d > slow ? sp : sp * Math.sqrt(Math.max(0, d / slow));
    const vk = clamp(w.v / sp);
    w.A = A0 * vk;
    // A bouncy walk: one step per π of phase, a little hop in each.
    const before = w.phase;
    w.phase += Math.PI * 3.5 * (.55 + .45 * vk) * dt;
    w.x += (to < w.x ? -1 : 1) * w.v * dt;
    if (Math.floor(w.phase / Math.PI) !== Math.floor(before / Math.PI)) {
      // The step's lead foot lands, out in front: the water feels it.
      const s = Math.floor(before / Math.PI) % 2 ? 1 : -1;
      const ax = H * .42 + s * .072 * H + Math.sin(w.A) * .21 * H + .04 * H;
      const [sx] = w.toScreen(ax, H);
      o.splash(sx, o.ground() - .01 * H, 1.25 * vk + .45, 3.6);
      w.land = 1;
    }
    if (d < 1.2 || (d < 24 && vk < .06)) { w.x = to; w.v = 0; w.land = 1; o.splash(w.x, o.ground() - 2, 1.6, 4.6); return true; }
    return false;
  };
  // Legs: the step's lead leg swings from behind to in front, the other
  // the other way; the whole figure is in the air at mid-step.
  w.gait = (dt) => {
    const st = w.st, H = o.H(), len = .21 * H, legs = st.legs, f = (w.phase / Math.PI) % 1, lead = Math.floor(w.phase / Math.PI) % 2;
    const vk = clamp(w.v / o.speed()), wk = clamp(w.A / A0), air = Math.sin(Math.PI * f) * Math.pow(vk, .8);
    legs[lead].th = lerp(-w.A, w.A, easeIO(f)); legs[1 - lead].th = -legs[lead].th * .7;
    legs[lead].lift = .035 * H * Math.sin(Math.PI * f) * vk; legs[1 - lead].lift = 0;
    w.air = air;
    st.drop = len * (1 - Math.cos(Math.max(Math.abs(legs[0].th), Math.abs(legs[1].th)))) - .07 * H * air;
    // Arms flap a little in turn, and flare out while it is in the air.
    st.ra = [.16 + .14 * wk * Math.sin(w.phase) + .3 * air, .12 + .1 * wk];
    st.la = [.16 - .14 * wk * Math.sin(w.phase) + .3 * air, .12 + .1 * wk];
    st.tilt = .05 * wk + .03 * wk * Math.sin(w.phase);
    st.antWob = .045 * H * wk * Math.sin(w.phase * 2 - 1.2);
    w.land = (w.land || 0) * Math.pow(.0005, dt);
  };
  w.draw = (g, dots, t, cell, glow) => dots(g, { H: o.H(), cell, x: w.x, y: o.ground(), mirror: w.mirror, squash: w.squash, land: w.land || 0, air: w.air || 0, st: w.st, t, glow });
  return w;
}
