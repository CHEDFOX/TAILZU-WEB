import { TAU } from "../util.js";
import { BAYER, figure } from "./figure.js";

/**
 * The one renderer for the dotted figure, wherever he stands: the figure in
 * greys into a small buffer (one cell per dot), then an ink sticker grown
 * around it, then the dots the dither lets through, then the antenna's glow.
 * o: { H, cell, x, y (feet, ground), mirror, squash, land, air, st, t, glow, padX }.
 * Returns the hand and the antenna's ball in g's coordinates.
 */
export function makeDots() {
  let buf = null, on = null;
  return function render(g, o) {
    const H = o.H, W = H * .84, cell = o.cell, PX = o.padX || 0, st = o.st;
    const sq = 1 - (o.squash || 0), land = o.land || 0, air = o.air || 0;
    const TOP = .14 * H, bw = Math.ceil((W + PX * 2) / cell), bh = Math.ceil((H + TOP) / cell) + 1;
    if (!buf || buf.width !== bw || buf.height !== bh) { buf = document.createElement("canvas"); buf.width = bw; buf.height = bh; on = new Uint8Array(bw * bh); }
    const fg = buf.getContext("2d", { willReadFrequently: true });
    fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, bw, bh);
    fg.setTransform(1 / cell, 0, 0, 1 / cell, 0, 0); fg.translate(PX, TOP);
    if (o.mirror) { fg.translate(W, 0); fg.scale(-1, 1); }
    const f = figure(fg, W, H, st, o.t);
    // Where a point in the figure's box lands.
    const map = (fx, fy) => { const lx = o.mirror ? W - fx : fx; return [o.x + (lx - W / 2) * sq, o.y - H + fy]; };
    const src = fg.getImageData(0, 0, bw, bh).data;
    const ox = o.x - W / 2 - PX, oy = o.y - H - TOP;
    // The shadow it stands in.
    const lifted = Math.max(st.legs[0].lift, st.legs[1].lift) / H;
    g.fillStyle = `rgba(28,24,18,${.1 - air * .04})`; g.beginPath(); g.ellipse(o.x, o.y - .004 * H, H * (.2 - lifted * .5 - air * .03) * sq, H * .022, 0, 0, TAU); g.fill();
    // Squashed as it lands, stretched in the air: the weight of it.
    g.save(); g.translate(o.x, o.y); g.scale(sq * (1 + .05 * land - .02 * air), 1 - .06 * land + .03 * air); g.translate(-o.x, -o.y);
    for (let i = 0; i < bw * bh; i++) on[i] = src[i * 4 + 3] > 60 ? 1 : 0;
    // The sticker: every cell the figure touches, grown by one, in ink.
    g.fillStyle = "#151311"; g.beginPath();
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      let hit = on[y * bw + x];
      if (!hit) for (let j = -1; j <= 1 && !hit; j++) for (let i = -1; i <= 1 && !hit; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && yy >= 0 && xx < bw && yy < bh && on[yy * bw + xx]) hit = 1; }
      if (hit) { const px = ox + x * cell + cell / 2, py = oy + y * cell + cell / 2; g.moveTo(px + cell * .64, py); g.arc(px, py, cell * .64, 0, TAU); }
    }
    g.fill();
    // The dots: lit where the grey beats the dither's threshold.
    g.fillStyle = "#F3E2C6"; g.beginPath();
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const i = (y * bw + x) * 4, a = src[i + 3]; if (a < 90) continue;
      const lum = (src[i] * .3 + src[i + 1] * .59 + src[i + 2] * .11) / 255 * (a / 255);
      if (lum > (BAYER[(y & 7) * 8 + (x & 7)] + .5) / 64) { const px = ox + x * cell + cell / 2, py = oy + y * cell + cell / 2; g.moveTo(px + cell * .46, py); g.arc(px, py, cell * .46, 0, TAU); }
    }
    g.fill();
    g.restore();
    const hand = map(f.hand[0], f.hand[1]), ball = map(f.ball[0], f.ball[1]);
    // The antenna's ball lights green: the same green as the water.
    if (o.glow > .02) {
      const [x, y] = ball, r = H * .05, gr = g.createRadialGradient(x, y, 0, x, y, r * 2.4);
      gr.addColorStop(0, `rgba(120,255,90,${.55 * o.glow})`); gr.addColorStop(.3, `rgba(57,255,20,${.22 * o.glow})`); gr.addColorStop(1, "rgba(57,255,20,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.4, 0, TAU); g.fill();
    }
    return { hand, ball };
  };
}
