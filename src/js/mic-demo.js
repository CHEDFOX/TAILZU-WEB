/* tailzu.space, the live demo's recorder (lazy: loaded only when /v1/site says demo:true and the
 * visitor presses the mic). The unchanged contract (design-spec 5.4): echoCancellation and
 * noiseSuppression; MediaRecorder in the order webm/opus, webm, mp4, ogg; auto-stop 1.4 s after a
 * level above 0.19, or at maxSeconds - 1; POST multipart "audio" (clip.webm|m4a|ogg) to
 * API + "/v1/demo/transcribe"; 413 "Too long.", 429 "Wait a moment.", 404 "Demo is off.", else
 * "Try again.", empty "Nothing heard.", a mic failure C.micDenied. Never SpeechRecognition.
 * Uses only window.TZ (and TZ.micParts from js/mic.js). */
(function () {
  "use strict";
  var TZ = window.TZ;
  if (!TZ || TZ.micDemo || !TZ.micParts) return;
  var get = TZ.get, P = TZ.micParts, markFor = P.markFor, markOn = P.markOn, M = P.M, thread = P.thread;
  var R = { on: false, busy: false, rec: null, chunks: [], stream: null, ac: null, an: null, hard: 0, lastLoud: 0, heard: false, btn: null };
  function pickMime() {
    var c = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
    for (var i = 0; i < c.length; i++) if (window.MediaRecorder && MediaRecorder.isTypeSupported(c[i])) return c[i];
    return "";
  }
  function ext(m) { return /mp4/.test(m) ? "m4a" : /ogg/.test(m) ? "ogg" : "webm"; }
  function label(s, hold) {
    var l = R.btn && (R.btn._label || R.btn);
    if (!l) return;
    TZ.setText(document.getElementById("listenOpen"), s);
    TZ.say(s);
    clearTimeout(label.t);
    if (!hold) label.t = setTimeout(function () { TZ.setText(document.getElementById("listenOpen"), get("hero.invite")); }, 3200);
  }
  function recStart(btn) {
    if (R.busy || R.on) return;
    R.btn = btn;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { recFail(); return; }
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (s) {
      R.stream = s; R.chunks = [];
      var m = pickMime();
      R.rec = new MediaRecorder(s, m ? { mimeType: m } : undefined);
      R.rec.ondataavailable = function (e) { if (e.data && e.data.size) R.chunks.push(e.data); };
      R.rec.onstop = upload;
      R.rec.start();
      R.on = true; R.heard = false; R.lastLoud = Date.now();
      btn.setAttribute("aria-pressed", "true");
      label(get("hero.listening") || "Listening", true);
      markOn(markFor(btn), true);
      thread.classList.add("live");
      try {
        R.ac = new (window.AudioContext || window.webkitAudioContext)();
        R.an = R.ac.createAnalyser(); R.an.fftSize = 128;
        R.ac.createMediaStreamSource(s).connect(R.an);
        var buf = new Uint8Array(R.an.frequencyBinCount);
        TZ.sched.add(function meter() {
          if (!R.an) return false;
          R.an.getByteFrequencyData(buf);
          var sum = 0, n = Math.floor(buf.length / 2);
          for (var i = 0; i < n; i++) sum += buf[i] / 255;
          var level = Math.min(1, (sum / n) * 3.2), now = Date.now();
          M.level = level;
          if (level > 0.19) { R.heard = true; R.lastLoud = now; }
          if (R.heard && now - R.lastLoud > 1400) { recStop(); return false; }
          var st = TZ.heroStr(); if (st) { st.talk = 1; st.bands = [level, level, level, level * .8, level * .8, level * .7, level * .6, level * .5, level * .5, level * .4, level * .4, level * .3]; st.wake(); }
          return true;
        });
      } catch (e) { /* the clock still stops it */ }
      R.hard = setTimeout(recStop, Math.max(1, TZ.site.maxSeconds - 1) * 1000);
    }).catch(recFail);
  }
  function recFail() {
    if (R.rec) { R.rec.onstop = null; if (R.rec.state !== "inactive") try { R.rec.stop(); } catch (e) { /* none */ } R.rec = null; }
    recStop(); label(TZ.C.micDenied || "Mic blocked.");
    TZ.track("tz_demo", { result: "error" });
  }
  function recStop() {
    clearTimeout(R.hard);
    R.an = null;
    if (R.ac) { try { R.ac.close(); } catch (e) { /* none */ } R.ac = null; }
    if (R.btn) { R.btn.setAttribute("aria-pressed", "false"); markOn(R.btn._mark, false); }
    thread.classList.remove("live");
    var st = TZ.heroStr(); if (st) { st.talk = 0; st.bands = null; }
    M.level = 0;
    R.on = false;
    if (R.rec && R.rec.state !== "inactive") { R.busy = true; label(get("hero.writing") || "Writing", true); R.rec.stop(); }
    if (R.stream) { R.stream.getTracks().forEach(function (t) { t.stop(); }); R.stream = null; }
  }
  function upload() {
    var m = (R.rec && R.rec.mimeType) || "audio/webm";
    var fd = new FormData();
    fd.append("audio", new Blob(R.chunks, { type: m }), "clip." + ext(m));
    var api = document.documentElement.getAttribute("data-api") || (/(^|\.)tailzu\.space$/.test(location.hostname) ? "" : "https://api.tailzu.space");
    fetch(api + "/v1/demo/transcribe", { method: "POST", body: fd }).then(function (r) {
      if (r.status === 413) { TZ.track("tz_demo", { result: "413" }); throw new Error("Too long."); }
      if (r.status === 429) { TZ.track("tz_demo", { result: "429" }); throw new Error("Wait a moment."); }
      if (r.status === 404) { TZ.track("tz_demo", { result: "404" }); throw new Error("Demo is off."); }
      if (!r.ok) { TZ.track("tz_demo", { result: "error" }); throw new Error("Try again."); }
      return r.json();
    }).then(function (j) {
      var s = (j.transcript || "").trim(), w = (j.cleanedText || "").trim();
      if (!s && !w) { TZ.track("tz_demo", { result: "empty" }); throw new Error("Nothing heard."); }
      TZ.track("tz_demo", { result: "ok" });
      R.busy = false;
      // the visitor's own words, through the same line; the receipt never claims what changed
      TZ.runLine({ said: s || w, wrote: w || s, note: get("hero.cleaned") || "Your words, cleaned" });
      label(get("hero.again") || "Say another.");
    }).catch(function (e) { R.busy = false; label(e.message || "Try again."); });
  }

  TZ.micDemo = {
    toggle: function (b) { if (R.on) recStop(); else recStart(b); },
    escape: function () { if (R.on) recStop(); },
    busy: function () { return R.on || R.busy; },
  };
})();
