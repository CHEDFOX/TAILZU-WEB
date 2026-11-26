// WHAT IT DOES, IN TWO CARDS (#duo). The view is held while it is scrolled through, and the scroll moves its track
// across: the first card comes in from the right and settles in the middle, then the second takes its place. Each card
// plays a short film (media/duo), drawn live as the opening's green dots: every frame is sampled down to a grid and each
// cell is lit or not against a 4x4 ordered threshold, light green where it is bright, on a dark ground. Only the card on
// screen is drawn. With motion reduced the cards stand one above the other, each drawn once.
import { reduced } from "./util.js";

const sec = document.getElementById("duo");
if (sec) {
  const track = sec.querySelector(".duo-track"), cards = [...sec.querySelectorAll(".duo-card")];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
  const LIT = [160, 218, 128], MID = [92, 140, 70];

  // ---- the track, moved by the scroll ----
  const ease = (k) => k * k * (3 - 2 * k);
  function place() {
    if (reduced) return;
    const r = sec.getBoundingClientRect(), room = r.height - innerHeight;
    const p = room > 0 ? Math.min(1, Math.max(0, -r.top / room)) : 0;
    // the track starts a window to the right (its padding); it ends with the last card in the middle
    const last = cards[cards.length - 1], end = last.offsetLeft + last.offsetWidth / 2 - innerWidth / 2;
    // two holds, one per card in the middle, with the travel between: in, hold, across, hold
    const first = cards[0].offsetLeft + cards[0].offsetWidth / 2 - innerWidth / 2;
    const k = p < .38 ? ease(p / .38) * first : p < .55 ? first : p < .9 ? first + ease((p - .55) / .35) * (end - first) : end;
    track.style.setProperty("--x", (-k).toFixed(1) + "px");
  }
  addEventListener("scroll", place, { passive: true });
  addEventListener("resize", place);

  // ---- each card's film, as dots ----
  const views = cards.map((card) => {
    const cv = card.querySelector(".duo-media"), video = card.querySelector("video"), g = cv.getContext("2d");
    const src = document.createElement("canvas"), sg = src.getContext("2d", { willReadFrequently: true });
    let cols = 0, rows = 0, img = null, cell = 4, raf = 0, on = false, last = 0;
    function size() {
      const r = card.getBoundingClientRect();
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
  // a card is drawn only while it is on screen
  const io = new IntersectionObserver((es) => es.forEach((e) => views[cards.indexOf(e.target)].show(e.isIntersecting)), { threshold: .05 });
  cards.forEach((c) => io.observe(c));
  place();
}
