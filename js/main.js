// The page: the stage (stage.js: the fabric, the hand on the water, the key), then the opening film and the views below it.
import { easeIO, reduced, view } from "./util.js";
import { splash } from "./paper/water.js";
import { scroll } from "./stage.js";
import "./tone.js";
import "./minis.js";
import "./game.js";
import { blip } from "./blip/kit.js";

// ---------------------------------------------------------------------------
// THE STAGE'S CLOCK. Every beat of the stage (the conversation in the card and
// the stories it opens into) is put on this clock, not on setTimeout, so the
// whole of it can be run faster: on a first visit the page does not scroll,
// and scrolling down fast-forwards the stage instead. The clock runs at
// 1 + boost; the boost comes from the scroll and dies away by itself. The
// stage's CSS transitions and animations are run at the same rate.
// ---------------------------------------------------------------------------
const stageClock = (() => {
  let q = [], vnow = 0, boost = 0, lastT = 0, raf = 0, sped = false;
  const stageEl = document.getElementById("stage");
  function tick(t) {
    const dt = lastT ? Math.min(100, t - lastT) : 0;
    lastT = t;
    boost = boost * Math.exp(-dt / 420);
    if (boost < .02) boost = 0;
    const rate = 1 + boost;
    vnow += dt * rate;
    // the animations follow in steps of a half, and one not yet started is left until it has (changing an animation's
    // rate every frame, or before it starts, keeps it on its first frame)
    if (stageEl && (boost || sped)) {
      const r = Math.round(rate * 2) / 2;
      stageEl.getAnimations({ subtree: true }).forEach((a) => {
        if (!a.pending && a.playbackRate !== r) a.updatePlaybackRate ? a.updatePlaybackRate(r) : (a.playbackRate = r);
      });
      sped = r !== 1;
    }
    for (;;) {                                  // one at a time, soonest first: a beat may cancel or add beats
      let k = -1;
      q.forEach((x, i) => { if (x.t <= vnow && (k < 0 || x.t < q[k].t)) k = i; });
      if (k < 0) break;
      const [x] = q.splice(k, 1);
      x.fn();
    }
    if (q.length || boost) raf = requestAnimationFrame(tick);
    else { raf = 0; lastT = 0; }
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  return {
    at(ms, fn) { const x = { t: vnow + ms, fn }; q.push(x); kick(); return x; },
    cancel(x) { const i = q.indexOf(x); if (i >= 0) q.splice(i, 1); },
    hurry(n) { boost = Math.min(7, boost + n); kick(); },
    now: () => vnow,
  };
})();

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
  const reply = document.getElementById("reply"), bubble = document.getElementById("bubble");
  const endmark = document.getElementById("endmark");
  const icon = document.getElementById("icon");
  const filmsay = document.getElementById("filmsay");
  const next = card.closest("section")?.nextElementSibling;   // the view the film hands over to
  const LINE = "hey X0";

  let played = 0;

  let timers = [];
  const at = (ms, fn) => { timers.push(stageClock.at(ms, fn)); };
  const stopAll = () => { timers.forEach(stageClock.cancel); timers = []; };
  const hurry = stageClock.hurry;

  // ---- every visit: the page waits for the stage ----
  // On every load (a visit or a refresh) the page starts at the top and stays
  // on the stage until its first round has played through, and a scroll down
  // plays it faster. When it ends the page moves on by itself and is let go;
  // from then on, until the next load, it scrolls as normal. Not for a link
  // to a part further down (#...), or for reduced motion.
  let held = !reduced && !!next && !location.hash;
  const typing = (e) => e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable]");
  const SCROLL_KEYS = { ArrowDown: 1.2, PageDown: 2.2, " ": 2.2, Spacebar: 2.2, End: 3, ArrowUp: 0, PageUp: 0, Home: 0 };
  let touchY = null;
  const onWheel = (e) => { e.preventDefault(); if (held && e.deltaY > 0) hurry(Math.min(e.deltaY, 160) * (e.deltaMode ? .4 : .012)); };
  const onTouchStart = (e) => { touchY = e.touches[0]?.clientY ?? null; };
  const onTouchMove = (e) => {
    e.preventDefault();
    const y = e.touches[0]?.clientY;
    if (held && touchY != null && y != null && touchY - y > 0) hurry((touchY - y) * .03);
    touchY = y ?? null;
  };
  const onKey = (e) => {
    if (typing(e) || !(e.key in SCROLL_KEYS)) return;
    e.preventDefault();
    if (held && SCROLL_KEYS[e.key]) hurry(SCROLL_KEYS[e.key]);
  };
  let pinned = false;
  const pin = () => { if (pinned && scrollY !== 0) scrollTo(0, 0); };
  function release() {
    if (!held) return;
    held = pinned = false;
    removeEventListener("scroll", pin);
    document.documentElement.classList.remove("film-held");
    // a moment longer, so a scroll still going when the page lands does not carry it past the view it landed on
    setTimeout(() => {
      removeEventListener("wheel", onWheel);
      removeEventListener("touchstart", onTouchStart);
      removeEventListener("touchmove", onTouchMove);
      removeEventListener("keydown", onKey);
    }, 700);
  }
  if (held) {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    scrollTo(0, 0);
    pinned = true;
    addEventListener("wheel", onWheel, { passive: false });
    addEventListener("touchstart", onTouchStart, { passive: true });
    addEventListener("touchmove", onTouchMove, { passive: false });
    addEventListener("keydown", onKey);
    addEventListener("scroll", pin, { passive: true });
    document.documentElement.classList.add("film-held");
    setTimeout(release, 240000);                // whatever happens, never keep someone for good
  }

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
  function typeOut(text, done) {
    let i = 0;
    const each = text.length > 12 ? .62 : 1;     // a longer ask is typed a little quicker
    const step = () => {
      i++;
      ty.textContent = text.slice(0, i);
      if (i === 1) box.classList.add("ready");
      if (i < text.length) at((85 + Math.random() * 90 + (text[i] === " " ? 60 : 0)) * each, step);
      else if (done) done();
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
    // held on this load: the stage has played through, so the page goes on, and
    // the scroll it was holding is handed back once it gets there
    const first = held;
    if (first) pinned = false;
    if (!first && (played > 1 || reduced || !next || scrollY > 40)) return;   // never yank someone who has scrolled
    const from = scrollY, to = next.getBoundingClientRect().top + scrollY, dur = 1150;
    let t0 = 0, raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      ["wheel", "touchstart", "keydown"].forEach((e) => removeEventListener(e, stop));
      if (first) release();
      setTimeout(() => { scroll.quiet = false; }, 150);
    };
    // a scroll stops the glide, except the first time, when it is part of it
    if (!first) ["wheel", "touchstart", "keydown"].forEach((e) => addEventListener(e, stop, { passive: true }));
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

  // ===========================================================================
  // THE STAGE: one conversation, in the card. Something is asked in the box and
  // X0 answers; then the card opens up into a desktop and a phone (it is the
  // desktop's screen, pulled back from) and the thing is done, there, in front
  // of you (the stories, THE WORK VIEW below); then they fold back into the card
  // for the next. After the last, the phone, in the middle, comes back out to
  // be the card, the face on it, and it all goes round again.
  // ===========================================================================
  const stage = card.closest(".stage");
  const BEATS = [
    [null, "hey X0", "Here, at your service."],
    ["mail", "Set up mail for leafandco.in", "On it. Your mail, in minutes."],
    ["food", "Dinner tonight? Surprise me.", "On it. Something you'll love."],
    ["code", "Ship the Notify me button.", "On it. Tested before it ships."],
    ["meet", "Sit in on my 10:00, take notes.", "On it. Notes to everyone after."],
  ];
  // how long each story runs once the screens are up (its own clock, THE WORK VIEW), for the tabs' bars
  const LEN = { mail: 29300, food: 13600, code: 29200, meet: 28700 };
  const S = () => window.__stories;
  const narrow = () => matchMedia("(max-width: 760px)").matches;

  // ---- one exchange: the ask typed in the box, sent, and X0's answer, close up ----
  function exchange(ask, answer, then) {
    box.classList.remove("in", "out", "ready"); send.classList.remove("press"); ty.textContent = "";
    reply.classList.remove("in", "spoken", "gone"); bubble.textContent = answer;
    camTo("50% 50%", 1, true);
    at(300, () => box.classList.add("in"));
    at(600, () => {
      const t = box.querySelector(".ty");
      // a short ask, a close push on its first letters; a longer one, a gentle push on the middle, so it all stays in
      if (ask.length < 10) shootAt(box.offsetLeft + t.offsetLeft + 26, box.offsetTop + box.offsetHeight / 2, 2.05);
      else camTo("50% 50%", narrow() ? 1 : 1.12);
      at(250, () => typeOut(ask, () => {
        at(260, () => send.classList.add("press"));
        at(460, () => box.classList.add("out"));
        at(830, () => { camTo("50% 50%", 1, true); reply.classList.add("in"); });
        at(1060, () => camTo("50% 50%", answer.length > 24 ? 1.3 : 1.75));
        at(1700, () => { reply.classList.add("spoken"); if (filmsay) filmsay.textContent = "X0 Bot: " + answer; });
        at(2950, () => { reply.classList.add("gone"); knock(.5, .35, 2.8); });
        at(3520, () => { wide(true); then(); });
      }));
    });
  }

  // ---- the card into the desktop's screen, and back out of a screen into the card ----
  function flipOnto(r1) {
    card.style.transform = "none";
    const r0 = card.getBoundingClientRect();
    return `translate(${(r1.left - r0.left).toFixed(1)}px, ${(r1.top - r0.top).toFixed(1)}px) scale(${(r1.width / r0.width).toFixed(4)}, ${(r1.height / r0.height).toFixed(4)})`;
  }
  function toDevices(then) {
    stage.classList.add("devices-on");                     // the box, the bezel and the stand, and the phone sliding up (CSS)
    if (narrow() || reduced) { card.classList.add("hide"); at(650, then); return; }
    const t = flipOnto(S().screen().getBoundingClientRect());
    card.style.transform = "none"; card.classList.add("morph"); void card.offsetWidth;
    card.style.transform = t;
    knock(.3, .3, 2.6); knock(.7, .3, 2.6);
    at(1080, () => card.classList.add("hide"));              // the card was the screen: it lets the real one show
    at(1380, () => { card.classList.remove("morph"); card.style.transform = ""; then(); });
  }
  function toCard(from, then) {
    if (narrow() || reduced) { card.classList.remove("hide"); stage.classList.remove("devices-on"); at(650, then); return; }
    card.classList.add("cut"); card.style.transform = flipOnto(from.getBoundingClientRect()); void card.offsetWidth;
    card.classList.remove("cut", "hide");                  // the card fades in over that screen...
    at(280, () => {                                          // ...and grows back out of it, the screens folding away
      stage.classList.remove("devices-on");
      card.classList.add("morph"); void card.offsetWidth; card.style.transform = "";
      knock(.3, .3, 2.6); knock(.7, .3, 2.6);
    });
    at(1420, () => { card.classList.remove("morph"); then(); });
  }

  // ---- the stories as tabs: which is on, how far it has got, and a way to jump to one ----
  const tabs = [...document.querySelectorAll("#workTabs .tab")];
  let tabOn = -1, tabT0 = 0, tabLen = 1;
  function setTab(i, len) {
    tabOn = i; tabT0 = stageClock.now(); tabLen = len;
    tabs.forEach((b, k) => { b.classList.toggle("on", k === i); if (k !== i) b.style.setProperty("--p", k < i ? "1" : "0"); });
  }
  (function tabsTick() {
    requestAnimationFrame(tabsTick);
    if (tabOn >= 0) tabs[tabOn].style.setProperty("--p", Math.min(1, (stageClock.now() - tabT0) / tabLen).toFixed(4));
  })();

  // ---- the conversation, beat by beat ----
  let seen = true, waiting = null;
  const whenSeen = (fn) => { if (seen) fn(); else waiting = fn; };
  new IntersectionObserver((es) => {
    seen = es.some((e) => e.isIntersecting);
    if (seen && waiting) { const fn = waiting; waiting = null; fn(); }
  }, { threshold: .3 }).observe(card);

  function beat(i) {
    const [story, ask, answer] = BEATS[i];
    if (i === 0) {
      reset(); played++;
      window.__filmT0 = performance.now();
      tabOn = -1; tabs.forEach((b) => { b.classList.remove("on"); b.style.setProperty("--p", "0"); });
    }
    if (story) setTab(tabs.findIndex((b) => b.dataset.story === story), 5600 + 2800 + LEN[story]);
    exchange(ask, answer, () => {
      if (!story) { beat(1); return; }
      S().prep(story);
      toDevices(() => S().play(story, () => {
        const last = story === "meet";
        if (last) iconAtRest();                              // the face on the phone comes back out as the card's
        toCard(last ? S().phone() : S().screen(), () => {
          if (!last) { whenSeen(() => beat(i + 1)); return; }
          if (held) moveOn();                                // the first time through: the page moves on, and is let go
          at(2600, () => anims.push(endmark.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 550, fill: "forwards", easing: "ease-in" })));
          at(3300, () => whenSeen(() => beat(0)));
        });
      }));
    });
  }
  function jump(i) {                                         // a tab: straight to that story's ask
    reset(); waiting = null;
    S().stop(); S().reset();
    stage.classList.remove("devices-on"); card.classList.remove("hide", "morph", "cut"); card.style.transform = "";
    if (reduced) { stage.classList.add("devices-on"); card.classList.add("hide"); S().play(BEATS[i][0]); setTab(i - 1, 1); return; }
    beat(i);
  }
  tabs.forEach((b) => b.addEventListener("click", () => jump(BEATS.findIndex((x) => x[0] === b.dataset.story))));

  function play() {
    if (reduced) { reset(); finale(false); return; }
    beat(0);
  }

  // Start once the fonts are in, so the first frames are set in the right face.
  const go = () => { setTimeout(play, 500); stage.classList.add("written"); };
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

    // ---- the line beside it, one per story ----
    const tell = sayer(work.querySelector(".show-say"));
    const LINES = {
      setup: ["Mail", "Your business email, live in minutes.", "Bring your domain. X0 Bot makes hello@, checks every record and learns how you sound."],
      inbox: ["Mail", "45 emails. 44 handled. One left for you.", "It sorts, drafts replies in your voice, and asks before anything is sent."],
      food: ["Food", "Say you're hungry. Dinner's sorted.", "It knows what you like, picks it, orders it, and tells you when it's close."],
      code: ["Code", "Ship from your phone.", "Xode reads your repos, plans the work, writes it and tests it. You approve."],
      routine: ["Routines", "Ask once. It happens every day.", "Every morning at 8, the updated user list is in your mail."],
      meet: ["Meetings", "It takes the notes. You make the calls.", "X0 Bot sits in on the call, writes down what was decided, and hands everyone their to-dos."],
      remind: ["Reminders", "Nothing slips. Not even for your team.", "Reminders for you, and for the people you work with, at the moment they need them."],
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
      ["Emma Clarke", "EC", "plum", "Invoice #2231", "Invoice for 120 ceramic pots, November", "9:58", "needs"],
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
      ["Calendar", "Ca", "stone", "Supplier call moved to 3:30", "Emma Clarke · 30 min", "8:55", "fyi"],
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
    const wat = (ms, fn) => { wt.push(stageClock.at(ms, fn)); };      // on the stage's clock (THE STAGE'S CLOCK, above)
    const wstop = () => { wt.forEach(stageClock.cancel); wt = []; };
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
        + '<div class="t">Emma Clarke · Invoice #2231</div>'
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
    // ---- Blip in the food story, the real one (js/blip/kit.js): he peeks round the screen's right edge, comes in to
    // the middle to listen, then goes up out of the way, small, looking about while the food comes. Drawn on a canvas
    // in the scene, in the mail screen's own 1040x650 design pixels.
    function foodBlip(host) {
      const B = blip();
      if (!B) return null;
      const cv = document.createElement("canvas");
      cv.className = "s2-cv"; cv.setAttribute("aria-hidden", "true");
      host.prepend(cv);       // under the words and the cards
      const g = cv.getContext("2d");
      const PEEK_H = 210, edge = B.createBlip({ height: PEEK_H });
      const me = B.createPerformer({ dpr: 2 });
      // where he stands in each part: feet (x, y), height H
      const SPOT = { off: [1150, 400, 180], mid: [520, 398, 180], up: [520, 150, 92] };
      let mode = "off", from = SPOT.off, to = SPOT.off, t0 = 0, T = 1, fx = -1, raf = 0, k = 0;
      const io = (u) => u * u * (3 - 2 * u);
      const want = () => Math.min(3, (mailScreen.clientWidth / 1040) * Math.min(2, devicePixelRatio || 1));
      function fit() { k = want(); cv.width = Math.round(1040 * k); cv.height = Math.round(650 * k); }
      function frame(now) {
        raf = requestAnimationFrame(frame);
        if (Math.abs(want() - k) > .01) fit();           // the screen was resized
        g.setTransform(k, 0, 0, k, 0, 0); g.clearRect(0, 0, 1040, 650);
        // round the edge: his "up" is to the left, into the screen
        g.save(); g.translate(1040, 318); g.rotate(-Math.PI / 2);
        edge.draw(g, 0, 0, now / 1000, k);
        g.restore();
        if (mode === "off") { if (!edge.shown()) stop(); return; }
        const u = io(Math.min(1, (now - t0) / T));
        const x = from[0] + (to[0] - from[0]) * u, y = from[1] + (to[1] - from[1]) * u, H = from[2] + (to[2] - from[2]) * u;
        if (u >= 1 && mode === "walk") { mode = "listen"; me.play("listen"); }
        fx += ((mode === "walk" ? -1 : 1) - fx) * .18;          // he walks in facing left, then turns to face you
        g.save(); g.translate(x, y); g.scale(fx, 1); me.draw(g, 0, 0, H, now); g.restore();
      }
      function start() { if (!raf) { fit(); raf = requestAnimationFrame(frame); } }
      function stop() { cancelAnimationFrame(raf); raf = 0; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); }
      function go(m, a, b, ms) { mode = m; from = a; to = b; t0 = performance.now(); T = ms; start(); }
      return {
        peek() { edge.pose("peek"); start(); },
        heard() { edge.pose("listening"); },                    // "Hey X0": he lifts up, all attention
        comeIn() {                                              // round the edge and in, to the middle, to listen
          edge.pose("hidden");
          me.play("stroll");
          go("walk", SPOT.off, SPOT.mid, reduced ? 1 : 900);
        },
        up() { me.play("look"); go("up", SPOT.mid, SPOT.up, reduced ? 1 : 750); },
        clear() { edge.pose("hidden"); edge.snap(); mode = "off"; stop(); },
      };
    }

    function drawScene2() {
      scene2El.classList.remove("on", "listening");
      if (s2 && s2.blip) s2.blip.clear();
      scene2El.innerHTML = '<div class="s2-rings"><i></i><i></i><i></i></div>'
        + '<p class="s2-said hey"><span>Hey</span><span>X0</span></p>'
        + '<p class="s2-said hungry"><span>I\'m</span><span>hungry.</span></p>'
        + '<div class="s2-cards"></div>'
        + '<div class="s2-pill"><span class="wave"><i></i><i></i><i></i><i></i><i></i></span><span>Listening</span><kbd>Ctrl</kbd><kbd>Ctrl</kbd></div>'
        + `<i class="cursor hide">${CURSOR}</i>`;
      s2 = {
        blip: null, hey: scene2El.querySelector(".hey"), hungry: scene2El.querySelector(".hungry"),
        cards: scene2El.querySelector(".s2-cards"), pill: scene2El.querySelector(".s2-pill"), cursor: scene2El.querySelector(".cursor"),
      };
      s2.blip = foodBlip(scene2El) || { peek() {}, heard() {}, comeIn() {}, up() {}, clear() {} };
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
      wat(B + 800, () => s2.blip.peek());
      // called
      wat(B + 1900, () => { s2.pill.classList.add("on", "talking"); words(s2.hey, 260); s2.blip.heard(); });
      // he comes to the middle to listen
      wat(B + 2800, () => {
        s2.hey.classList.add("out");
        s2.blip.comeIn();
        scene2El.classList.add("listening");
        say("Listening…");
      });
      wat(B + 3500, () => words(s2.hungry, 300));
      // up out of the way, and the food comes
      wat(B + 4900, () => {
        s2.pill.classList.remove("talking", "on");
        s2.hungry.classList.add("out");
        scene2El.classList.remove("listening");
        s2.blip.up();
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
      chain(act3, B + 13600);
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
      chain(act5, C + 29200);
    }

    // ---- the fourth story: a meeting on the desktop, its notes and the reminders on the phone ----
    const scene4El = document.getElementById("scene4");
    const PEOPLE = [["Rahul", "/media/meet/call-1.mp4"], ["Arjun", "/media/meet/call-2.mp4"], ["Emma", "/media/meet/call-3.mp4"]];
    // what is said, by whom (an index into PEOPLE), and the note it becomes
    const SAID = [
      [0, "Can we launch the festive range on Friday?"],
      [2, "Yes, if the stock lands by Thursday.", "Decided: launch on Friday"],
      [1, "I'll restock the monstera before then.", "Arjun · restock the monstera"],
      [0, "Then I'll get the mailer out on Thursday.", "Rahul · festive mailer by Thursday"],
      [2, "And I'll send the revised invoice.", "Emma · send the revised invoice"],
    ];
    const REMS = [
      ["You · in 15 min", "Supplier call with Emma", "Her revised invoice is in your mail."],
      ["For Rahul · Thursday", "Festive mailer goes out", "Sent to Rahul, with the draft attached."],
      ["For Arjun · before Friday", "Restock the monstera", "Sent to Arjun · 12 left in stock."],
    ];
    const pRems = REMS.map(([top, b, sp], i) => {
      const n = document.createElement("div");
      n.className = "p-notif rem"; n.style.setProperty("--i", String(i));
      n.innerHTML = `<span class="ico">${faceSrc ? `<img alt="" src="${faceSrc}">` : ""}</span><div><div class="top"><span></span><span>now</span></div><b></b><span></span></div>`;
      n.querySelector(".top span").textContent = "X0 Bot · " + top; n.querySelector("b").textContent = b; n.querySelector("div > span:last-child").textContent = sp;
      app.appendChild(n);
      return n;
    });
    let x4 = {};
    function drawScene4() {
      scene4El.classList.remove("on", "ended");
      scene4El.querySelectorAll("video").forEach((v) => v.pause());
      scene4El.innerHTML = '<div class="x4-top"><i class="rec"></i><span>Leaf &amp; Co. · weekly</span><span class="x4-t">00:00</span><span class="x4-n">4 people</span></div>'
        + '<div class="x4-body"><div class="x4-grid">'
        + PEOPLE.map(([name, src]) => `<div class="x4-tile"><video src="${src}" muted loop playsinline preload="none"></video><span class="x4-name">${name}</span></div>`).join("")
        + `<div class="x4-tile x4-bot"><span class="x4-ring"></span>${faceSrc ? `<img alt="" src="${faceSrc}">` : ""}<span class="x4-name">X0 Bot · notes</span></div>`
        + '</div><div class="x4-notes"><b>Notes</b><small>Written as you talk</small><div class="x4-list"></div></div></div>'
        + '<div class="x4-cap"><b></b><span></span></div>'
        + '<div class="x4-end"><span>Call ended</span><b>Notes and to-dos sent to all four</b></div>';
      x4 = { tiles: [...scene4El.querySelectorAll(".x4-tile")], list: scene4El.querySelector(".x4-list"), cap: scene4El.querySelector(".x4-cap"),
        t: scene4El.querySelector(".x4-t"), bot: scene4El.querySelector(".x4-bot") };
    }
    function act5(M) {
      const T = (ms, fn) => wat(M + ms, fn);
      // the screens clear: the desktop is in a call
      T(0, () => {
        pNotif.classList.remove("in");
        scene4El.classList.add("on");
        scene4El.querySelectorAll("video").forEach((v) => { try { v.currentTime = 0; v.play().catch(() => {}); } catch (e) {} });
        feed.querySelectorAll(".f").forEach((f) => drop(f));
        clock.style.opacity = "0"; wat(250, () => { clock.textContent = "10:02"; clock.style.opacity = "1"; });
        pillName.textContent = "X0 Bot"; say("In your meeting…");
        focusOn("desk"); tell(LINES.meet);
      });
      // the call's clock
      for (let k = 1; k <= 9; k++) T(k * 1000, () => { x4.t.textContent = "00:" + String(11 + k * 3).padStart(2, "0"); });
      // what is said, in captions, the speaker lit; and the note it becomes, written by Blip
      SAID.forEach(([who, line, note], i) => {
        const at = 900 + i * 1650;
        T(at, () => {
          x4.tiles.forEach((t, j) => t.classList.toggle("talk", j === who));
          x4.cap.classList.remove("in"); void x4.cap.offsetWidth;
          x4.cap.querySelector("b").textContent = PEOPLE[who][0]; x4.cap.querySelector("span").textContent = line;
          x4.cap.classList.add("in");
        });
        if (note) T(at + 900, () => {
          x4.bot.classList.add("writing"); wat(700, () => x4.bot.classList.remove("writing"));
          const n = document.createElement("p"); n.className = "x4-li" + (i === 1 ? " dec" : ""); n.textContent = note;
          x4.list.appendChild(n); void n.offsetWidth; n.classList.add("in");
        });
      });
      // the call ends; the notes go to everyone, and to the phone
      T(9600, () => { x4.tiles.forEach((t) => t.classList.remove("talk")); x4.cap.classList.remove("in"); scene4El.classList.add("ended"); });
      T(10200, () => {
        focusOn("phone"); say("Sending the notes…");
        add('<div class="tcard"><span>Notes · weekly</span><b>Launch on Friday</b>Rahul: festive mailer by Thursday<br>Arjun: restock the monstera<br>Emma: send the revised invoice</div>');
      });
      T(11200, () => { say("Notes sent to all four", false); });
      // and the reminders, for you and for them
      T(12000, () => { tell(LINES.remind); pRems[0].classList.add("in"); });
      T(12800, () => pRems[1].classList.add("in"));
      T(13600, () => pRems[2].classList.add("in"));
      T(16600, () => pRems.forEach((n, i) => wat(i * 120, () => n.classList.remove("in"))));
      // then the finale
      act4(M + 17400);
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
      T(11300, () => (onDone ? finish() : glideOn()));
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
      drawScene4(); pRems.forEach((n) => n.classList.remove("in"));
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

    // ---- one story at a time, for the stage's conductor (THE STAGE, above): it asks X0 for something in the card,
    // opens the card up into these screens, plays the story, and is told when it is over. Played that way, a story
    // does not run on into the next; played on its own (onDone unset), the four run on as one.
    const STORY = { mail: 1, food: 1, code: 1, meet: 1 };
    let onDone = null, prepped = false;       // prepped: the screens are already set for the story about to play
    function finish() { const d = onDone; onDone = null; if (d) d(); }
    function chain(next, at) { if (onDone) wat(at, finish); else next(at); }
    window.__stories = {
      play(name, done) { onDone = done || null; run(name); },
      stop() { onDone = null; wstop(); },
      reset() { onDone = null; reset(); },
      /** The screens as the story `name` opens on, before the card opens up into them. */
      prep(name) {
        onDone = null; reset(); prepped = true;
        const sc = { food: scene2El, code: scene3El, meet: scene4El }[name];
        if (sc) { sc.style.transition = "none"; sc.classList.add("on"); void sc.offsetWidth; sc.style.transition = ""; }
      },
      screen: () => mailScreen,
      phone: () => appScreen,
    };

    function run(from) {
      const story = typeof from === "string" && STORY[from] !== undefined ? from : "mail";
      runs++;
      if (!prepped) reset();
      prepped = false;
      window.__workT0 = performance.now();   // for the timing probe
      if (reduced) { endState(); return; }
      if (story === "food") { act2(200); return; }
      if (story === "code") { act3(200); return; }
      if (story === "meet") { act5(200); return; }

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
      chain(act2, S + 16000);
    }

    reset();
  }
}

// ---------------------------------------------------------------------------
// THE ROAM. Seven journeys cut fast into one loop (media/roam/roam.mp4: fourteen
// one-second cuts, seven places twice round). The line writes itself in the
// first time the view is seen; the film plays only while it can be seen.
// ---------------------------------------------------------------------------
{
  const sec = document.getElementById("roam"), film = document.getElementById("roamFilm");
  if (sec && film) {
    new IntersectionObserver((es) => {
      const vis = es.some((e) => e.isIntersecting);
      if (vis) { sec.classList.add("seen"); if (!reduced) film.play().catch(() => {}); }
      else film.pause();
    }, { threshold: .3 }).observe(sec);
  }
}

// ---------------------------------------------------------------------------
// THE MINDS. Three films (media/minds: a night at the desk, a face lit by its
// thoughts, an observatory under the Milky Way) cut fast into shots, each its own framing of one of them with a
// slow push, and drawn as an orange dither: each frame is sampled down to a
// grid, levelled, and every cell is lit or not by a 4x4 ordered threshold, so
// the mid-tones come out as checkerboards. A cut flashes inverted for a frame.
// It runs only while the view can be seen.
// ---------------------------------------------------------------------------
{
  const sec = document.getElementById("minds");
  const frame = sec?.querySelector(".minds-frame");
  if (sec && frame) {
    const vids = [...frame.querySelectorAll("video")];
    const out = frame.querySelector("canvas"), octx = out.getContext("2d");
    const tcEl = frame.querySelector(".mf-tc"), nameEl = frame.querySelector(".mf-name");
    const NAMES = ["NIGHT SHIFT", "DEEP THOUGHT", "STARGAZER"];
    // [film, width of the framing as a part of the film's, its centre x, y, ms]
    const SHOTS = [
      [0, 1, .5, .5, 900], [1, .72, .5, .42, 520], [2, 1, .5, .5, 760], [0, .44, .62, .64, 420],
      [1, .48, .64, .4, 640], [2, .42, .64, .66, 460], [0, .4, .5, .47, 480], [2, .4, .6, .2, 520],
      [1, 1, .5, .5, 700], [0, .34, .84, .55, 380], [2, .5, .38, .5, 560], [1, .56, .48, .62, 480],
      [0, .62, .4, .45, 620], [2, .36, .6, .76, 400], [1, .38, .56, .34, 440],
    ];
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
    const COLS = 64, ROWS = 106;               // the picture's grid: 9:16 less the strip under it
    const grab = document.createElement("canvas"); grab.width = COLS; grab.height = ROWS;
    const gctx = grab.getContext("2d", { willReadFrequently: true });
    const tiny = document.createElement("canvas"); tiny.width = COLS; tiny.height = ROWS;
    const tctx = tiny.getContext("2d");
    const img = tctx.createImageData(COLS, ROWS);
    const lum = new Float32Array(COLS * ROWS), hist = new Uint32Array(64);
    const FIRE = [255, 90, 31], DARK = [7, 6, 5];

    let shot = 0, shotT = 0, t0 = 0, last = 0, raf = 0, on = false, flash = 0;
    const fit = () => { const r = Math.min(2, devicePixelRatio || 1); out.width = Math.round(out.clientWidth * r); out.height = Math.round(out.clientHeight * r); };
    new ResizeObserver(fit).observe(out);

    function draw(k) {                          // k: how far through the shot, for the push
      const [f, w0, cx, cy] = SHOTS[shot], v = vids[f];
      if (v.readyState < 2) return false;
      const W = v.videoWidth, H = v.videoHeight;
      const sw = W * w0 * (1 - .08 * k), sh = sw * ROWS / COLS;
      const sx = Math.max(0, Math.min(W - sw, W * cx - sw / 2)), sy = Math.max(0, Math.min(H - sh, H * cy - sh / 2));
      gctx.drawImage(v, sx, sy, sw, sh, 0, 0, COLS, ROWS);
      const px = gctx.getImageData(0, 0, COLS, ROWS).data;
      hist.fill(0);
      for (let i = 0, j = 0; i < lum.length; i++, j += 4) {
        const l = (px[j] * .3 + px[j + 1] * .59 + px[j + 2] * .11) / 255;
        lum[i] = l; hist[Math.min(63, l * 64 | 0)]++;
      }
      // levelled between its 3rd and 97th percentiles, so a dark film still uses the whole range
      let lo = 0, hi = 63, acc = 0;
      for (; lo < 63 && (acc += hist[lo]) < lum.length * .03; lo++);
      acc = 0; for (; hi > 0 && (acc += hist[hi]) < lum.length * .03; hi--);
      const a = lo / 64, span = Math.max(.08, (hi + 1) / 64 - a);
      const inv = flash > 0;
      const d = img.data;
      for (let y = 0, i = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++, i++) {
        // a floor, so the dark round a figure stays black, and a steep S, so shapes come out as solid fields
        const u = Math.min(1, Math.max(0, ((lum[i] - a) / span - .2) / .66)), l = u * u * (3 - 2 * u);
        const lit = (l > B[(y & 3) * 4 + (x & 3)]) !== inv;
        const c = lit ? FIRE : DARK, o = i * 4;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
      tctx.putImageData(img, 0, 0);
      octx.imageSmoothingEnabled = false;
      octx.drawImage(tiny, 0, 0, out.width, out.height);
      return true;
    }

    const pad = (n) => String(n).padStart(2, "0");
    function frameLoop(t) {
      raf = requestAnimationFrame(frameLoop);
      if (t - last < 1000 / 24) return;           // the films' own 24 a second
      last = t; t0 ||= t; shotT ||= t;
      if (t - shotT >= SHOTS[shot][4]) {
        shot = (shot + 1) % SHOTS.length; shotT = t; flash = 1;
        nameEl.textContent = NAMES[SHOTS[shot][0]];
      }
      if (draw((t - shotT) / SHOTS[shot][4])) flash = Math.max(0, flash - 1);
      const e = (t - t0) / 1000, fr = Math.floor(e * 24);
      tcEl.textContent = `${pad(Math.floor(e / 3600))}:${pad(Math.floor(e / 60) % 60)}:${pad(Math.floor(e) % 60)}:${pad(fr % 24)}`;
    }

    function start() {
      if (on) return; on = true;
      vids.forEach((v) => { v.preload = "auto"; v.play().catch(() => {}); });
      if (reduced) {                               // one still, drawn once the first film has a frame
        const still = () => { vids.forEach((v) => v.pause()); draw(0); };
        if (vids[0].readyState >= 2) still(); else vids[0].addEventListener("loadeddata", still, { once: true });
        return;
      }
      raf = requestAnimationFrame(frameLoop);
    }
    function stop() {
      if (!on) return; on = false;
      cancelAnimationFrame(raf); raf = 0; last = 0;
      vids.forEach((v) => v.pause());
    }
    new IntersectionObserver((es) => {
      const vis = es.some((e) => e.isIntersecting);
      if (vis) { sec.classList.add("seen"); start(); } else stop();
    }, { threshold: .2 }).observe(sec);
    new IntersectionObserver((es) => {           // fetch the films a little before they are needed
      if (es.some((e) => e.isIntersecting)) vids.forEach((v) => { if (v.preload === "none") v.preload = "auto"; });
    }, { rootMargin: "100% 0px" }).observe(sec);
  }
}
