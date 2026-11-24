// The page's own words on the field turn with it. The field (stage.js, the dark half) is light across the upper left
// and dark across the lower right, and its edge travels; so every word laid straight on it is its own span, and each
// is set dark on the light and light on the dark by the field under its middle, as the edge passes. A word on the
// edge itself, where the field is a middle grey, keeps what it was until it is clearly on one side (either reads on
// a middle grey; a difference blend there would be grey on grey). The colours are in site.css, under .tw.
import { fieldDark } from "./stage.js";

// what is laid straight on the field: words split into spans, and a few things that turn as one
const WORDS = ["main h2", ".hand .hw", ".roam-l", ".band > p", ".two p", ".plans .lede", ".plats a", ".proof > span", ".made"];
const UNITS = [".hand .arrow", ".stage .tab"];
const onCard = (el) => el.closest("[data-noglitch], .card, .work");

const items = [];
function split(el) {
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts = [];
  for (let n; (n = walk.nextNode());) if (n.nodeValue.trim() && !n.parentElement.closest(".tw")) texts.push(n);
  texts.forEach((n) => {
    const frag = document.createDocumentFragment();
    n.nodeValue.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.append(part); return; }
      const w = document.createElement("span");
      w.className = "tw"; w.textContent = part;
      frag.append(w); items.push({ el: w, x: 0, y: 0, on: false, dk: false });
    });
    n.replaceWith(frag);
  });
}
document.querySelectorAll(WORDS.join(",")).forEach((el) => { if (!onCard(el)) split(el); });
document.querySelectorAll(UNITS.join(",")).forEach((el) => {
  if (onCard(el) && !el.closest(".stage")) return;
  el.classList.add("tw"); items.push({ el, x: 0, y: 0, on: false, dk: false });
});

// where each is on the page (its middle), kept, and taken again as the layout may have moved
function measure() {
  const sy = scrollY;
  for (const it of items) {
    const r = it.el.getBoundingClientRect();
    it.on = r.width > 0 && r.height > 0;
    it.x = r.left + r.width / 2; it.y = r.top + r.height / 2 + sy;
  }
}
let rz = 0;
addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(measure, 150); });
if (document.fonts?.ready) document.fonts.ready.then(measure);
addEventListener("load", measure);
setInterval(measure, 1500);
measure();

// every few frames: the ones on screen, by the field under them, with a little give either side of the middle
let n = 0;
(function turn() {
  requestAnimationFrame(turn);
  if (n++ % 3) return;
  const sy = scrollY, vh = innerHeight;
  for (const it of items) {
    if (!it.on) continue;
    const y = it.y - sy;
    if (y < -80 || y > vh + 80) continue;
    const d = fieldDark(it.x, y);
    if (!it.dk && d > .56) { it.dk = true; it.el.classList.add("dk"); }
    else if (it.dk && d < .44) { it.dk = false; it.el.classList.remove("dk"); }
  }
})();
