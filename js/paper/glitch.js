import { reduced } from "../util.js";
import { glitchPlane } from "./words.js";

/* =====================================================================
   THE GLITCH (as on tailzu.space today). The word under the cursor
   flickers into ones and zeros and resolves back, left to right, in half
   a second: one word at a time, so a sweep across a sentence leaves a
   trail. All the text on the page, the plane's tiny words included. A
   pointer drives it by hovering, a finger by touching and dragging.
   Never under reduced motion.
   ================================================================== */
const GLITCH_AT = "h1,h2,h3,p,li,a,button,span,b,i,em,strong,label";
const glitchOn = new WeakMap();
// The word under a point: the text node and the run of non-space
// characters around the caret the browser puts there.
function wordAt(x, y) {
  let node, off;
  if (document.caretPositionFromPoint) { const c = document.caretPositionFromPoint(x, y); if (!c) return null; node = c.offsetNode; off = c.offset; }
  else if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); if (!r) return null; node = r.startContainer; off = r.startOffset; }
  else return null;
  if (!node || node.nodeType !== 3) return null;
  const pe = node.parentElement;
  if (!pe || pe.classList.contains("glb") || pe.closest("svg, script, style")) return null;
  const elm = pe.closest(GLITCH_AT); if (!elm) return null;
  const t = node.nodeValue;
  if (!/\S/.test(t.charAt(off))) { if (off > 0 && /\S/.test(t.charAt(off - 1))) off--; else return null; }
  let a = off, b = off;
  while (a > 0 && /\S/.test(t.charAt(a - 1))) a--;
  while (b < t.length && /\S/.test(t.charAt(b))) b++;
  const rg = document.createRange(); rg.setStart(node, a); rg.setEnd(node, b);
  const box = rg.getBoundingClientRect();
  if (x < box.left - 2 || x > box.right + 2 || y < box.top - 2 || y > box.bottom + 2) return null;
  return { node, a, b, elm };
}
// The line never moves: the word goes into a box of its own width, the
// digits are drawn inside it, then it goes back as text.
function glitchWord(w) {
  const elm = w.elm, nd = w.node, tok = nd.nodeValue.slice(w.a, w.b);
  if (!tok) return;
  nd.splitText(w.b);
  const mid = nd.splitText(w.a);
  const box = document.createElement("span"); box.className = "glb"; box.textContent = tok;
  mid.parentNode.replaceChild(box, mid);
  box.style.width = box.getBoundingClientRect().width.toFixed(2) + "px";
  box.classList.add("held");
  glitchOn.set(elm, (glitchOn.get(elm) || 0) + 1);
  const chars = Array.from(tok), dur = Math.min(720, 240 + chars.length * 44);
  let t0 = 0, lastFlip = 0, rnd = [];
  const flip = () => { rnd = chars.map(() => (Math.random() < .5 ? "0" : "1")); };
  flip();
  function undo() {
    const host = box.parentNode;
    if (host) { host.replaceChild(document.createTextNode(tok), box); host.normalize(); }
    const n = (glitchOn.get(elm) || 1) - 1;
    if (n > 0) glitchOn.set(elm, n); else glitchOn.delete(elm);
  }
  (function step(now) {
    if (!t0) t0 = now;
    const k = Math.min(1, (now - t0) / dur);
    if (now - lastFlip > 46) { flip(); lastFlip = now; }
    const front = Math.min(chars.length, Math.floor(chars.length * k * 1.12));
    box.textContent = chars.slice(0, front).join("") + rnd.slice(front).join("");
    if (k < 1) requestAnimationFrame(step); else undo();
  })(performance.now());
}
export function initGlitch() {
  if (reduced) return;
  let moveRaf = 0, mx = 0, my = 0;
  // One word per frame, wherever the point is by then: the page's text
  // first, the plane's tiny words where no page text is over them.
  const aim = (x, y) => {
    mx = x; my = y;
    if (moveRaf) return;
    moveRaf = requestAnimationFrame(() => {
      moveRaf = 0;
      const w = wordAt(mx, my);
      if (w) return glitchWord(w);
      const top = document.elementFromPoint(mx, my);
      if (!top || top.id === "words" || top.id === "bot" || top.id === "plane" || top.id === "hero" || top === document.body || top === document.documentElement) glitchPlane(mx, my);
    });
  };
  document.addEventListener("mousemove", (e) => aim(e.clientX, e.clientY), { passive: true });
  const touch = (e) => { const t = e.touches && e.touches[0]; if (t) aim(t.clientX, t.clientY); };
  document.addEventListener("touchstart", touch, { passive: true });
  document.addEventListener("touchmove", touch, { passive: true });
}
