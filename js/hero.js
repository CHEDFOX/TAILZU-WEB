// THE OPENING'S PICTURE (#hero .hero-team). X0 itself, rising over the horizon: the bot's head, huge, coming up from
// the bottom of the window like a sun, drawn by the desktop app's own renderer (js/blip/blip.js) in its own dithered
// dots, its one eye on the visitor's pointer. On a visit only its antennae are up at first, over the horizon; after a
// beat it comes up, slowly, into the sky. Across the horizon in front of it the team goes by without end, small bots
// each at its own pace, now and then hopping, stopping to wave, or looking up at X0. A thin halo of dots fades out
// round it all.
//
// It turns with the field as the words do (stage.js, tone.js): it is drawn twice, ink on the paper and light on the
// dark, and the two are laid together through a map of how dark the field is under each part of it, taken every
// frame, so as the dark half flows across, the picture turns black or white under it. It runs only while it can be
// seen; with motion reduced it is drawn once, still.
import { reduced } from "./util.js";
import { blip } from "./blip/kit.js";
import { fieldDark } from "./stage.js";

const cv = document.querySelector(".hero-team");
const B = blip();
if (cv && B) {
  const g = cv.getContext("2d");
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
  // the two looks: on the dark, light green dots with dark edges; on the paper, ink dots with paper edges
  const LOOK = {
    dark: { dot: [160, 218, 128], edge: "#14200F", line: "rgb(160, 218, 128)", halo: "rgb(98, 150, 72)" },
    light: { dot: [22, 20, 15], edge: "#F4F2EC", line: "rgb(22, 20, 15)", halo: "rgba(22, 20, 15, .55)" },
  };
  const hex = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  let W = 0, H = 0, dpr = 1;
  const layer = { dark: document.createElement("canvas"), light: document.createElement("canvas") };
  const halo = { dark: document.createElement("canvas"), light: document.createElement("canvas") };
  const mask = document.createElement("canvas"), mg = mask.getContext("2d");
  const MW = 48, MH = 16; mask.width = MW; mask.height = MH;
  const mimg = mg.createImageData(MW, MH);

  // ---- X0 rising, and the team going by: one of each per look, played alike, so the two drawings match ----
  let ptr = null;
  addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); ptr = [e.clientX - r.left, e.clientY - r.top]; }, { passive: true });
  addEventListener("pointerleave", () => { ptr = null; });
  const N = 8;
  // the team's own state, shared by both drawings: where each is, its pace and size, and what it is doing
  const crew = Array.from({ length: N }, (_, i) => ({
    i, x: 0, speed: 34 + Math.random() * 26, scale: .82 + Math.random() * .36, phase: Math.random() * 6,
    trick: null, until: 0, next: 1500 + i * 900 + Math.random() * 3000, air: 0,
  }));
  const cast = {};
  for (const k of ["dark", "light"]) {
    const L = LOOK[k];
    const sun = B.createBlip({ height: 600, ink: L.edge, pale: L.dot, live: hex(L.dot) });
    sun.pose("peek");   // not live: the opening lights the antenna itself (glow, below)
    const team = crew.map(() => {
      const me = B.createPerformer({ dpr: 2, dot: hex(L.dot), sticker: L.edge, glow: hex(L.dot) });
      me.play(reduced ? "rest" : "stroll");
      return me;
    });
    if (reduced) sun.still(true);
    cast[k] = { sun, team };
  }
  const play = (i, name, opts) => { cast.dark.team[i].play(name, opts); cast.light.team[i].play(name, opts); };

  function size() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    for (const k of ["dark", "light"]) {
      layer[k].width = cv.width; layer[k].height = cv.height;
      cast[k].sun.size(Math.min(H * 1.48, W * .9));
      // the halo, once per size: a rise of light from the horizon, dithered into thinning dots
      const c = halo[k]; c.width = cv.width; c.height = cv.height;
      const h = c.getContext("2d"), cell = 4 * dpr, cols = Math.ceil(c.width / cell), rows = Math.ceil(c.height / cell);
      h.fillStyle = LOOK[k].halo;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const dx = (x / cols - .5) * 1.6, dy = 1 - y / rows;
        const v = Math.max(0, .5 - Math.hypot(dx, dy * 1.15) * .62) * Math.min(1, (y / rows) * 1.6);
        if (v > BAYER[(y & 3) * 4 + (x & 3)]) h.fillRect(x * cell, y * cell, cell * .55, cell * .55);
      }
    }
  }

  // ---- the team, a step at a time: walking, and now and then a trick ----
  let placed = false, lastT = 0;
  function stepTeam(now) {
    const dt = Math.min(.1, lastT ? (now - lastT) / 1000 : 0); lastT = now;
    const span = W + 200;
    if (!placed) { crew.forEach((c) => { c.x = (c.i + Math.random() * .5) * span / N - 100; }); placed = true; }
    for (const c of crew) {
      if (c.trick && now > c.until) { c.trick = null; c.air = 0; play(c.i, "stroll"); c.next = now + 2500 + Math.random() * 5000; }
      if (!c.trick && !reduced && now > c.next) {
        c.trick = ["hop", "wave", "look", "hop"][Math.floor(Math.random() * 4)];
        c.from = now;
        if (c.trick === "hop") { c.until = now + 650; play(c.i, "celebrate"); }
        if (c.trick === "wave") { c.until = now + 1600; play(c.i, "yourTurn"); }
        if (c.trick === "look") { c.until = now + 1400; play(c.i, "look"); }
      }
      const walking = !c.trick || c.trick === "hop";
      if (walking && !reduced) c.x += c.speed * (c.trick === "hop" ? 1.6 : 1) * dt;
      if (c.trick === "hop") { const k = (now - c.from) / 650; c.air = Math.sin(Math.PI * Math.min(1, k)) * 26 * c.scale; }
      if (c.x > W + 100) c.x -= span;
    }
  }

  // ---- X0's arrival: only the antennae, then up, slowly ----
  let seenAt = 0;
  const ease = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
  function sunDrop(now) {
    if (reduced) return 0;
    const full = cast.dark.sun ? Math.min(H * 1.48, W * .9) * .5 : 0;       // how far up it stands when it is all there
    const ant = full * .78;                                                  // all but the antennae under the horizon
    const k = ease((now - seenAt - 1400) / 3400);
    return ant * (1 - k);
  }

  function drawLook(k, now) {
    const t = now / 1000, c = layer[k].getContext("2d"), L = LOOK[k], { sun, team } = cast[k];
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, layer[k].width, layer[k].height);
    c.drawImage(halo[k], 0, 0);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // X0, rising, its eye on the pointer (or, with none, on the one at the front of the team)
    let lead = crew[0]; for (const c of crew) if (c.x > lead.x) lead = c;
    sun.lookAt(ptr || [lead.x, H - 40]);
    sun.draw(c, W / 2, H + 2 + sunDrop(now), t, reduced ? 1 : .42);   // big dots: the renderer's own dither, at a coarse grain
    // the horizon, and the team on it
    c.fillStyle = L.line; c.fillRect(0, H - 3, W, 1.5);
    const h0 = Math.max(40, Math.min(72, H * .16));
    crew.forEach((b, i) => {
      const h = h0 * b.scale, bob = b.trick ? 0 : Math.abs(Math.sin(t * 6 * (b.speed / 46) + b.phase)) * 1.6;
      c.save(); c.translate(b.x, H - 3 - bob - b.air); team[i].draw(c, 0, 0, h, now); c.restore();
    });
  }

  // how dark the field is under the picture, as a small map, stretched over it
  function fieldMap() {
    const r = cv.getBoundingClientRect(), px = mimg.data;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const d = fieldDark(r.left + (x + .5) / MW * r.width, r.top + (y + .5) / MH * r.height), o = (y * MW + x) * 4;
      px[o] = px[o + 1] = px[o + 2] = 255; px[o + 3] = Math.round(Math.max(0, Math.min(1, (d - .35) / .3)) * 255);   // a quick turn across the edge
    }
    mg.putImageData(mimg, 0, 0);
  }

  function frame(now) {
    stepTeam(now);
    drawLook("dark", now); drawLook("light", now); fieldMap();
    // the dark look where the field is dark, the light look where it is light
    const dc = layer.dark.getContext("2d"), lc = layer.light.getContext("2d");
    dc.setTransform(1, 0, 0, 1, 0, 0); dc.imageSmoothingEnabled = true; dc.globalCompositeOperation = "destination-in";
    dc.drawImage(mask, 0, 0, layer.dark.width, layer.dark.height); dc.globalCompositeOperation = "source-over";
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.imageSmoothingEnabled = true; lc.globalCompositeOperation = "destination-out";
    lc.drawImage(mask, 0, 0, layer.light.width, layer.light.height); lc.globalCompositeOperation = "source-over";
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(layer.light, 0, 0); g.drawImage(layer.dark, 0, 0);
    glow(now);
  }

  // ---- the lit antenna: a hot core, a bloom that spreads and fades, a faint streak where a lens would catch it, and a
  // slow breath with a little flicker. On the dark it adds light (it brightens the dots round it); on the paper it is a
  // soft green halo ----
  function glow(now) {
    const b = cast.dark.sun.ball();
    if (!b) return;
    const t = now / 1000, [x, y, r0] = b, r = Math.max(2.5, r0);
    const dark = fieldDark(cv.getBoundingClientRect().left + x, cv.getBoundingClientRect().top + y) > .5;
    const breath = reduced ? .85 : .72 + .2 * Math.sin(t * 1.7) + .06 * Math.sin(t * 9.3) * Math.sin(t * 3.1);
    g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalCompositeOperation = dark ? "lighter" : "source-over";
    const k = dark ? 1 : .55;
    // the bloom
    let gr = g.createRadialGradient(x, y, 0, x, y, r * 11 * (.9 + .2 * breath));
    gr.addColorStop(0, `rgba(170, 235, 140, ${.42 * breath * k})`); gr.addColorStop(.18, `rgba(140, 214, 110, ${.18 * breath * k})`);
    gr.addColorStop(.5, `rgba(110, 190, 90, ${.06 * breath * k})`); gr.addColorStop(1, "rgba(110, 190, 90, 0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 11 * (.9 + .2 * breath), 0, Math.PI * 2); g.fill();
    // the streak a lens would catch
    g.save(); g.translate(x, y); g.scale(1, .07);
    gr = g.createRadialGradient(0, 0, 0, 0, 0, r * 16);
    gr.addColorStop(0, `rgba(210, 255, 190, ${.35 * breath * k})`); gr.addColorStop(1, "rgba(210, 255, 190, 0)");
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 16, 0, Math.PI * 2); g.fill(); g.restore();
    // the core: the ball itself lit, near white at its middle
    gr = g.createRadialGradient(x - r * .25, y - r * .25, 0, x, y, r * 1.25);
    gr.addColorStop(0, `rgba(250, 255, 240, ${dark ? 1 : .95})`); gr.addColorStop(.45, `rgba(200, 245, 170, ${dark ? .95 : .9})`); gr.addColorStop(1, `rgba(140, 214, 110, ${dark ? .5 : .7})`);
    g.globalCompositeOperation = "source-over";
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 1.08, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  let raf = 0, last = 0;
  const loop = (now) => { raf = requestAnimationFrame(loop); if (now - last < 1000 / 30) return; last = now; frame(now); };
  size();
  addEventListener("resize", () => { size(); if (reduced) frame(4000); });
  if (reduced) { frame(4000); addEventListener("scroll", () => frame(4000), { passive: true }); }
  else new IntersectionObserver((es) => {
    cancelAnimationFrame(raf);
    if (es.some((e) => e.isIntersecting)) { if (!seenAt) seenAt = performance.now(); raf = requestAnimationFrame(loop); }
  }).observe(cv);
}
