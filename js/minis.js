// THE MINI: one small Blip who goes down the page with you, drawn by the desktop app's own renderer (js/blip/blip.js,
// window.TailzuBlip) on one canvas over the page, so he is the same dotted character here as in the app.
//
//   1. the film      a jetpack on his back: he flies about the screen, out of it and back in from somewhere else
//   2. the work      a skateboard: he rides along the top edges of the two boxes, flips off their ends, turns round in
//                    the air, and jumps the gap from one box to the other
//   3. the cases     he peeks out from behind a card, now and then on his long neck, hides, and peeks from another;
//                    sometimes he is gone a while
//
// He is one character: when the page moves on to another view he flies there on his jetpack from wherever he was, and
// lands on the boxes, or dives behind a card. He minds the pointer: the flier dodges it, the skater ollies over it, and
// the peeker ducks when it comes close. The canvas never takes the pointer, and with motion reduced there is no Blip.
import { reduced } from "./util.js";
import { blip } from "./blip/kit.js";

const B = blip();

if (B && !reduced) {
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
  const ptr = { x: -1e4, y: -1e4 };
  addEventListener("pointermove", (e) => { ptr.x = e.clientX; ptr.y = e.clientY; }, { passive: true });
  addEventListener("pointerleave", () => { ptr.x = ptr.y = -1e4; });
  const near = (x, y, r) => Math.hypot(ptr.x - x, ptr.y - y) < r;

  /** Blip on his jetpack, feet at (x, y): `me` a performer, `fx` which way he faces, `k` how hard he is flying (0..1). */
  function jet(me, x, y, h, tilt, fx, k, now) {
    g.save();
    g.translate(x, y); g.rotate(tilt); g.scale(fx, 1);
    // the pack on his back (he faces right; his back is to the left), and its flame, flickering, longer the harder he flies
    const px = -h * .3, py = -h * .66, pw = h * .2, ph = h * .34;
    const thrust = .7 + k * .6 + Math.sin(now / 37) * .12;
    const fl = h * .26 * thrust, gx = px + pw / 2, gy = py + ph;
    const gr = g.createLinearGradient(0, gy, 0, gy + fl);
    gr.addColorStop(0, "rgba(255,240,200,.95)"); gr.addColorStop(.35, "rgba(232,162,60,.9)"); gr.addColorStop(1, "rgba(232,162,60,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(gx - pw * .34, gy); g.quadraticCurveTo(gx, gy + fl * 1.15, gx + pw * .34, gy); g.fill();
    g.fillStyle = ink; g.beginPath(); g.roundRect(px - 1.5, py - 1.5, pw + 3, ph + 3, pw * .4); g.fill();
    g.fillStyle = pale; g.beginPath(); g.roundRect(px + 1, py + 1, pw - 2, ph - 2, pw * .32); g.fill();
    g.fillStyle = ink; g.fillRect(px + 1, py + ph * .3, pw - 2, 1.4);
    me.draw(g, 0, 0, h, now);
    g.restore();
  }
  /** A flight on the jetpack from (x0, y0) to (x1, y1) over T ms, eased, with a little arc: where he is at `now`. */
  function flight(f, now) {
    const k = Math.min(1, (now - f.t0) / f.T), e = k * k * (3 - 2 * k);
    return { k, x: f.x0 + (f.x1 - f.x0) * e, y: f.y0 + (f.y1 - f.y0) * e - Math.sin(Math.PI * k) * f.arc, fx: f.x1 >= f.x0 ? 1 : -1 };
  }

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
    let dodgeAt = 0;
    function draw(now, dt) {
      const h = size();
      if (!s.started) { s.started = true; [s.x, s.y] = edgePoint(h); [s.tx, s.ty] = inside(); s.mode = "in"; }
      // the pointer coming at him: he darts away from it
      if (s.mode !== "away" && now > dodgeAt && near(s.x, s.y - h * .5, h * 2.2)) {
        dodgeAt = now + 700;
        const ax = s.x - ptr.x, ay = s.y - h * .5 - ptr.y, d = Math.hypot(ax, ay) || 1;
        s.tx = clamp(s.x + ax / d * h * 5, h, W - h); s.ty = clamp(s.y + ay / d * h * 4, h * 2, H - h * .5);
        s.vx += ax / d * h * 4; s.vy += ay / d * h * 4; s.mode = "wander"; s.until = now + 2400;
      }
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
      jet(me, s.x, s.y + hover, h, clamp(s.vx / (top * 2.4), -.32, .32), s.fx, Math.min(1, Math.hypot(s.vx, s.vy) / top), now);
    }
    return {
      draw,
      pos: () => (s.started && s.mode !== "away" ? [s.x, s.y] : null),
      /** Here from another view: he carries on flying from where he was. */
      enter(p) {
        const h = size(); s.started = true;
        if (p) { [s.x, s.y] = p; s.vx = s.vy = 0; } else [s.x, s.y] = edgePoint(h);
        [s.tx, s.ty] = inside(); s.mode = "in"; me.play("rest");
      },
    };
  })();

  // ======================================================================== 2. the skateboard, on the work view's boxes
  const skater = (() => {
    const me = B.createPerformer({ dpr, glow: amber });
    me.play("tiptoe");      // knees bent, arms a little out: how he rides
    const s = { seg: 0, at: .2, dir: 1, mode: "ride", air: null, wheel: 0, pause: 0, manual: 0, manualUntil: 0, nextTrick: 0, land: null, x: 0, y: 0 };
    const pack = B.createPerformer({ dpr, glow: amber });   // himself, on the jetpack, while he flies in to land
    pack.play("rest");
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
    const h0 = () => 0;
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
    function draw(now, dt) {
      const E = edges(); if (!E.length) return;
      const h = size(), lift = h * .14;                    // his feet stand on the board, the board on the edge
      if (s.seg >= E.length) { s.seg = 0; s.at = .3; }
      let x, y, tilt = 0, rot = 0, flip = 0;
      // flying in to land: on the jetpack from where he was to his spot on the edge, then onto the board
      if (s.mode === "land") {
        const L = s.land, [tx, ty] = at(E[s.seg], s.at);
        L.x1 = tx; L.y1 = ty - lift;
        const f = flight(L, now);
        s.x = f.x; s.y = f.y;
        jet(pack, f.x, f.y, h, (f.fx * .25) * Math.sin(Math.PI * f.k), f.fx, 1 - f.k * .6, now);
        if (f.k >= 1) { s.mode = "ride"; s.dir = f.fx; me.play("laugh", { then: "tiptoe", again: true }); }
        return;
      }
      // the pointer in his way: he ollies over it
      if (s.mode === "ride" && now > s.nextTrick - 1800 && near(s.x, s.y - h * .5, h * 1.7)) {
        s.nextTrick = now + 2600;
        const len = Math.max(1, E[s.seg].x2 - E[s.seg].x1);
        jump(s.seg, clamp(s.at + s.dir * h * 2.4 / len, .02, .98), { high: 1.4, T: .7, kick: Math.random() < .5 ? 1 : 0 });
      }
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
      s.x = x; s.y = y;
      g.save();
      g.translate(x, y);
      if (rot) { g.translate(0, -h * .55); g.rotate(rot); g.translate(0, h * .55); }
      board(0, -h * .07, h, tilt, flip);
      g.save(); g.rotate(tilt); g.scale(s.dir, 1); me.draw(g, 0, -lift, h, now); g.restore();
      g.restore();
    }
    return {
      draw,
      pos: () => (s.mode === "land" || s.x ? [s.x, s.y - h0()] : null),
      /** Here from another view: he flies in on the jetpack from where he was and lands on the nearer box's edge. */
      enter(p, now) {
        const E = edges(); if (!E.length) return;
        const h = size(), from = p || [W * .5, -h * 1.5];
        let best = 0, bd = 1e9;
        E.forEach((e, i) => { const d = Math.abs(clamp(from[0], e.x1, e.x2) - from[0]) + Math.abs(e.y - from[1]) * .3; if (d < bd) { bd = d; best = i; } });
        const e = E[best];
        s.seg = best; s.at = clamp((from[0] - e.x1) / Math.max(1, e.x2 - e.x1), .12, .88); s.air = null; s.pause = 0;
        s.land = { x0: from[0], y0: from[1], x1: 0, y1: 0, t0: now, T: 1100, arc: h * 1.2 };
        s.mode = "land"; pack.play("rest");
      },
    };
  })();

  // ======================================================================== 3. peeking from behind the cards
  const peeker = (() => {
    const sec = document.getElementById("gifs");
    const grid = sec && sec.querySelector(".grid");
    const cards = grid ? [...grid.querySelectorAll(".case")] : [];
    let me = null, made = 0;
    const s = { card: -1, side: "top", u: .5, phase: "wait", until: 0, crane: false, dive: null };
    const pack = B.createPerformer({ dpr, glow: amber });   // himself, on the jetpack, while he flies in to hide
    pack.play("rest");
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
    const sizeOf = () => clamp(cards[0].clientWidth * .2, 40, 76);
    function draw(now) {
      if (!cards.length) return;
      const h = sizeOf();
      if (!me || Math.abs(made - h) > 2) { me = B.createBlip({ height: h }); made = h; }
      // flying in from the last view: to the edge of a card, and down behind it
      if (s.phase === "dive") {
        const q = where(); if (!q) return;
        const D = s.dive; D.x1 = q.x; D.y1 = q.y - (s.side === "top" ? h * .1 : 0);
        const f = flight(D, now), hp = clamp(h * .7, 34, 56);
        jet(pack, f.x, f.y, hp * (1 - f.k * .25), .2 * f.fx * Math.sin(Math.PI * f.k), f.fx, 1 - f.k * .5, now);
        if (f.k >= 1) { s.phase = "up"; s.until = now + rnd(1500, 2400); me.pose("peek"); me.snap(); }
        return;
      }
      const busy = grid.classList.contains("has-big");
      // the pointer comes close: he ducks, and comes up somewhere else soon after
      const pq = where();
      if (s.phase === "up" && pq && near(pq.x, pq.y, h * 1.4)) { s.phase = "hide"; me.pose("hidden"); s.shy = true; }
      if (busy && s.phase !== "wait") { s.phase = "hide"; me.pose("hidden"); }
      if (s.phase === "wait" && now > s.until && !busy) { choose(); s.phase = "up"; s.until = now + rnd(1800, 2800); me.pose("peek"); }
      else if (s.phase === "up") {
        if (s.crane && now > s.until - 1500 && now < s.until - 300) me.pose("crane"); else me.pose("peek");
        if (now > s.until) { s.phase = "hide"; me.pose("hidden"); }
      } else if (s.phase === "hide" && !me.shown()) {
        s.phase = "wait"; s.until = now + (s.shy ? rnd(700, 1200) : Math.random() < .25 ? rnd(3500, 6000) : rnd(500, 1600));   // sometimes gone a while
        s.shy = false;
      }
      const p = where();
      if (!p) { me.step && me.step(now / 1000); return; }
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
      me.draw(g, 0, 0, now / 1000, dpr);
      g.restore();
    }
    return {
      draw,
      pos: () => { const q = where(); return q && (s.phase === "up" || s.phase === "dive") ? [q.x, q.y] : null; },
      /** Here from another view: he flies to a card on the jetpack, from where he was, and drops behind it. */
      enter(p, now) {
        if (!cards.length) return;
        choose(); s.side = "top";
        const from = p || [W * .5, -60];
        if (me) { me.pose("hidden"); me.snap(); }
        s.dive = { x0: from[0], y0: from[1], x1: 0, y1: 0, t0: now, T: 950, arc: sizeOf() * .8 };
        s.phase = "dive";
      },
    };
  })();

  // ======================================================================== the one loop
  const views = [["stage", flier], ["work", skater], ["gifs", peeker]].map(([id, m]) => [document.getElementById(id), m]).filter(([el]) => el);
  let last = 0, drew = false, cur = null, lastPos = null, lastScroll = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, last ? (now - last) / 1000 : .016); last = now;
    // the view most on screen, if it fills at least a third of it
    let best = null, most = H * .34;
    for (const [el, m] of views) {
      const r = el.getBoundingClientRect(), seen = Math.min(r.bottom, H) - Math.max(r.top, 0);
      if (seen > most) { most = seen; best = m; }
    }
    // a new view: he goes there from where he was last seen (on screen, or just above or below it)
    if (best && best !== cur) {
      // where he was has moved with the page since: scrolling down, it went up
      const from = lastPos ? [clamp(lastPos[0], -40, W + 40), clamp(lastPos[1] - (scrollY - lastScroll), -80, H + 80)] : null;
      best.enter(from, now);
      cur = best;
    }
    if (!best && !drew) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    drew = !!best;
    if (best) { best.draw(now, dt); const p = best.pos(); if (p) { lastPos = p; lastScroll = scrollY; } }
  }
  requestAnimationFrame(frame);
}
