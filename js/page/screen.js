// What is inside the phone's and the laptop's glass on step 1: an empty white
// screen, the phone's own status bar over it, and the bots that walk on off
// the page (page/arrivals.js) and wander about on it (page/crowd.js). Nothing
// else — no app screen, no copy. The screen starts empty every time the
// device goes and comes back.
import { makeCrowd } from "./crowd.js";

const PH = 844 / 390;                       // the phone's screen, tall per wide
const DESK = .625;                          // the laptop's, wide per tall
const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

/** The phone's status bar: the time on the left; signal, Wi-Fi and battery on the right. */
function statusBar() {
  const s = el("div", "wl-status"), right = svg("svg", { viewBox: "0 0 78 14", width: "78", height: "14" });
  [[0, 9, 3], [5, 6.5, 5.5], [10, 4, 8], [15, 1.5, 10.5]].forEach(([x, y, h]) => right.appendChild(svg("rect", { x, y, width: "3.2", height: h, rx: "1", fill: "#0A0A0A" })));
  right.appendChild(svg("path", { d: "M30.5 4.6a8.6 8.6 0 0 1 12 0l-1.5 1.6a6.4 6.4 0 0 0-9 0zm2.6 2.8a4.9 4.9 0 0 1 6.8 0l-1.6 1.6a2.6 2.6 0 0 0-3.6 0zm3.4 2.6 1.4 1.5-1.4 1.5-1.4-1.5z", fill: "#0A0A0A" }));
  right.appendChild(svg("rect", { x: "50.5", y: "1.5", width: "23", height: "11", rx: "3.4", fill: "none", stroke: "#0A0A0A", "stroke-opacity": ".4", "stroke-width": "1" }));
  right.appendChild(svg("rect", { x: "52.5", y: "3.5", width: "17", height: "7", rx: "1.8", fill: "#0A0A0A" }));
  right.appendChild(svg("path", { d: "M75 5.2v3.6a1.9 1.9 0 0 0 0-3.6z", fill: "#0A0A0A", "fill-opacity": ".4" }));
  s.append(el("span", "", "9:41"), right);
  return s;
}

export function makeScreen(kind) {
  const root = el("div", `wl wl-${kind}`), crowd = makeCrowd(kind);
  root.appendChild(crowd.el);
  let bar = null;
  if (kind === "phone") { bar = statusBar(); root.appendChild(bar); }
  return {
    el: root,
    crowd,
    /** The glass is `w` CSS pixels wide; how tall follows from which device it is. */
    size: (w) => ({ w, h: kind === "phone" ? w * PH : Math.round(w * DESK) }),
    /** The device's screen is `w` CSS pixels wide: the bots' floor, and the status bar, scaled to it. */
    fit(w) {
      crowd.fit(w, this.size(w).h);
      if (bar) bar.style.transform = `scale(${(w / 390).toFixed(4)})`;
    },
    leave: () => crowd.leave(),
    step(dt) { crowd.step(dt); if (crowd.due()) crowd.draw(); },
  };
}
