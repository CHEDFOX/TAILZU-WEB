/* demo/drive.js: the Ask preview's driver, ported from the visuals page's
 * post.js (scratchpad/visuals) for the home page's frame. It plays what the
 * desktop app's main process and ask.js would: it is window.tailzuGuide to
 * guide.js (so it loads before it), it tells the pill in its frame what
 * main.js would, and it runs three of the scripted asks over the stand-in
 * Chat app: picture ("Explain this triangle"), export ("Where's export?")
 * and send ("Tell #design the mockups are ready").
 *
 * The home page asks with postMessage({ run, calm }) and hears { done: run }
 * back. Messages from this origin only. No style attributes (the /demo CSP):
 * the visuals page's inline styles are classes in ask.css. No voice: nothing
 * on the home page makes a sound until it is asked to.
 */
(function () {
  "use strict";
  // ---- the bridge guide.js reads at load (pre.js) ----
  const G = window.__guide = { listener: null, pending: null, permitting: null, onDismiss: null };
  window.tailzuGuide = {
    onGuide(cb) { G.listener = cb; },
    mouse() {},
    confirm(yes) { const p = G.pending; G.pending = null; if (p) p(!!yes); },
    permit(choice) { const p = G.permitting; G.permitting = null; if (p) p(String(choice || "no")); },
    spoken() {},
    dismiss() { if (G.onDismiss) G.onDismiss(); },
  };

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const box = (id) => { const r = $(id).getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; };
  const at = (id) => { const r = $(id).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  let calm = /[?&]calm=1(&|$)/.test(location.search);

  // ---- the pill: pill.js in its frame, told what main.js would tell it ----
  function pill(m) { const f = $("pillframe"); try { f.contentWindow.postMessage({ pill: Object.assign({ hint: "Tap Ctrl twice to talk", rest: true }, m) }, location.origin); } catch (e) { /* none */ } }
  function capsule() { const r = $("pillframe").getBoundingClientRect(); return { x: r.left + r.width / 2 - 20, y: r.bottom - 14 - 16, w: 40, h: 16 }; }
  let phase = null, closing = null;
  function pillPhase(p) { clearTimeout(closing); closing = null; if (phase === p) return; phase = p; pill({ state: "ask", phase: p }); }
  function pillClose() {
    if (!phase) return;
    phase = null; pill({ state: "ask", phase: "closing" });
    clearTimeout(closing); closing = setTimeout(() => { closing = null; if (!phase) pill({ state: "rest" }); }, 700);
  }
  const raw = (m) => { if (G.listener) G.listener(m); };
  const PHASE = { listening: "listening", thinking: "thinking" };
  function send(m) {
    if (m.type === "show") { raw({ type: "dock", pill: capsule() }); pillPhase(PHASE[m.state] || "showing"); }
    else if (m.type === "state") pillPhase(PHASE[m.state] || "showing");
    else if ((m.type === "say" || (m.type === "point" && !m.tentative) || m.type === "confirm" || m.type === "permission") && phase) pillPhase("showing");
    else if (m.type === "hide") pillClose();
    raw(m);
  }
  let markId = 0;
  const draw = (d) => send(Object.assign({ type: "draw", id: "d" + (++markId) }, d));

  // ---- the stand-in app ----
  const PEOPLE = { Priya: "p-priya", Anthony: "p-anthony", Meera: "p-meera", You: "p-you" };
  const THREADS = {
    general: [["Anthony", "9:12 AM", "Standup moved to 10:15 today."], ["Meera", "9:24 AM", "My kid's homework, anyone?", "pic"]],
    design: [["Priya", "11:02 AM", "Round two of the mockups is in the deck. Ready for a look?"], ["Anthony", "11:05 AM", "Will check after the call."]],
    launch: [["Meera", "Yesterday", "Press kit is final."]],
  };
  let chan = "general";
  function paint() {
    const t = $("thread"); t.textContent = "";
    for (const [who, when, text, pic] of THREADS[chan]) {
      const m = document.createElement("div"); m.className = "msg";
      const av = document.createElement("div"); av.className = "av " + (PEOPLE[who] || ""); av.textContent = who[0];
      const col = document.createElement("div");
      const w = document.createElement("div"); w.className = "who"; w.textContent = who;
      const sm = document.createElement("small"); sm.textContent = when; w.appendChild(sm);
      const p = document.createElement("p"); p.textContent = text;
      col.appendChild(w); col.appendChild(p);
      if (pic) col.appendChild(homework());
      m.appendChild(av); m.appendChild(col); t.appendChild(m);
    }
    for (const c of ["general", "design", "launch"]) $("m-" + c).classList.toggle("on", c === chan);
    $("m-chan").textContent = "# " + chan;
    $("m-topic").textContent = chan === "design" ? "Mockups, type, the deck" : chan === "launch" ? "Q3 launch" : "Company-wide notes";
    setField("");
  }
  // A photo of a worksheet: a right triangle and its equation, drawn, not text.
  const PIC_W = 520, PIC_H = 250;
  function homework() {
    const c = document.createElement("canvas");
    c.id = "m-pic"; c.width = PIC_W; c.height = PIC_H;
    const g = c.getContext("2d");
    g.fillStyle = "#FBF7EE"; g.fillRect(0, 0, PIC_W, PIC_H);
    g.strokeStyle = "rgba(60,90,160,.18)"; g.lineWidth = 2;
    for (let y = 30; y < PIC_H; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(PIC_W, y); g.stroke(); }
    g.strokeStyle = "#2A2F45"; g.lineWidth = 4; g.lineJoin = "round";
    g.beginPath(); g.moveTo(60, 200); g.lineTo(60, 60); g.lineTo(250, 200); g.closePath(); g.stroke();
    g.lineWidth = 3; g.strokeRect(60, 178, 22, 22);
    g.fillStyle = "#2A2F45"; g.font = "italic 30px Georgia, serif";
    g.fillText("3", 30, 140); g.fillText("4", 145, 236); g.fillText("c", 168, 118);
    g.font = "italic 34px Georgia, serif"; g.fillText("a² + b² = c²", 290, 110);
    g.fillText("c = ?", 330, 170);
    return c;
  }
  function pic() {
    const r = $("m-pic").getBoundingClientRect(), sx = r.width / PIC_W, sy = r.height / PIC_H;
    return { pt: (x, y) => [r.left + x * sx, r.top + y * sy], fr: (x, y, w, h) => [r.left + x * sx, r.top + y * sy, w * sx, h * sy] };
  }
  function triangle() {
    const P = pic();
    return [
      ["It's the Pythagorean theorem: in a right triangle, a² + b² = c².", [
        { kind: "underline", frame: P.fr(288, 80, 206, 40) },
        { kind: "circle", frame: P.fr(56, 174, 30, 30), text: "90°" }]],
      ["The two short sides are 3 and 4, so 3² + 4² = 9 + 16 = 25.", [
        { kind: "number", at: P.pt(60, 96), n: 1 },
        { kind: "number", at: P.pt(155, 200), n: 2 }]],
      ["c is the long side, across from the right angle, so c = √25 = 5.", [
        { kind: "highlight", frame: P.fr(326, 140, 92, 40) },
        { kind: "arrow", from: P.pt(318, 30), to: P.pt(180, 134), text: "c, what we want" }]],
    ];
  }
  function setField(text, typing) {
    const f = $("m-field");
    f.classList.toggle("typed", !!text);
    f.textContent = text || "Message #" + chan;
    if (typing) { const c = document.createElement("span"); c.className = "caret"; f.appendChild(c); }
  }

  // ---- runs ----
  let run = 0;
  const alive = (r) => r === run;
  G.onDismiss = () => { run++; send({ type: "hush" }); send({ type: "hide" }); stopLevel(); };
  let levelTimer = null;
  function startLevel() { stopLevel(); let t = 0; levelTimer = setInterval(() => { t += .09; send({ type: "level", v: Math.max(0, .25 + .55 * Math.abs(Math.sin(t * 3.1)) * (.6 + .4 * Math.sin(t * 7.3))) }); }, 90); }
  function stopLevel() { clearInterval(levelTimer); levelTimer = null; send({ type: "level", v: 0 }); }
  const say = (text) => send({ type: "say", text });
  const confirm = (text, risk) => new Promise((resolve) => { G.pending = resolve; send({ type: "confirm", text, risk }); });
  // The picture card waits for the visitor; a preview nobody touches goes on, once.
  const permission = (app) => new Promise((resolve) => {
    G.permitting = resolve; send({ type: "permission", app, text: "To answer that I need to see it." });
    setTimeout(() => { if (G.permitting === resolve) { G.permitting = null; resolve("once"); } }, 2600);
  });
  async function begin(r, app, heard, anchorId) {
    send({ type: "hush" });
    send({ type: "show", state: "listening", app, anchor: at(anchorId || "m-field"), key: "Alt" });
    startLevel();
    await sleep(1700); if (!alive(r)) return false;
    stopLevel();
    send({ type: "heard", text: heard });
    send({ type: "state", state: "thinking" });
    await sleep(1000);
    return alive(r);
  }
  async function done(r, text, ms) {
    send({ type: "state", state: "done" });
    if (text) say(text);
    await sleep(ms || 6000); if (alive(r)) send({ type: "hide" });
  }
  async function stream(r, lines, gap) {
    for (let i = 0; i < lines.length; i++) {
      if (!alive(r)) return false;
      const [text, marks] = lines[i];
      send(i ? { type: "say", text, append: true } : { type: "say", text });
      for (const d of marks || []) draw(d);
      await sleep(i === lines.length - 1 ? 300 : gap);
    }
    return alive(r);
  }
  const RUNS = {
    async export(r) {
      send({ type: "hush" });
      send({ type: "show", state: "listening", app: "Chat", anchor: at("m-search"), key: "Alt" });
      startLevel();
      await sleep(1100); if (!alive(r)) return;
      send({ type: "point", frame: box("m-export"), caption: "Export", tentative: true });
      await sleep(900); if (!alive(r)) return;
      stopLevel();
      send({ type: "heard", text: "where's export?" });
      say("Here's Export.");
      send({ type: "point", frame: box("m-export"), caption: "Export" });
      await sleep(8000); if (alive(r)) send({ type: "hide" });
    },
    async picture(r) {
      chan = "general"; paint();
      send({ type: "hush" });
      send({ type: "show", state: "listening", app: "Chat", anchor: at("m-pic"), key: "Alt" });
      startLevel();
      await sleep(1100); if (!alive(r)) return;
      send({ type: "point", frame: box("m-pic"), caption: "Looking", tentative: true });
      await sleep(900); if (!alive(r)) return;
      stopLevel();
      send({ type: "heard", text: "explain this triangle" });
      const choice = await permission("Chat");
      if (!alive(r)) return;
      if (choice === "no") { send({ type: "unpoint" }); return done(r, "Okay. I didn't send anything."); }
      send({ type: "badge", text: "1 picture sent" });
      send({ type: "state", state: "thinking" });
      await sleep(1000); if (!alive(r)) return;
      send({ type: "unpoint" });
      if (!await stream(r, triangle(), 2200)) return;
      await sleep(12000); if (alive(r)) send({ type: "hide" });
    },
    async send(r) {
      if (!await begin(r, "Chat", "tell design the mockups are ready")) return;
      const steps = (a, b, c) => send({ type: "steps", items: [{ text: "Open #design", state: a }, { text: "Write the message", state: b }, { text: "Send it", state: c }] });
      say("Opening #design.");
      steps("active", "todo", "todo");
      send({ type: "point", frame: box("m-design"), caption: "# design" });
      await sleep(1400); if (!alive(r)) return;
      send({ type: "state", state: "doing", label: "Pressing “# design”" });
      await sleep(700); if (!alive(r)) return;
      chan = "design"; paint();
      await sleep(500); if (!alive(r)) return;
      steps("done", "active", "todo");
      say("Writing it in #design.");
      send({ type: "point", frame: box("composer"), caption: "Message #design" });
      send({ type: "state", state: "doing", label: "Writing it" });
      const text = "The mockups are ready! Round two is in the deck.";
      for (let i = 1; i <= text.length; i += 2) { if (!alive(r)) return; setField(text.slice(0, i), true); await sleep(calm ? 0 : 28); }
      setField(text, true);
      await sleep(500); if (!alive(r)) return;
      steps("done", "done", "active");
      say("Written. Send it?");
      send({ type: "point", frame: box("send"), caption: "Send" });
      const yes = await Promise.race([confirm("Send to #design: “" + text + "”", "confirm"), sleep(4200).then(() => { if (G.pending) { G.pending = null; return true; } return true; })]);
      if (!alive(r)) return;
      if (!yes) { steps("done", "done", "todo"); return done(r, "Okay, I left it."); }
      send({ type: "state", state: "doing", label: "Pressing “Send”" });
      await sleep(600); if (!alive(r)) return;
      THREADS.design = THREADS.design.slice(0, 2).concat([["You", "now", text]]); paint();
      const last = $("thread").lastElementChild; if (last) last.classList.add("new");
      send({ type: "unpoint" });
      steps("done", "done", "done");
      await done(r, "Sent. Priya is typing.");
    },
  };
  async function start(id) {
    const go = RUNS[id]; if (!go) return;
    run++; const r = run;
    stopLevel(); send({ type: "hush" }); send({ type: "hide" });
    await sleep(calm ? 0 : 450);
    if (!alive(r)) return;
    await go(r);
    if (alive(r)) { try { window.parent.postMessage({ done: id }, location.origin); } catch (e) { /* none */ } }
  }
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || e.source !== window.parent || !e.data || typeof e.data !== "object") return;
    if (typeof e.data.calm === "boolean") calm = e.data.calm;
    if (e.data.run) start(String(e.data.run));
  });
  window.addEventListener("load", () => { paint(); pill({ state: "rest" }); });
})();
