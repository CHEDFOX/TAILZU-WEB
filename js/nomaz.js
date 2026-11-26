// THE NOMAZ VIEW (#roam). Nomaz is X0 Bot's travel bot. The view is three windows tall and its contents stay in place
// while it is scrolled through; how far in the page is becomes a step on the section (data-step): 0 the intro alone in
// the middle of the box, then each stop of the route in turn (css/site.css THE NOMAZ BOX does the showing).
//
// Nomaz itself, drawn by the desktop app's renderer (js/blip/blip.js, as the mini is) in its app colour, blue, with its
// paper plane, walks the route: it says hello beside the intro, hops down to each stop as it comes and does it (plans,
// works, cheers), and at the last, "just promise me company", throws the plane out of the box into the film. With
// motion reduced the view is not held: every stop shows, and Nomaz stands at the last with the plane.
import { reduced } from "./util.js";
import { blip } from "./blip/kit.js";

const sec = document.getElementById("roam");
const box = sec && sec.querySelector(".nomaz");
if (sec && box) {
  const head = box.querySelector(".nz-head"), name = box.querySelector(".nz-name");
  const stops = [...box.querySelectorAll(".nz-trip li")];
  const canvas = box.querySelector(".nz-bot");
  let step = -1, bot = null;

  // the intro stands in the middle of the box until the first stop (offsets: layout, not the drift itself)
  function measure() {
    const drop = (box.clientHeight - head.offsetHeight) / 2 - head.offsetTop;
    box.style.setProperty("--drop", Math.max(0, Math.round(drop)) + "px");
    if (bot) bot.size();
  }
  function progress() {
    const r = sec.getBoundingClientRect(), room = r.height - innerHeight;
    return room > 0 ? Math.min(1, Math.max(0, -r.top / room)) : 1;
  }
  function update() {
    const p = reduced ? 1 : progress();
    const s = p < .14 ? 0 : p < .38 ? 1 : p < .62 ? 2 : 3;
    if (s === step) return;
    step = s; sec.dataset.step = String(s);
    if (bot) bot.go(s);
  }

  // ---- Nomaz ----
  const B = blip();
  if (B && canvas) bot = (() => {
    const g = canvas.getContext("2d");
    const blue = "#3C688A", pale = "#D9E6EF", ink = "#16140F";
    let dpr = 1, W = 0, H = 0;
    const me = B.createPerformer({ dpr: Math.min(2, devicePixelRatio || 1), dot: pale, sticker: blue, glow: "#6FA352" });
    me.play("rest");
    const s = { x: 0, y: 0, from: null, t0: 0, T: 700, at: -1, dir: 1, plane: "hand", p0: 0, seen: false };
    function size() {
      dpr = Math.min(2, devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }
    const h = () => Math.max(46, Math.min(104, box.clientWidth * .14));
    // where it stands for a step, in the canvas's pixels: beside the name, then at the right of each stop, level with
    // its title (on the route out to the film, at the second)
    function spot(k) {
      const c = canvas.getBoundingClientRect(), pad = parseFloat(getComputedStyle(box).paddingRight) || 24;
      const right = box.clientWidth - pad - h() * .45;
      if (k === 0) {
        const n = name.getBoundingClientRect();
        return [Math.min(right, n.right - c.left + h() * .7), n.bottom - c.top - h() * .08];
      }
      // on a narrow box the titles run nearly to its edge: it stands on the short "when" line above each instead
      if (box.clientWidth < 440) return [right, stops[k - 1].querySelector(".nz-when").getBoundingClientRect().bottom - c.top];
      const t = stops[k - 1].querySelector("b").getBoundingClientRect();
      return [right, k === 2 ? t.top - c.top + t.height / 2 + 2 : t.bottom - c.top];
    }
    const ARRIVE = ["look", "plan", "work", "done"];
    function go(k) {
      if (!s.seen) { s.at = k; return; }
      s.from = [s.x, s.y]; s.t0 = performance.now(); s.at = k;
      me.play("travel");
      if (s.plane !== "hand") { s.plane = "hand"; }
    }
    // the paper plane: in its hand, or flying out to the film
    function plane(x, y, sz, rot) {
      g.save(); g.translate(x, y); g.rotate(rot);
      g.fillStyle = "#FCFBF8"; g.strokeStyle = blue; g.lineWidth = 1.6; g.lineJoin = "round";
      g.beginPath(); g.moveTo(sz, 0); g.lineTo(-sz * .8, -sz * .55); g.lineTo(-sz * .35, 0); g.lineTo(-sz * .8, sz * .5); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(sz, 0); g.lineTo(-sz * .35, 0); g.stroke();
      g.restore();
    }
    function frame(now) {
      if (!s.seen) return;
      raf = requestAnimationFrame(frame);
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      const hh = h(), [tx, ty] = spot(s.at);
      let x = tx, y = ty, hop = 0;
      if (s.from) {
        const k = Math.min(1, (now - s.t0) / s.T), e = k * k * (3 - 2 * k);
        x = s.from[0] + (tx - s.from[0]) * e; y = s.from[1] + (ty - s.from[1]) * e;
        hop = Math.sin(Math.PI * k) * hh * .55;
        if (Math.abs(tx - s.from[0]) > 2) s.dir = tx > s.from[0] ? 1 : -1;
        if (k >= 1) {
          s.from = null; s.dir = 1;
          me.play(ARRIVE[s.at], { then: "rest", again: true });
          if (s.at === 3 && !reduced) { s.plane = "fly"; s.p0 = now + 900; }
        }
      }
      s.x = x; s.y = y;
      g.save(); g.translate(x, y - hop); g.scale(s.dir, 1); me.draw(g, 0, 0, hh, now); g.restore();
      // the plane: held at its hand (it faces right); thrown, it rises and goes out to the film's edge
      const hx = x + hh * .34 * s.dir, hy = y - hop - hh * .5, sz = hh * .2;
      if (s.plane === "hand" || (s.plane === "fly" && now < s.p0)) plane(hx, hy, sz, -.25);
      else if (s.plane === "fly") {
        const k = Math.min(1, (now - s.p0) / 1500), e = 1 - Math.pow(1 - k, 2);
        const ex = W + sz, ey = hy - hh * 1.2;
        const px = hx + (ex - hx) * e, py = hy + (ey - hy) * e - Math.sin(Math.PI * k) * hh * .8;
        g.globalAlpha = k < .85 ? 1 : (1 - k) / .15;
        plane(px, py, sz, -.25 - Math.cos(Math.PI * k) * .2);
        g.globalAlpha = 1;
        if (k >= 1) { s.plane = "gone"; me.play("celebrate", { then: "rest", again: true }); }
      }
    }
    let raf = 0;
    function start() {
      if (s.seen) return;
      s.seen = true; size();
      const [x, y] = spot(s.at < 0 ? 0 : s.at); s.x = x; s.y = y;
      if (reduced) { s.at = 3; s.plane = "hand"; me.play("rest"); }
      raf = requestAnimationFrame(frame);
    }
    function stop() { s.seen = false; cancelAnimationFrame(raf); }
    return { size, go, start, stop };
  })();

  // drawn only while the view is on screen
  new IntersectionObserver((es) => {
    if (!bot) return;
    if (es.some((e) => e.isIntersecting)) bot.start(); else bot.stop();
  }, { threshold: .2 }).observe(sec.querySelector(".roam-pin") || sec);

  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", () => { measure(); update(); });
  measure(); update();
  document.fonts?.ready.then(measure);
}
