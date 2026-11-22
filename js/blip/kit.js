// Blip for the page: the desktop app's renderer (js/blip/blip.js, window.TailzuBlip) with the moves it would compile from
// its catalog put back into its tables from js/blip/moves.js (scripts/gen-blip-moves.mjs). blip() is the renderer, ready,
// or null when it did not load.
import { NUM, CARD, MOVES } from "./moves.js";

let ready = false;
export function blip() {
  const B = window.TailzuBlip;
  if (!B) return null;
  if (!ready) { install(B); ready = true; }
  return B;
}

// ---- his moves, put back into the renderer's tables (see scripts/gen-blip-moves.mjs) ----
function install(B) {
  Object.assign(B.POSES, CARD);
  for (const [name, m] of Object.entries(MOVES)) {
    const F = m.frames, n = F.length;
    B.BLIP_GESTURES[name] = (t) => {
      let u = Math.max(0, t);
      if (m.play === "loop") u %= m.len;
      else if (m.play === "bounce") { u %= 2 * m.len; if (u > m.len) u = 2 * m.len - u; }
      else u = Math.min(u, m.len);
      const k = u / m.len * (n - 1);
      const i = Math.min(n - 2, Math.floor(k)), f = k - i, a = F[i], b = F[i + 1];
      const v = (j) => a[j] + (b[j] - a[j]) * f;
      const p = {};
      NUM.forEach((key, j) => { p[key] = v(j); });
      let j = NUM.length;
      p.ra = [v(j), v(j + 1)]; p.la = [v(j + 2), v(j + 3)]; p.look = [v(j + 4), v(j + 5)];
      p.legs = [{ th: v(j + 6), lift: v(j + 7) }, { th: v(j + 8), lift: v(j + 9) }];
      j += 10;
      p.mouth = (f < .5 ? a : b)[j] || "smile";
      const eye = (f < .5 ? a : b)[j + 1]; if (eye) p.eye = eye;
      return p;
    };
    if (m.play === "once") B.GESTURE_LENGTH[name] = m.len;
  }
}

