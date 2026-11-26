// THE WALL (#wall) and THE FOOTER'S NAME (.sf-mark), on the page's own paper.
//
// The wall: the bot in the middle, and round it three dotted orbits, like a dial, with round badges travelling along
// them clockwise: stills from the owner's travel clips and patterns, all dithered into the site's dots. A scroll pulls
// on it: the badges lag the page and spring back, a gentle scroll slows the turn, and a hard one throws it the other way,
// anticlockwise, before it eases back. A badge under the pointer, or held on a touch screen, stops and grows, and a
// founders' note is written beside it by hand, with an arrow to it.
//
// The footer's name, "x0bot", is drawn in the same dots, with the peeking bot looking over the top of the 0, its eye
// on the pointer.
//
// Like the opening, both turn with the field (stage.js): each is drawn twice, ink on the paper and light on the dark,
// and the two are laid together through a map of how dark the field is under it, every frame. They run only while
// they can be seen; with motion reduced they are drawn once and stand still.
import { reduced } from "./util.js";
import { blip } from "./blip/kit.js";
import { fieldDark } from "./stage.js";

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
const LOOK = {
  dark: { dot: [160, 218, 128], soft: [98, 150, 72], edge: "#14200F" },
  light: { dot: [22, 20, 15], soft: [79, 122, 58], edge: "#F4F2EC" },
};
const rgb = (c, a = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
const noise = (x, y, t) => .5 + .25 * Math.sin(x * 1.7 + t * 1.1) * Math.cos(y * 1.3 - t * .7) + .25 * Math.sin((x + y) * .9 + t * .5);

// a canvas drawn in two looks and laid together through the field under it
function toned(cv) {
  const out = cv.getContext("2d"), layer = { dark: document.createElement("canvas"), light: document.createElement("canvas") };
  const mask = document.createElement("canvas"), mg = mask.getContext("2d"), MW = 40, MH = 26;
  mask.width = MW; mask.height = MH;
  const mimg = mg.createImageData(MW, MH);
  let W = 0, H = 0, dpr = 1;
  return {
    size() {
      const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      for (const c of [cv, layer.dark, layer.light]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      return { W, H, dpr };
    },
    draw(paint) {
      for (const k of ["dark", "light"]) {
        const g = layer[k].getContext("2d");
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, layer[k].width, layer[k].height); g.setTransform(dpr, 0, 0, dpr, 0, 0);
        paint(g, LOOK[k], k);
      }
      const r = cv.getBoundingClientRect(), px = mimg.data;
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const d = fieldDark(r.left + (x + .5) / MW * r.width, r.top + (y + .5) / MH * r.height), o = (y * MW + x) * 4;
        px[o] = px[o + 1] = px[o + 2] = 255; px[o + 3] = Math.round(Math.max(0, Math.min(1, (d - .35) / .3)) * 255);
      }
      mg.putImageData(mimg, 0, 0);
      const dc = layer.dark.getContext("2d"), lc = layer.light.getContext("2d");
      dc.setTransform(1, 0, 0, 1, 0, 0); dc.globalCompositeOperation = "destination-in"; dc.drawImage(mask, 0, 0, layer.dark.width, layer.dark.height); dc.globalCompositeOperation = "source-over";
      lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = "destination-out"; lc.drawImage(mask, 0, 0, layer.light.width, layer.light.height); lc.globalCompositeOperation = "source-over";
      out.setTransform(1, 0, 0, 1, 0, 0); out.clearRect(0, 0, cv.width, cv.height);
      out.drawImage(layer.light, 0, 0); out.drawImage(layer.dark, 0, 0);
    },
  };
}

// a grey picture (0 dark .. 1 light) as dots, into a disc of radius r at (x, y), in a look's colours
function dots(g, grey, n, x, y, r, L, lift) {
  const cell = (2 * r) / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const dx = (i + .5) / n - .5, dy = (j + .5) / n - .5;
    if (dx * dx + dy * dy > .25) continue;
    const v = Math.min(1, grey[j * n + i] * (lift || 1));
    if (v <= BAYER[(j & 3) * 4 + (i & 3)]) continue;
    g.fillStyle = rgb(v > .62 ? L.dot : L.soft);
    g.fillRect(x - r + i * cell + cell * .12, y - r + j * cell + cell * .12, cell * .76, cell * .76);
  }
}

const wall = document.getElementById("wall");
if (wall) {
  const cv = wall.querySelector(".wall-cv"), core = wall.querySelector(".wall-core"), note = wall.querySelector(".wall-note");
  const noteT = note.querySelector(".wn-t"), arrow = note.querySelector(".wn-arrow");
  const T = toned(cv);
  const N = 28;                                      // a badge's dots across
  // ---- the badges: what each shows, and its note ----
  const BADGES = [
    ["w1", "We build bots that do the work, not bots that talk about it."],
    ["noise", "Up at 2 a.m. or 6 a.m., it is up when you are."],
    ["w5", "You went there for the view, not for your phone."],
    ["face", "One team, every device. Your phone and your computer, the same bots."],
    ["w3", "Next: Nomaz, the travel buddy. It plans, it handles, you keep it company."],
    ["rain", "45 emails in, 44 handled. One left for you, the one that needs a person."],
    ["w7", "We never sell your data, and never use it to train AI."],
    ["grid", "Nothing ships until you approve. Nothing is booked or paid until you say yes."],
    ["w2", "74 languages today. Every language tomorrow."],
    ["w6", "Where we are going: bots that run your days, and tell you only what matters."],
    ["rings", "Ask once. It happens every day, at the hour you choose."],
    ["w4", "Dinner, sorted. Have a peaceful evening."],
    ["w8", "Built by Xooteq Lab: the codes that contain value."],
    ["noise", "A team of bots for every person, not just for companies."],
    ["face", "Free to start. Pay only when it has earned it."],
  ];
  const RINGS = [{ n: 4, speed: 1, r: 40 }, { n: 5, speed: .78, r: 34 }, { n: 6, speed: .6, r: 30 }];
  const badges = [];
  let bi = 0;
  RINGS.forEach((ring, k) => {
    for (let j = 0; j < ring.n; j++) {
      const [what, line] = BADGES[bi++ % BADGES.length];
      const b = { ring: k, speed: ring.speed, rb: ring.r * (.9 + Math.random() * .2), r0: 0, a: (j / ring.n) * Math.PI * 2 + k * .9, what, line, grey: null, grow: 0, x: 0, y: 0, wob: Math.random() * 6 };
      if (/^w\d/.test(what)) {
        const im = new Image(); im.src = `/media/wall/${what}.jpg`;
        im.onload = () => { const c = document.createElement("canvas"); c.width = c.height = N; const x = c.getContext("2d"); x.drawImage(im, 0, 0, N, N);
          const d = x.getImageData(0, 0, N, N).data; b.grey = new Float32Array(N * N);
          for (let i = 0; i < N * N; i++) b.grey[i] = Math.min(1, Math.max(0, ((d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11) / 255 - .12) * 1.35)); };
      }
      badges.push(b);
    }
  });
  const faceIm = new Image(); faceIm.src = "/media/face.svg";
  let faceGrey = null;
  faceIm.onload = () => { const c = document.createElement("canvas"); c.width = c.height = N; const x = c.getContext("2d"); x.fillStyle = "#000"; x.fillRect(0, 0, N, N); x.filter = "invert(1)"; x.drawImage(faceIm, 4, 5, N - 8, N - 9);
    const d = x.getImageData(0, 0, N, N).data; faceGrey = new Float32Array(N * N); for (let i = 0; i < N * N; i++) faceGrey[i] = d[i * 4] / 255; };
  const live = new Float32Array(N * N);
  function greyOf(b, t) {
    if (b.grey) return b.grey;
    if (b.what === "face") return faceGrey || live.fill(0);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      let v;
      if (b.what === "noise") v = noise(i * .25, j * .25, t + b.wob);
      else if (b.what === "rain") { const col = (i * 7 + 3) % 11, head = (t * (6 + col) + col * 9) % 40 - 5; v = j < head && j > head - 8 ? 1 - (head - j) / 8 : .05; }
      else if (b.what === "rings") v = .5 + .5 * Math.sin(Math.hypot(i - N / 2, j - N / 2) * .9 - t * 3);
      else v = ((i >> 2) + (j >> 2) + Math.floor(t * 3 + b.wob)) % 4 === 0 ? .95 : .2;
      live[j * N + i] = v;
    }
    return live;
  }

  // ---- the bot in the middle ----
  const B = blip();
  const bots = B ? { dark: B.createPerformer({ dpr: 2, dot: rgb(LOOK.dark.dot), sticker: LOOK.dark.edge, glow: rgb(LOOK.dark.dot) }),
    light: B.createPerformer({ dpr: 2, dot: rgb(LOOK.light.dot), sticker: LOOK.light.edge, glow: rgb(LOOK.light.dot) }) } : null;
  const MOVES = ["look", "celebrate", "work", "think", "yourTurn", "done", "listen", "laugh"];
  let nextMove = 2500;
  if (bots) { bots.dark.play("rest"); bots.light.play("rest"); }

  // ---- the size of things ----
  let W = 0, H = 0, cx = 0, cy = 0, orbits = [], botH = 160, botFeet = 0;
  function size() {
    ({ W, H } = T.size());
    cx = W / 2; cy = H * .5;
    // the middle: the bot standing a little above the centre, the platforms just under its feet
    const small = W < 760;
    botH = Math.min(small ? 130 : 170, H * .26); botFeet = cy + botH * .32;
    core.style.top = (botFeet + 12).toFixed(0) + "px";
    // the orbits fill the space round it, the inner one clear of the bot and the platforms
    const ry0 = botH * .5 + 98, ryMax = H / 2 - (small ? 26 : 34), aspect = small ? .78 : 1.75;
    const stepY = Math.max(24, (ryMax - ry0) / 2);
    orbits = [0, 1, 2].map((k) => { const ry = ry0 + k * stepY; return { ry, rx: Math.min(W / 2 - (small ? 22 : 40), Math.max(ry * aspect, small ? 0 : 230 + k * 150)) }; });
    // on a phone the badges are smaller, and the outer ring is left out
    badges.forEach((b) => { b.r0 = b.rb * (small ? .62 : 1); b.hidden = small && b.ring === 2; });
  }

  // ---- opening a badge ----
  let open = null, ptr = null, hold = 0, holdAt = 0;
  const hit = (x, y) => badges.find((b) => !b.hidden && Math.hypot(b.x - x, b.y - y) < b.r0 * (1 + b.grow * .3) + 6) || null;
  const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; ptr = local(e); const b = hit(...ptr); cv.classList.toggle("over", !!b); setOpen(b); });
  cv.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { ptr = null; setOpen(null); } });
  cv.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") return; const b = hit(...local(e)); clearTimeout(hold); if (b) hold = setTimeout(() => setOpen(b), 240); });
  const release = () => { clearTimeout(hold); setTimeout(() => setOpen(null), 1600); };
  cv.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") release(); });
  cv.addEventListener("pointercancel", release);
  cv.addEventListener("contextmenu", (e) => e.preventDefault());
  function setOpen(b) {
    if (b === open) return;
    open = b;
    if (b) { noteT.textContent = b.line; note.classList.remove("on"); void note.offsetWidth; note.classList.add("on"); holdAt = performance.now(); }
    else note.classList.remove("on");
  }
  // the note beside its badge, away from the middle where there is room, the arrow pointing back at the badge
  function placeNote() {
    if (!open) return;
    const b = open, nw = note.offsetWidth, nh = note.offsetHeight, out = b.x > cx ? 1 : -1, gap = b.r0 * 1.4 + 50;
    let side = out;
    if (side > 0 && b.x + gap + nw > W - 12) side = -1; else if (side < 0 && b.x - gap - nw < 12) side = 1;
    const x = side > 0 ? b.x + gap : b.x - gap - nw, y = Math.max(12, Math.min(H - nh - 12, b.y - nh * .7));
    note.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
    arrow.style.left = side > 0 ? "-96px" : "auto"; arrow.style.right = side > 0 ? "auto" : "-96px";
    arrow.style.top = Math.max(-10, Math.min(nh - 20, b.y - y - 30)) + "px";
    arrow.style.transform = side > 0 ? "scaleX(-1)" : "none";
    note.classList.toggle("dk", fieldDark(cv.getBoundingClientRect().left + x + nw / 2, cv.getBoundingClientRect().top + y + nh / 2) > .5);
  }

  // ---- the pull ----
  const W0 = .07;
  let omega = W0, impulse = 0, pull = 0, pullV = 0, lastY = scrollY;
  const inView = () => { const r = wall.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
  const kick = (d) => { if (inView() && d > 0) impulse = Math.min(9, impulse + d); };
  addEventListener("wheel", (e) => kick(Math.min(240, e.deltaY * (e.deltaMode ? 30 : 1)) * .006), { passive: true });
  let ty = null;
  addEventListener("touchstart", (e) => { ty = e.touches[0]?.clientY ?? null; }, { passive: true });
  addEventListener("touchmove", (e) => { const y = e.touches[0]?.clientY; if (ty != null && y != null) kick((ty - y) * .02); ty = y ?? null; }, { passive: true });
  addEventListener("scroll", () => { const dy = scrollY - lastY; lastY = scrollY; if (inView()) pullV -= dy * 4.5; }, { passive: true });

  // ---- one frame ----
  let raf = 0, last = 0;
  function frame(now) {
    const dt = Math.min(.05, last ? (now - last) / 1000 : .016); last = now;
    const t = now / 1000;
    impulse *= Math.exp(-dt * 1.4);
    omega += ((W0 - impulse * .14) * (open ? .2 : 1) - omega) * Math.min(1, dt * 3.5);
    pullV += (-70 * pull - 11 * pullV) * dt; pull += pullV * dt; pull = Math.max(-120, Math.min(120, pull));
    for (const b of badges) {
      if (b.hidden) continue;
      if (b !== open) b.a += omega * b.speed * dt;
      b.grow += ((b === open ? 1 : 0) - b.grow) * Math.min(1, dt * 9);
      const o = orbits[b.ring];
      b.x = cx + Math.cos(b.a) * o.rx; b.y = cy + Math.sin(b.a) * o.ry + pull * (1 + b.ring * .35) + Math.sin(t * .9 + b.wob) * 3;
    }
    if (bots && now > nextMove) { const m = MOVES[Math.floor(Math.random() * MOVES.length)]; bots.dark.play(m, { then: "rest", again: true }); bots.light.play(m, { then: "rest", again: true }); nextMove = now + 3000 + Math.random() * 2500; }
    T.draw((g, L, k) => {
      // the orbits: dotted ellipses, the dots marching with the turn
      orbits.forEach((o, i) => {
        const n = Math.round((o.rx + o.ry) * .17), sh = (t * omega * 2.2) % 1;
        g.fillStyle = rgb(L.soft, .55);
        for (let j = 0; j < n; j++) { const a = ((j + sh) / n) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * o.rx, cy + Math.sin(a) * o.ry + pull * (1 + i * .35), 1.3, 0, Math.PI * 2); g.fill(); }
      });
      // the badges, back ones first
      badges.filter((b) => !b.hidden).sort((p, q) => p.y - q.y).forEach((b) => {
        const r = b.r0 * (1 + b.grow * .3);
        g.fillStyle = L.edge; g.beginPath(); g.arc(b.x, b.y, r + 3, 0, Math.PI * 2); g.fill();
        dots(g, greyOf(b, t), N, b.x, b.y, r, L, 1);
        g.strokeStyle = rgb(L.dot, .9); g.lineWidth = 1.4 + b.grow; g.beginPath(); g.arc(b.x, b.y, r + 3, 0, Math.PI * 2); g.stroke();
      });
      // the bot, over the middle
      if (bots) { g.save(); g.translate(cx, botFeet); bots[k].draw(g, 0, 0, botH, now); g.restore(); }
    });
    placeNote();
  }
  const loop = (now) => { raf = requestAnimationFrame(loop); if (now - last < 1000 / 40) return; frame(now); };
  size();
  addEventListener("resize", () => { size(); if (reduced) frame(3000); });
  document.fonts?.ready.then(() => { size(); if (reduced) frame(3000); });
  if (reduced) { setTimeout(() => frame(3000), 400); addEventListener("scroll", () => frame(3000), { passive: true }); }
  else new IntersectionObserver((es) => { cancelAnimationFrame(raf); last = 0; if (es.some((e) => e.isIntersecting)) raf = requestAnimationFrame(loop); }).observe(wall);
}

// ---- the footer's name, in dots, with the bot looking over the 0 ----
const mark = document.querySelector(".sf-mark");
if (mark) {
  const T = toned(mark), B = blip();
  let W = 0, H = 0, cell = 6, grid = null, cols = 0, rows = 0, zero = [0, 0], ptr = null, raf = 0, last = 0;
  const peek = B ? { dark: B.createBlip({ height: 90, ink: LOOK.dark.edge, pale: LOOK.dark.dot }), light: B.createBlip({ height: 90, ink: LOOK.light.edge, pale: LOOK.light.dot }) } : null;
  if (peek) { peek.dark.pose("peek"); peek.light.pose("peek"); if (reduced) { peek.dark.still(true); peek.light.still(true); } }
  function size() {
    ({ W, H } = T.size());
    cell = W < 700 ? 4 : 6; cols = Math.floor(W / cell); rows = Math.floor(H / cell);
    // the word, drawn once into a grid of how much of each cell it covers
    const c = document.createElement("canvas"); c.width = cols; c.height = rows; const x = c.getContext("2d");
    let fs = rows * 1.15;
    x.font = `400 ${fs}px Newsreader, Georgia, serif`;
    const tw = x.measureText("x0bot").width; if (tw > cols * .96) { fs *= cols * .96 / tw; x.font = `400 ${fs}px Newsreader, Georgia, serif`; }
    x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "alphabetic"; x.fontVariantNumeric = "lining-nums";
    const base = rows * .92; x.fillText("x0bot", cols / 2, base);
    const w0 = x.measureText("x").width, w1 = x.measureText("x0").width, total = x.measureText("x0bot").width;
    zero = [(cols / 2 - total / 2 + (w0 + w1) / 2) * cell, (base - fs * .7) * cell];
    const d = x.getImageData(0, 0, cols, rows).data; grid = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) grid[i] = d[i * 4 + 3] / 255;
    if (peek) { const ph = Math.min(190, fs * cell * .78); peek.dark.size(ph); peek.light.size(ph); }
  }
  mark.addEventListener("pointermove", (e) => { const r = mark.getBoundingClientRect(); ptr = [e.clientX - r.left, e.clientY - r.top]; });
  mark.addEventListener("pointerleave", () => { ptr = null; });
  function frame(now) {
    last = now; const t = now / 1000;
    T.draw((g, L, k) => {
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        let v = grid[y * cols + x];
        if (v < .05) continue;
        v *= .82 + .18 * noise(x * .08, y * .1, t * .7);
        if (ptr) v += Math.max(0, 1 - Math.hypot(x * cell - ptr[0], y * cell - ptr[1]) / 120) * .35;
        if (v <= BAYER[(y & 3) * 4 + (x & 3)]) continue;
        g.fillStyle = rgb(v > .6 ? L.dot : L.soft);
        g.fillRect(x * cell, y * cell, cell - 1.5, cell - 1.5);
      }
      if (peek) { peek[k].lookAt(ptr || [W * .8, H * .2]); peek[k].draw(g, zero[0], zero[1], t, reduced ? 1 : .5); }
    });
  }
  const loop = (now) => { raf = requestAnimationFrame(loop); if (now - last < 1000 / 24) return; frame(now); };
  const start = () => { size(); if (reduced) frame(3000); };
  addEventListener("resize", start);
  document.fonts?.ready.then(start);
  start();
  if (reduced) addEventListener("scroll", () => frame(3000), { passive: true });
  else new IntersectionObserver((es) => { cancelAnimationFrame(raf); if (es.some((e) => e.isIntersecting)) raf = requestAnimationFrame(loop); }).observe(mark);
}
