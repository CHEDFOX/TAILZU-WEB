// WHAT IT DOES, ON ONE CARD (#duo). The view is held while it is scrolled through and the one card stays in the middle
// of it; one film plays on it the whole time, and the scroll turns only its line from the first to the second (--t on
// the card, css). The film (media/duo/plan.mp4) is drawn live as the opening's green dots: every frame is sampled down
// to a grid and each cell is lit or not against a 4x4 ordered threshold, light green where it is bright, on a dark
// ground. It is drawn only while the card can be seen. With motion reduced it is drawn once and both lines stand on it.
import { reduced } from "./util.js";

const sec = document.getElementById("duo");
if (sec) {
  const card = sec.querySelector(".duo-card"), cards = [card];   // one film, on the card itself
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
  const LIT = [46, 226, 140], MID = [16, 138, 86];

  // ---- the turn, moved by the scroll: the first film held, the turn to the second, the second held ----
  // The scroll sets where the turn should be; the card follows it with a little lag, so a flick of the wheel still
  // turns it smoothly rather than in steps.
  const ease = (k) => k * k * (3 - 2 * k);
  let want = 0, t = 0, tRaf = 0, tLast = 0, inView = false;
  function target() {
    const r = sec.getBoundingClientRect(), room = r.height - innerHeight;
    const p = room > 0 ? Math.min(1, Math.max(0, -r.top / room)) : 0;
    return ease(Math.min(1, Math.max(0, (p - .3) / .4)));
  }
  function step(now) {
    const dt = Math.min(.1, tLast ? (now - tLast) / 1000 : .016); tLast = now;
    t += (want - t) * (1 - Math.exp(-dt * 9));
    if (Math.abs(want - t) < .001) t = want;
    card.style.setProperty("--t", t.toFixed(4));
    // a film is drawn only while it can be seen at all
    views[0].show(inView);   // the film plays the whole time the card can be seen
    tRaf = t === want ? 0 : requestAnimationFrame(step);
  }
  function place() {
    if (reduced) return;
    want = target();
    if (!tRaf) { tLast = 0; tRaf = requestAnimationFrame(step); }
  }
  addEventListener("scroll", place, { passive: true });
  addEventListener("resize", place);

  // ---- each card's film, as dots ----
  const views = cards.map((card) => {
    const cv = card.querySelector(".duo-media"), video = card.querySelector("video"), g = cv.getContext("2d");
    const src = document.createElement("canvas"), sg = src.getContext("2d", { willReadFrequently: true });
    let cols = 0, rows = 0, img = null, cell = 4, raf = 0, on = false, last = 0;
    function size() {
      const r = { width: card.offsetWidth, height: card.offsetHeight };   // untransformed: the turn scales the films
      cell = r.width < 600 ? 3 : 4;
      cols = Math.ceil(r.width / cell); rows = Math.ceil(r.height / cell);
      src.width = cols; src.height = rows;
      cv.width = cols * cell; cv.height = rows * cell;
      img = g.createImageData(cv.width, cv.height);
    }
    function draw() {
      if (!img || video.readyState < 2) return;
      // cover the card with the frame
      const vw = video.videoWidth, vh = video.videoHeight, s = Math.max(cols / vw, rows / vh), dw = vw * s, dh = vh * s;
      sg.drawImage(video, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
      const d = sg.getImageData(0, 0, cols, rows).data, px = img.data, W = cv.width;
      px.fill(0);
      for (let y = 0; y < rows; y++) {
        const b = (y & 3) * 4;
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255, v = Math.min(1, Math.max(0, (l - .22) * 1.6));   // levelled: darks to nothing, lights to full
          if (v <= BAYER[b + (x & 3)]) continue;
          const c = v > .55 ? LIT : MID, X = x * cell, Y = y * cell, dot = cell - 1;
          for (let j = 0; j < dot; j++) { const row = (Y + j) * W; for (let k = 0; k < dot; k++) { const o = (row + X + k) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255; } }
        }
      }
      g.putImageData(img, 0, 0);
    }
    const loop = (now) => { raf = requestAnimationFrame(loop); if (now - last < 1000 / 24) return; last = now; draw(); };
    return {
      size,
      show(yes) {
        if (yes === on) return; on = yes;
        if (yes) { if (video.preload === "none") video.preload = "auto"; video.play().catch(() => {}); if (reduced) video.addEventListener("loadeddata", draw, { once: true }); else raf = requestAnimationFrame(loop); }
        else { video.pause(); cancelAnimationFrame(raf); }
      },
    };
  });
  views.forEach((v) => v.size());
  addEventListener("resize", () => views.forEach((v) => v.size()));
  // the films are drawn only while the card is on screen (and, moving, only the ones that can be seen on it)
  if (reduced) {
    const io = new IntersectionObserver((es) => es.forEach((e) => views[cards.indexOf(e.target)].show(e.isIntersecting)), { threshold: .05 });
    cards.forEach((c) => io.observe(c));
  } else {
    new IntersectionObserver((es) => { inView = es.some((e) => e.isIntersecting); views[0].show(inView); }, { threshold: .05 }).observe(card);
    t = want = target(); card.style.setProperty("--t", t.toFixed(4));
  }
}
