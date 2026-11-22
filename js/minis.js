// THE MINIS: a small Blip in each of the first three views, drawn by the desktop app's own renderer (js/blip/blip.js,
// window.TailzuBlip) on one canvas over the page, so he is the same dotted character here as in the app.
//
//   1. the film      a jetpack on his back: he flies about the screen, out of it and back in from somewhere else
//   2. the work      a skateboard: he rides along the top edges of the two boxes, flips off their ends, turns round in
//                    the air, and jumps the gap from one box to the other
//   3. the cases     he peeks out from behind a card, now and then on his long neck, hides, and peeks from another;
//                    sometimes he is gone a while
//
// Only the one for the view mostly on screen runs. None of them catch the pointer, and with motion reduced there are none.
import { reduced } from "./util.js";
import { NUM, CARD, MOVES } from "./blip/moves.js";

const B = window.TailzuBlip;

// ---- his moves, put back into the renderer's tables (see scripts/gen-blip-moves.mjs) ----
function install() {
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

if (B && !reduced) {
  install();
  const canvas = document.createElement("canvas");
  canvas.className = "minis";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const g = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  size();
  addEventListener("resize", size);

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ink = "#151311", pale = "#F3E2C6", amber = "#E8A23C";

  // ======================================================================== 1. the jetpack, over the film
  const flier = (() => {
    const me = B.createPerformer({ dpr, glow: amber });
    me.play("rest");
    const s = { x: -80, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, fx: 1, mode: "in", until: 0, started: false };
    const size = () => clamp(W * .042, 42, 64);
    const edgePoint = (h) => {      // somewhere just off the screen
      const side = pick(["l", "r", "t"]);
      if (side === "l") return [-h * 1.6, rnd(H * .2, H * .8)];
      if (side === "r") return [W + h * 1.6, rnd(H * .2, H * .8)];
      return [rnd(W * .15, W * .85), -h * 1.8];
    };
    const inside = () => [rnd(W * .08, W * .92), rnd(H * .18, H * .9)];
    function next(now, h) {
      if (Math.random() < .18) { [s.tx, s.ty] = edgePoint(h); s.mode = "out"; }
      else { [s.tx, s.ty] = inside(); s.mode = "wander"; s.until = now + rnd(2600, 4600); }
      if (Math.random() < .2) me.play("celebrate", { then: "rest", again: true });   // a loop in the air
    }
    return function draw(now, dt) {
      const h = size();
      if (!s.started) { s.started = true; [s.x, s.y] = edgePoint(h); [s.tx, s.ty] = inside(); s.mode = "in"; }
      if (s.mode === "away") {
        if (now < s.until) return;
        [s.x, s.y] = edgePoint(h); [s.tx, s.ty] = inside(); s.vx = s.vy = 0; s.mode = "in";
        me.play("done", { then: "rest", again: true });   // back in, with a wave
      }
      // steer: towards the target, never faster than his top speed, a little lazy about it
      const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy), top = h * 6.5;
      const want = Math.min(top, d * 1.4);
      const k = 1 - Math.exp(-dt * 1.9);
      s.vx += ((d ? dx / d * want : 0) - s.vx) * k; s.vy += ((d ? dy / d * want : 0) - s.vy) * k;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.mode === "out" && d < h) { s.mode = "away"; s.until = now + rnd(1400, 3200); return; }
      if ((s.mode === "wander" || s.mode === "in") && (d < h * .8 || (s.mode === "wander" && now > s.until))) next(now, h);
      if (Math.abs(s.vx) > 12) s.fx += (Math.sign(s.vx) - s.fx) * (1 - Math.exp(-dt * 7));
      const hover = Math.sin(now / 420) * h * .06;
      const tilt = clamp(s.vx / (top * 2.4), -.32, .32);
      g.save();
      g.translate(s.x, s.y + hover); g.rotate(tilt); g.scale(s.fx, 1);
      // the pack on his back (he faces right; his back is to the left), and its flame, flickering, longer the harder he flies
      const px = -h * .3, py = -h * .66, pw = h * .2, ph = h * .34;
      const thrust = .7 + Math.min(1, Math.hypot(s.vx, s.vy) / top) * .6 + Math.sin(now / 37) * .12;
      const fl = h * .26 * thrust, gx = px + pw / 2, gy = py + ph;
      const gr = g.createLinearGradient(0, gy, 0, gy + fl);
      gr.addColorStop(0, "rgba(255,240,200,.95)"); gr.addColorStop(.35, "rgba(232,162,60,.9)"); gr.addColorStop(1, "rgba(232,162,60,0)");
      g.fillStyle = gr; g.beginPath(); g.moveTo(gx - pw * .34, gy); g.quadraticCurveTo(gx, gy + fl * 1.15, gx + pw * .34, gy); g.fill();
      g.fillStyle = ink; g.beginPath(); g.roundRect(px - 1.5, py - 1.5, pw + 3, ph + 3, pw * .4); g.fill();
      g.fillStyle = pale; g.beginPath(); g.roundRect(px + 1, py + 1, pw - 2, ph - 2, pw * .32); g.fill();
      g.fillStyle = ink; g.fillRect(px + 1, py + ph * .3, pw - 2, 1.4);
      me.draw(g, 0, 0, h, now);
      g.restore();
    };
  })();

  // ======================================================================== 2. the skateboard, on the work view's boxes
  const skater = (() => {
    const me = B.createPerformer({ dpr, glow: amber });
    me.play("tiptoe");      // knees bent, arms a little out: how he rides
    const s = { seg: 0, at: .2, dir: 1, mode: "ride", air: null, wheel: 0, pause: 0, manual: 0, manualUntil: 0, nextTrick: 0 };
    const sec = document.getElementById("work");
    const boxes = sec ? [sec.querySelector(".show-box"), sec.querySelector(".show-say")] : [];
    // the edges he can ride: each box's top, short of its rounded corners; the second only when it is beside the first
    function edges() {
      const out = [];
      boxes.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect(), cut = Math.min(28, r.width * .08);
        if (i === 1 && out[0] && r.left < out[0].x2) return;
        out.push({ x1: r.left + cut, x2: r.right - cut, y: r.top });
      });
      return out;
    }
    const size = () => clamp(W * .036, 36, 58);
    const at = (e, u) => [e.x1 + (e.x2 - e.x1) * u, e.y];
    function board(x, y, h, tilt, flip) {
      g.save(); g.translate(x, y); g.rotate(tilt);
      g.scale(1, Math.cos(flip) || .001);            // a kickflip: the board turns over about its length
      const L = h * .74, T = h * .075, wy = h * .07, wr = h * .055;
      g.fillStyle = ink;
      g.beginPath(); g.roundRect(-L / 2 - 1.5, -T - 1.5, L + 3, T + 3, T); g.fill();
      [-1, 1].forEach((sd) => { g.beginPath(); g.arc(sd * L * .3, wy, wr + 1.4, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = pale;
      g.beginPath(); g.roundRect(-L / 2, -T, L, T, T * .6); g.fill();
      [-1, 1].forEach((sd) => {
        g.beginPath(); g.arc(sd * L * .3, wy, wr, 0, Math.PI * 2); g.fill();
        g.strokeStyle = ink; g.lineWidth = 1; g.beginPath();
        g.moveTo(sd * L * .3, wy); g.lineTo(sd * L * .3 + Math.cos(s.wheel) * wr, wy + Math.sin(s.wheel) * wr); g.stroke();
      });
      g.restore();
    }
    // a jump: from (seg a, u a) to (seg b, u b), so high, so long, with a flip of the body, the board, or a turn
    function jump(b, ub, o) {
      s.air = Object.assign({ a: s.seg, ua: s.at, b, ub, t: 0, T: .8, high: 1.1, spin: 0, kick: 0, turn: false }, o);
      s.mode = "air";   // his flips are the board's and his together (rot below), so no flip of his own in the air
    }
    return function draw(now, dt) {
      const E = edges(); if (!E.length) return;
      const h = size(), lift = h * .14;                    // his feet stand on the board, the board on the edge
      if (s.seg >= E.length) { s.seg = 0; s.at = .3; }
      let x, y, tilt = 0, rot = 0, flip = 0;
      if (s.mode === "ride") {
        const e = E[s.seg], len = Math.max(1, e.x2 - e.x1);
        if (now < s.pause) { /* balancing on the very end */ tilt = Math.sin(now / 160) * .12 * s.dir; me.play("balance"); }
        else {
          const v = h * 3.6;
          s.at += s.dir * v * dt / len; s.wheel += s.dir * v * dt / (h * .055);
          if (now > s.nextTrick && Math.random() < dt * .35) {          // tricks along the way
            s.nextTrick = now + 2600;
            const t = pick(["kick", "manual", "ollie"]);
            if (t === "manual") s.manualUntil = now + 1100;
            else jump(s.seg, clamp(s.at + s.dir * h * 3 / len, .02, .98), t === "kick" ? { kick: 1, high: .8, T: .62 } : { high: 1, T: .7 });
          }
          if (now < s.manualUntil) { tilt = -.22 * s.dir; me.play("balance"); }
          else if (me.name === "balance") me.play("tiptoe");
          // the end of the edge: over the gap to the next box, or a trick on the edge and back the other way
          const end = s.dir > 0 ? s.at >= .985 : s.at <= .015;
          if (end && s.mode === "ride") {
            s.at = clamp(s.at, 0, 1);
            const nb = s.seg + s.dir;
            if (nb >= 0 && nb < E.length && Math.random() < .75) jump(nb, s.dir > 0 ? .06 : .94, { T: 1, high: 1.7, spin: Math.random() < .5 ? 1 : 0, kick: Math.random() < .4 ? 1 : 0 });
            else {
              const t = pick(["turn", "turn", "spin", "balance"]);
              if (t === "balance") { s.pause = now + 1300; s.dir *= -1; }
              else jump(s.seg, s.at, { T: t === "spin" ? .9 : .66, high: t === "spin" ? 1.5 : 1, spin: t === "spin" ? 1 : 0, turn: true });
            }
          }
        }
        [x, y] = at(E[s.seg], s.at);
      }
      if (s.mode === "air") {
        const A = s.air; A.t += dt;
        const k = Math.min(1, A.t / A.T), b = A.b < E.length ? A.b : A.a;
        const [x0, y0] = at(E[A.a] || E[0], A.ua), [x1, y1] = at(E[b], A.ub);
        const e = k * k * (3 - 2 * k);
        x = x0 + (x1 - x0) * e; y = y0 + (y1 - y0) * k - Math.sin(Math.PI * k) * h * A.high;
        if (A.spin) rot = -s.dir * Math.PI * 2 * e;
        if (A.kick) flip = Math.PI * 2 * e;
        tilt = Math.sin(Math.PI * k) * -.25 * s.dir;
        if (A.turn && k > .5 && !A.turned) { A.turned = true; s.dir *= -1; }
        if (k >= 1) {
          s.mode = "ride"; s.seg = b; s.at = A.ub; s.air = null;
          const r = Math.random();
          if (r < .2) me.play("laugh", { then: "tiptoe", again: true }); else if (r < .32) me.play("done", { then: "tiptoe", again: true });
        }
      }
      g.save();
      g.translate(x, y);
      if (rot) { g.translate(0, -h * .55); g.rotate(rot); g.translate(0, h * .55); }
      board(0, -h * .07, h, tilt, flip);
      g.save(); g.rotate(tilt); g.scale(s.dir, 1); me.draw(g, 0, -lift, h, now); g.restore();
      g.restore();
    };
  })();

  // ======================================================================== 3. peeking from behind the cards
  const peeker = (() => {
    const sec = document.getElementById("gifs");
    const grid = sec && sec.querySelector(".grid");
    const cards = grid ? [...grid.querySelectorAll(".case")] : [];
    let me = null, made = 0;
    const s = { card: -1, side: "top", u: .5, phase: "wait", until: 0, crane: false };
    function where() {
      const c = cards[s.card]; if (!c) return null;
      const r = c.getBoundingClientRect();
      if (s.side === "top") return { x: r.left + r.width * s.u, y: r.top + 1, rot: 0 };
      if (s.side === "left") return { x: r.left + 1, y: r.top + r.height * s.u, rot: -Math.PI / 2 };
      return { x: r.right - 1, y: r.top + r.height * s.u, rot: Math.PI / 2 };
    }
    function choose() {
      const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      let i; do { i = Math.floor(Math.random() * cards.length); } while (cards.length > 1 && i === s.card);
      s.card = i;
      const col = i % cols, sides = ["top", "top"];
      if (col === 0) sides.push("left"); if (col === cols - 1) sides.push("right");
      s.side = pick(sides); s.u = rnd(.22, .78);
      s.crane = Math.random() < .34;
    }
    return function draw(now) {
      if (!cards.length) return;
      const h = clamp(cards[0].clientWidth * .2, 40, 76);
      if (!me || Math.abs(made - h) > 2) { me = B.createBlip({ height: h }); made = h; }
      const busy = grid.classList.contains("has-big");
      if (busy && s.phase !== "wait") { s.phase = "hide"; me.pose("hidden"); }
      if (s.phase === "wait" && now > s.until && !busy) { choose(); s.phase = "up"; s.until = now + rnd(1800, 2800); me.pose("peek"); }
      else if (s.phase === "up") {
        if (s.crane && now > s.until - 1500 && now < s.until - 300) me.pose("crane"); else me.pose("peek");
        if (now > s.until) { s.phase = "hide"; me.pose("hidden"); }
      } else if (s.phase === "hide" && !me.shown()) {
        s.phase = "wait"; s.until = now + (Math.random() < .25 ? rnd(3500, 6000) : rnd(500, 1600));   // sometimes gone a while
      }
      const p = where();
      if (!p) { me.step && me.step(now / 1000); return; }
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
      me.draw(g, 0, 0, now / 1000, dpr);
      g.restore();
    };
  })();

  // ======================================================================== the one loop
  const views = [["stage", flier], ["work", skater], ["gifs", peeker]].map(([id, fn]) => [document.getElementById(id), fn]).filter(([el]) => el);
  let last = 0, drew = false;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, last ? (now - last) / 1000 : .016); last = now;
    // the view most on screen, if it fills at least a third of it
    let best = null, most = H * .34;
    for (const [el, fn] of views) {
      const r = el.getBoundingClientRect(), seen = Math.min(r.bottom, H) - Math.max(r.top, 0);
      if (seen > most) { most = seen; best = fn; }
    }
    if (!best && !drew) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    drew = !!best;
    if (best) best(now, dt);
  }
  requestAnimationFrame(frame);
}
