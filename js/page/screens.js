// The phone and the laptop, each with an empty screen the bots walk onto. On a wide
// window they stand side by side on one floor, the phone on the left, the
// laptop (the bigger of the two) on the right, Blip in the gap between them,
// the three centred together; on a tall one the phone is above, the laptop
// below, and Blip in the middle. They come in (and go) on springs, each from
// its own side.
import { TAU, clamp, reduced, view } from "../util.js";
import { makeScreen } from "./screen.js";
import * as arrivals from "./arrivals.js";

const box = document.getElementById("screens");
const PH = 844 / 390;                       // the phone's screen, tall per wide
const W_IN = TAU * 1.3, Z_IN = .78;         // their springs

function device(kind) {
  const d = document.createElement("div"), scr = document.createElement("div"), scn = makeScreen(kind);
  scr.className = "scr"; scr.appendChild(scn.el);
  if (kind === "phone") {
    d.className = "dev phone";
    const frame = document.createElement("div"), glass = document.createElement("div"), isl = document.createElement("i");
    frame.className = "frame"; glass.className = "glass"; isl.className = "isl";
    glass.append(scr, isl); frame.appendChild(glass);
    for (const k of ["k1", "k2", "k3", "k4"]) { const b = document.createElement("i"); b.className = "k " + k; d.appendChild(b); }
    d.appendChild(frame);
  } else {
    d.className = "dev laptop";
    const lid = document.createElement("div"), glass = document.createElement("div"), base = document.createElement("div");
    lid.className = "lid"; glass.className = "glass"; base.className = "base";
    glass.appendChild(scr); lid.appendChild(glass); d.append(lid, base);
  }
  box.appendChild(d);
  arrivals.register(kind, scn.crowd);
  return { el: d, kind, scn, e: 0, v: 0, to: 0, delay: 0, w: 0, h: 0 };
}
const phone = device("phone"), lap = device("desk");

// ---- Sizes ---------------------------------------------------------------------
const pBez = (ps) => Math.max(4, Math.round(ps * .032)) + 2;
const phoneH = (ps) => Math.round(ps * PH) + 2 * pBez(ps);
const phoneW = (ps) => Math.round(ps) + 2 * pBez(ps);
const lapParts = (sw) => {
  const lb = Math.max(5, Math.round(sw * .02)), lbb = Math.max(8, Math.round(sw * .036)), e = 1.25;
  const lw = Math.round(sw + 2 * lb + 2 * e), sh = Math.round(sw * .625), lh = Math.round(sh + lb + lbb + 2 * e);
  const bw = Math.round(lw * 1.06), bh = Math.max(7, Math.round(lw * .024)), lr = Math.max(9, Math.round(sw * .03)), lx = Math.round((bw - lw) / 2);
  return { lb, lbb, lw, sh, lh, bw, bh, lr, lx, w: bw, h: lh + bh };
};
/** A phone whose screen is `ps` wide. */
function sizePhone(ps) {
  ps = Math.round(ps);
  const pb = pBez(ps) - 2, w = phoneW(ps), h = phoneH(ps), r = Math.round(w * .17), s = phone.el.style;
  s.width = w + "px"; s.height = h + "px";
  s.setProperty("--pb", pb + "px"); s.setProperty("--pr", r + "px"); s.setProperty("--pw", ps + "px");
  phone.w = w; phone.h = h;
  // Where the glass sits inside the device box: the band, then the bezel.
  return { w, h, sw: ps, ox: pBez(ps), oy: pBez(ps) };
}
/** A laptop whose screen is `sw` wide: the lid, a thin bezel with the camera, and a base 6% wider. */
function sizeLaptop(sw) {
  sw = Math.round(sw);
  const p = lapParts(sw), s = lap.el.style;
  s.width = p.w + "px"; s.height = p.h + "px";
  for (const [k, v] of [["--lw", p.lw], ["--lh", p.lh], ["--lx", p.lx], ["--lb", p.lb], ["--lbb", p.lbb], ["--lr", p.lr], ["--bw", p.bw], ["--bh", p.bh], ["--sw", sw], ["--sh", p.sh]]) s.setProperty(k, v + "px");
  lap.w = p.w; lap.h = p.h;
  return { w: p.w, h: p.h, sw, ox: p.lx + 1.25 + p.lb, oy: 1.25 + p.lb };
}

let side = true;

/**
 * Lays them out for this window. Returns where Blip stands between them
 * ({ x, gy, H }) and where his antenna's foot stands ([x, y]) while the
 * screens are up, and which way he looks at each device (`aim`) when he is
 * watching one from there. Where he goes when he leaves that spot — into one
 * of the screens — is page/arrivals.js's business; it is given this same spot,
 * so a resize moves where he is heading, not him.
 */
export function layoutScreens() {
  const VW = view.w, VH = view.h;
  side = VW >= VH * .95;
  let P, Q, px, py, qx, qy, blip;
  if (side) {
    // Below the key (its foot is about 70 px down), above a margin at the bottom.
    const top = VH < 520 ? 80 : 96, bottom = VH - Math.max(22, VH * .05), avail = bottom - top;
    const zone = clamp(VW * .11, 110, VH * .24), M = Math.max(20, VW * .05);
    // The laptop leads (its screen a third of the window), the phone a little taller than it; both fit the height.
    let sw = clamp(VW * .3, 220, 900);
    while (lapParts(sw).h > avail * .86 && sw > 160) sw -= 4;
    let ps = (Math.min(lapParts(sw).h * 1.18, avail) - 12) / PH;
    // Too wide for the window: both down together.
    const need = phoneW(ps) + zone + lapParts(sw).w, room = VW - 2 * M;
    if (need > room) { const k = (room - zone) / (need - zone); ps *= k; sw *= k; }
    P = sizePhone(ps); Q = sizeLaptop(sw);
    const groupW = P.w + zone + Q.w, x0 = Math.round((VW - groupW) / 2);
    const groupH = Math.max(P.h, Q.h), floor = Math.round(Math.min(bottom, top + (avail - groupH) / 2 + groupH));
    px = x0; py = floor - P.h; qx = x0 + P.w + zone; qy = floor - Q.h;
    blip = { x: Math.round(x0 + P.w + zone / 2), gy: floor - 2, H: Math.round(clamp(Math.min(zone * .82, P.h * .36), 64, VH * .17)) };
  } else {
    const top = 84, bottom = VH - Math.max(18, VH * .03), avail = bottom - top;
    const bh = Math.round(clamp(avail * .15, 60, 130)), gap = Math.round(bh * 1.45), R = avail - gap;
    // The whole laptop, base and all, within the window less 20 px each side.
    let sw = Math.min(620, ((VW - 40) / 1.06 - 2.5) / 1.04);
    const ps = Math.min((R * .55 - 12) / PH, VW * .46);
    while (lapParts(sw).h > R - phoneH(ps) && sw > 120) sw -= 4;
    P = sizePhone(ps); Q = sizeLaptop(sw);
    const total = P.h + gap + Q.h, y0 = Math.round(top + (avail - total) / 2);
    px = Math.round((VW - P.w) / 2); py = y0;
    qx = Math.round((VW - Q.w) / 2); qy = y0 + P.h + gap;
    blip = { x: Math.round(VW / 2), gy: Math.round(y0 + P.h + gap * .86), H: bh };
  }
  // Which way he looks from the middle at each of them, when he is watching
  // rather than walking into one.
  const aim = side ? { phone: [-1, -.18], desk: [1, -.18] } : { phone: [0, -1], desk: [0, .7] };
  phone.el.style.left = px + "px"; phone.el.style.top = py + "px";
  lap.el.style.left = qx + "px"; lap.el.style.top = qy + "px";
  phone.scn.fit(P.sw); lap.scn.fit(Q.sw);
  // Where each glass is on the page, for the bots walking over to it.
  arrivals.fitPage();
  arrivals.setRect("phone", { x: px + P.ox, y: py + P.oy, ...phone.scn.size(P.sw) });
  arrivals.setRect("desk", { x: qx + Q.ox, y: qy + Q.oy, ...lap.scn.size(Q.sw) });
  paint(phone); paint(lap);
  return { blip, foot: [blip.x, blip.gy], aim };
}

function paint(d) {
  const e = d.e, off = 1 - e, dir = d === phone ? -1 : 1;
  // Mostly moving, hardly fading: they are see-through only for the first and last few hundredths.
  const o = clamp((e - .04) * 4), s = .95 + .05 * clamp(e, 0, 1.15);
  const tr = side ? `translateX(${(off * d.w * .28 * dir).toFixed(2)}px)` : `translateY(${(off * d.h * .22 * dir).toFixed(2)}px)`;
  d.el.style.transform = `${tr} scale(${s.toFixed(4)})`;
  d.el.style.opacity = o.toFixed(3);
  d.el.style.visibility = o < .002 && d.to === 0 ? "hidden" : "visible";
}

/**
 * How far into his pour the screens may start coming in: side by side, once
 * his head and waving arm are in; one above the other, once all of him is
 * (the laptop comes up where he stood).
 */
export const screensEnterAt = () => (side ? .45 : .98);
/** In: the phone first, the laptop a beat after. */
export function showScreens() {
  for (const [d, delay] of [[phone, 0], [lap, .08]]) { d.to = 1; d.delay = reduced ? 0 : delay; }
}
export function hideScreens() {
  for (const [d, delay] of [[lap, 0], [phone, .05]]) { d.to = 0; d.delay = reduced ? 0 : delay; }
}

// ---- The crowd on them, and the beats after it ---------------------------------
/** Enough roaming: both troupes come to a stop, and nobody still on the way dawdles. */
export function settleScreens() {
  for (const d of [phone, lap]) { if (d.to === 1) { arrivals.rush(d.kind); d.scn.crowd.settle(); } }
}
/** Everyone is on and standing: the page may move on. */
export function screensSettled() {
  for (const d of [phone, lap]) { if (d.to === 1 && (arrivals.pending(d.kind) || !d.scn.crowd.settled())) return false; }
  return true;
}
/** They go the way Blip does: every dot into its own antenna's ball (blip/pour.js). */
export function vanishCrowds() { for (const d of [phone, lap]) d.scn.crowd.vanish(); }
/** Nothing of them left: both screens are blank white. */
export function crowdsGone() { for (const d of [phone, lap]) if (!d.scn.crowd.gone()) return false; return true; }
/** Back to step 1 from the other side: the screens are empty and they walk on again. */
export function restartCrowds() {
  for (const d of [phone, lap]) {
    d.scn.content.hide(); arrivals.stop(d.kind); d.scn.crowd.leave();
    if (d.to === 1 && d.e > .9) arrivals.start(d.kind);
  }
}

/** One of a device's beats arrives on its blank screen (`now`: simply there, finished). */
export function showBeat(kind, name, now) { (kind === "phone" ? phone : lap).scn.content.show(name, now); }
/** One beat off, or (no `kind`) both: the screens are blank white again. */
export function hideBeats(kind) {
  for (const d of [phone, lap]) if (!kind || d.kind === kind) d.scn.content.hide();
}
/** That beat has finished arriving and is holding — the freeze. */
export function beatDone(kind) { return (kind === "phone" ? phone : lap).scn.content.done(); }
/** Nothing on that screen: it is blank white again. */
export function beatOff(kind) { return !(kind === "phone" ? phone : lap).scn.content.shown(); }
/** Blip himself: off to one of the screens, about on it, or back to the middle. */
export function blipTo(kind, home) { arrivals.guestTo(kind, home); }
/** He has got there (`kind` null: back in the middle). */
export function blipThere(kind) { return arrivals.guestThere(kind); }
/** He is out of the page's hands, somewhere between the two. */
export const blipOut = () => arrivals.guestBusy();

/** Someone is still on their way over to one of them. */
export function screensFilling() { for (const d of [phone, lap]) if (d.to === 1 && arrivals.pending(d.kind)) return true; return false; }

export function stepScreens(dt) {
  for (const d of [phone, lap]) {
    if (d.delay > 0) { d.delay -= dt; continue; }
    if (reduced) { d.e = d.to; d.v = 0; }
    else { d.v += (W_IN * W_IN * (d.to - d.e) - 2 * Z_IN * W_IN * d.v) * dt; d.e += d.v * dt; }
    if (d.to === 0 && d.e < .002) { d.e = 0; d.v = 0; }
    paint(d);
    // The bots set off across the page once the device has all but landed;
    // the screen is empty again, and whoever is still walking over turns back,
    // once it has gone.
    if (d.to === 1 && d.e > .9) arrivals.start(d.kind);
    if (d.to === 0 && d.e === 0) { arrivals.stop(d.kind); d.scn.leave(); }
    if (d.e > .02) d.scn.step(dt);
  }
  arrivals.step(dt);
  arrivals.draw();
}
