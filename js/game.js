// X AND 0, against Blip: the small card by the last key. The visitor is X; Blip is the green 0 and plays well but not
// perfectly (he sometimes misses a block), so he can be beaten. Whoever did not start the last round starts the next.
// Each move lands on the water under the card; a finished round sinks, and the board draws itself again.
import { reduced } from "./util.js";
import { splash } from "./paper/water.js";

const root = document.getElementById("xo");
if (root) {
  const cells = [...root.querySelectorAll(".xo-c")];
  const sayEl = document.getElementById("xoSay"), scoreEl = document.getElementById("xoScore"), win = document.getElementById("xoWin");
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const pick = (l) => l[Math.floor(Math.random() * l.length)];
  const SAY = {
    you: ["Your move.", "Go on.", "Your turn."],
    him: ["Hmm…", "Let me think…", "One moment…"],
    won: ["You win. Well played.", "You got me.", "Nicely done."],
    lost: ["Mine. Again?", "Got you. Another?", "I'll take that one."],
    draw: ["A draw. Again?", "Nobody wins. Again?", "Even. One more?"],
  };
  let b = Array(9).fill(""), turn = "x", starts = "x", over = false, score = [0, 0], timers = [];
  // he greets the visitor by their own time of day
  const hr = new Date().getHours();
  sayEl.textContent = `${hr < 5 ? "Up late?" : hr < 12 ? "Good morning." : hr < 17 ? "Good afternoon." : "Good evening."} A game? You're X.`;
  const later = (ms, fn) => { timers.push(setTimeout(fn, reduced ? Math.min(ms, 60) : ms)); };

  function say(text) {
    if (sayEl.textContent === text) return;
    sayEl.classList.add("swap");
    setTimeout(() => { sayEl.textContent = text; sayEl.classList.remove("swap"); }, 160);
  }
  const winner = () => LINES.find(([a, c, d]) => b[a] && b[a] === b[c] && b[a] === b[d]) || null;
  const free = () => b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  // the square that completes two of `who` in a line, if there is one
  function finish(who) {
    for (const l of LINES) { const v = l.map((i) => b[i]); if (v.filter((x) => x === who).length === 2 && v.includes("")) return l[v.indexOf("")]; }
    return -1;
  }
  function blipMove() {
    let i = finish("o");                                          // win
    if (i < 0 && Math.random() < .82) i = finish("x");            // block, most of the time
    if (i < 0 && !b[4] && Math.random() < .75) i = 4;             // the middle
    if (i < 0) { const corners = [0, 2, 6, 8].filter((c) => !b[c]); if (corners.length && Math.random() < .7) i = pick(corners); }
    if (i < 0) i = pick(free());
    return i;
  }
  function place(i, who) {
    b[i] = who; cells[i].classList.add(who); cells[i].setAttribute("aria-label", `Square ${i + 1}: ${who === "x" ? "X" : "0"}`);
    if (!reduced) { const r = cells[i].getBoundingClientRect(), c = root.getBoundingClientRect(); splash(r.left + r.width / 2, c.bottom + 8, .5, 2.6); }
    const w = winner();
    if (w || !free().length) return end(w, who);
    turn = who === "x" ? "o" : "x";
    if (turn === "o") think(); else { root.classList.add("yours"); say(pick(SAY.you)); }
  }
  function think() {
    root.classList.remove("yours"); root.classList.add("thinking"); say(pick(SAY.him));
    later(520 + Math.random() * 520, () => { root.classList.remove("thinking"); place(blipMove(), "o"); });
  }
  function end(w, who) {
    over = true; root.classList.remove("yours", "thinking"); root.classList.add("over");
    if (w) {
      w.forEach((i) => cells[i].classList.add("hit"));
      const at = (i) => [50 + (i % 3) * 100, 50 + Math.floor(i / 3) * 100], [x1, y1] = at(w[0]), [x2, y2] = at(w[2]);
      const dx = Math.sign(x2 - x1) * 30, dy = Math.sign(y2 - y1) * 30;
      win.setAttribute("x1", x1 - dx); win.setAttribute("y1", y1 - dy); win.setAttribute("x2", x2 + dx); win.setAttribute("y2", y2 + dy);
      win.style.setProperty("--wc", who === "x" ? "#141414" : "#4F7A3A");
      void win.getBoundingClientRect(); win.classList.add("on");
      if (who === "x") { score[0]++; root.classList.add("lost"); say(pick(SAY.won)); } else { score[1]++; root.classList.add("won"); say(pick(SAY.lost)); }
    } else say(pick(SAY.draw));
    scoreEl.textContent = `${score[0]} · ${score[1]}`;
    scoreEl.setAttribute("aria-label", `Score: you ${score[0]}, Blip ${score[1]}`);
    // the round sinks, then a new one
    later(1900, () => {
      cells.forEach((c, i) => c.style.setProperty("--n", String(i)));
      root.classList.add("sink"); win.classList.remove("on");
      if (!reduced) { const c = root.getBoundingClientRect(); [.3, .5, .7].forEach((f, n) => setTimeout(() => splash(c.left + c.width * f, c.bottom + 8, .45, 3), 200 + n * 140)); }
    });
    later(2800, () => { starts = starts === "x" ? "o" : "x"; fresh(); });
  }
  function fresh() {
    b = Array(9).fill(""); over = false; turn = starts;
    root.classList.add("fresh");
    root.classList.remove("sink", "over", "won", "lost");
    cells.forEach((c, i) => { c.classList.remove("x", "o", "hit"); c.setAttribute("aria-label", `Square ${i + 1}`); });
    void root.offsetWidth; root.classList.remove("fresh");        // the grid draws itself in
    if (turn === "o") later(500, think); else { root.classList.add("yours"); if (score[0] + score[1] > 0) say(pick(SAY.you)); }
  }
  cells.forEach((c, i) => c.addEventListener("click", () => {
    if (over || turn !== "x" || b[i]) return;
    root.classList.remove("yours");
    place(i, "x");
  }));
  // the card leans a little towards the pointer
  if (!reduced && matchMedia("(hover: hover)").matches) {
    root.addEventListener("pointermove", (e) => {
      const r = root.getBoundingClientRect();
      root.style.setProperty("--ry", (((e.clientX - r.left) / r.width - .5) * 7).toFixed(2) + "deg");
      root.style.setProperty("--rx", ((.5 - (e.clientY - r.top) / r.height) * 7).toFixed(2) + "deg");
    });
    root.addEventListener("pointerleave", () => { root.style.setProperty("--rx", "0deg"); root.style.setProperty("--ry", "0deg"); });
  }
  // the board draws itself the first time it is seen
  root.classList.add("fresh");
  new IntersectionObserver((es, ob) => { if (es.some((e) => e.isIntersecting)) { ob.disconnect(); fresh(); } }, { threshold: .4 }).observe(root);
}
