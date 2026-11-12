import { view } from "../util.js";

// ---- The plane as water: a 2-D wave equation on a grid --------------------
// u'' = c² ∇²u, stepped explicitly; every footstep is a disturbance in it.
const CELL = 6, MARGIN = 16, C2 = .34, SUB = 2;
let cols = 0, rows = 0, prev, cur, next, damp;
export function makeField() {
  cols = Math.ceil(view.w / CELL) + MARGIN * 2; rows = Math.ceil(view.h / CELL) + MARGIN * 2;
  const n = cols * rows; prev = new Float32Array(n); cur = new Float32Array(n); next = new Float32Array(n); damp = new Float32Array(n);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const e = Math.min(x, y, cols - 1 - x, rows - 1 - y);
    // A soft sponge at the rim, so ripples leave instead of bouncing back.
    damp[y * cols + x] = e >= MARGIN ? .9962 : .9962 * (.84 + .16 * (e / MARGIN));
  }
}
export function stepField() {
  let mx = 0;
  for (let s = 0; s < SUB; s++) {
    for (let y = 1; y < rows - 1; y++) {
      let i = y * cols + 1;
      for (let x = 1; x < cols - 1; x++, i++) {
        const c = cur[i];
        const v = (2 * c - prev[i] + C2 * (cur[i - 1] + cur[i + 1] + cur[i - cols] + cur[i + cols] - 4 * c)) * damp[i];
        next[i] = v;
        if (s === SUB - 1) { const a = v < 0 ? -v : v; if (a > mx) mx = a; }
      }
    }
    const t = prev; prev = cur; cur = next; next = t;
  }
  wave.max = mx;
}
/** A disturbance at a point on the screen: a smooth bump, at rest. */
export function splash(px, py, amp, r = 2.2) {
  const gx = px / CELL + MARGIN, gy = py / CELL + MARGIN, R = Math.ceil(r * 3);
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  for (let y = y0 - R; y <= y0 + R; y++) {
    if (y < 1 || y >= rows - 1) continue;
    for (let x = x0 - R; x <= x0 + R; x++) {
      if (x < 1 || x >= cols - 1) continue;
      const d2 = (x - gx) * (x - gx) + (y - gy) * (y - gy), v = amp * Math.exp(-d2 / (r * r));
      cur[y * cols + x] += v; prev[y * cols + x] += v;
    }
  }
  wave.max = Math.max(wave.max, Math.abs(amp));
}
/** Height and slope of the water under a point (bilinear), into wave.u, wave.x, wave.y. */
export function sample(px, py) {
  const gx = px / CELL + MARGIN, gy = py / CELL + MARGIN;
  const x = Math.floor(gx), y = Math.floor(gy), fx = gx - x, fy = gy - y;
  if (x < 0 || y < 0 || x >= cols - 1 || y >= rows - 1) { wave.u = wave.x = wave.y = 0; return; }
  const i = y * cols + x, a = cur[i], b = cur[i + 1], c = cur[i + cols], d = cur[i + cols + 1];
  wave.u = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  wave.x = (b - a) * (1 - fy) + (d - c) * fy; wave.y = (c - a) * (1 - fx) + (d - b) * fx;
}


/** What sample() last read (u: height, x and y: slope), and the field's biggest height after the last step. */
export const wave = { u: 0, x: 0, y: 0, max: 0 };
