import { TAU } from "../util.js";

// ---- The paper's grain ---------------------------------------------------
/** Paints the plane (#plane): grain and fibres, a soft light in the middle, a darker rim. */
export function paintGrain(p) {
  const c = document.createElement("canvas"); c.width = c.height = 220;
  const g = c.getContext("2d"), im = g.createImageData(220, 220), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = Math.random(), dark = r < .5;
    const a = dark ? r * 22 : (r - .5) * 26;
    d[i] = d[i + 1] = d[i + 2] = dark ? 60 : 255; d[i + 3] = a;
  }
  g.putImageData(im, 0, 0);
  // A few long fibres, the way pressed paper has them.
  g.lineCap = "round";
  for (let k = 0; k < 26; k++) {
    const x = Math.random() * 220, y = Math.random() * 220, a = Math.random() * TAU, l = 6 + Math.random() * 18;
    g.strokeStyle = Math.random() < .5 ? "rgba(70,62,52,.05)" : "rgba(255,255,255,.12)"; g.lineWidth = .6;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  const GRAIN = c.toDataURL();
  p.style.backgroundImage = `radial-gradient(ellipse at 50% 46%, rgba(255,255,255,.35), rgba(255,255,255,0) 62%), radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(40,34,26,.07) 100%), url(${GRAIN})`;
  p.style.backgroundSize = "100% 100%, 100% 100%, 220px 220px";
}
