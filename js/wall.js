// THE WALL (#wall) and THE FOOTER'S NAME (.sf-mark), on the page's own paper.
//
// The wall: round badges travelling along three unseen orbits, like a dial,
// them clockwise: stills from the owner's travel clips and patterns, all dithered into the site's dots. A scroll pulls
// on it: the badges lag the page and spring back, a gentle scroll slows the turn, and a hard one throws it the other way,
// anticlockwise, before it eases back. A badge under the pointer, or held on a touch screen, opens: everything stops,
// the rest fade back, and the badge grows where it stood into a small card, its picture (or its pattern's pixels) on
// top and its words under, in the site's paper and ink. Off the card it closes, and the turn goes on from where it was.
//
// The footer's corners, an X and a 0, are drawn in the same dots, with the peeking bot looking over the top of the 0,
// its eye on the pointer; the links stand between them.
//
// Like the opening, both turn with the field (stage.js): each is drawn twice, ink on the paper and light on the dark,
// and the two are laid together through a map of how dark the field is under it, every frame. They run only while
// they can be seen; with motion reduced they are drawn once and stand still.
import { reduced } from "./util.js";
import { blip } from "./blip/kit.js";
import { fieldDark } from "./stage.js";

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
const LOOK = {
  dark: { dot: [46, 226, 140], soft: [16, 138, 86], edge: "#062016" },
  light: { dot: [22, 20, 15], soft: [0, 168, 90], edge: "#F4F2EC" },
};
const rgb = (c, a = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
const noise = (x, y, t) => .5 + .25 * Math.sin(x * 1.7 + t * 1.1) * Math.cos(y * 1.3 - t * .7) + .25 * Math.sin((x + y) * .9 + t * .5);

// a canvas drawn in two looks and laid together through the field under it
function toned(cv, fine) {
  const out = cv.getContext("2d"), layer = { dark: document.createElement("canvas"), light: document.createElement("canvas") };
  const mask = document.createElement("canvas"), mg = mask.getContext("2d"), MW = fine ? 96 : 40, MH = fine ? 60 : 26;   // fine: the wall, where the bot and badges stand on the edge
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
  const cv = wall.querySelector(".wall-cv"), core = wall.querySelector(".wall-core"), card = wall.querySelector(".wall-card");
  const cImg = card.querySelector("img"), cCv = card.querySelector("canvas"), cT = card.querySelector(".wc-t"), cP = card.querySelector(".wc-p"), cBy = card.querySelector(".wc-by");
  const T = toned(cv, true);
  const N = 28;                                      // a badge's dots across
  // ---- the badges: what each shows, and its card: a title (three words at most), a line (forty at most) and who says it,
  // written small by hand. The first nine are the inner two rings, the ones a phone shows. ----
  const BADGES = [
    ["w1", "Less busywork", "Honestly, most of what eats your day isn't hard, it's just endless. Replying, booking, chasing people up. We'd rather the bots carry that, so your head's free for the stuff you actually care about.", "the X0 Bot team"],
    ["rings", "Why by hand?", "Pretty much every bot we've built started with someone on the team asking, wait, why am I still doing this by hand? We try hard not to lose that. It's the best part of the job.", "the X0 Bot team"],
    ["w5", "That one morning", "The first build crashed every night for weeks. We'd come in, fix it, and it'd crash again. Then one morning it just didn't. We still talk about how quiet the room went.", "the engineers, X0 Bot"],
    ["noise", "Without thinking", "Civilization advances by extending the number of important operations which we can perform without thinking about them.", "Alfred North Whitehead"],
    ["w3", "What's next", "We started with mail. Then food, then code, then meetings. Every time one works, someone asks what's next, and the list hasn't got any shorter. Honestly, we hope it never does.", "the X0 Bot team"],
    ["face", "Invent the future", "The best way to predict the future is to invent it.", "Alan Kay"],
    ["w7", "Bad weeks", "Some weeks nothing works. A feature we loved gets binned, or a fix breaks two other things. We've learned to keep at it. The answer usually turns up right after we almost gave up.", "the product team, X0 Bot"],
    ["grid", "Passionately curious", "I have no special talents. I am only passionately curious.", "Albert Einstein"],
    ["w8", "Xooteq Lab", "X0 Bot is made at Xooteq Lab, and we're still working on it every day. We call what we do FunTech: tools that take real work off your plate and are actually fun to use.", "Xooteq Lab"],
    ["w2", "Chai breaks", "We'll argue for twenty minutes about the shade of a button, then go get chai together. Nobody guards their own corner here. If something's broken, whoever's free picks it up. It's a good place to be.", "the X0 Bot team"],
    ["rain", "Indistinguishable from magic", "Any sufficiently advanced technology is indistinguishable from magic.", "Arthur C. Clarke"],
    ["w4", "Minutes add up", "Every small thing a bot handles gives you a few minutes back. They add up faster than you'd think. Spend them on dinner with your family, or that idea you keep putting off.", "the X0 Bot team"],
    ["w6", "Green revolution", "Green's been our colour since day one, and lately it feels like a direction too: let the bots do the grind so people get their time back. We call it the green revolution. Half joking.", "Xooteq Lab"],
    ["noise", "A vigorous mind", "Curiosity is one of the permanent and certain characteristics of a vigorous mind.", "Samuel Johnson"],
    ["face", "Thinking big", "We're a small team going after something big: bots that everyone just has, the way everyone has a phone. Some days that sounds a bit mad. We're building it anyway.", "Xooteq Lab"],
  ];
  const RINGS = [{ n: 4, speed: 1, r: 40 }, { n: 5, speed: .78, r: 34 }, { n: 6, speed: .6, r: 30 }];
  const badges = [];
  let bi = 0;
  RINGS.forEach((ring, k) => {
    for (let j = 0; j < ring.n; j++) {
      const [what, title, line, by] = BADGES[bi++ % BADGES.length];
      const b = { ring: k, speed: ring.speed, rb: ring.r * (.9 + Math.random() * .2), r0: 0, a: (j / ring.n) * Math.PI * 2 + k * .9, what, title, line, by, grey: null, grow: 0, fade: 1, x: 0, y: 0, wob: Math.random() * 6 };
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

  // ---- the platforms: their shapes, read from the links' own icons, drawn on the canvas ----
  const plats = [...core.querySelectorAll(".wp")].map((el) => {
    const paths = [...el.querySelectorAll("path")].map((p) => ({ d: new Path2D(p.getAttribute("d")), fill: p.getAttribute("fill") !== "none", stroke: p.hasAttribute("stroke"), rule: p.getAttribute("fill-rule") || "nonzero" }));
    const p = { el, paths, hover: 0, on: false };
    el.addEventListener("pointerenter", () => { p.on = true; }); el.addEventListener("pointerleave", () => { p.on = false; });
    el.addEventListener("focus", () => { p.on = true; }); el.addEventListener("blur", () => { p.on = false; });
    return p;
  });
  function drawPlats(g, L, dt) {
    const w = cv.getBoundingClientRect();
    for (const p of plats) {
      p.hover += ((p.on ? 1 : 0) - p.hover) * Math.min(1, dt * 12);
      const r = p.el.getBoundingClientRect(), x = r.left - w.left + r.width / 2, y = r.top - w.top + r.height / 2 - p.hover * 3, R = r.width / 2 - .75;
      if (p.hover > .01) { g.fillStyle = rgb(L.soft, .18 * p.hover); g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = rgb(L.dot); g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.stroke();
      g.save(); g.translate(x - 10, y - 10); g.scale(20 / 24, 20 / 24);
      g.fillStyle = rgb(L.dot); g.strokeStyle = rgb(L.dot); g.lineWidth = .9; g.lineCap = "round";
      for (const q of p.paths) { if (q.fill) g.fill(q.d, q.rule); if (q.stroke) g.stroke(q.d); }
      g.restore();
    }
  }

  // ---- the size of things ----
  let W = 0, H = 0, cx = 0, cy = 0, orbits = [], botH = 160, botFeet = 0;
  function size() {
    ({ W, H } = T.size());
    cx = W / 2; cy = H * .5;
    // the middle: empty now, kept the bot's room so the orbits sit as they did (the platforms are in the foot)
    const small = W < 760;
    botH = Math.min(small ? 104 : 130, H * .2); botFeet = cy + botH * .32;
    core.style.top = (botFeet + 12).toFixed(0) + "px";
    // the orbits fill the space round it, the inner one clear of the bot and the platforms
    const ry0 = botH * .5 + 98, ryMax = H / 2 - (small ? 26 : 34), aspect = small ? .78 : 1.75;
    const stepY = Math.max(24, (ryMax - ry0) / 2);
    orbits = [0, 1, 2].map((k) => { const ry = ry0 + k * stepY; return { ry, rx: Math.min(W / 2 - (small ? 22 : 40), Math.max(ry * aspect, small ? 0 : 230 + k * 150)) }; });
    // on a phone the badges are smaller, and the outer ring is left out
    badges.forEach((b) => { b.r0 = b.rb * (small ? .62 : 1); b.hidden = small && b.ring === 2; });
  }

  // ---- opening a badge: it grows into the card where it stands ----
  let open = null, ptr = null, hold = 0, onCard = false, box = null;   // box: the card's place, grown, in the wall's terms
  const inBox = (x, y) => box && x >= box.x - 6 && x <= box.x + box.w + 6 && y >= box.y - 6 && y <= box.y + box.h + 6;
  const hit = (x, y) => badges.find((b) => !b.hidden && Math.hypot(b.x - x, b.y - y) < b.r0 * (1 + b.grow * .3) + 6) || null;
  const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; ptr = local(e);
    if (open && inBox(...ptr)) return;                     // still over the card (or where it is growing to): it stays
    const b = hit(...ptr); cv.classList.toggle("over", !!b); if (!onCard) setOpen(b); });
  // the card coming up under the pointer takes it off the canvas: that is not leaving
  cv.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !onCard && !card.contains(e.relatedTarget) && !(open && inBox(...local(e)))) { ptr = null; setOpen(null); } });
  card.addEventListener("pointerenter", () => { onCard = true; });
  card.addEventListener("pointerleave", (e) => { onCard = false; if (e.pointerType === "mouse" && !inBox(...local(e))) setOpen(null); });
  cv.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") return; const b = hit(...local(e)); clearTimeout(hold); if (b) hold = setTimeout(() => setOpen(b), 240); else setOpen(null); });
  const release = () => { clearTimeout(hold); setTimeout(() => { if (!onCard) setOpen(null); }, 2400); };
  cv.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") release(); });
  cv.addEventListener("pointercancel", release);
  cv.addEventListener("contextmenu", (e) => e.preventDefault());
  function setOpen(b) {
    if (b === open) return;
    open = b;
    if (!b) { card.classList.remove("on"); box = null; return; }
    const photo = /^w\d/.test(b.what);
    card.dataset.kind = photo ? "photo" : "pixels";
    if (photo) cImg.src = `/media/wall/${b.what}.jpg`;
    cT.textContent = b.title; cP.textContent = b.line; cBy.textContent = b.by;
    // where it stands: its picture over the badge, kept inside the wall
    card.classList.remove("on"); card.style.transition = "none";
    const cw = card.offsetWidth, ch = card.offsetHeight, mh = cw * 9 / 16;
    const x = Math.max(12, Math.min(W - cw - 12, b.x - cw / 2)), y = Math.max(12, Math.min(H - ch - 12, b.y - mh / 2));
    card.style.left = x.toFixed(0) + "px"; card.style.top = y.toFixed(0) + "px"; box = { x, y, w: cw, h: ch };
    card.style.transformOrigin = `${(b.x - x).toFixed(0)}px ${(b.y - y).toFixed(0)}px`;
    card.style.setProperty("--ox", (b.x - x).toFixed(0) + "px"); card.style.setProperty("--oy", (b.y - y).toFixed(0) + "px");
    const r = cv.getBoundingClientRect();
    card.classList.toggle("dk", fieldDark(r.left + x + cw / 2, r.top + y + ch / 2) > .5);
    void card.offsetWidth; card.style.transition = ""; card.classList.add("on");
  }
  // a pattern's pixels, on the card: in its ink on its paper, square cells, the middle of the pattern
  const cg = cCv.getContext("2d");
  function drawPixels(t) {
    if (!open || card.dataset.kind !== "pixels") return;
    const cols = N, rows = Math.round(N * 9 / 16), w = cCv.width = cols * 8, h = cCv.height = rows * 8, grey = greyOf(open, t), y0 = Math.floor((N - rows) / 2);
    const dk = card.classList.contains("dk");
    cg.fillStyle = dk ? "#161511" : "#F7F6F2"; cg.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const v = grey[(j + y0) * N + i];
      if (v <= BAYER[(j & 3) * 4 + (i & 3)]) continue;
      cg.fillStyle = dk ? (v > .62 ? "#F3EEE6" : "rgba(243, 238, 230, .45)") : (v > .62 ? "#16140F" : "rgba(22, 20, 15, .4)");
      cg.fillRect(i * 8 + 1, j * 8 + 1, 6, 6);
    }
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
    omega += ((W0 - impulse * .14) - omega) * Math.min(1, dt * 3.5);
    pullV += (-70 * pull - 11 * pullV) * dt; pull += pullV * dt; pull = Math.max(-120, Math.min(120, pull));
    for (const b of badges) {
      if (b.hidden) continue;
      if (!open) b.a += omega * b.speed * dt;                // opened, everything stops where it is, and goes on from there
      b.grow += ((b === open ? 1 : 0) - b.grow) * Math.min(1, dt * 9);
      // the rest stay, faint, so the card has the eye; the opened one has become the card
      b.fade += ((!open ? 1 : b === open ? 0 : .2) - b.fade) * Math.min(1, dt * (open ? 10 : 6));
      const o = orbits[b.ring];
      b.x = cx + Math.cos(b.a) * o.rx; b.y = cy + Math.sin(b.a) * o.ry + pull * (1 + b.ring * .35) + Math.sin(t * .9 + b.wob) * 3;
    }
    T.draw((g, L, k) => {
      // (the orbits themselves are not drawn: only the badges, travelling along them)
      // the badges, back ones first
      badges.filter((b) => !b.hidden && b.fade > .01).sort((p, q) => p.y - q.y).forEach((b) => {
        const r = b.r0 * (1 + b.grow * .3);
        g.globalAlpha = b.fade;
        g.fillStyle = L.edge; g.beginPath(); g.arc(b.x, b.y, r + 3, 0, Math.PI * 2); g.fill();
        dots(g, greyOf(b, t), N, b.x, b.y, r, L, 1);
        g.strokeStyle = rgb(L.dot, .9); g.lineWidth = 1.4 + b.grow; g.beginPath(); g.arc(b.x, b.y, r + 3, 0, Math.PI * 2); g.stroke();
        g.globalAlpha = 1;
      });
      drawPlats(g, L, k === "dark" ? dt : 0);
    });
    drawPixels(t);
  }
  const loop = (now) => { raf = requestAnimationFrame(loop); if (now - last < 1000 / 40) return; frame(now); };
  size();
  addEventListener("resize", () => { size(); if (reduced) frame(3000); });
  document.fonts?.ready.then(() => { size(); if (reduced) frame(3000); });
  if (reduced) { setTimeout(() => frame(3000), 400); addEventListener("scroll", () => frame(3000), { passive: true }); }
  else new IntersectionObserver((es) => { cancelAnimationFrame(raf); last = 0; if (es.some((e) => e.isIntersecting)) raf = requestAnimationFrame(loop); }).observe(wall);
}

// ---- the footer's corners: X and 0, each in dots, the bot looking over the 0 ----
document.querySelectorAll(".sf-glyph").forEach((mark) => {
  const glyph = mark.dataset.glyph, T = toned(mark), B = mark.hasAttribute("data-peek") ? blip() : null;
  let W = 0, H = 0, cell = 4, grid = null, cols = 0, rows = 0, top = [0, 0], ptr = null, raf = 0, last = 0;
  const peek = B ? { dark: B.createBlip({ height: 60, ink: LOOK.dark.edge, pale: LOOK.dark.dot }), light: B.createBlip({ height: 60, ink: LOOK.light.edge, pale: LOOK.light.dot }) } : null;
  if (peek) { peek.dark.pose("peek"); peek.light.pose("peek"); if (reduced) { peek.dark.still(true); peek.light.still(true); } }
  function size() {
    ({ W, H } = T.size());
    cell = H < 80 ? 3 : 4; cols = Math.floor(W / cell); rows = Math.floor(H / cell);
    const c = document.createElement("canvas"); c.width = cols; c.height = rows; const x = c.getContext("2d");
    // the glyph as large as fits, standing on the bottom, with room over the 0 for the bot
    let fs = rows * (peek ? 1.05 : 1.25);
    x.font = `400 ${fs}px Newsreader, Georgia, serif`;
    const tw = x.measureText(glyph).width; if (tw > cols * .98) { fs *= cols * .98 / tw; x.font = `400 ${fs}px Newsreader, Georgia, serif`; }
    x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "alphabetic"; x.fontVariantNumeric = "lining-nums";
    const base = rows * .97; x.fillText(glyph, cols / 2, base);
    top = [W / 2, (base - fs * .7) * cell];
    const d = x.getImageData(0, 0, cols, rows).data; grid = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) grid[i] = d[i * 4 + 3] / 255;
    if (peek) { const ph = Math.min(90, fs * cell * .62); peek.dark.size(ph); peek.light.size(ph); }
  }
  const sf = mark.closest(".sf");
  sf.addEventListener("pointermove", (e) => { const r = mark.getBoundingClientRect(); ptr = [e.clientX - r.left, e.clientY - r.top]; });
  sf.addEventListener("pointerleave", () => { ptr = null; });
  function frame(now) {
    last = now; const t = now / 1000;
    T.draw((g, L, k) => {
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        let v = grid[y * cols + x];
        if (v < .05) continue;
        v *= .82 + .18 * noise(x * .1, y * .12, t * .7);
        if (ptr) v += Math.max(0, 1 - Math.hypot(x * cell - ptr[0], y * cell - ptr[1]) / 90) * .35;
        if (v <= BAYER[(y & 3) * 4 + (x & 3)]) continue;
        g.fillStyle = rgb(v > .6 ? L.dot : L.soft);
        g.fillRect(x * cell, y * cell, cell - 1, cell - 1);
      }
      if (peek) { peek[k].lookAt(ptr || [-W, -H * .5]); peek[k].draw(g, top[0], top[1], t, reduced ? 1 : .5); }
    });
  }
  const loop = (now) => { raf = requestAnimationFrame(loop); if (now - last < 1000 / 24) return; frame(now); };
  const start = () => { size(); if (reduced) frame(3000); };
  addEventListener("resize", start);
  document.fonts?.ready.then(start);
  start();
  if (reduced) addEventListener("scroll", () => frame(3000), { passive: true });
  else new IntersectionObserver((es) => { cancelAnimationFrame(raf); if (es.some((e) => e.isIntersecting)) raf = requestAnimationFrame(loop); }).observe(mark);
});
