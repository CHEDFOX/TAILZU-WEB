import { TAU, clamp, lerp } from "../util.js";

// ---- Blip, whole: the films' figure, walking ------------------------------
// drawFigureBlip from the films (tools/media/social.html), with legs that
// walk. Painted in greys one cell per dot, then dithered into dots.
export const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
const grey = (l) => { const v = Math.round(clamp(l) * 255); return `rgb(${v},${v},${v})`; };
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function arm(g, H, sx, sy, s, a1, a2) {
  const L1 = .2 * H, L2 = .18 * H, ex = sx + s * Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1;
  const a = a1 + a2, hx = ex + s * Math.sin(a) * L2, hy = ey + Math.cos(a) * L2;
  g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = grey(.5); g.lineWidth = .085 * H; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke();
  g.strokeStyle = grey(.68); g.lineWidth = .028 * H; g.beginPath(); g.moveTo(sx - s * .012 * H, sy - .02 * H); g.lineTo(ex - s * .012 * H, ey - .02 * H); g.stroke();
  const px = hx + s * Math.sin(a) * .035 * H, py = hy + Math.cos(a) * .035 * H;
  g.fillStyle = grey(.84); g.beginPath(); g.arc(px, py, .052 * H, 0, TAU); g.fill();
  return [px, py];
}
/** The figure, feet at the foot of a box W×H. Returns the waving hand and the antenna's ball. */
export function figure(g, W, H, st, t) {
  const cx = W / 2, bob = st.bob, sway = Math.sin(t * TAU * .45) * .025 * st.swayK, drop = st.drop;
  [-1, 1].forEach((s, i) => {
    const L = st.legs[i], hx = cx + s * .06 * H, hy = .72 * H + drop, len = .21 * H;
    const ax = hx + Math.sin(L.th) * len + s * .012 * H, ay = hy + Math.cos(L.th) * len - L.lift;
    g.strokeStyle = grey(.34); g.lineWidth = .034 * H; g.lineCap = "round"; g.beginPath(); g.moveTo(hx, hy); g.lineTo(ax, ay); g.stroke();
    g.lineCap = "butt"; g.lineWidth = .038 * H;
    for (let k = 0; k < 4; k++) { const f0 = .5 + k * .105, f1 = f0 + .105; g.strokeStyle = grey(k % 2 ? .88 : .16); g.beginPath(); g.moveTo(lerp(hx, ax, f0), lerp(hy, ay, f0)); g.lineTo(lerp(hx, ax, f1), lerp(hy, ay, f1)); g.stroke(); }
    // Standing, the shoes point out; walking, both point the way it goes.
    const dir = lerp(s, 1, st.walkK);
    g.save(); g.translate(ax + dir * .038 * H, ay + .026 * H); g.rotate(-L.lift / H * 2.2 * Math.sign(dir || 1));
    g.fillStyle = grey(.14); g.beginPath(); g.ellipse(0, 0, .105 * H, .04 * H, 0, 0, TAU); g.fill();
    g.fillStyle = grey(.42); g.beginPath(); g.ellipse(dir * .005 * H, -.016 * H, .065 * H, .013 * H, 0, 0, TAU); g.fill();
    g.restore();
  });
  const top = .52 * H + bob + drop, bot = .75 * H + drop;
  g.save(); g.beginPath(); g.moveTo(cx - .085 * H, top); g.quadraticCurveTo(cx - .2 * H, bot, cx - .17 * H, bot); g.lineTo(cx + .17 * H, bot); g.quadraticCurveTo(cx + .2 * H, bot, cx + .085 * H, top); g.closePath(); g.clip();
  for (let i = 0; i < 7; i++) { g.fillStyle = grey(i % 2 ? .66 : .38); g.fillRect(cx - .22 * H, top + i * .035 * H, .44 * H, .035 * H); }
  g.restore();
  const hand = arm(g, H, cx + .1 * H, top + .035 * H, 1, st.ra[0], st.ra[1]);
  arm(g, H, cx - .1 * H, top + .035 * H, -1, st.la[0], st.la[1]);
  g.strokeStyle = grey(.72); g.lineWidth = .028 * H; g.lineCap = "round"; g.beginPath(); g.moveTo(cx, top + .01 * H); g.quadraticCurveTo(cx + .035 * H, .49 * H + bob + drop, cx, .44 * H + bob + drop); g.stroke();
  const hx = cx, hy = .3 * H + bob + drop, R = .16 * H, rot = st.tilt + sway;
  g.save(); g.translate(hx, hy + R); g.rotate(rot); g.translate(-hx, -(hy + R));
  const wob = Math.sin(t * TAU * 1.6) * .025 * H + st.antWob;
  g.strokeStyle = grey(.55); g.lineWidth = .012 * H; g.beginPath(); g.moveTo(hx - .05 * H, hy - R * .9); g.quadraticCurveTo(hx - .11 * H, hy - R * 1.35, hx - .065 * H + wob, hy - R * 1.55); g.stroke();
  g.fillStyle = grey(.96); g.beginPath(); g.arc(hx - .065 * H + wob, hy - R * 1.55, .024 * H, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(hx + .055 * H, hy - R * .88); g.lineTo(hx + .09 * H, hy - R * 1.22); g.lineTo(hx + .135 * H, hy - R * 1.16); g.stroke();
  const sg = g.createRadialGradient(hx - .06 * H, hy - .06 * H, 0, hx, hy, R * 1.3); sg.addColorStop(0, grey(.93)); sg.addColorStop(.6, grey(.75)); sg.addColorStop(1, grey(.46));
  g.fillStyle = sg; g.beginPath(); g.ellipse(hx, hy, R * 1.1, R * .94, 0, 0, TAU); g.fill();
  g.fillStyle = grey(.5); [-1, 1].forEach((s) => { rr(g, hx + s * R * 1.1 - .012 * H, hy - .015 * H, .024 * H, .03 * H, .006 * H); g.fill(); });
  const blink = ((t * 1000 + 300) % 3100) < 130, ex = hx - .005 * H, ey = hy - .012 * H, er = .082 * H;
  g.fillStyle = grey(.1); g.beginPath(); g.arc(ex, ey, er + .011 * H, 0, TAU); g.fill();
  if (!blink) {
    g.fillStyle = grey(.99); g.beginPath(); g.arc(ex, ey, er, 0, TAU); g.fill();
    const lx = st.look[0] * .034 * H, ly = .004 * H + st.look[1] * .026 * H;
    g.fillStyle = grey(.05); g.beginPath(); g.arc(ex + lx, ey + ly, .036 * H, 0, TAU); g.fill();
    g.fillStyle = grey(.99); g.beginPath(); g.arc(ex + lx - .011 * H, ey + ly - .012 * H, .009 * H, 0, TAU); g.fill();
    g.fillStyle = grey(.62); g.beginPath(); g.arc(ex, ey, er + .002 * H, Math.PI * 1.1, Math.PI * 1.9); g.closePath(); g.fill();
  } else { g.fillStyle = grey(.62); g.beginPath(); g.arc(ex, ey, er, 0, TAU); g.fill(); g.strokeStyle = grey(.1); g.lineWidth = .013 * H; g.beginPath(); g.moveTo(ex - er * .8, ey + .01 * H); g.lineTo(ex + er * .8, ey + .01 * H); g.stroke(); }
  g.strokeStyle = grey(.1); g.lineWidth = .017 * H; g.lineCap = "round"; g.beginPath(); g.arc(ex, ey - .016 * H - st.brows * .018 * H, er * 1.2, Math.PI * 1.22, Math.PI * 1.78); g.stroke();
  g.fillStyle = grey(.3); [[.075, .055], [.095, .07], [.07, .08]].forEach(([dx, dy]) => { g.beginPath(); g.arc(hx + dx * H, hy + dy * H, .006 * H, 0, TAU); g.fill(); });
  const mx = hx + .035 * H, my = hy + .105 * H;
  if (st.mouth === "grin") { g.fillStyle = grey(.08); g.beginPath(); g.ellipse(mx, my, .05 * H, .03 * H, -.15, 0, Math.PI); g.fill(); g.fillStyle = grey(.97); g.fillRect(mx - .012 * H, my - .002 * H, .02 * H, .014 * H); }
  else { g.strokeStyle = grey(.1); g.lineWidth = .014 * H; g.beginPath(); g.arc(mx, my - .022 * H, .04 * H, Math.PI * .2, Math.PI * .75); g.stroke(); g.fillStyle = grey(.97); g.fillRect(mx - .004 * H, my + .012 * H, .014 * H, .012 * H); }
  g.restore();
  // The antenna's ball, in the box, through the head's turn.
  const bx = hx - .065 * H + wob - hx, by = hy - R * 1.55 - (hy + R), c = Math.cos(rot), s = Math.sin(rot);
  return { hand, ball: [hx + bx * c - by * s, hy + R + bx * s + by * c] };
}
