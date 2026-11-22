// The page: the stage (stage.js: the fabric, the hand on the water, the key), then the opening film and the views below it.
import { easeIO, reduced, view } from "./util.js";
import { splash } from "./paper/water.js";
import { scroll } from "./stage.js";

// ---------------------------------------------------------------------------
// THE OPENING FILM. One white card, three acts, and a camera.
//
//   1. a box rises; the camera pushes in while "hey X0" is typed; it is sent
//   2. the dots, then "Here, at your service.", in the middle, close up
//   3. the card clears and the icon puts itself together: its dots from the
//      middle out, the visor, a shine across it, the antennae springing up.
//      Then, the first time only, the page moves on to the next view.
//
// The camera is one transform on .cam, aimed with offsetLeft/offsetTop, which
// a transform does not change, so a push can be aimed from anywhere.
// ---------------------------------------------------------------------------
const card = document.getElementById("card");

if (card) {
  const cam = document.getElementById("cam");
  const box = document.getElementById("typebox");
  const ty = document.getElementById("ty");
  const send = document.getElementById("send");
  const reply = document.getElementById("reply");
  const endmark = document.getElementById("endmark");
  const icon = document.getElementById("icon");
  const replay = document.getElementById("replay");
  const filmsay = document.getElementById("filmsay");
  const next = card.closest("section")?.nextElementSibling;   // the view the film hands over to
  const LINE = "hey X0";

  let timers = [], played = 0;
  const at = (ms, fn) => { timers.push(setTimeout(fn, ms)); };
  const stopAll = () => { timers.forEach(clearTimeout); timers = []; };

  // ---- the camera ----
  function camTo(origin, scale, cut = false) {
    cam.classList.toggle("cut", cut);
    cam.style.transformOrigin = origin;
    cam.style.transform = `scale(${scale})`;
    if (cut) { void cam.offsetWidth; cam.classList.remove("cut"); }
  }
  const pct = (x, y) => `${(x / cam.clientWidth * 100).toFixed(2)}% ${(y / cam.clientHeight * 100).toFixed(2)}%`;
  const shootAt = (x, y, scale) => camTo(pct(x, y), scale);
  const wide = (cut = false) => camTo(cam.style.transformOrigin || "50% 50%", 1, cut);

  // ---- the water, under the table ----
  // The card is opaque, so the fabric is disturbed just outside its edges.
  function knock(fx, amp, r = 3) {
    if (reduced) return;
    const c = card.getBoundingClientRect();
    splash(c.left + c.width * fx, c.bottom + 10, amp, r);
  }

  // ---- typing, with a person's unevenness ----
  function typeOut(text) {
    let i = 0;
    const step = () => {
      i++;
      ty.textContent = text.slice(0, i);
      if (i === 1) box.classList.add("ready");
      if (i < text.length) at(85 + Math.random() * 90 + (text[i] === " " ? 60 : 0), step);
    };
    step();
  }

  // ---- the icon, assembling ----
  const dots = icon ? [...icon.querySelectorAll(".dots circle")] : [];
  const ants = icon ? [...icon.querySelectorAll(".ant")] : [];
  const visor = icon?.querySelector(".visor");
  const gloss = icon?.querySelector(".gloss");
  // The dots are put in nine rings by their distance from the visor's middle,
  // and each ring arrives as one: the same spread outward as 353 separate
  // pops, at a fraction of the cost a frame.
  const rings = [];
  const dotsG = icon?.querySelector(".dots");
  if (dotsG && visor) {
    const vb = visor.querySelector("path").getBBox();
    const cx = vb.x + vb.width / 2, cy = vb.y + vb.height / 2;
    const maxd = Math.max(...dots.map((c) => +c.dataset.d)) + 1, N = 9;
    for (let i = 0; i < N; i++) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.style.transformBox = "view-box";
      g.style.transformOrigin = `${cx}px ${cy}px`;
      dotsG.appendChild(g); rings.push(g);
    }
    dots.forEach((c) => rings[Math.floor(+c.dataset.d / maxd * N)].appendChild(c));
  }
  ants.forEach((a) => {                     // each antenna turns about its own root
    a.style.transformBox = "view-box";
    a.style.transformOrigin = `${a.dataset.bx}px ${a.dataset.by}px`;
  });
  let anims = [];
  function assemble() {
    anims.forEach((a) => a.cancel()); anims = [];
    endmark.classList.remove("alive");
    endmark.classList.add("in");
    const spring = "cubic-bezier(.2, .9, .3, 1.4)";
    anims.push(endmark.animate(
      [{ transform: "translateY(10px) scale(.9)", opacity: 0 }, { transform: "none", opacity: 1 }],
      { duration: 700, easing: "cubic-bezier(.2, .8, .3, 1)", fill: "both" }));
    rings.forEach((g, i) => anims.push(g.animate(
      [{ transform: "scale(.86)", opacity: 0 }, { transform: "none", opacity: 1 }],
      { duration: 480, delay: 30 + i * 45, easing: "cubic-bezier(.2, .8, .3, 1.12)", fill: "both" })));
    // the visor lands with the first ring of dots that shows round it (the
    // inner rings sit behind it, unseen)
    if (visor) anims.push(visor.animate(
      [{ transform: "scale(.96)", opacity: 0 }, { transform: "none", opacity: 1 }],
      { duration: 360, delay: 175, easing: "cubic-bezier(.2, .8, .3, 1)", fill: "both" }));
    if (gloss) anims.push(gloss.animate(
      [{ transform: "skewX(-22deg) translateX(0px)" }, { transform: "skewX(-22deg) translateX(900px)" }],
      { duration: 1000, delay: 620, easing: "cubic-bezier(.45, 0, .2, 1)", fill: "both" }));
    ants.forEach((a, i) => anims.push(a.animate(
      [{ transform: `scale(.3) rotate(${i ? 10 : -10}deg)`, opacity: 0 }, { transform: "none", opacity: 1 }],
      { duration: 640, delay: 320 + i * 70, easing: "cubic-bezier(.3, 1.3, .5, 1)", fill: "both" })));
    at(1300, () => endmark.classList.add("alive"));
  }
  function iconAtRest() {
    anims.forEach((a) => a.cancel()); anims = [];
    endmark.classList.add("in", "alive");
  }

  // ---- handing over to the next view, once ----
  function moveOn() {
    if (played > 1 || reduced || !next || scrollY > 40) return;   // never yank someone who has scrolled
    const from = scrollY, to = next.getBoundingClientRect().top + scrollY, dur = 1150;
    let t0 = 0, raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      ["wheel", "touchstart", "keydown"].forEach((e) => removeEventListener(e, stop));
      setTimeout(() => { scroll.quiet = false; }, 150);
    };
    ["wheel", "touchstart", "keydown"].forEach((e) => addEventListener(e, stop, { passive: true }));
    scroll.quiet = true;
    const step = (t) => {
      t0 ||= t;
      const k = Math.min(1, (t - t0) / dur);
      scrollTo(0, from + (to - from) * easeIO(k));
      if (k < 1) raf = requestAnimationFrame(step); else stop();
    };
    raf = requestAnimationFrame(step);
  }

  const setRest = (on) => card.classList.toggle("rest", on);

  function reset() {
    stopAll();
    setRest(false);
    cam.style.transformOrigin = "50% 50%";
    wide(true);
    box.classList.remove("in", "out", "ready");
    send.classList.remove("press");
    ty.textContent = "";
    reply.classList.remove("in", "spoken", "gone");
    anims.forEach((a) => a.cancel()); anims = [];
    endmark.classList.remove("in", "alive");
    if (filmsay) filmsay.textContent = "";
  }

  // The last frame at once: for reduced motion, and for a tap that skips.
  function finale(thenMoveOn) {
    stopAll();
    box.classList.remove("in");
    reply.classList.add("gone");
    wide(true);
    iconAtRest();
    setRest(true);
    if (filmsay) filmsay.textContent = "X0 Bot: Here, at your service.";
    if (thenMoveOn) at(900, moveOn);
  }

  function play() {
    reset();
    played++;
    window.__filmT0 = performance.now();   // for the timing probe
    if (reduced) { finale(false); return; }

    // ACT 1: the box, the push, the line, the send
    at(600, () => box.classList.add("in"));
    at(900, () => {
      const t = box.querySelector(".ty");
      shootAt(box.offsetLeft + t.offsetLeft + 26, box.offsetTop + box.offsetHeight / 2, 2.05);
      at(250, () => typeOut(LINE));
    });
    at(2400, () => send.classList.add("press"));
    at(2600, () => box.classList.add("out"));

    // ACT 2: the answer, in the middle of the card. Once the box has gone the
    // camera cuts back to wide, centred, so the push in on the answer is a push
    // straight down the middle and the answer never leaves the centre.
    at(2970, () => { camTo("50% 50%", 1, true); reply.classList.add("in"); });
    at(3200, () => camTo("50% 50%", 1.75));
    at(3850, () => {
      reply.classList.add("spoken");
      if (filmsay) filmsay.textContent = "X0 Bot: Here, at your service.";
    });

    // ACT 3: the answer sinks away from the close-up, the camera resets while
    // the card is empty, the face arrives, and the page moves on
    at(5050, () => { reply.classList.add("gone"); knock(.5, .35, 2.8); });
    at(5630, () => wide(true));
    at(5700, () => { assemble(); knock(.42, .35, 2.8); knock(.58, .35, 2.8); });
    at(7600, () => { setRest(true); moveOn(); });
  }

  replay.addEventListener("click", (e) => { e.stopPropagation(); play(); });
  card.addEventListener("click", () => { if (!card.classList.contains("rest")) finale(played === 1); });

  // Start once the fonts are in, so the first frames are set in the right face.
  const go = () => setTimeout(play, 500);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
}

// ---------------------------------------------------------------------------
// THE LINE BESIDE A SHOWCASE. One kicker, one line, one sentence, swapped as
// what is playing changes: the old words lift away, the new ones rise in.
// ---------------------------------------------------------------------------
function sayer(aside) {
  if (!aside) return () => {};
  const k = aside.querySelector(".say-k span"), h = aside.querySelector(".say-h"), p = aside.querySelector(".say-p");
  let timer = 0, now = h.textContent;
  return ([kick, line, more], instant = false) => {
    if (line === now) return;
    now = line;
    clearTimeout(timer);
    const put = () => { k.textContent = kick; h.textContent = line; p.textContent = more; aside.classList.remove("out"); };
    if (instant || reduced) { put(); return; }
    aside.classList.add("out");
    timer = setTimeout(put, 280);
  };
}

// ---------------------------------------------------------------------------
// THE WORK VIEW. A desktop and a phone, a little apart.
//
//   SET UP, on the desktop, in the four steps of docs/mail.md: the business
//   and its domain (the hello@ mailbox is made for it); the four DNS records,
//   each checked live; its personality, read from its website; how it
//   answers. A cursor clicks it through. Then the mail starts arriving.
//   THEN the phone works through it, and the desktop follows: sort, draft in
//   the business's own voice, ask before sending, hand back the one that
//   needs a person.
//
// It starts when the view is mostly on screen, once; Replay runs it again.
// ---------------------------------------------------------------------------
{
  const work = document.getElementById("work");
  if (work) {
    const mailScreen = document.getElementById("mailScreen"), mail = document.getElementById("mail");
    const appScreen = document.getElementById("appScreen"), app = document.getElementById("app");
    const rowsEl = document.getElementById("mailRows");
    const counts = [document.getElementById("mailCount"), document.getElementById("mailCountSide")];
    const feed = document.getElementById("pFeed"), stateEl = document.getElementById("pState");
    const setupEl = document.getElementById("setup");
    const replayW = document.getElementById("workReplay");

    // ---- the line beside it, one per story ----
    const tell = sayer(work.querySelector(".show-say"));
    const LINES = {
      setup: ["Mail", "Your business email, live in minutes.", "Bring your domain. X0 Bot makes hello@, checks every record and learns how you sound."],
      inbox: ["Mail", "45 emails. 44 handled. One left for you.", "It sorts, drafts replies in your voice, and asks before anything is sent."],
      food: ["Food", "Say you're hungry. Dinner's sorted.", "It knows what you like, picks it, orders it, and tells you when it's close."],
      code: ["Code", "Ship from your phone.", "Xode reads your repos, plans the work, writes it and tests it. You approve."],
      routine: ["Routines", "Ask once. It happens every day.", "Every morning at 8, the updated user list is in your mail."],
      done: ["All day", "And dinner's at the door.", "While you shipped, it kept an eye on your order. One app, every part of your day."],
    };

    // ---- which screen is doing the work: it comes forward, the other steps back ----
    const focusOn = (who) => {
      work.classList.toggle("f-desk", who === "desk");
      work.classList.toggle("f-phone", who === "phone");
    };

    // ---- each designed screen scaled to its frame ----
    const fitScreens = () => {
      mail.style.setProperty("--s", mailScreen.clientWidth / 1040);
      app.style.setProperty("--s", appScreen.clientWidth / 320);
    };
    new ResizeObserver(fitScreens).observe(mailScreen);
    new ResizeObserver(fitScreens).observe(appScreen);
    fitScreens();

    // ---- the bot's face, as a picture, for the phone's header and the setup ----
    const iconSvg = document.getElementById("icon");
    const faceSrc = iconSvg ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      iconSvg.outerHTML.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace(' id="icon"', "")) : "";
    const faceEl = document.getElementById("pFace");
    if (faceEl && faceSrc) { const img = new Image(); img.alt = ""; img.src = faceSrc; faceEl.appendChild(img); }

    // ---- the inbox: a small plant shop's, 22 of its 45, newest first. The
    // companies are made up, so the page borrows nobody's name.
    const MAIL = [
      ["Kavya Iyer", "KI", "plum", "Invoice #2231", "Invoice for 120 ceramic pots, November", "9:58", "needs"],
      ["Priya Sharma", "PS", "clay", "Order #1042", "Mera order kab tak aayega?", "9:51", "reply"],
      ["ShipEasy", "SE", "ash", "New courier rates from Monday", "What changes for parcels under 2 kg", "9:47", "news"],
      ["Payments", "₹", "stone", "₹4,820 settled to your bank", "From 7 orders yesterday", "9:44", "fyi"],
      ["Marta Ruiz", "MR", "sea", "¿Enviáis a Madrid?", "Me encantan vuestras macetas, ¿enviáis a España?", "9:40", "reply"],
      ["Market Brief", "MB", "ash", "Five things for small sellers", "Festive demand starts early this year", "9:36", "news"],
      ["Hotel Saffron", "HS", "pine", "Plants for our lobby", "We'd like 40 large plants for the new lobby", "9:31", "reply"],
      ["Store", "St", "stone", "New order #1046", "Monstera, medium · ₹1,450", "9:28", "fyi"],
      ["Arjun Rao", "AR", "ochre", "Return for #1038", "The pot arrived cracked", "9:22", "reply"],
      ["Gather", "G", "ash", "You appeared in 9 searches", "See who's been looking", "9:19", "news"],
      ["Neha Kapoor", "NK", "moss", "Gift wrapping?", "Can you wrap it and add a note?", "9:15", "reply"],
      ["Courier", "Co", "stone", "12 parcels picked up", "Out for delivery by evening", "9:12", "fyi"],
      ["R. Khanna", "RK", "sand", "Wholesale enquiry", "Do you supply cafés in Pune?", "9:08", "reply"],
      ["Packwell", "P", "ash", "Bulk boxes, 20% off", "This week only", "9:05", "news"],
      ["Store", "St", "stone", "New order #1047", "Snake plant, small · ₹650", "9:03", "fyi"],
      ["Sam Lee", "SL", "slate", "Plants for our café", "Would love to feature your plants", "9:01", "reply"],
      ["Launchpad Daily", "LD", "ash", "Today's top products", "A watering app that", "8:58", "news"],
      ["Calendar", "Ca", "stone", "Supplier call moved to 3:30", "Kavya Iyer · 30 min", "8:55", "fyi"],
      ["Ananya Das", "AD", "clay", "Repotting tips?", "My fiddle leaf fig is drooping", "8:50", "reply"],
      ["Trade Weekly", "TW", "ash", "Planning the festive season", "Stock up before October", "8:47", "news"],
      ["Rahul Verma", "RV", "sea", "Order #1029", "Can I change the address?", "8:41", "reply"],
      ["Store", "St", "stone", "New order #1048", "Peace lily, large · ₹1,900", "8:40", "fyi"],
    ];
    const CHIP = { news: "Newsletter", fyi: "FYI", reply: "Reply", needs: "Needs you" };
    function drawInbox(waiting) {
      rowsEl.textContent = "";
      MAIL.forEach(([from, ini, col, subj, snip, time, k]) => {
        const row = document.createElement("div");
        row.className = "mrow" + (waiting ? " wait" : "");
        row.innerHTML = `<div><div class="r" data-k="${k}"><i class="u"></i><span class="av c-${col}"></span>`
          + `<span class="from"></span><span class="subj"><b></b> — <span></span></span>`
          + `<span class="chip">${CHIP[k]}</span><span class="time">${time}</span></div></div>`;
        row.querySelector(".av").textContent = ini;
        row.querySelector(".from").textContent = from;
        row.querySelector(".subj b").textContent = subj;
        row.querySelector(".subj span").textContent = snip;
        rowsEl.appendChild(row);
      });
    }
    const rowsOf = (k) => [...rowsEl.querySelectorAll(`.r[data-k="${k}"]`)];

    // ---- the setup card ----
    const CURSOR = '<svg viewBox="0 0 22 24"><path d="M2 1v17.5l4.6-4.3 3.2 7.1 2.8-1.2-3.1-7h6.4z" fill="#141414" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg><i class="ring"></i>';
    const SETUP = `<div class="su-card" id="suCard">
        <div class="su-top"><span class="su-brand">${faceSrc ? `<img alt="" src="${faceSrc}">` : ""}X0 Bot · Mail</span><span class="su-steps"><i class="on"></i><i></i><i></i><i></i></span></div>
        <div class="su-stage">
          <section class="su-step on" data-step="1">
            <h4>Bring your business's email</h4>
            <p class="su-sub">We make the mailbox on our mail server. Nothing to bring.</p>
            <div class="su-field"><span>Business name</span><b class="su-in" id="suName"></b></div>
            <div class="su-field"><span>Domain</span><b class="su-in" id="suDomain"></b></div>
            <div class="su-made" id="suMade"><span><b>hello@leafandco.in</b> is made for you</span></div>
            <span class="su-btn">Next</span>
          </section>
          <section class="su-step" data-step="2">
            <h4>Point leafandco.in here</h4>
            <p class="su-sub">Add these four records where you bought the domain.</p>
            <div class="su-recs">
              <div class="su-rec"><b>MX</b><span>@</span><code>10 mx.mail.x0bot.com</code><em>Checking</em></div>
              <div class="su-rec"><b>TXT</b><span>@</span><code>v=spf1 include:spf.mail.x0bot.com ~all</code><em>Checking</em></div>
              <div class="su-rec"><b>TXT</b><span>x0._domainkey</span><code>v=DKIM1; k=rsa; p=MIIBIjANBgkqh…</code><em>Checking</em></div>
              <div class="su-rec"><b>TXT</b><span>_dmarc</span><code>v=DMARC1; p=quarantine</code><em>Checking</em></div>
            </div>
            <p class="su-ok" id="suOk">All four found. Mail arrives here now.</p>
            <span class="su-btn">Next</span>
          </section>
          <section class="su-step" data-step="3">
            <h4 class="su-read" id="suRead">Reading leafandco.in…</h4>
            <p class="su-sub">Read from its website. Every email is written this way.</p>
            <ul class="su-voice">
              <li><b>Voice</b><span>Warm and plain, a little playful.</span></li>
              <li><b>Knows</b><span>Ships across India in 3–5 days.</span></li>
              <li><b>Rule</b><span>Never promise a date for a custom order.</span></li>
            </ul>
            <div class="su-row"><span class="su-btn">Keep</span><span class="su-btn ghost">Change it</span></div>
          </section>
          <section class="su-step" data-step="4">
            <h4>How should it answer?</h4>
            <p class="su-sub">For every address at leafandco.in. You can change it later.</p>
            <div class="su-opts">
              <div class="su-opt on"><b>Drafts for you</b><span>Every reply waits for you to send it.</span></div>
              <div class="su-opt"><b>Sends by itself</b><span>After a short wait. Money, legal matters and complaints still wait for you.</span></div>
            </div>
            <span class="su-btn">Done</span>
          </section>
          <section class="su-step" data-step="5">
            <div class="su-donebox"><h4>hello@leafandco.in is ready</h4><p class="su-sub">Mail is on its way in.</p></div>
          </section>
        </div>
      </div><i class="cursor" id="suCursor">${CURSOR}</i>`;
    let su = {};
    function drawSetup() {
      setupEl.classList.remove("gone");
      setupEl.innerHTML = SETUP;
      su = {
        card: setupEl.querySelector("#suCard"), cursor: setupEl.querySelector("#suCursor"),
        steps: [...setupEl.querySelectorAll(".su-step")], dots: [...setupEl.querySelectorAll(".su-steps i")],
        name: setupEl.querySelector("#suName"), domain: setupEl.querySelector("#suDomain"), made: setupEl.querySelector("#suMade"),
        recs: [...setupEl.querySelectorAll(".su-rec")], ok: setupEl.querySelector("#suOk"),
        read: setupEl.querySelector("#suRead"), voice: [...setupEl.querySelectorAll(".su-voice li")],
      };
    }
    function stepTo(n) {
      su.steps.forEach((st, i) => { st.classList.toggle("on", i === n - 1); st.classList.toggle("past", i < n - 1); });
      su.dots.forEach((d, i) => d.classList.toggle("on", i < Math.min(n, 4)));
    }
    // where an element's middle is, in the setup layer's own (unscaled) pixels
    function centreOf(el, fx = .5, fy = .5) {
      let x = el.offsetWidth * fx, y = el.offsetHeight * fy, n = el;
      while (n && n !== setupEl) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return [x, y];
    }
    function pointAt(el, fx, fy) {
      const [x, y] = centreOf(el, fx, fy);
      su.cursor.style.setProperty("--cx", (x - 2) + "px");
      su.cursor.style.setProperty("--cy", (y - 1) + "px");
    }
    function click(btn) {
      su.cursor.classList.remove("click"); void su.cursor.offsetWidth; su.cursor.classList.add("click");
      btn.classList.add("press");
      wat(140, () => btn.classList.remove("press"));
      wat(500, () => su.cursor.classList.remove("click"));
    }
    function typeIn(el, text, each = 70) {
      el.classList.add("focus");
      el.innerHTML = '<span class="t"></span><i class="cur"></i>';
      const t = el.querySelector(".t");
      [...text].forEach((ch, i) => wat(i * each + Math.random() * 25, () => { t.textContent += ch; }));
      wat(text.length * each + 120, () => { el.classList.remove("focus"); el.querySelector(".cur")?.remove(); });
      return text.length * each + 120;
    }
    const btnOf = (n) => su.steps[n - 1].querySelector(".su-btn");

    // ---- small machinery ----
    let wt = [], shown = 0, ran = false, runs = 0;
    const wat = (ms, fn) => { wt.push(setTimeout(fn, ms)); };
    const wstop = () => { wt.forEach(clearTimeout); wt = []; };
    function count(to, dur = 700) {
      const from = shown; shown = to;
      if (reduced) { counts.forEach((e) => { e.textContent = to; }); return; }
      let t0 = 0;
      const step = (t) => {
        t0 ||= t;
        const k = Math.min(1, (t - t0) / dur);
        const v = Math.round(from + (to - from) * easeIO(k));
        counts.forEach((e) => { e.textContent = v; });
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    function say(text, busy = true) {
      stateEl.classList.add("swap");
      wat(230, () => { stateEl.textContent = text; stateEl.classList.remove("swap"); });
      app.classList.toggle("busy", busy);
    }
    function add(html) {
      const f = document.createElement("div");
      f.className = "f";
      f.innerHTML = `<div>${html}</div>`;
      feed.appendChild(f);
      void f.offsetHeight;
      f.classList.add("in");
      return f;
    }
    function drop(f) { f.classList.remove("in"); f.classList.add("out"); wat(560, () => f.remove()); }
    function typingThen(text, wait) {
      const t = add('<span class="typing"><i></i><i></i><i></i></span>');
      wat(wait, () => { drop(t); const f = add('<p class="say"></p>'); f.querySelector(".say").textContent = text; });
    }
    // a draft writes itself; its height is set by an invisible copy of the
    // finished text, so the card never jumps a line while it types
    function draft(to, ini, col, subj, text) {
      const f = add(`<div class="draft"><div class="to"><span class="av c-${col}"></span><b></b><span class="s"></span><small>Drafted</small></div>`
        + `<div class="txt"><span class="ghost"></span><span class="live"><span class="w"></span><i class="cur"></i></span></div></div>`);
      f.querySelector(".to .av").textContent = ini;
      f.querySelector(".to b").textContent = to;
      f.querySelector(".to .s").textContent = "· " + subj;
      f.querySelector(".ghost").textContent = text;
      const w = f.querySelector(".w"), card = f.querySelector(".draft");
      let i = 0;
      const step = () => {
        i += 2;
        w.textContent = text.slice(0, i);
        if (i < text.length) wat(28, step); else card.classList.add("ready");
      };
      wat(380, step);
      return f;
    }
    const PLANE = '<svg viewBox="0 0 16 16"><path d="M14.5 1.5 7 9M14.5 1.5 10 14.5 7 9 1.5 6z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    function handback() {
      return '<div class="handback"><div class="h"><span>Needs you</span><span>9:58</span></div>'
        + '<div class="t">Kavya Iyer · Invoice #2231</div>'
        + '<div class="b">The total is ₹48,000, but the PO says ₹42,000. I haven\'t replied.</div>'
        + '<span class="look">Open the mail</span></div>';
    }

    // ---- the second story: the same screens, cleared ----
    const scene2El = document.getElementById("scene2");
    const FOOD = [
      ["🍔", "Veg crunch burger", "Corner Kitchen · ₹149"],
      ["🍟", "Peri-peri fries", "Corner Kitchen · ₹99"],
      ["🍕", "Margherita slice", "Slice Lab · ₹129"],
      ["🥤", "Cold coffee", "Corner Kitchen · ₹119"],
    ];
    const DELIV = '<div class="deliv"><div class="emos">🍔🍟🥤</div>'
      + '<div class="big">Your happy meal is arriving in <em>31 mins</em></div>'
      + '<div class="small">Hot and as you like.</div>'
      + '<div class="track"><b></b><i></i></div><div class="ends"><span>Corner Kitchen</span><span>You</span></div></div>';
    let s2 = {};
    function drawScene2() {
      scene2El.classList.remove("on", "listening");
      scene2El.innerHTML = '<div class="s2-rings"><i></i><i></i><i></i></div><div class="s2-blip"></div>'
        + '<p class="s2-said hey"><span>Hey</span><span>X0</span></p>'
        + '<p class="s2-said hungry"><span>I\'m</span><span>hungry.</span></p>'
        + '<div class="s2-cards"></div>'
        + '<div class="s2-pill"><span class="wave"><i></i><i></i><i></i><i></i><i></i></span><span>Listening</span><kbd>Ctrl</kbd><kbd>Ctrl</kbd></div>'
        + `<i class="cursor hide">${CURSOR}</i>`;
      s2 = {
        blip: scene2El.querySelector(".s2-blip"), hey: scene2El.querySelector(".hey"), hungry: scene2El.querySelector(".hungry"),
        cards: scene2El.querySelector(".s2-cards"), pill: scene2El.querySelector(".s2-pill"), cursor: scene2El.querySelector(".cursor"),
      };
      if (iconSvg) { const c = iconSvg.cloneNode(true); c.removeAttribute("id"); s2.blip.appendChild(c); }
      FOOD.forEach(([emo, name, from]) => {
        const card = document.createElement("div");
        card.className = "fc";
        card.innerHTML = '<div class="emo"></div><b></b><span></span>';
        card.querySelector(".emo").textContent = emo;
        card.querySelector("b").textContent = name;
        card.querySelector("span").textContent = from;
        s2.cards.appendChild(card);
      });
    }
    function pointIn(el, fx, fy, dx = 0, dy = 0) {
      let x = el.offsetWidth * fx, y = el.offsetHeight * fy, n = el;
      while (n && n !== scene2El) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      s2.cursor.style.setProperty("--cx", (x - 2 + dx) + "px");
      s2.cursor.style.setProperty("--cy", (y - 1 + dy) + "px");
    }
    // the deck: card f in front; the others behind it to either side, each a
    // step further back, smaller and turned in, so each sits partly behind the next
    function deck(f, list) {
      list.forEach((c, i) => {
        const d = i - f, ad = Math.abs(d);
        c.style.setProperty("--x", (d * 150) + "px");
        c.style.setProperty("--z", (-ad * 110) + "px");
        c.style.setProperty("--ry", (-d * 18) + "deg");
        c.style.setProperty("--s", (1 - ad * .05).toFixed(3));
        c.style.zIndex = String(10 - ad);
      });
    }
    const words = (p, gap) => [...p.children].forEach((w, i) => wat(i * gap, () => w.classList.add("in")));

    function act2(B) {
      const cards = () => [...s2.cards.children];
      // the screens clear
      wat(B, () => {
        scene2El.classList.add("on");
        feed.querySelectorAll(".f").forEach((f) => drop(f));
        say("Here if you need me", false);
      });
      // Blip peeks in at the desktop's edge
      wat(B + 600, () => { focusOn("desk"); tell(LINES.food); });
      wat(B + 800, () => s2.blip.classList.add("peek", "bob"));
      // called
      wat(B + 1900, () => { s2.pill.classList.add("on", "talking"); words(s2.hey, 260); });
      // he comes to the middle to listen
      wat(B + 2800, () => {
        s2.hey.classList.add("out");
        s2.blip.classList.remove("peek");
        s2.blip.classList.add("listen");
        scene2El.classList.add("listening");
        say("Listening…");
      });
      wat(B + 3500, () => words(s2.hungry, 300));
      // up out of the way, and the food comes
      wat(B + 4900, () => {
        s2.pill.classList.remove("talking", "on");
        s2.hungry.classList.add("out");
        scene2El.classList.remove("listening");
        s2.blip.classList.remove("listen");
        s2.blip.classList.add("up");
        say("Finding food…");
      });
      wat(B + 5300, () => { deck(0, cards()); cards().forEach((c, i) => wat(i * 120, () => c.classList.add("in"))); });
      // the deck scrolls sideways, to the pizza
      wat(B + 6500, () => deck(1, cards()));
      wat(B + 7300, () => deck(2, cards()));
      // the person swipes it away
      wat(B + 7900, () => { s2.cursor.classList.remove("hide"); pointIn(cards()[2], .5, .42); });
      wat(B + 8550, () => {
        const pz = cards()[2];
        s2.cursor.classList.add("click");
        pz.classList.add("grab");
        pz.style.setProperty("--x", "-56px"); pz.style.setProperty("--ry", "-8deg");
        pointIn(pz, .5, .42, -56, 4);
      });
      wat(B + 8900, () => {
        const pz = cards()[2];
        s2.cursor.classList.remove("click");
        pz.classList.remove("grab");
        pz.classList.add("swiped");
        pz.style.setProperty("--x", "-640px"); pz.style.setProperty("--y", "-50px"); pz.style.setProperty("--ry", "-34deg");
        pointIn(pz, .5, .42, -250, 14);
      });
      wat(B + 9250, () => s2.cursor.classList.add("hide"));
      // the three left settle back into the deck, fries in front, and turn green: that is the meal
      wat(B + 9400, () => deck(1, cards().filter((c) => !c.classList.contains("swiped"))));
      wat(B + 9900, () => {
        cards().filter((c) => !c.classList.contains("swiped")).forEach((c, i) => wat(i * 170, () => c.classList.add("pick")));
        say("Ordering…");
      });
      // and on the phone, it is on its way
      wat(B + 10850, () => { focusOn("phone"); feed.classList.add("center"); add(DELIV); say("On its way", false); });
      // a moment with the meal on its way, then the third story
      act3(B + 13600);
    }

    // ---- the third story: Xode on the desktop, orders from the phone ----
    const scene3El = document.getElementById("scene3");
    const pillName = app.querySelector(".p-pill b"), clock = app.querySelector(".p-status b");
    // the phone's own parts for this story: a box to write in, a notification, a day marker
    const pCompose = document.createElement("div");
    pCompose.className = "p-compose";
    pCompose.innerHTML = '<span class="pc-t"></span><span class="pc-send"><svg viewBox="0 0 12 12"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    const pNotif = document.createElement("div");
    pNotif.className = "p-notif";
    pNotif.innerHTML = `<span class="ico">${faceSrc ? `<img alt="" src="${faceSrc}">` : ""}</span><div><div class="top"><span>X0 Bot · Mail</span><span>now</span></div>`
      + '<b>Updated user list</b><span>1,284 users, 37 new since yesterday. The list is attached.</span></div>';
    const pDay = document.createElement("div");
    pDay.className = "p-day";
    pDay.textContent = "Next morning · 8:00";
    app.append(pCompose, pNotif, pDay);
    const pcT = pCompose.querySelector(".pc-t"), pcSend = pCompose.querySelector(".pc-send");

    // Xode's mark: its own dot mark from the app (code: an X), in its moss
    const XMARK = '<svg viewBox="0 0 7 7" fill="currentColor">' + ".......|.#...#.|..#.#..|...#...|..#.#..|.#...#.|......."
      .split("|").flatMap((row, y) => [...row].map((ch, x) => ch === "#" ? `<circle cx="${x + .5}" cy="${y + .5}" r=".45"/>` : "")).join("") + "</svg>";
    const TREE = [
      ["store/", 0, "dir"],
      ["src/", 1, "dir"], ["products/", 2, "dir"], ["ProductCard.tsx", 3, "", "card"], ["ProductPage.tsx", 3],
      ["api/", 2, "dir"], ["stock.ts", 3], ["notify.ts", 3, "new", "api"],
      ["jobs/", 2, "dir"], ["restock.ts", 3, "", "restock"],
      ["db/migrations/", 1, "dir"], ["0041_reviews.sql", 2], ["0042_notify.sql", 2, "new", "mig"],
      ["tests/", 1, "dir"], ["notify.test.ts", 2, "new", "test"],
      ["admin/", 0, "dir"], ["emails/", 0, "dir"],
    ];
    const REPOS = [
      ["leaf-and-co/store", "The shop at leafandco.in · TypeScript"],
      ["leaf-and-co/admin", "Orders and stock · TypeScript"],
      ["leaf-and-co/emails", "Email templates · MJML"],
    ];
    const CODE = [
      [12, "export function ProductCard({ id, name, price, stock }: Props) {"], [13, "  return ("],
      [14, '    <article className="card">'], [15, "      <img src={photo(id)} alt={name} />"],
      [16, "      <h3>{name}</h3>"], [17, '      <p className="price">₹{price}</p>'], [18, "      {stock === 0 ? ("],
      [19, '        <span className="sold">Sold out</span>', "old"], [19, '        <NotifyMe productId={id} label="Notify me" />', "new"],
      [20, "      ) : ("], [21, "        <AddToCart id={id} />"], [22, "      )}"], [23, "    </article>"], [24, "  );"], [25, "}"],
    ];
    let x3 = {};
    function drawScene3() {
      scene3El.classList.remove("on");
      scene3El.innerHTML = `<div class="x3-top"><i></i><i></i><i></i><span>Xode · leaf-and-co · 3 repos</span></div>
        <div class="x3-start"><div class="x3-startcard">
          <div class="x3-brand"><span class="x3-mark">${XMARK}</span>Xode</div>
          <h4>Start a project</h4><p>Add the repositories it covers. Xode reads them before it changes anything.</p>
          <div class="x3-add"><span class="pre">github.com/</span><span class="x3-typed"></span></div>
          <div class="x3-repos"></div><span class="x3-go">Start</span></div></div>
        <div class="x3-body">
          <aside class="x3-chat"><div class="x3-chathead"><span class="x3-mark">${XMARK}</span><b>Xode</b><span class="x3-proj">3 repos</span></div>
            <div class="x3-msgs"></div><div class="x3-compose"><span class="ph">Tell Xode what to build</span></div></aside>
          <section class="x3-work"><nav class="x3-tree"></nav>
            <div class="x3-editor"><div class="x3-tab">src/products/ProductCard.tsx</div><pre class="x3-code"></pre></div>
            <div class="x3-term"></div></section>
        </div><i class="cursor hide">${CURSOR}</i>`;
      const q = (sel) => scene3El.querySelector(sel);
      x3 = { start: q(".x3-start"), add: q(".x3-add"), typed: q(".x3-typed"), repos: q(".x3-repos"), go: q(".x3-go"), msgs: q(".x3-msgs"), compose: q(".x3-compose"),
        tree: q(".x3-tree"), code: q(".x3-code"), term: q(".x3-term"), cursor: q(".cursor"), files: {} };
      TREE.forEach(([name, depth, kind, key]) => {
        const f = document.createElement("div");
        f.className = "x3-f" + (kind ? " " + kind : "");
        f.style.paddingLeft = (8 + depth * 13) + "px";
        f.innerHTML = "<span></span><i></i>";
        f.querySelector("span").textContent = name;
        x3.tree.appendChild(f);
        if (key) x3.files[key] = f;
      });
      CODE.forEach(([n, text, kind]) => {
        const l = document.createElement("div");
        l.className = "x3-l" + (kind === "new" ? " hid" : "");
        if (kind) l.dataset.k = kind;
        l.innerHTML = '<span class="n"></span><span class="c"></span>';
        l.querySelector(".n").textContent = n;
        l.querySelector(".c").textContent = kind === "new" ? "" : text;
        if (kind === "new") l.dataset.text = text;
        x3.code.appendChild(l);
      });
    }
    function x3point(el, fx = .5, fy = .5) {
      let x = el.offsetWidth * fx, y = el.offsetHeight * fy, n = el;
      while (n && n !== scene3El) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      x3.cursor.style.setProperty("--cx", (x - 2) + "px");
      x3.cursor.style.setProperty("--cy", (y - 1) + "px");
    }
    function x3click(btn) {
      x3.cursor.classList.remove("click"); void x3.cursor.offsetWidth; x3.cursor.classList.add("click");
      if (btn) { btn.classList.add("press"); wat(140, () => btn.classList.remove("press")); }
      wat(500, () => x3.cursor.classList.remove("click"));
    }
    function x3msg(html, cls = "") {
      const m = document.createElement("div");
      m.className = "x3-m" + (cls ? " " + cls : "");
      m.innerHTML = html;
      x3.msgs.appendChild(m);
      void m.offsetWidth; m.classList.add("in");
      return m;
    }
    function term(html) {
      const t = document.createElement("div");
      t.className = "x3-t";
      t.innerHTML = html;
      x3.term.appendChild(t);
      void t.offsetWidth; t.classList.add("in");
    }
    function flag(key, letter) {
      const f = x3.files[key];
      if (f.classList.contains("new")) f.classList.add("in");
      const i = f.querySelector("i"); i.textContent = letter; i.className = letter === "A" ? "a" : "m";
    }
    function typeText(el, text, each, done) {
      el.textContent = "";
      const span = document.createElement("span"), cur = document.createElement("i");
      cur.className = "cur"; el.append(span, cur);
      [...text].forEach((ch, i) => wat(i * each, () => { span.textContent += ch; }));
      wat(text.length * each + 60, () => { cur.remove(); if (done) done(); });
      return text.length * each + 60;
    }
    const TASK = 'Add "Notify me" for sold-out plants, and mail people when they\'re back.';
    const ORDER = "Run test no. 854 again and ship when passed. Each day at 8, mail me the updated user list.";
    const CLOCK = '<svg viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 5v4.3l2.8 1.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    const TEST_RUN = '<div class="tcard"><span>Test #854</span><b>Running it again</b><code>notify › sends one mail per signup</code><br><span class="res run">running…</span></div>';
    const SHIP = '<div class="shipcard"><span class="lab">Shipped</span><b>"Notify me" for sold-out plants</b>Live on leafandco.in · merged #128 · 1,212 of 1,212 tests pass</div>';
    const ROUTINE = `<div class="rcard">${CLOCK}<div><span>Every day at 8:00</span><b>Mail you the updated user list</b>The first one is tomorrow morning.</div></div>`;

    function act3(C) {
      const T = (ms, fn) => wat(C + ms, fn);
      // the screens clear
      T(0, () => {
        scene3El.classList.add("on");
        feed.querySelectorAll(".f").forEach((f) => drop(f));
        feed.classList.remove("center");
        say("Here if you need me", false);
      });
      // start a project: three repositories, each typed in and dropped into the list
      T(300, () => { focusOn("desk"); tell(LINES.code); });
      T(600, () => { x3.cursor.classList.remove("hide"); x3point(x3.add, .55, .5); });
      T(1000, () => { x3click(); x3.add.classList.add("focus"); });
      REPOS.forEach(([name, about], i) => {
        const at0 = 1150 + i * 900;
        T(at0, () => typeText(x3.typed, name.replace("leaf-and-co/", "leaf-and-co/"), 30));
        T(at0 + name.length * 30 + 120, () => {
          x3.typed.textContent = "";
          const slot = document.createElement("div");
          slot.className = "x3-slot";
          slot.innerHTML = '<div><div class="x3-repo on"><b></b><span></span><em>Added</em></div></div>';
          slot.querySelector("b").textContent = name;
          slot.querySelector("span").textContent = about;
          x3.repos.appendChild(slot);
          void slot.offsetWidth; slot.classList.add("in");
        });
      });
      T(4050, () => { x3.add.classList.remove("focus"); x3point(x3.go); });
      T(4650, () => x3click(x3.go));
      // everything after the start moves along by the time the three took
      C += 2350;
      // Xode reads it first
      T(2450, () => {
        x3.start.classList.add("gone");
        x3.cursor.classList.add("hide");
        const m = x3msg('<span class="rd">Reading the project…</span><div class="x3-bar"><b></b></div>');
        void m.offsetWidth; m.querySelector(".x3-bar b").style.width = "100%";
        [...x3.tree.children].forEach((f, i) => { wat(i * 95, () => f.classList.add("read")); wat(i * 95 + 320, () => f.classList.remove("read")); });
        wat(1700, () => { m.querySelector(".rd").textContent = "Read 3 repos: 612 files, 38 routes, 1,212 tests."; });
      });
      // the task
      T(4500, () => { x3.compose.textContent = ""; typeText(x3.compose, TASK, 33); });
      T(7050, () => { x3.compose.innerHTML = '<span class="ph">Tell Xode what to build</span>'; const m = x3msg("", "me"); m.textContent = TASK; });
      // it thinks, then answers with a plan
      let thinking = null, plan = null;
      T(7350, () => { thinking = x3msg('<span class="typing"><i></i><i></i><i></i></span>'); thinking.style.background = "none"; thinking.style.padding = "0"; });
      T(8150, () => {
        thinking.remove();
        plan = x3msg('<b>Plan</b><p>Sold-out plants show a grey "Sold out" and nothing else. Next: a way to ask to be told.</p>'
          + '<ol><li>A table for who is waiting<em></em></li><li>"Notify me" on sold-out cards<em></em></li>'
          + '<li>On restock, mail them, once<em></em></li><li>Tests for all three<em></em></li></ol><span class="x3-approve">Approve</span>', "");
        plan.className = "x3-plan"; void plan.offsetWidth; plan.classList.add("in");
      });
      const step = (i, state, label) => { const li = plan.querySelectorAll("li")[i]; li.className = state; li.querySelector("em").textContent = label; };
      T(8850, () => { x3.cursor.classList.remove("hide"); x3point(plan.querySelector(".x3-approve")); });
      T(9450, () => { const b = plan.querySelector(".x3-approve"); x3click(b); wat(200, () => b.classList.add("used")); });
      // the work, where you can see it
      T(9650, () => {
        x3.cursor.classList.add("hide");
        step(0, "working", "working");
        term('<span class="cmd">$ xode run</span> <span class="dim">"Notify me" for sold-out plants</span>');
        wat(350, () => { flag("mig", "A"); term('  <span class="ok">created</span>  db/migrations/0042_notify.sql'); });
      });
      T(10450, () => { step(0, "done", "done"); step(1, "working", "working"); flag("card", "M"); term('  <span class="ok">changed</span>  src/products/ProductCard.tsx'); });
      T(10750, () => x3.code.querySelector('[data-k="old"]').classList.add("del"));
      T(11150, () => {
        const nl = x3.code.querySelector('[data-k="new"]');
        nl.classList.remove("hid"); nl.classList.add("add");
        typeText(nl.querySelector(".c"), nl.dataset.text, 26);
      });
      T(12550, () => {
        step(1, "done", "done"); step(2, "working", "working");
        flag("api", "A"); term('  <span class="ok">created</span>  src/api/notify.ts');
        wat(300, () => { flag("restock", "M"); term('  <span class="ok">changed</span>  src/jobs/restock.ts'); });
      });
      T(13350, () => { step(2, "done", "done"); step(3, "working", "running"); flag("test", "A"); term('  <span class="ok">created</span>  tests/notify.test.ts'); });
      T(13750, () => {
        term('<span class="cmd">$ npm test</span>');
        const lines = [
          '  notify › stores one request per email ....... <span class="ok">passed</span>',
          '  notify › button shows only when sold out .... <span class="ok">passed</span>',
          '  restock › mails everyone waiting, once ...... <span class="ok">passed</span>',
          '  #854 notify › sends one mail per signup ..... <span class="bad">failed (timeout)</span>',
          '  <span class="ok">1,211 passed</span> · <span class="bad">1 failed</span>',
        ];
        lines.forEach((l, i) => wat(250 + i * 260, () => term(l)));
      });
      T(15400, () => {
        step(3, "", "1 flaky");
        const m = x3msg("1,211 pass. #854 timed out on the mail stub. It looks flaky, not this change. Run it again?");
        m.style.background = "#FBF3E4";
      });
      // from the phone: the order
      T(15600, () => focusOn("phone"));
      T(15900, () => { pillName.textContent = "Xode"; say("Waiting for you", false); app.classList.add("composing"); });
      T(16300, () => typeText(pcT, ORDER, 27, () => pCompose.classList.add("ready")));
      T(16310, () => pCompose.classList.add("ready"));
      T(19000, () => { pcSend.classList.add("press"); wat(140, () => pcSend.classList.remove("press")); });
      T(19200, () => {
        const f = add('<p class="mine"></p>'); f.querySelector(".mine").textContent = ORDER;
        app.classList.remove("composing"); pcT.textContent = ""; pCompose.classList.remove("ready");
        const m = x3msg('<span class="from">From your phone</span>', "me"); m.append(ORDER);
      });
      // the test, again
      let tc = null;
      T(19500, () => focusOn("desk"));
      T(19800, () => { term('<span class="cmd">$ npm test -- --only 854</span>'); tc = add(TEST_RUN); say("Running test #854…"); step(3, "working", "running"); });
      T(21000, () => {
        term('  #854 notify › sends one mail per signup ..... <span class="ok">passed (1.9s)</span>');
        wat(250, () => term('  <span class="ok">1,212 passed</span>'));
        const card = tc.querySelector(".tcard");
        card.querySelector("b").textContent = "Passed in 1.9s";
        const r = card.querySelector(".res"); r.className = "res ok"; r.textContent = "1,212 of 1,212 pass";
      });
      // and ship
      T(21700, () => { step(3, "done", "done"); x3msg("All 1,212 pass. Shipping."); term('<span class="cmd">$ xode ship</span>'); say("Shipping…"); });
      T(22300, () => term('  <span class="ok">merged</span>   #128 into main'));
      T(22700, () => focusOn("phone"));
      T(22900, () => { term('  <span class="ok">deployed</span> to leafandco.in'); add(SHIP); say("Shipped", false); });
      // every day at 8
      T(23900, () => { tell(LINES.routine); add(ROUTINE); x3msg("Every day at 8:00 I'll mail you the updated user list."); say("Every day at 8:00", false); });
      // the next morning, the mail arrives
      T(25300, () => { pDay.classList.add("in"); clock.style.opacity = "0"; wat(250, () => { clock.textContent = "8:00"; clock.style.opacity = "1"; }); });
      T(26300, () => { pDay.classList.remove("in"); pNotif.classList.add("in"); });
      // a moment with the mail in, then the finale
      act4(C + 29200);
    }

    // ---- the finale: the desktop goes, the phone takes the middle ----
    const monitorEl = work.querySelector(".monitor"), phoneEl = work.querySelector(".phone");
    const pFood = document.createElement("div");
    pFood.className = "p-notif";
    pFood.innerHTML = '<span class="ico"><span class="food">🍔</span></span><div><div class="top"><span>Corner Kitchen</span><span>now</span></div>'
      + '<b>Your food has arrived</b><span>Burger, fries and a cold coffee. Hot, and just as you like.</span></div>';
    const pFaceEnd = document.createElement("div");
    pFaceEnd.className = "p-face-end";
    if (iconSvg) { const c = iconSvg.cloneNode(true); c.removeAttribute("id"); pFaceEnd.appendChild(c); }
    app.append(pFood, pFaceEnd);
    let faceAnims = [];
    // the face puts itself together as at the end of the film: the whole mark
    // rising, its dots arriving ring by ring, the visor with the first ring
    // that shows, a shine, and the antennae springing up from their roots
    function faceIn() {
      faceAnims.forEach((a) => a.cancel()); faceAnims = [];
      pFaceEnd.classList.remove("alive");
      pFaceEnd.classList.add("in");
      const svg = pFaceEnd.querySelector("svg");
      if (!svg) return;
      faceAnims.push(pFaceEnd.animate([{ transform: "translateY(10px) scale(.9)", opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 700, easing: "cubic-bezier(.2, .8, .3, 1)", fill: "both" }));
      [...svg.querySelectorAll(".dots > g")].forEach((g, i) => faceAnims.push(g.animate(
        [{ transform: "scale(.86)", opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 480, delay: 30 + i * 45, easing: "cubic-bezier(.2, .8, .3, 1.12)", fill: "both" })));
      const visor = svg.querySelector(".visor"), gloss = svg.querySelector(".gloss");
      if (visor) faceAnims.push(visor.animate([{ transform: "scale(.96)", opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 360, delay: 175, easing: "cubic-bezier(.2, .8, .3, 1)", fill: "both" }));
      if (gloss) faceAnims.push(gloss.animate([{ transform: "skewX(-22deg) translateX(0px)" }, { transform: "skewX(-22deg) translateX(900px)" }],
        { duration: 1000, delay: 620, easing: "cubic-bezier(.45, 0, .2, 1)", fill: "both" }));
      [...svg.querySelectorAll(".ant")].forEach((a, i) => faceAnims.push(a.animate(
        [{ transform: `scale(.3) rotate(${i ? 10 : -10}deg)`, opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 640, delay: 320 + i * 70, easing: "cubic-bezier(.3, 1.3, .5, 1)", fill: "both" })));
      wat(1300, () => pFaceEnd.classList.add("alive"));
    }
    // on to the next view: the first time only, and only for someone still here
    function glideOn() {
      const next = work.nextElementSibling;
      if (runs > 1 || reduced || !next || Math.abs(work.getBoundingClientRect().top) > 120) return;
      const from = scrollY, to = next.getBoundingClientRect().top + scrollY, dur = 1150;
      let t0 = 0, raf = 0;
      const stop = () => {
        cancelAnimationFrame(raf);
        ["wheel", "touchstart", "keydown"].forEach((e) => removeEventListener(e, stop));
        setTimeout(() => { scroll.quiet = false; }, 150);
      };
      ["wheel", "touchstart", "keydown"].forEach((e) => addEventListener(e, stop, { passive: true }));
      scroll.quiet = true;
      const step = (t) => {
        t0 ||= t;
        const k = Math.min(1, (t - t0) / dur);
        scrollTo(0, from + (to - from) * easeIO(k));
        if (k < 1) raf = requestAnimationFrame(step); else stop();
      };
      raf = requestAnimationFrame(step);
    }

    function act4(D) {
      const T = (ms, fn) => wat(D + ms, fn);
      // the desktop fades away; the phone takes the middle
      T(0, () => { focusOn(null); tell(LINES.done); pNotif.classList.remove("in"); monitorEl.classList.add("away"); });
      T(300, () => phoneEl.classList.add("center"));
      // its screen empties as it moves; it is 10:29, thirty-one minutes after the order
      T(600, () => {
        feed.querySelectorAll(".f").forEach((f) => drop(f));
        clock.style.opacity = "0";
        wat(250, () => { clock.textContent = "10:29"; clock.style.opacity = "1"; });
        pillName.textContent = "X0 Bot"; say("Here if you need me", false);
      });
      // the food arrives: the camera inside the phone goes in close on it, comes back out, and holds
      T(1900, () => pFood.classList.add("in"));
      T(2600, () => { app.classList.add("cam"); app.style.setProperty("--z", "1.75"); });
      T(4100, () => app.style.setProperty("--z", "1"));
      // the notification goes, all the way, before anything else moves
      T(6600, () => pFood.classList.remove("in"));
      T(7400, () => { app.classList.remove("cam"); app.classList.add("bare"); });
      // then the face, smoothly
      T(8000, () => faceIn());
      // a hold, then on to the next view
      T(11300, () => glideOn());
      T(12600, () => work.classList.add("rest"));
    }

    function reset() {
      wstop();
      focusOn(null);
      tell(LINES.setup, true);
      work.classList.remove("rest");
      feed.textContent = "";
      drawInbox(true);
      drawSetup();
      drawScene2();
      feed.classList.remove("center");
      drawScene3();
      pillName.textContent = "X0 Bot"; clock.textContent = "9:58"; clock.style.opacity = "";
      app.classList.remove("composing"); pcT.textContent = ""; pCompose.classList.remove("ready");
      pNotif.classList.remove("in"); pDay.classList.remove("in");
      monitorEl.classList.remove("away"); phoneEl.classList.remove("center"); app.classList.remove("bare");
      app.classList.remove("cam"); app.style.setProperty("--z", "1");
      pFood.classList.remove("in"); faceAnims.forEach((x) => x.cancel()); faceAnims = []; pFaceEnd.classList.remove("in", "alive");
      shown = 0; counts.forEach((e) => { e.textContent = 0; });
      stateEl.textContent = "Setting up mail…";
      app.classList.remove("busy");
    }

    function endState() {
      tell(LINES.done, true);
      setupEl.classList.add("gone");
      drawInbox(false);
      scene3El.classList.add("on");
      x3.start.classList.add("gone");
      Object.keys(x3.files).forEach((k) => flag(k, ["mig", "api", "test"].includes(k) ? "A" : "M"));
      x3.code.querySelector('[data-k="old"]').classList.add("del");
      const nl = x3.code.querySelector('[data-k="new"]'); nl.classList.remove("hid"); nl.classList.add("add"); nl.querySelector(".c").textContent = nl.dataset.text;
      x3msg("", "me").textContent = TASK;
      const mm = x3msg('<span class="from">From your phone</span>', "me"); mm.append(ORDER);
      x3msg("All 1,212 pass. Shipped. Every day at 8:00 I'll mail you the updated user list.");
      term('<span class="cmd">$ xode ship</span>'); term('  <span class="ok">merged</span>   #128 into main'); term('  <span class="ok">deployed</span> to leafandco.in');
      const f = add('<p class="mine"></p>'); f.querySelector(".mine").textContent = ORDER;
      add(SHIP); add(ROUTINE);
      pillName.textContent = "Xode"; clock.textContent = "8:00"; stateEl.textContent = "Every day at 8:00";
      monitorEl.classList.add("away"); phoneEl.classList.add("center"); app.classList.add("bare");
      feed.textContent = ""; clock.textContent = "10:29";
      pFaceEnd.classList.add("in", "alive");
      work.classList.add("rest");
    }

    function run() {
      runs++;
      reset();
      window.__workT0 = performance.now();   // for the timing probe
      if (reduced) { endState(); return; }

      // ---------- SET UP, on the desktop ----------
      focusOn("desk");
      say("Setting up mail…");
      wat(300, () => typingThen("Let's bring Leaf & Co.'s mail in.", 700));
      // 1. the business and its domain
      wat(500, () => pointAt(su.name, .3, .5));
      wat(1000, () => { const d = typeIn(su.name, "Leaf & Co."); wat(d + 150, () => pointAt(su.domain, .3, .5)); wat(d + 450, () => typeIn(su.domain, "leafandco.in", 62)); });
      wat(2900, () => su.made.classList.add("in"));
      wat(3200, () => pointAt(btnOf(1)));
      wat(3800, () => click(btnOf(1)));
      // 2. the records, each checked live
      wat(3950, () => { stepTo(2); say("Checking records…"); });
      [4500, 4850, 5200, 5550].forEach((ms, i) => wat(ms, () => { su.recs[i].classList.add("found"); su.recs[i].querySelector("em").textContent = "Found"; }));
      wat(5800, () => su.ok.classList.add("in"));
      wat(6000, () => pointAt(btnOf(2)));
      wat(6600, () => click(btnOf(2)));
      // 3. its personality, read from its website
      wat(6750, () => { stepTo(3); say("Reading leafandco.in…"); });
      wat(7650, () => { su.read.textContent = "How Leaf & Co. sounds"; su.read.classList.add("done"); });
      [7700, 7900, 8100].forEach((ms, i) => wat(ms, () => su.voice[i].classList.add("in")));
      wat(8450, () => pointAt(btnOf(3)));
      wat(9050, () => click(btnOf(3)));
      // 4. how it answers: drafts for the person, as it starts
      wat(9200, () => stepTo(4));
      wat(9750, () => pointAt(btnOf(4)));
      wat(10350, () => click(btnOf(4)));
      wat(10500, () => { stepTo(5); su.cursor.classList.add("hide"); });
      wat(11300, () => { setupEl.classList.add("gone"); say("Ready", false); typingThen("hello@leafandco.in is live.", 500); });
      // the mail arrives, newest landing on top
      const A = 11800;
      const rows = [...rowsEl.querySelectorAll(".mrow")].reverse();
      rows.forEach((r, i) => wat(A + i * 50, () => r.classList.remove("wait")));
      wat(A, () => count(45, 1100));

      // ---------- THEN the phone works through it ----------
      const S = A + 1500;
      wat(S, () => { focusOn("phone"); tell(LINES.inbox); say("Reading your inbox…"); typingThen("45 new for hello@leafandco.in. Sorting them.", 750); });
      wat(S + 1150, () => say("Sorting…"));
      rowsEl.querySelectorAll(".r").forEach((r, i) => wat(S + 1150 + i * 55, () => r.classList.add("tagged")));
      wat(S + 2550, () => { rowsOf("news").forEach((r, i) => wat(i * 90, () => r.closest(".mrow").classList.add("gone"))); count(31); });
      wat(S + 3050, () => typingThen("Archived 14 newsletters. Marked 19 updates as read.", 600));
      wat(S + 3750, () => { rowsOf("fyi").forEach((r, i) => wat(i * 60, () => r.classList.add("read"))); count(12); });

      wat(S + 4550, () => { say("Drafting replies…"); draft("Priya Sharma", "PS", "clay", "Order #1042", "Namaste Priya ji! Aapka order kal dispatch ho gaya, 3–4 din mein pahunch jayega."); });
      wat(S + 6250, () => draft("Marta Ruiz", "MR", "sea", "¿Madrid?", "¡Hola Marta! Sí, enviamos a Madrid en 7 a 10 días."));
      wat(S + 7550, () => draft("Hotel Saffron", "HS", "pine", "Lobby plants", "Thank you! Sharing our wholesale list. Could we talk Thursday at 5?"));
      wat(S + 8750, () => { const f = add('<p class="andmore">and 8 more, in your voice</p>'); f.dataset.k = "more"; });

      let askItem = null;
      wat(S + 9350, () => {
        say("Waiting for your OK", false);
        askItem = add(`<div class="ask"><div class="q">${PLANE}<span>X0 Bot wants to send 11 replies</span></div>`
          + '<div class="sub">Written the way Leaf &amp; Co. writes. Nothing goes until you say so.</div>'
          + '<div class="who"><span class="av c-clay">PS</span><span class="av c-sea">MR</span><span class="av c-pine">HS</span><span>Priya, Marta, Hotel Saffron and 8 more</span></div>'
          + '<div class="btns"><span class="btn go">Send all<i class="tapring"></i></span><span class="btn no">Review</span></div></div>');
      });
      wat(S + 10450, () => {
        const card = askItem.querySelector(".ask"), btn = card.querySelector(".go");
        card.style.position = "relative";
        const fin = document.createElement("i");
        fin.className = "finger";
        fin.style.left = (btn.offsetLeft + btn.offsetWidth * .7 - 23) + "px";
        fin.style.top = (btn.offsetTop + btn.offsetHeight / 2 - 23) + "px";
        card.appendChild(fin);
        void fin.offsetWidth;
        fin.classList.add("on");
        wat(420, () => {
          fin.classList.add("tap"); btn.classList.add("press");
          const ring = btn.querySelector(".tapring");
          ring.style.left = (btn.offsetWidth * .7 - 15) + "px"; ring.style.top = (btn.offsetHeight / 2 - 15) + "px";
          ring.classList.add("on");
        });
        wat(560, () => { btn.classList.remove("press"); fin.classList.remove("tap"); });
        wat(760, () => fin.classList.remove("on"));
      });
      wat(S + 11300, () => {
        focusOn("desk");   // the replies landing in the inbox
        say("Sending…");
        drop(askItem);
        add(`<div class="sent">11 replies sent</div>`);
        // the drafts stay, and say what happened to them
        feed.querySelectorAll(".draft small").forEach((sm, i) => wat(120 + i * 110, () => { sm.textContent = "Sent"; sm.classList.add("sent-ok"); }));
        rowsOf("reply").forEach((r, i) => wat(i * 90, () => {
          r.classList.add("read", "replied");
          r.querySelector(".chip").textContent = "Replied";
        }));
        count(1, 900);
      });

      wat(S + 12450, () => { focusOn("phone"); typingThen("That's 44 handled. One needs you.", 600); });
      wat(S + 13450, () => {
        add(handback());
        rowsOf("needs").forEach((r) => r.classList.add("flag"));
        say("1 thing needs you", false);
      });
      // a moment to read the hand-back, then the second story
      act2(S + 16000);
    }

    reset();
    replayW.addEventListener("click", run);
    new IntersectionObserver((es, ob) => {
      if (es.some((e) => e.isIntersecting) && !ran) { ran = true; ob.disconnect(); run(); }
    }, { threshold: .55 }).observe(work);
  }
}

// ---------------------------------------------------------------------------
// THE GALLERY. Six looping cards, one at a time, in place: each plays its loop
// once from the top while its line sits beside it, then the next comes in. The
// bar under the box shows how far through it is, and picks another. It pauses
// under the pointer and while the gallery is off screen.
// ---------------------------------------------------------------------------
{
  const gifs = document.getElementById("gifs"), deck = document.getElementById("deck");
  if (deck) {
    const cards = [...deck.querySelectorAll(".gc")];
    const dots = [...gifs.querySelectorAll(".g-dot")];
    const tell = sayer(gifs.querySelector(".show-say"));

    // Blip's face in the meeting, and as the icon of each reminder
    const icon = document.getElementById("icon");
    if (icon) {
      const face = deck.querySelector(".m-face");
      if (face) { const c = icon.cloneNode(true); c.removeAttribute("id"); face.appendChild(c); }
      const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
        icon.outerHTML.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace(' id="icon"', ""));
      deck.querySelectorAll(".r-ico").forEach((img) => { img.src = src; });
    }

    // each card is designed at 480x272 and scaled to the box
    const fit = () => { const k = (deck.clientWidth / 480).toFixed(4); cards.forEach((c) => c.firstElementChild.style.setProperty("--k", k)); };
    new ResizeObserver(fit).observe(deck);
    fit();

    let cur = -1, left = 0, total = 1, last = 0, visible = false, held = false;
    function restart(c) {
      const inner = c.firstElementChild;
      inner.style.display = "none"; void inner.offsetWidth; inner.style.display = "";
      inner.querySelectorAll("video").forEach((v) => { try { v.currentTime = 0; v.play().catch(() => {}); } catch (e) {} });
    }
    function show(n) {
      const prev = cards[cur];
      cur = (n + cards.length) % cards.length;
      const c = cards[cur];
      cards.forEach((o) => o.classList.remove("was"));
      if (prev && prev !== c) { prev.classList.remove("on"); prev.classList.add("was"); }
      c.classList.add("on");
      restart(c);
      tell([c.dataset.k, c.dataset.h, c.dataset.p], prev === undefined);
      left = total = (+c.dataset.s || 10) * 1000;
      dots.forEach((d, i) => { d.setAttribute("aria-current", String(i === cur)); d.style.setProperty("--p", "0"); });
    }
    show(0);

    function tick(t) {
      requestAnimationFrame(tick);
      const dt = last ? t - last : 0; last = t;
      if (!visible || held || reduced) return;
      left -= dt;
      dots[cur].style.setProperty("--p", Math.min(1, 1 - left / total).toFixed(4));
      if (left <= 0) show(cur + 1);
    }
    requestAnimationFrame(tick);
    dots.forEach((d, i) => d.addEventListener("click", () => show(i)));
    const box = gifs.querySelector(".show-box");
    box.addEventListener("pointerenter", () => { held = true; gifs.classList.add("held"); });
    box.addEventListener("pointerleave", () => { held = false; gifs.classList.remove("held"); });
    new IntersectionObserver((es) => {
      const was = visible;
      visible = es.some((e) => e.isIntersecting);
      gifs.classList.toggle("off", !visible);
      if (visible && !was) show(cur);
    }, { threshold: .35 }).observe(gifs);
  }
}
