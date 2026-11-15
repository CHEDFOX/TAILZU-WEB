// What the devices show once the bots have gone: one beat each, built as DOM
// over the white screen (text, so it stays crisp at whatever size the device
// is) at a fixed design width, scaled to the glass like the phone's status bar.
//
//   the laptop   a terminal: Xode installed on a project, the real install
//                line and the real words install.sh prints, then `xode` run in
//                the project's folder and its prompt waiting
//   the phone    the "Bots at work" Live Activity, done: Ready to ship, and
//                under it what it was — codes while you rest
//
// Each arrives (the terminal types itself, the card drops in and its stages
// fill), then FREEZES: finished, holding, nothing moving but the cursor. The
// page asks for a beat (`show`), is told when it has finished arriving
// (`done`), and clears it again (`hide`). Under reduced motion a beat is
// simply there, finished, on the frame it is asked for.
import { clamp, reduced } from "../util.js";

const DW = { desk: 1280, phone: 390 };          // the design width each is drawn at
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

// ---- The laptop's terminal ----------------------------------------------------
// `at` is where it is run, `type` is typed a character at a time; `out` is what
// comes back, a line at a time. The words are install.sh's own.
const TERM = [
  { at: "~/apollo", type: "curl -fsSL https://x0bot.com/install.sh | bash", wait: .35 },
  { out: "Installing xode…", wait: .5 },
  { out: "added 1 package in 4s", wait: 1.1, dim: true },
  { out: "Done. In your project's folder, run:", wait: .45 },
  { out: "  xode", wait: .1, lit: true },
  { at: "~/apollo", type: "xode", wait: .5 },
  { prompt: true, wait: .4 },
];
const TYPE = 26;                                 // characters a second

function terminal() {
  const root = el("div", "tm"), bar = el("div", "tm-bar"), body = el("div", "tm-body");
  for (const c of ["a", "b", "c"]) bar.appendChild(el("i", "tm-d tm-" + c));
  bar.appendChild(el("span", "tm-t", "apollo — xode"));
  root.append(bar, body);
  const rows = TERM.map((s) => {
    const row = el("div", "tm-r" + (s.dim ? " tm-dim" : s.lit ? " tm-lit" : ""));
    if (s.at) { row.appendChild(el("span", "tm-at", s.at)); row.appendChild(el("span", "tm-sh", "$")); row.appendChild(el("span", "tm-in", "")); }
    else if (s.prompt) { row.appendChild(el("span", "tm-ps", "›")); row.appendChild(el("b", "tm-cur", "")); }
    else row.appendChild(el("span", "tm-ou", s.out));
    body.appendChild(row);
    return row;
  });
  let i = 0, t = 0, chars = 0;
  const put = (n) => { rows[n].style.display = "block"; };
  return {
    el: root,
    reset() {
      i = 0; t = 0; chars = 0;
      rows.forEach((r, n) => { r.style.display = "none"; if (TERM[n].at) r.lastChild.textContent = ""; });
    },
    finish() {
      i = TERM.length;
      rows.forEach((r, n) => { r.style.display = "block"; if (TERM[n].at) r.lastChild.textContent = TERM[n].type; });
    },
    done: () => i >= TERM.length,
    step(dt) {
      if (i >= TERM.length) return;
      const s = TERM[i];
      t += dt;
      if (t < s.wait) return;
      put(i);
      if (s.type) {
        chars += dt * TYPE;
        const n = Math.min(s.type.length, Math.floor(chars));
        rows[i].lastChild.textContent = s.type.slice(0, n);
        if (n < s.type.length) return;
      }
      i++; t = 0; chars = 0;
    },
  };
}

// ---- The phone's Live Activity -------------------------------------------------
const STAGES = ["Plan", "Code", "Test", "Ship"];

function activity() {
  const root = el("div", "la"), card = el("div", "la-card");
  const head = el("div", "la-head"), mark = el("i", "la-mark");
  head.append(mark, el("span", "la-who", "Xode"), el("span", "la-when", "now"));
  const bar = el("div", "la-bar"), fill = el("i", "la-fill");
  bar.appendChild(fill);
  const steps = el("div", "la-steps"), tags = STAGES.map((s) => el("span", "", s));
  for (const t of tags) steps.appendChild(t);
  card.append(head, el("div", "la-big", "Ready to ship"), el("div", "la-sub", "Codes while you rest"), bar, steps, el("div", "la-foot", "Pull request #128 · 6 min"));
  root.appendChild(card);
  let t = 0;
  const paint = () => {
    // It drops in, then the stages fill behind it.
    const inK = reduced ? 1 : clamp(t / .42), fillK = reduced ? 1 : clamp((t - .3) / .8);
    card.style.transform = `translateY(${((1 - inK) * -34).toFixed(2)}px) scale(${(.96 + .04 * inK).toFixed(4)})`;
    card.style.opacity = inK.toFixed(3);
    fill.style.width = (fillK * 100).toFixed(1) + "%";
    // Each stage lights as the bar reaches it; the last one, Ship, is green.
    tags.forEach((e, i) => {
      const k = clamp((fillK - i / STAGES.length) * STAGES.length);
      e.style.color = i === STAGES.length - 1 && k > .9 ? "#5FD13C" : `rgba(243,226,198,${(.35 + .5 * k).toFixed(3)})`;
    });
  };
  return {
    el: root,
    reset() { t = 0; paint(); },
    finish() { t = 9; paint(); },
    done: () => t >= 1.25,
    step(dt) { if (t < 1.4) { t += dt; paint(); } },
  };
}

/** The beat this device shows. `kind` is "phone" or "desk". */
export function makeContent(kind) {
  const beat = kind === "phone" ? activity() : terminal();
  const root = el("div", "ct ct-" + kind);
  root.appendChild(beat.el);
  root.style.display = "none";
  let state = "off", fade = 0;
  beat.reset();
  return {
    el: root,
    /** The glass is `w` CSS pixels wide: the beat is drawn at its design width and scaled to it. */
    fit(w) { root.style.transform = `scale(${(w / DW[kind]).toFixed(5)})`; },
    /** It arrives — or, `now`, is simply there, finished (a resize, or coming back to it). */
    show(now) {
      root.style.display = "block"; root.style.opacity = "1";
      if (state === "on" && !now) return;
      state = "on"; fade = 0;
      if (now || reduced) beat.finish(); else beat.reset();
    },
    /** It goes, and the screen is blank white again. */
    hide() {
      if (state === "off") return;
      state = reduced ? "off" : "out"; fade = 0;
      if (state === "off") { root.style.display = "none"; beat.reset(); }
    },
    /** Off this instant, mid-fade or not (the device itself has gone). */
    clear() { state = "off"; fade = 0; root.style.display = "none"; root.style.opacity = "1"; beat.reset(); },
    shown: () => state !== "off",
    /** Arrived and holding: the freeze. */
    done: () => state === "on" && beat.done(),
    step(dt) {
      if (state === "on") beat.step(dt);
      else if (state === "out") {
        fade += dt;
        root.style.opacity = (1 - clamp(fade / .3)).toFixed(3);
        if (fade >= .3) { state = "off"; root.style.display = "none"; root.style.opacity = "1"; beat.reset(); }
      }
    },
  };
}
