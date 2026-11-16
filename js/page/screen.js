// What is inside the phone's and the laptop's glass: an empty white screen,
// the phone's own status bar over it, and then, in turn,
//
//   the bots that walk on off the page (page/arrivals.js) and wander about on
//   it (page/crowd.js), until they settle and pour away; and
//   the device's own beat (page/content.js) — the laptop's terminal, the
//   phone's Live Activity — which arrives on the blank screen and freezes.
//
// Nothing is there to begin with and nothing is left between the two: the
// screen starts empty every time the device goes and comes back.
import { makeCrowd } from "./crowd.js";
import { makeContent } from "./content.js";

const PH = 844 / 390;                       // the phone's screen, tall per wide
const DESK = .625;                          // the laptop's, wide per tall
const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

/**
 * The phone's status bar: the time on the left; signal, Wi-Fi and battery on
 * the right. Over the wallpaper it is white, as it is on a real one, and it
 * reads the visitor's own clock.
 */
function statusBar() {
  const s = el("div", "wl-status"), right = svg("svg", { viewBox: "0 0 78 14", width: "78", height: "14" });
  [[0, 9, 3], [5, 6.5, 5.5], [10, 4, 8], [15, 1.5, 10.5]].forEach(([x, y, h]) => right.appendChild(svg("rect", { x, y, width: "3.2", height: h, rx: "1", fill: "currentColor" })));
  right.appendChild(svg("path", { d: "M30.5 4.6a8.6 8.6 0 0 1 12 0l-1.5 1.6a6.4 6.4 0 0 0-9 0zm2.6 2.8a4.9 4.9 0 0 1 6.8 0l-1.6 1.6a2.6 2.6 0 0 0-3.6 0zm3.4 2.6 1.4 1.5-1.4 1.5-1.4-1.5z", fill: "currentColor" }));
  right.appendChild(svg("rect", { x: "50.5", y: "1.5", width: "23", height: "11", rx: "3.4", fill: "none", stroke: "currentColor", "stroke-opacity": ".45", "stroke-width": "1" }));
  right.appendChild(svg("rect", { x: "52.5", y: "3.5", width: "17", height: "7", rx: "1.8", fill: "currentColor" }));
  right.appendChild(svg("path", { d: "M75 5.2v3.6a1.9 1.9 0 0 0 0-3.6z", fill: "currentColor", "fill-opacity": ".45" }));
  const t = el("span", "wl-now", "");
  s.append(t, right);
  return { el: s, time: t };
}

/** The lock screen under it all: the date and the big clock, and the bar at the foot. */
function lockFace() {
  const root = el("div", "wl-lock"), date = el("div", "wl-date", ""), time = el("div", "wl-time", "");
  root.append(date, time);
  return { el: root, date, time };
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** The visitor's own clock, the way a phone shows it. */
function clockNow() {
  const d = new Date(), h = d.getHours(), m = d.getMinutes();
  return { hm: `${h % 12 === 0 ? 12 : h % 12}:${m < 10 ? "0" + m : m}`, day: `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}` };
}

export function makeScreen(kind) {
  const root = el("div", `wl wl-${kind}`), crowd = makeCrowd(kind), content = makeContent(kind);
  let bar = null, lock = null, home = null, tick = 0;
  if (kind === "phone") {
    // The wallpaper is the screen's own background (css/screens.css); over it
    // the lock screen, then whatever the page is showing, then the status bar.
    lock = lockFace(); root.appendChild(lock.el);
  }
  root.append(crowd.el, content.el);
  if (kind === "phone") {
    bar = statusBar(); home = el("i", "wl-home");
    root.append(bar.el, home);
  }
  /** The clock, on the frame it is first shown and every half minute after. */
  function setClock() { if (!bar) return; const n = clockNow(); bar.time.textContent = n.hm; lock.time.textContent = n.hm; lock.date.textContent = n.day; }
  setClock();
  return {
    el: root,
    crowd,
    content,
    /** The glass is `w` CSS pixels wide; how tall follows from which device it is. */
    size: (w) => ({ w, h: kind === "phone" ? w * PH : Math.round(w * DESK) }),
    /** The device's screen is `w` CSS pixels wide: the bots' floor, and the status bar, scaled to it. */
    fit(w) {
      crowd.fit(w, this.size(w).h);
      content.fit(w);
      if (bar) { const k = `scale(${(w / 390).toFixed(4)})`; bar.el.style.transform = k; lock.el.style.transform = k; home.style.transform = k; }
    },
    leave() { crowd.leave(); content.clear(); },
    step(dt) {
      crowd.step(dt);
      if (crowd.due()) crowd.draw();
      content.step(dt);
      if (bar) { tick += dt; if (tick > 30) { tick = 0; setClock(); } }
    },
  };
}
