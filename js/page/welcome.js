// The app's first screen, the Bots app's Welcome, as the app's own renderers
// draw it: Blip waving, "Hi, I'm X0.", "Everything here is a bot…" (the phone
// at 390 x 844; the window at 1280 x 800, with its list of first bots). The
// pictures are the render check's (TAILZU-BACKEND scripts/bots-render,
// screen bots.welcome) with the Start button and the "I already have an
// account" link under it painted out: the page moves on without a press.
// On the phone the system's status bar sits over it, and the screen sits
// below the island as a phone's safe area puts it.
const SHOT = {
  phone: { src: "/media/welcome-phone.webp", w: 390, h: 844, top: 16 },
  desk: { src: "/media/welcome-desk.webp", w: 1280, h: 800, top: 0 },
};
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

export function makeWelcome(kind) {
  const S = SHOT[kind], root = el("div", `wl wl-${kind}`), img = el("img", "wl-shot");
  img.src = S.src; img.alt = ""; img.decoding = "async";
  root.appendChild(img);
  let bar = null;
  if (kind === "phone") { bar = statusBar(); root.appendChild(bar); }
  return {
    el: root,
    /** The device's screen is `w` CSS pixels wide: the picture at that width (sharp), the status bar scaled to it. */
    fit(w) {
      const k = w / S.w;
      img.style.width = w + "px"; img.style.height = Math.round(S.h * k) + "px"; img.style.top = (S.top * k).toFixed(2) + "px";
      if (bar) bar.style.transform = `scale(${k.toFixed(4)})`;
    },
  };
}
