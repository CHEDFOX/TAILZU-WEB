// THE WALL (#wall) and the footer's name (.sf-mark).
//
// The wall: the bot in the middle (drawn by the desktop app's renderer, cycling through what it does) with the
// platforms under it, and round it an orbit of tiles on three rings, stills from the owner's clips, films, and pixels
// drawn live, each with a small caption. It turns clockwise, slowly, the outer rings slower. A scroll pulls on it: the
// tiles lag behind the page and spring back, a gentle scroll slows the turn, and a hard one throws it the other way,
// anticlockwise, before it eases back. A tile under the pointer, or held on a touch screen, stops and opens into a card
// with a line from the founders: what we do, and where we are going.
//
// The footer's name stands on a band of green dots, dense at the foot and thinning upwards, drifting, brighter round
// the pointer. Both run only while they can be seen; with motion reduced they are drawn once and stand still.
import { reduced } from "./util.js";
import { blip } from "./blip/kit.js";

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
const LIT = [160, 218, 128], MID = [92, 140, 70];
const noise = (x, y, t) => .5 + .25 * Math.sin(x * 1.7 + t * 1.1) * Math.cos(y * 1.3 - t * .7) + .25 * Math.sin((x + y) * .9 + t * .5);

const wall = document.getElementById("wall");
if (wall) {
  const orbit = wall.querySelector(".wall-orbit"), core = wall.querySelector(".wall-core");
  // ---- the tiles: what each shows, its caption, and its line ----
  const I = (n) => ({ kind: "img", src: `/media/wall/${n}.jpg` }), V = (src) => ({ kind: "video", src }), P = (style) => ({ kind: "pixel", style });
  const TILES = [
    [I("w1"), "The caravan", "We build bots that do the work, not bots that talk about it."],
    [P("face"), "X0", "One team, every device. Your phone and your computer, the same bots."],
    [V("/media/duo/plan.mp4"), "I plan", "Ask once, in your own words. The plan is made before you have finished your tea."],
    [I("call-1"), "In your meeting", "It sits in on the call, writes down what was decided, and hands out the to-dos."],
    [P("noise"), "Night shift", "Up at 2 a.m. or 6 a.m., it is up when you are."],
    [I("w5"), "Somewhere quiet", "You went there for the view, not for your phone."],
    [I("w3"), "Dusk", "Next: Nomaz, the travel buddy. It plans, it handles, you just keep it company."],
    [P("rain"), "Inbox", "45 emails in. 44 handled. One left for you, the one that needs a person."],
    [V("/media/meet/call-2.mp4"), "Live", "Your bots ask before they book, pay or message anyone."],
    [I("w7"), "Wind", "We never sell your data, and never use it to train AI."],
    [P("grid"), "Code", "Xode plans, writes and tests the code. Nothing ships until you approve."],
    [I("w2"), "Long walk", "74 languages today. Every language tomorrow."],
    [V("/media/duo/do.mp4"), "I do", "Tickets, transfers, the small print. Done while you were living your life."],
    [I("call-3"), "The team", "Free to start. Pay only when it has earned it."],
    [I("w6"), "Shoreline", "Where we are going: bots that run your routines every day, and tell you only what matters."],
    [P("noise"), "Signal", "Small team, big ambition: a team of bots for every person, not just for companies."],
    [I("w4"), "Last light", "Dinner, sorted. Have a peaceful evening."],
    [I("w8"), "Cloak", "Built by Xooteq Lab. We make the codes that contain value."],
    [I("call-2"), "Notes sent", "Reminders for you, and for the people you work with, at the moment they need them."],
    [P("rain"), "Routines", "Ask once. It happens every day at the hour you choose."],
  ];
  const RINGS = [{ n: 5, speed: 1, size: 112 }, { n: 7, speed: .8, size: 100 }, { n: 8, speed: .64, size: 88 }];
  const tiles = [];
  let ti = 0;
  RINGS.forEach((ring, r) => {
    for (let j = 0; j < ring.n; j++) {
      const [media, label, quote] = TILES[ti++ % TILES.length];
      const el = document.createElement("div");
      el.className = "wt"; el.tabIndex = 0;
      el.setAttribute("role", "button"); el.setAttribute("aria-label", `${label}: ${quote}`);
      const face = document.createElement("span"); face.className = "face";
      let canvas = null, video = null;
      if (media.kind === "img") { const im = new Image(); im.src = media.src; im.alt = ""; im.loading = "lazy"; im.decoding = "async"; face.appendChild(im); }
      if (media.kind === "video") { video = document.createElement("video"); Object.assign(video, { src: media.src, muted: true, loop: true, playsInline: true, preload: "none" }); video.setAttribute("aria-hidden", "true"); face.appendChild(video); }
      if (media.kind === "pixel") { canvas = document.createElement("canvas"); canvas.width = canvas.height = 36; face.appendChild(canvas); }
      el.append(face);
      const lab = document.createElement("span"); lab.className = "lab"; lab.textContent = label; el.append(lab);
      const q = document.createElement("span"); q.className = "q";
      q.innerHTML = "<b></b><small>From the founders</small>"; q.querySelector("b").textContent = quote; el.append(q);
      orbit.appendChild(el);
      const size = ring.size * (.86 + Math.random() * .28);
      el.style.setProperty("--s", size.toFixed(0) + "px");
      tiles.push({ el, ring: r, speed: ring.speed, a: (j / ring.n) * Math.PI * 2 + r * .7 + Math.random() * .25, size, canvas, video, style: media.style, open: false, wob: Math.random() * 6 });
    }
  });

  // ---- opening a tile: under the pointer, focused, or held on a touch screen ----
  let anyOpen = 0;
  const setOpen = (t, on) => { if (t.open === on) return; t.open = on; anyOpen += on ? 1 : -1; t.el.classList.toggle("open", on); };
  tiles.forEach((t) => {
    let hold = 0;
    t.el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") setOpen(t, true); });
    t.el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") setOpen(t, false); });
    t.el.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") { clearTimeout(hold); hold = setTimeout(() => setOpen(t, true), 260); } });
    const up = () => { clearTimeout(hold); setTimeout(() => setOpen(t, false), 1400); };
    t.el.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") up(); });
    t.el.addEventListener("pointercancel", up);
    t.el.addEventListener("contextmenu", (e) => e.preventDefault());
    t.el.addEventListener("focus", () => setOpen(t, true));
    t.el.addEventListener("blur", () => setOpen(t, false));
  });

  // ---- the pixel tiles, drawn live ----
  const face = new Image(); face.src = "/media/face.svg";
  let faceGrey = null;
  face.onload = () => {
    const c = document.createElement("canvas"); c.width = c.height = 36; const x = c.getContext("2d");
    x.fillStyle = "#000"; x.fillRect(0, 0, 36, 36); x.filter = "invert(1)"; x.drawImage(face, 5, 5, 26, 25);
    faceGrey = x.getImageData(0, 0, 36, 36).data;
  };
  function pixels(t, time) {
    const g = t.canvas.getContext("2d"), im = g.createImageData(36, 36), px = im.data;
    for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) {
      let v;
      if (t.style === "noise") v = noise(x * .22, y * .22, time + t.wob) * (.3 + .7 * y / 36);
      else if (t.style === "rain") { const col = (x * 7 + 3) % 11, head = (time * (6 + col) + col * 9) % 48 - 6; v = y < head && y > head - 9 ? 1 - (head - y) / 9 : .04; }
      else if (t.style === "grid") v = ((x >> 2) + (y >> 2) + Math.floor(time * 3 + t.wob)) % 5 === 0 ? .9 : (Math.sin(x * 12.9 + y * 78.2 + Math.floor(time * 4)) * 43758.5 % 1 + 1) % 1 * .45;
      else v = faceGrey ? faceGrey[(y * 36 + x) * 4] / 255 * (.85 + .15 * Math.sin(time * 3 + y * .5)) : 0;
      const o = (y * 36 + x) * 4;
      if (v > BAYER[(y & 3) * 4 + (x & 3)]) { const c = v > .6 ? LIT : MID; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255; }
      else { px[o] = 16; px[o + 1] = 20; px[o + 2] = 14; px[o + 3] = 255; }
    }
    g.putImageData(im, 0, 0);
  }

  // ---- the bot in the middle ----
  const B = blip(), botCv = core.querySelector(".wall-bot");
  let bot = null;
  if (B && botCv) {
    bot = B.createPerformer({ dpr: 2, dot: "#A0DA80", sticker: "#0C100A", glow: "#A0DA80" });
    bot.play("rest");
  }
  const MOVES = ["look", "celebrate", "work", "think", "yourTurn", "done", "listen", "laugh"];
  let nextMove = 2500;

  // ---- the pull: scroll and hard scroll ----
  let W = 0, H = 0, cx = 0, cy = 0, rings = [];
  function size() {
    W = wall.clientWidth; H = wall.clientHeight; cx = W / 2; cy = H / 2;
    const c = core.getBoundingClientRect(), gap = 26;
    const rx0 = c.width / 2 + 70 + gap, ry0 = c.height / 2 + 60 + gap;
    const sx = Math.max(80, (W * .56 - rx0) / 2), sy = Math.max(70, (H * .56 - ry0) / 2);
    rings = [0, 1, 2].map((k) => ({ rx: rx0 + sx * k, ry: ry0 + sy * k }));
    if (botCv) { const d = Math.min(2, devicePixelRatio || 1), r = botCv.getBoundingClientRect(); botCv.width = r.width * d; botCv.height = r.height * d; }
  }
  const W0 = .055;                         // the turn at rest, radians a second, clockwise
  let omega = W0, impulse = 0, pull = 0, pullV = 0, lastY = scrollY;
  const inView = () => { const r = wall.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
  const kick = (d) => { if (inView() && d > 0) impulse = Math.min(9, impulse + d); };
  addEventListener("wheel", (e) => kick(Math.min(240, e.deltaY * (e.deltaMode ? 30 : 1)) * .006), { passive: true });
  let ty = null;
  addEventListener("touchstart", (e) => { ty = e.touches[0]?.clientY ?? null; }, { passive: true });
  addEventListener("touchmove", (e) => { const y = e.touches[0]?.clientY; if (ty != null && y != null) kick((ty - y) * .02); ty = y ?? null; }, { passive: true });
  addEventListener("scroll", () => { const dy = scrollY - lastY; lastY = scrollY; if (inView()) pullV -= dy * 4.5; }, { passive: true });

  // ---- one frame ----
  let raf = 0, last = 0, pixAt = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, last ? (now - last) / 1000 : .016); last = now;
    const t = now / 1000;
    // the turn: clockwise at rest; a scroll brakes it, a hard one throws it the other way; it eases back
    impulse *= Math.exp(-dt * 1.4);
    const target = (W0 - impulse * .11) * (anyOpen ? .25 : 1);
    omega += (target - omega) * Math.min(1, dt * 3.5);
    // the pull: the tiles lag the page and spring back
    pullV += (-70 * pull - 11 * pullV) * dt; pull += pullV * dt; pull = Math.max(-140, Math.min(140, pull));
    orbit.style.setProperty("--pull", pull.toFixed(1) + "px");
    for (const tile of tiles) {
      if (!tile.open) tile.a += omega * tile.speed * dt;
      const R = rings[tile.ring], half = tile.size / 2;
      const x = cx + Math.cos(tile.a) * R.rx - half, y = cy + Math.sin(tile.a) * R.ry - half + Math.sin(t * .8 + tile.wob) * 4;
      tile.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      // its card opens away from the middle, unless there is no room that side
      const outward = x + half > cx ? 1 : -1, room = outward > 0 ? W - (x + tile.size + 12) : x - 12;
      const left = (room > 280 ? outward : -outward) < 0;
      if (left !== tile.left) { tile.left = left; tile.el.classList.toggle("left", left); }
    }
    if (now - pixAt > 80) { pixAt = now; tiles.forEach((tile) => { if (tile.canvas) pixels(tile, t); }); }
    if (bot) {
      if (now > nextMove) { bot.play(MOVES[Math.floor(Math.random() * MOVES.length)], { then: "rest", again: true }); nextMove = now + 3000 + Math.random() * 2500; }
      const g = botCv.getContext("2d"), d = botCv.width / botCv.clientWidth;
      g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, botCv.clientWidth, botCv.clientHeight);
      g.save(); g.translate(botCv.clientWidth / 2, botCv.clientHeight - 6); bot.draw(g, 0, 0, botCv.clientHeight * .82, now); g.restore();
    }
  }
  size();
  addEventListener("resize", size);
  document.fonts?.ready.then(size);
  if (reduced) { last = 0; frame(3000); cancelAnimationFrame(raf); tiles.forEach((tile) => tile.canvas && pixels(tile, 3)); }
  else new IntersectionObserver((es) => {
    const on = es.some((e) => e.isIntersecting);
    cancelAnimationFrame(raf); last = 0;
    tiles.forEach((tile) => { if (!tile.video) return; if (on) { tile.video.preload = "auto"; tile.video.play().catch(() => {}); } else tile.video.pause(); });
    if (on) raf = requestAnimationFrame(frame);
  }).observe(wall);
}

// ---- the footer's name, on a band of green dots ----
const mark = document.querySelector(".sf-mark");
if (mark) {
  const cv = mark.querySelector("canvas"), g = cv.getContext("2d");
  const CELL = 6;
  let cols = 0, rows = 0, img = null, ptr = null, raf = 0, last = 0;
  function size() {
    const r = mark.getBoundingClientRect();
    cols = Math.ceil(r.width / CELL); rows = Math.ceil(r.height / CELL);
    cv.width = cols * CELL; cv.height = rows * CELL; img = g.createImageData(cv.width, cv.height);
  }
  mark.closest(".sf").addEventListener("pointermove", (e) => { const r = mark.getBoundingClientRect(); ptr = [(e.clientX - r.left) / CELL, (e.clientY - r.top) / CELL]; }, { passive: true });
  mark.closest(".sf").addEventListener("pointerleave", () => { ptr = null; });
  function draw(now) {
    const t = now / 1000, px = img.data, W = cv.width;
    px.fill(0);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const yy = y / rows;
      let v = Math.pow(yy, 1.5) * 1.15 * (.65 + .55 * noise(x * .09, y * .14, t * .6)) - .08;
      if (ptr) { const d = Math.hypot(x - ptr[0], (y - ptr[1]) * 1.4); v += Math.max(0, 1 - d / 22) * .55; }
      if (v <= BAYER[(y & 3) * 4 + (x & 3)]) continue;
      const c = v > .62 ? LIT : MID, X = x * CELL, Y = y * CELL;
      for (let j = 0; j < CELL - 2; j++) { const row = (Y + j) * W; for (let k = 0; k < CELL - 2; k++) { const o = (row + X + k) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255; } }
    }
    g.putImageData(img, 0, 0);
  }
  const loop = (now) => { raf = requestAnimationFrame(loop); if (now - last < 1000 / 15) return; last = now; draw(now); };
  size();
  addEventListener("resize", () => { size(); if (reduced) draw(3000); });
  if (reduced) draw(3000);
  else new IntersectionObserver((es) => { cancelAnimationFrame(raf); if (es.some((e) => e.isIntersecting)) raf = requestAnimationFrame(loop); }).observe(mark);
}

// ---- the mast, dark over the page's dark end ----
{
  const mast = document.querySelector(".mast"), end = document.getElementById("wall");
  if (mast && end) {
    const set = () => mast.classList.toggle("over-end", end.getBoundingClientRect().top < 70);
    addEventListener("scroll", set, { passive: true }); addEventListener("resize", set); set();
  }
}
