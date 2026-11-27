// THE OPENING'S PICTURE (#hero .hero-team). X0 itself, rising over the horizon: the bot's head, huge, coming up from
// the bottom of the window like a sun, drawn by the desktop app's own renderer (js/blip/blip.js) in its own dithered
// dots, its one eye on the visitor's pointer. On a
// visit only its antennae are up, over the horizon; the opening is held while the page is scrolled, and the scroll pulls
// it up into the sky, a hard pull (THE PULL, below). Once it is all the way up it stays up until the page is loaded
// again. Its antenna is lit like a real light.
//
// On the horizon in front of it, the crew, each its own kind and never in step: walkers going either way at their own
// pace, who stop to wave, cheer, laugh or look up at X0, now and then a quirk (dizzy, jelly); skaters, faster, on their
// boards, popping ollies and kickflips and spinning round in the air; and jetpacks, who stand, fire up with a sputter,
// lift off and climb away out of the window (X0 watches them go, when the pointer is still), and some time later walk
// back in. The canvas covers the whole opening, so a flight can go up past the title and off the top; the scene itself
// stands on the bottom.
//
// It turns with the field as the words do (stage.js, tone.js): it is drawn twice, ink on the paper and light on the
// dark, and the two are laid together through a map of how dark the field is under each part of it, taken every
// frame, so as the dark half flows across, the picture turns black or white under it. It runs only while it can be
// seen; with motion reduced it is drawn once, still.
import { reduced } from "./util.js";
import { blip } from "./blip/kit.js";
import { fieldDark } from "./stage.js";

// Every visit and every refresh starts at the top, so the opening's pull and the stage's scroll start from the beginning
// (not for a link to a part further down).
if (!location.hash) { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; scrollTo(0, 0); }

const cv = document.querySelector(".hero-team");
const B = blip();
if (cv && B) {
  const g = cv.getContext("2d");
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
  // the two looks: on the dark, light green dots with dark edges; on the paper, ink dots with paper edges
  const LOOK = {
    dark: { dot: [46, 226, 140], edge: "#062016", line: "rgb(46, 226, 140)", halo: "rgb(16, 138, 86)" },
    light: { dot: [22, 20, 15], edge: "#F4F2EC", line: "rgb(22, 20, 15)", halo: "rgba(22, 20, 15, .55)" },
  };
  const hex = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  const rnd = (a, b) => a + Math.random() * (b - a), pick = (l) => l[Math.floor(Math.random() * l.length)];
  let W = 0, H = 0, SH = 0, dpr = 1;                       // SH: the scene's height, standing on the canvas's bottom
  const layer = { dark: document.createElement("canvas"), light: document.createElement("canvas") };
  const halo = { dark: document.createElement("canvas"), light: document.createElement("canvas") };
  const mask = document.createElement("canvas"), mg = mask.getContext("2d");
  const MW = 48, MH = 30; mask.width = MW; mask.height = MH;
  const mimg = mg.createImageData(MW, MH);

  let ptr = null, ptrAt = -1e9;
  addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); ptr = [e.clientX - r.left, e.clientY - r.top]; ptrAt = performance.now(); }, { passive: true });
  addEventListener("pointerleave", () => { ptr = null; });

  // ---- the crew: who each is, and its state, shared by both drawings ----
  const ROLES = ["walk", "skate", "jet", "walk", "skate", "walk", "jet", "walk"];
  const crew = ROLES.map((role, i) => ({
    i, role, x: 0, y: 0, dir: Math.random() < .5 ? 1 : -1, scale: rnd(.82, 1.14), phase: rnd(0, 6),
    speed: role === "skate" ? rnd(92, 128) : role === "jet" ? rnd(26, 36) : rnd(28, 52),
    state: "go", t0: 0, next: 1800 + i * 700 + rnd(0, 3000), air: 0, rot: 0, flip: 0, tilt: 0, wheel: 0, thrust: 0, gone: false,
  }));
  const cast = {};
  for (const k of ["dark", "light"]) {
    const L = LOOK[k];
    const sun = B.createBlip({ height: 600, ink: L.edge, pale: L.dot, live: hex(L.dot), noStalks: true });   // its antennae are ours (THE ANTENNAE)
    sun.pose("peek");   // not live: the opening lights the antenna itself (glow, below)
    if (reduced) sun.still(true);
    const team = crew.map((c) => {
      const me = B.createPerformer({ dpr: 2, dot: hex(L.dot), sticker: L.edge, glow: hex(L.dot) });
      me.play(reduced ? "rest" : c.role === "skate" ? "tiptoe" : "stroll");
      return me;
    });
    cast[k] = { sun, team };
  }
  const play = (i, name, opts) => { cast.dark.team[i].play(name, opts); cast.light.team[i].play(name, opts); };

  function size() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    SH = Math.min(H * .5, innerWidth < 760 ? 340 : 540);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    for (const k of ["dark", "light"]) {
      layer[k].width = cv.width; layer[k].height = cv.height;
      cast[k].sun.size(Math.min(SH * 1.48, W * .9));
      // the halo, once per size: a rise of light from the horizon, dithered into thinning dots, in the scene's part
      const c = halo[k]; c.width = cv.width; c.height = cv.height;
      const h = c.getContext("2d"), cell = 4 * dpr, cols = Math.ceil(c.width / cell), rows = Math.ceil(c.height / cell), top = (H - SH) * dpr / cell;
      h.fillStyle = LOOK[k].halo;
      for (let y = Math.floor(top); y < rows; y++) for (let x = 0; x < cols; x++) {
        const yy = (y - top) / (rows - top), dx = (x / cols - .5) * 1.6, dy = 1 - yy;
        const v = Math.max(0, .5 - Math.hypot(dx, dy * 1.15) * .62) * Math.min(1, yy * 1.6);
        if (v > BAYER[(y & 3) * 4 + (x & 3)]) h.fillRect(x * cell, y * cell, cell * .55, cell * .55);
      }
    }
  }
  const ground = () => H - 3;
  // the crew keep to the middle of the window, not its whole width, and fade out at the band's ends
  const band = () => { const m = W < 760 ? .04 : .17; return [W * m, W * (1 - m)]; };
  const edgeFade = (x) => { const [a, b] = band(), f = 70; return Math.max(0, Math.min(1, (x - a) / f, (b - x) / f)); };
  const botH = (c) => Math.max(30, Math.min(54, SH * .12)) * c.scale;   // the crew: small beside X0, in their band

  // ---- the crew, a step at a time ----
  let placed = false, lastT = 0;
  function back(c, now) {                                   // round again: in from the side it is walking towards from
    const [bl, br] = band(); c.x = c.dir > 0 ? bl - 20 : br + 20; c.y = 0; c.state = "go"; c.air = c.rot = c.flip = c.tilt = c.thrust = 0; c.gone = false;
    c.next = now + rnd(2500, 6000); play(c.i, c.role === "skate" ? "tiptoe" : "stroll");
  }
  function stepCrew(now) {
    const dt = Math.min(.1, lastT ? (now - lastT) / 1000 : 0); lastT = now;
    if (!placed) { const [bl, br] = band(); crew.forEach((c, i) => { c.x = bl + (i + rnd(.1, .7)) * ((br - bl) / crew.length); }); placed = true; }
    for (const c of crew) {
      const h = botH(c), since = (now - c.t0) / 1000;
      if (c.role === "jet") {
        // stand, fire up, lift off, climb away; then, a while later, walk back in
        if (c.state === "go" && now > c.next) { c.state = "ignite"; c.t0 = now; play(c.i, "look"); }
        else if (c.state === "ignite") { c.thrust = .25 + Math.random() * .35; if (since > 1.1) { c.state = "fly"; c.t0 = now; c.vx = c.dir * rnd(40, 90); play(c.i, "celebrate", { then: "rest", again: true }); } }
        else if (c.state === "fly") {
          c.thrust = 1; c.y = -(180 * since * since + 30 * since); c.x += c.vx * dt * (1 + since); c.tilt = c.dir * Math.min(.35, since * .25);
          if (ground() + c.y < -h * 1.6 || c.x < band()[0] - 60 || c.x > band()[1] + 60) { c.state = "away"; c.gone = true; c.t0 = now; }
        } else if (c.state === "away") { if (since > rnd(3, 6)) back(c, now); }
        else c.thrust = 0;
      } else if (c.role === "skate") {
        c.wheel += c.dir * c.speed * dt / (h * .055);
        if (c.state === "go" && now > c.next) {
          c.state = pick(["ollie", "kickflip", "spin", "ollie", "manual"]); c.t0 = now;
          play(c.i, c.state === "manual" ? "balance" : pick(["laugh", "celebrate", "done"]), { then: "tiptoe", again: true });
        }
        const T = c.state === "spin" ? .9 : c.state === "manual" ? 1.2 : .7, k = Math.min(1, since / T), e = k * k * (3 - 2 * k);
        if (c.state === "ollie" || c.state === "kickflip" || c.state === "spin") {
          c.air = Math.sin(Math.PI * k) * h * (c.state === "spin" ? 1.25 : .9);
          c.flip = c.state === "kickflip" ? Math.PI * 2 * e : 0; c.rot = c.state === "spin" ? -c.dir * Math.PI * 2 * e : 0;
          c.tilt = Math.sin(Math.PI * k) * -.22 * c.dir;
        } else if (c.state === "manual") c.tilt = -.24 * c.dir * Math.sin(Math.PI * k);
        if (c.state !== "go" && k >= 1) { c.state = "go"; c.air = c.flip = c.rot = c.tilt = 0; c.next = now + rnd(1400, 3600); }
        c.x += c.dir * c.speed * dt;
      } else {
        // walkers: and now and then a pause for something
        if (c.state === "go" && now > c.next) {
          c.state = pick(["wave", "cheer", "look", "laugh", "quirk", "cheer", "turn"]); c.t0 = now;
          const g2 = { wave: "yourTurn", cheer: "celebrate", look: "look", laugh: "laugh", quirk: pick(["dizzy", "jelly", "float", "melt"]), turn: "oops" }[c.state];
          play(c.i, g2, { then: "rest", again: true });
          c.len = c.state === "cheer" ? .75 : c.state === "turn" ? .9 : rnd(1.3, 2);
        }
        if (c.state === "cheer") c.air = Math.sin(Math.PI * Math.min(1, since / .75)) * h * .45;
        if (c.state !== "go" && since > c.len) { if (c.state === "turn") c.dir *= -1; c.state = "go"; c.air = 0; play(c.i, "stroll"); c.next = now + rnd(2500, 6500); }
        if (c.state === "go" || c.state === "cheer") c.x += c.dir * c.speed * dt * (c.state === "cheer" ? 1.4 : 1);
      }
      if (c.role !== "jet" || c.state === "go") { const [bl, br] = band(); if (c.x > br + 20 && c.dir > 0) c.x = bl - 20; if (c.x < bl - 20 && c.dir < 0) c.x = br + 20; }
    }
  }

  // ---- THE PULL: only the antennae, until the scroll pulls X0 up ----
  // The opening is held (sticky) over a stretch of scroll (.hero --pull); how far through it the page is, is how far up
  // X0 is, followed with a little lag so it rises like something heavy being hauled. Scrolling back lets it sink again,
  // until it has come all the way up once: then it stays up until the page is loaded again (every visit and every
  // refresh starts at the top, with only its antennae up).
  const hero = cv.closest(".hero");
  let up = false, rise = 0, riseT = 0;
  function pulled() {
    const room = hero.offsetHeight - innerHeight;
    return room > 0 ? Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / room)) : 1;
  }
  function sunDrop(now) {
    if (reduced) return 0;
    const full = Math.min(SH * 1.48, W * .9) * .5, ant = full * .78;   // all but the antennae under the horizon, at first
    const want = up ? 1 : pulled(), dt = Math.min(.1, riseT ? (now - riseT) / 1000 : 0); riseT = now;
    rise += (want - rise) * (1 - Math.exp(-dt * 5));
    if (!up && rise > .995) { up = true; rise = 1; }
    const u = rise, k = u * u * (3 - 2 * u);
    return ant * (1 - k);
  }

  // ---- the props: a jetpack and its flame; a board ----
  function pack(c, L, h, k, now) {
    const px = -h * .3, py = -h * .66, pw = h * .2, ph = h * .34;
    if (k > 0) {
      const thrust = .5 + k * .9 + Math.sin(now / 33 + c.i) * .14 * k, fl = h * .3 * thrust, gx = px + pw / 2, gy = py + ph;
      const gr = c2.createLinearGradient(0, gy, 0, gy + fl);
      gr.addColorStop(0, "rgba(255,244,214,.97)"); gr.addColorStop(.35, "rgba(240,170,70,.92)"); gr.addColorStop(1, "rgba(232,140,50,0)");
      c2.fillStyle = gr; c2.beginPath(); c2.moveTo(gx - pw * .38, gy); c2.quadraticCurveTo(gx, gy + fl * 1.2, gx + pw * .38, gy); c2.fill();
    }
    c2.fillStyle = L.edge; c2.beginPath(); c2.roundRect(px - 1.5, py - 1.5, pw + 3, ph + 3, pw * .4); c2.fill();
    c2.fillStyle = hex(L.dot); c2.beginPath(); c2.roundRect(px + 1, py + 1, pw - 2, ph - 2, pw * .32); c2.fill();
    c2.fillStyle = L.edge; c2.fillRect(px + 1, py + ph * .3, pw - 2, 1.4);
  }
  function board(c, L, h) {
    c2.save(); c2.translate(0, -h * .07); c2.rotate(c.tilt); c2.scale(1, Math.cos(c.flip) || .001);
    const Ln = h * .74, T = h * .075, wy = h * .07, wr = h * .055;
    c2.fillStyle = L.edge;
    c2.beginPath(); c2.roundRect(-Ln / 2 - 1.5, -T - 1.5, Ln + 3, T + 3, T); c2.fill();
    [-1, 1].forEach((sd) => { c2.beginPath(); c2.arc(sd * Ln * .3, wy, wr + 1.4, 0, Math.PI * 2); c2.fill(); });
    c2.fillStyle = hex(L.dot);
    c2.beginPath(); c2.roundRect(-Ln / 2, -T, Ln, T, T * .6); c2.fill();
    [-1, 1].forEach((sd) => {
      c2.beginPath(); c2.arc(sd * Ln * .3, wy, wr, 0, Math.PI * 2); c2.fill();
      c2.strokeStyle = L.edge; c2.lineWidth = 1; c2.beginPath();
      c2.moveTo(sd * Ln * .3, wy); c2.lineTo(sd * Ln * .3 + Math.cos(c.wheel) * wr, wy + Math.sin(c.wheel) * wr); c2.stroke();
    });
    c2.restore();
  }
  let c2 = null;   // the drawing it is being drawn into, for the props

  // ---- THE ANTENNAE: X0's own, drawn as on its face (media/face.svg): two long thin stalks, the left with the light at
  // its tip, the right curling over into a knob. Each is a chain of joints on springs, pulled towards that shape from
  // where it is rooted in the skull: stiff at the root, looser towards the tip, damped. So when X0 comes up they lag
  // and swing, overshoot a little and settle; held still, they only sway a little with its breath. ----
  // the shapes, from the face's paths, in its own units from the root (y down); the face's mark is 809 wide
  const SHAPE = [
    [[0, 0], [-12, -32], [-32, -67], [-50, -97], [-60, -122], [-63, -143], [-59, -162]],
    [[0, 0], [6, -44], [20, -80], [40, -112], [68, -144], [102, -169], [138, -182], [162, -174], [174, -151]],
  ];
  const ants = SHAPE.map((sh) => ({ sh, p: null, q: null }));
  let antH = 0, antT = 0;
  function restOf(a, root, angle, H0, sway) {
    const sc = .62 * H0 / 809, cs = Math.cos(angle), sn = Math.sin(angle);   // the face's antennae, at their length on it
    return a.sh.map(([x, y], i) => { const k = i / (a.sh.length - 1), xs = x * sc + sway * k * k * H0 * .04, ys = y * sc; return [root[0] + xs * cs - ys * sn, root[1] + xs * sn + ys * cs]; });
  }
  function stepAntennae(at, now) {
    if (!at) return;
    antH = at.H;
    const dt = Math.min(.05, antT ? (now - antT) / 1000 : .016); antT = now;
    const sway = reduced ? 0 : Math.sin(now / 1000 * .9) * .5 + Math.sin(now / 1000 * 1.7 + 1) * .25;
    ants.forEach((a, j) => {
      const rest = restOf(a, at.roots[j], at.angle, at.H, sway * (j ? -1 : 1));
      if (!a.p || reduced) { a.p = rest.map((v) => v.slice()); a.q = rest.map((v) => v.slice()); return; }
      const n = rest.length, sub = 3, h = dt / sub;
      for (let s2 = 0; s2 < sub; s2++) {
        a.p[0] = rest[0].slice(); a.q[0] = rest[0].slice();
        for (let i = 1; i < n; i++) {
          const k = 260 * (1 - .72 * (i / (n - 1))), damp = .9;          // springs: stiff at the root, loose at the tip
          const vx = (a.p[i][0] - a.q[i][0]) * damp, vy = (a.p[i][1] - a.q[i][1]) * damp;
          const ax = (rest[i][0] - a.p[i][0]) * k, ay = (rest[i][1] - a.p[i][1]) * k + at.H * .02;   // and a little weight
          a.q[i] = a.p[i].slice();
          a.p[i] = [a.p[i][0] + vx + ax * h * h, a.p[i][1] + vy + ay * h * h];
        }
        // the stalk does not stretch: each joint kept its length from the last
        for (let it = 0; it < 2; it++) for (let i = 1; i < n; i++) {
          const L0 = Math.hypot(rest[i][0] - rest[i - 1][0], rest[i][1] - rest[i - 1][1]);
          const dx = a.p[i][0] - a.p[i - 1][0], dy = a.p[i][1] - a.p[i - 1][1], d = Math.hypot(dx, dy) || 1, f = (d - L0) / d;
          a.p[i][0] -= dx * f; a.p[i][1] -= dy * f;
        }
      }
    });
  }
  function stalkPath(c, pts) {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
    const e = pts[pts.length - 1]; c.lineTo(e[0], e[1]);
  }
  function drawAntennae(c, k) {
    if (!antH || !ants[0].p) return;
    const w = Math.max(1.6, antH * .011), rim = k === "dark" ? `rgb(${LOOK.dark.dot.join(", ")})` : null;
    c.save(); c.lineCap = "round"; c.lineJoin = "round";
    ants.forEach((a, j) => {
      const tip = a.p[a.p.length - 1];
      // tapering: the stalk drawn twice, the outer half thinner towards the tip
      if (rim) { c.strokeStyle = rim; c.lineWidth = w + 1.6; stalkPath(c, a.p); c.stroke(); }
      c.strokeStyle = "#0B0A08"; c.lineWidth = w; stalkPath(c, a.p); c.stroke();
      if (j === 1) {   // the right one's knob
        const kr = antH * .014;
        if (rim) { c.fillStyle = rim; c.beginPath(); c.arc(tip[0], tip[1], kr + .9, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = "#0B0A08"; c.beginPath(); c.arc(tip[0], tip[1], kr, 0, Math.PI * 2); c.fill();
      }
    });
    c.restore();
  }

  function drawLook(k, now) {
    const t = now / 1000, c = layer[k].getContext("2d"), L = LOOK[k], { sun, team } = cast[k];
    c2 = c;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, layer[k].width, layer[k].height);
    c.drawImage(halo[k], 0, 0);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // X0, rising: its eye on the pointer; with the pointer still, on a jetpack lifting off, or the one at the front
    const flying = crew.find((m) => m.role === "jet" && (m.state === "fly" || m.state === "ignite"));
    let lead = crew[0]; for (const m of crew) if (m.x > lead.x && !m.gone) lead = m;
    const look = ptr && now - ptrAt < 2500 ? ptr : flying ? [flying.x, ground() + flying.y - botH(flying)] : ptr || [lead.x, ground() - 40];
    sun.lookAt(look);
    sun.draw(c, W / 2, H + 2 + sunDrop(now), t, reduced ? 1 : .42);   // big dots: the renderer's own dither, at a coarse grain
    if (k === "dark") stepAntennae(sun.antennae(), now);
    drawAntennae(c, k);
    // the horizon, and the crew on it (and over it)
    { const [bl, br] = band(), hg = c.createLinearGradient(bl - 40, 0, br + 40, 0);
      hg.addColorStop(0, "rgba(0,0,0,0)"); hg.addColorStop(.12, L.line); hg.addColorStop(.88, L.line); hg.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = hg; c.fillRect(bl - 40, ground(), br - bl + 80, 1.5); }
    crew.forEach((m, i) => {
      if (m.gone) return;
      const fade = edgeFade(m.x); if (fade <= 0) return;
      const h = botH(m), walking = m.state === "go" && m.role === "walk";
      const bob = walking ? Math.abs(Math.sin(t * 6 * (m.speed / 46) + m.phase)) * 1.6 : 0;
      const lift = m.role === "skate" ? h * .14 : 0;   // a skater's feet are on the board
      c.save(); c.globalAlpha = fade; c.translate(m.x, ground() - bob - m.air + m.y);   // its board and pack fade with it
      if (m.rot) { c.translate(0, -h * .55); c.rotate(m.rot); c.translate(0, h * .55); }
      if (m.role === "skate") board(m, L, h);
      c.rotate(m.role === "skate" ? m.tilt : m.role === "jet" ? m.tilt : 0); c.scale(m.dir, 1);
      if (m.role === "jet") pack(m, L, h, m.thrust, now);
      team[i].draw(c, 0, -lift, h, now);
      c.restore();
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
    if (!reduced) stepCrew(now); else if (!placed) { const [bl, br] = band(); crew.forEach((c, i) => { c.x = bl + (i + .5) * ((br - bl) / crew.length); }); placed = true; }
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

  // ---- the light at the antenna's tip, alive: it breathes like something asleep (in, a rest, out, never quite even),
  // its glow's edge shifts like a cell's, the light inside it wanders, now and then a mote drifts up off it like a
  // firefly and goes out, and when the pointer comes near it brightens and leans towards it. In the site's mint ----
  const motes = [];
  let nextMote = 0, near = 0;
  function glow(now) {
    if (!antH || !ants[0].p) return;
    const tipP = ants[0].p[ants[0].p.length - 1], x = tipP[0], y = tipP[1], r = Math.max(2.5, antH * .024);
    const t = now / 1000;
    const dark = fieldDark(cv.getBoundingClientRect().left + x, cv.getBoundingClientRect().top + y) > .5;
    const ink = dark ? [60, 242, 160] : [0, 150, 80];
    const ph = t * (.42 + .05 * Math.sin(t * .23)), w = (Math.sin(ph * Math.PI * 2) + 1) / 2;
    const breath = reduced ? .7 : .55 + .45 * w ** 1.8 + .04 * Math.sin(t * 3.7) * Math.sin(t * 1.9);
    const dist = ptr ? Math.hypot(ptr[0] - x, ptr[1] - y) : 1e9;
    near += ((dist < 260 && performance.now() - ptrAt < 2500 ? 1 - dist / 260 : 0) - near) * .08;
    const lx = ptr ? Math.max(-1, Math.min(1, (ptr[0] - x) / 200)) * near * r * .25 : 0, ly = ptr ? Math.max(-1, Math.min(1, (ptr[1] - y) / 200)) * near * r * .25 : 0;
    const life = Math.min(1, breath + near * .35);
    g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalCompositeOperation = dark ? "lighter" : "source-over";
    const R = r * (2.1 + .7 * life);
    g.beginPath();
    for (let k = 0; k <= 48; k++) {
      const a = k / 48 * Math.PI * 2, rr = R * (1 + .07 * Math.sin(a * 3 + t * 1.1) + .05 * Math.sin(a * 5 - t * 1.7));
      const px = x + lx + Math.cos(a) * rr, py = y + ly + Math.sin(a) * rr; k ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    let gr = g.createRadialGradient(x + lx, y + ly, r * .6, x + lx, y + ly, R * 1.08);
    gr.addColorStop(0, `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${(dark ? .42 : .26) * life})`); gr.addColorStop(.55, `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${(dark ? .12 : .08) * life})`); gr.addColorStop(1, `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, 0)`);
    g.fillStyle = gr; g.fill();
    if (!reduced && now > nextMote) { motes.push({ x: x + (Math.random() - .5) * r, y: y - r * .6, vx: (Math.random() - .5) * 9, vy: -(10 + Math.random() * 12), t0: now, life: 1600 + Math.random() * 1600, s: .5 + Math.random() * .6 }); nextMote = now + 700 + Math.random() * 1600 - near * 500; }
    for (let i = motes.length - 1; i >= 0; i--) {
      const m = motes[i], k = (now - m.t0) / m.life;
      if (k >= 1) { motes.splice(i, 1); continue; }
      const sec = (now - m.t0) / 1000, mx = m.x + m.vx * sec + Math.sin(sec * 2.4 + i) * 3, my = m.y + m.vy * sec;
      const a = Math.sin(Math.PI * k) * (.6 + .4 * Math.sin(sec * 9 + i * 2)), ms = r * .28 * m.s;
      gr = g.createRadialGradient(mx, my, 0, mx, my, ms * 3.2);
      gr.addColorStop(0, `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${.9 * a})`); gr.addColorStop(.35, `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, ${.3 * a})`); gr.addColorStop(1, `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, 0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(mx, my, ms * 3.2, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = "source-over";
    // its seat: a thin dark ring, so the light sits on the stalk
    g.fillStyle = "#0B0A08"; g.beginPath(); g.arc(x, y, r + Math.max(1, r * .14), 0, Math.PI * 2); g.fill();
    const hx = x + lx * .6 + Math.sin(t * .7) * r * .22 - r * .25, hy = y + ly * .6 + Math.cos(t * .53) * r * .18 - r * .25;
    gr = g.createRadialGradient(hx, hy, 0, x, y, r * 1.05);
    gr.addColorStop(0, dark ? `rgb(${Math.round(180 + 60 * life)}, 255, ${Math.round(212 + 28 * life)})` : "rgb(60, 242, 160)");
    gr.addColorStop(.55, dark ? "rgb(60, 242, 160)" : "rgb(0, 168, 90)"); gr.addColorStop(1, dark ? "rgb(16, 160, 98)" : "rgb(0, 120, 64)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  let raf = 0, last = 0;
  const loop = (now) => { raf = requestAnimationFrame(loop); if (now - last < 1000 / 30) return; last = now; frame(now); };
  size();
  addEventListener("resize", () => { size(); if (reduced) frame(4000); });
  if (reduced) { frame(4000); addEventListener("scroll", () => frame(4000), { passive: true }); }
  else new IntersectionObserver((es) => {
    cancelAnimationFrame(raf);
    if (es.some((e) => e.isIntersecting)) { riseT = 0; raf = requestAnimationFrame(loop); }
  }).observe(cv);
}

// ---------------------------------------------------------------------------
// THE KEY'S HAND-OFF. There is one "Take me home" at a time: in the opening it stands in the middle, under the line,
// and the mast's is not shown. As the page scrolls, the opening's key goes up and across into the mast's corner,
// growing smaller to the mast key's size, over the mast. It follows the scroll with a little lag, every frame, so a
// flick of the wheel still moves it smoothly. Once it has got there it stays there until the page is loaded again:
// the mast's key is shown and the opening's is put away, even scrolled back to the top. With motion reduced there is no journey: the mast's key shows once the page is scrolled.
//
// The opening is held while it is scrolled (THE PULL, .hero-pin is sticky), so the key's place is measured inside the
// pin and read off the pin each frame, not off the page.
// ---------------------------------------------------------------------------
{
  const key = document.getElementById("heroKey"), mastKey = document.querySelector(".mast .key"), root = document.documentElement;
  const pin = key?.closest(".hero-pin") || key?.closest(".hero");
  if (key && mastKey && pin) {
    let done = false;
    const park = () => { key.style.visibility = "hidden"; key.style.transform = ""; root.classList.remove("key-handoff"); };
    if (done) park();
    else {
      let rel = null;                                        // the key's untransformed place, inside the pin
      const measure = () => {
        if (done) return;
        const t = key.style.transform; key.style.transform = "";
        const r = key.getBoundingClientRect(), pr = pin.getBoundingClientRect();
        rel = { x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height };
        key.style.transform = t; kick();
      };
      const smooth = (k) => k * k * (3 - 2 * k);
      const target = () => Math.min(1, Math.max(0, scrollY / (innerHeight * .45)));
      let p = target(), raf = 0, last = 0;
      function draw() {
        const pr = pin.getBoundingClientRect(), m = mastKey.getBoundingClientRect(), k = smooth(p);
        const x0 = pr.left + rel.x, y0 = pr.top + rel.y;
        const dx = (m.left - x0) * k, dy = (m.top - y0) * k, s = 1 + (m.width / rel.w - 1) * k;
        key.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
      }
      function step(now) {
        raf = 0;
        if (done || !rel) return;
        const dt = Math.min(.1, last ? (now - last) / 1000 : .016); last = now;
        const want = target();
        p += (want - p) * (1 - Math.exp(-dt * 10));
        if (Math.abs(want - p) < .002) p = want;
        if (p >= .998) { done = true; park(); return; }
        draw();
        if (p !== want) raf = requestAnimationFrame(step); else last = 0;
      }
      function kick() {
        if (done) return;
        if (reduced) { if (scrollY > 40) { done = true; park(); } return; }
        if (!raf) raf = requestAnimationFrame(step);
      }
      root.classList.add("key-handoff");
      addEventListener("scroll", kick, { passive: true });
      addEventListener("resize", measure);
      document.fonts?.ready.then(measure);
      measure();
      if (rel && !reduced) draw();
    }
  }
}
