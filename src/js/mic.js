/* tailzu.space, the microphone (lazy: loaded when the first mic button is
 * pressed or comes into view). Three things, and nothing else:
 *
 *   1. THE LEVEL (W3): getUserMedia → an AnalyserNode (fftSize 128; the level
 *      is the mean of the lower half × 3.2, as the demo has always read it).
 *      No MediaRecorder, no upload, no SpeechRecognition: only how loud.
 *      It stops after 12 s, on a second press or on Escape, and every track
 *      is released. The thread turns amber (the page's one amber: something
 *      of the visitor's is live) and rings with the voice.
 *   2. THE DEMO (demo:true only, /v1/site): the recorder under the unchanged
 *      contract: echoCancellation and noiseSuppression; MediaRecorder in the
 *      order webm/opus, webm, mp4, ogg; auto-stop 1.4 s after a level above
 *      0.19, or at maxSeconds − 1; POST multipart "audio" (clip.webm|m4a|ogg)
 *      to API + "/v1/demo/transcribe"; 413 "Too long.", 429 "Wait a moment.",
 *      404 "Demo is off.", else "Try again.", empty "Nothing heard.", a mic
 *      failure C.micDenied. Never the browser's SpeechRecognition.
 *   3. THE MARK: mic buttons draw the TailzuMic mark the server sends
 *      (/v1/site mic), with the renderer the phones run; the copy between
 *      MIC-BEGIN and MIC-END is the fallback, from the page before this one.
 *      Still at rest (no frame loop); it moves only while the mic is open.
 */
(function () {
  "use strict";
  var TZ = window.TZ;
  if (!TZ || TZ.mic) return;
  var reduced = true;   // the mark's own loop runs only while a mic is open (see markOn)
  /* THE MIC KEY THE SERVER SENDS, until /v1/site answers with the live one. */
  var MIC = /* MIC-BEGIN */ { "mark": {"viewBox":[170,228,680,512],"fit":"circle","tint":true,"shapes":[{"id":"line1","kind":"line","x1":346,"y1":402,"x2":270,"y2":598,"width":9,"cap":"round","color":"#E9CBA2"},{"id":"link","kind":"bars","x1":444,"y1":394,"x2":554,"y2":486,"thick":6,"heights":[28,36,41,46,43,34,28],"swell":{"thick":1.3,"height":1.9},"color":"#E8A23C"},{"id":"line2","kind":"line","x1":668,"y1":478,"x2":828,"y2":243,"width":9,"cap":"round","color":"#C77A3A"},{"id":"dot","kind":"circle","cx":828,"cy":243,"r":11,"color":"#B06240"},{"id":"a","kind":"rect","x":308,"y":269,"w":132,"h":132,"rx":28,"color":"#F4F1EA"},{"id":"b","kind":"rect","x":558,"y":478,"w":132,"h":132,"rx":28,"color":"#F4F1EA"},{"id":"c","kind":"rect","x":178,"y":598,"w":132,"h":132,"rx":28,"color":"#F4F1EA"}]}, "program": {"version": 1, "fps": {"idle": 24, "rec": 60}, "colors": {"signal": "#F4F1EA"}, "vars": {"period": 3.6, "n": 6, "breathe": 4.2, "bscale": 1.06, "out": 1.9, "spin": 40, "arc": 0.22, "shrink": 0.45, "gather": 0.05, "stagger": 0.07, "bspeed": 12, "bbounce": 0.6, "bturb": 0.14, "btumble": 1, "bstagger": 0.05, "lift": 2.8, "wait": 0.25, "krad": 1.636, "ring": 0.72, "nt": 42, "tick": 0.05, "swell": 0.15, "sweep": 1.1, "turn": 0.12, "voice": 0.75, "bloom": 0.35, "breath": 0.035}, "funcs": {"turbs": {"args": [], "expr": "rec ? 0 : bturb*R*abs(p)*(0.6*sin(t*11 + k*2.1) + 0.4*sin(t*17 + k*0.7))"}, "turbr": {"args": [], "expr": "rec ? 0 : bturb*R*0.5*abs(p)*sin(t*13 + k*1.3)"}, "side": {"args": [], "expr": "arc*R*sin(pi*clamp(p, 0, 1))*sign + turbs()"}, "along": {"args": [], "expr": "out*R*p + turbr()"}, "ang": {"args": ["k"], "expr": "tau*k/nt + turn*t"}, "rr": {"args": [], "expr": "krad*R*ring*(bloom + (1 - bloom)*q)*(1 + breath*lv)/lift"}, "cr": {"args": ["k"], "expr": "0.6*crest(ang(k)*2 - sweep*t) + 0.4*crest(ang(k)*3 + sweep*0.7*t + 1)"}, "th": {"args": ["k"], "expr": "(tick*krad*R*(0.5 + 0.5*height(k % cols)/46) + swell*krad*R*cr(k)*(1 - voice + voice*lv))/lift*q"}, "tx": {"args": ["k", "s"], "expr": "(x1 + x2)/2 + (lx*cos(ang(k)) + nx*sin(ang(k)))*(rr() + th(k)*s)"}, "ty": {"args": ["k", "s"], "expr": "(y1 + y2)/2 + (ly*cos(ang(k)) + ny*sin(ang(k)))*(rr() + th(k)*s)"}}, "springs": {"p": {"scope": "shape", "rest": 0, "target": "rec ? (since < k*stagger ? 0 : (since < k*stagger + 0.1 ? -gather : 1)) : (since >= (n - 1 - k)*bstagger + 0.12 ? 0 : prev)", "rate": "rec ? 6.5 : bspeed", "damp": "rec ? 1 : bbounce"}, "q": {"scope": "global", "rest": 0, "target": "rec ? (since >= wait ? 1 : 0) : 0", "rate": "7", "damp": "1"}, "lv": {"scope": "global", "rest": 0, "target": "rec ? level : 0", "rate": "16", "damp": "1"}}, "mark": {"scale": "1 + (bscale - 1)*(0.5 - 0.5*cos(tau*t/breathe))"}, "shapes": {"a": {"vars": {"k": 0, "sign": 1}, "dx": "dir.x*along() - dir.y*side()", "dy": "dir.y*along() + dir.x*side()", "rot": "(spin + (rec ? 0 : btumble*360))*p*sign", "scale": "1 - shrink*clamp(p, 0, 1)", "opacity": "1 - smooth(0.55, 1, clamp(p, 0, 1))", "mix": "rec ? 0 : ramp(t % period, 0.92, 0.42)"}, "b": {"vars": {"k": 1, "sign": -1}, "dx": "dir.x*along() - dir.y*side()", "dy": "dir.y*along() + dir.x*side()", "rot": "(spin + (rec ? 0 : btumble*360))*p*sign", "scale": "1 - shrink*clamp(p, 0, 1)", "opacity": "1 - smooth(0.55, 1, clamp(p, 0, 1))", "mix": "rec ? 0 : ramp(t % period, 2.33, 0.42)"}, "line1": {"vars": {"k": 2, "sign": 1}, "dx": "dir.x*along() - dir.y*side()", "dy": "dir.y*along() + dir.x*side()", "rot": "(spin + (rec ? 0 : btumble*360))*p*sign", "scale": "1 - shrink*clamp(p, 0, 1)", "opacity": "1 - smooth(0.55, 1, clamp(p, 0, 1))"}, "line2": {"vars": {"k": 3, "sign": -1}, "dx": "dir.x*along() - dir.y*side()", "dy": "dir.y*along() + dir.x*side()", "rot": "(spin + (rec ? 0 : btumble*360))*p*sign", "scale": "1 - shrink*clamp(p, 0, 1)", "opacity": "1 - smooth(0.55, 1, clamp(p, 0, 1))"}, "c": {"vars": {"k": 4, "sign": 1}, "dx": "dir.x*along() - dir.y*side()", "dy": "dir.y*along() + dir.x*side()", "rot": "(spin + (rec ? 0 : btumble*360))*p*sign", "scale": "1 - shrink*clamp(p, 0, 1)", "opacity": "1 - smooth(0.55, 1, clamp(p, 0, 1))", "mix": "rec ? 0 : ramp(t % period, 0.33, 0.42)"}, "dot": {"vars": {"k": 5, "sign": -1}, "dx": "dir.x*along() - dir.y*side()", "dy": "dir.y*along() + dir.x*side()", "rot": "(spin + (rec ? 0 : btumble*360))*p*sign", "scale": "1 - shrink*clamp(p, 0, 1)", "opacity": "1 - smooth(0.55, 1, clamp(p, 0, 1))"}, "link": {"dx": "(cx - home.x)*q", "dy": "(cy - home.y)*q", "rot": "(180 - atan2(y2 - y1, x2 - x1)*180/pi)*q", "scale": "1 + (lift - 1)*q", "rise": "max(q*clamp(0.2*cr(i*6) + 1.1*lv*(0.6 + 0.4*sin(t*9 + i*1.7)), 0, 1), run(f, t % period, 1.33, 0.95, 0.3)*(1 - q))", "lean": "0"}}, "emit": [{"attach": "link", "kind": "line", "repeat": ["nt"], "as": ["k"], "x1": "tx(k, -0.3)", "y1": "ty(k, -0.3)", "x2": "tx(k, 0.7)", "y2": "ty(k, 0.7)", "opacity": "q*(0.42 + 0.5*cr(k)*(0.5 + 0.5*lv))", "width": "thick*1.5", "color": "ink"}], "settle": {"eps": 0.002, "timeout": 1.4}}, "inset": 7 } /* MIC-END */;
  /* THE MIC KEY, AS THE KEYBOARD DRAWS IT. The server sends the mark's
     shapes and a program — numbers, springs, one expression per property —
     and this is the same renderer the phones run, so the key on this page
     does exactly what the key on the phone does, idle and recording alike.
     A new mic key is a backend deploy; this page never changes for it. */
  var TailzuMic = (function () {
    var NS = "http://www.w3.org/2000/svg";
    var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  /* THE MOTION LANGUAGE — one small evaluator, the same on every platform.
     Numbers only. An expression is arithmetic, comparisons, && || !, ?:,
     built-in functions, the program's own functions, and names looked up in
     the context. Anything unknown or non-finite is 0: a bad program is a
     still mark, never a crash. */
  var Lang = (function () {
    var TOK = /(\d+\.?\d*(?:[eE][+-]?\d+)?)|([A-Za-z_][A-Za-z0-9_.]*)|(\|\||&&|==|!=|<=|>=|[-+*\/%^<>!?:(),])/y;
    function tokenize(src) {
      var out = [], i = 0;
      while (i < src.length) {
        if (/\s/.test(src[i])) { i++; continue; }
        TOK.lastIndex = i; var m = TOK.exec(src);
        if (!m || m.index !== i) throw new Error("bad character at " + i + ": " + src.slice(i, i + 12));
        i = TOK.lastIndex;
        out.push(m[1] != null ? { t: "n", v: parseFloat(m[1]) } : m[2] != null ? { t: "id", v: m[2] } : { t: "op", v: m[3] });
      }
      return out;
    }
    function parse(src) {
      var toks = tokenize(String(src)), pos = 0;
      function peek() { return toks[pos]; }
      function isOp(v) { var k = toks[pos]; return k && k.t === "op" && k.v === v; }
      function take(v) { if (!isOp(v)) throw new Error("expected " + v + " in " + src); pos++; }
      function ternary() { var c = or(); if (isOp("?")) { pos++; var a = ternary(); take(":"); var b = ternary(); return ["?", c, a, b]; } return c; }
      function or() { var l = and(); while (isOp("||")) { pos++; l = ["||", l, and()]; } return l; }
      function and() { var l = eq(); while (isOp("&&")) { pos++; l = ["&&", l, eq()]; } return l; }
      function eq() { var l = rel(); while (isOp("==") || isOp("!=")) { var o = toks[pos++].v; l = [o, l, rel()]; } return l; }
      function rel() { var l = add(); while (isOp("<") || isOp("<=") || isOp(">") || isOp(">=")) { var o = toks[pos++].v; l = [o, l, add()]; } return l; }
      function add() { var l = mul(); while (isOp("+") || isOp("-")) { var o = toks[pos++].v; l = [o, l, mul()]; } return l; }
      function mul() { var l = unary(); while (isOp("*") || isOp("/") || isOp("%")) { var o = toks[pos++].v; l = [o, l, unary()]; } return l; }
      function unary() { if (isOp("-")) { pos++; return ["neg", unary()]; } if (isOp("!")) { pos++; return ["not", unary()]; } return power(); }
      function power() { var b = primary(); if (isOp("^")) { pos++; return ["^", b, unary()]; } return b; }
      function primary() {
        var k = peek(); if (!k) throw new Error("unexpected end of " + src);
        if (k.t === "n") { pos++; return ["n", k.v]; }
        if (k.t === "id") {
          pos++;
          if (isOp("(")) { pos++; var args = []; if (!isOp(")")) { args.push(ternary()); while (isOp(",")) { pos++; args.push(ternary()); } } take(")"); return ["call", k.v, args]; }
          return ["v", k.v];
        }
        if (isOp("(")) { pos++; var e = ternary(); take(")"); return e; }
        throw new Error("unexpected " + k.v + " in " + src);
      }
      var ast = ternary();
      if (pos < toks.length) throw new Error("trailing " + toks[pos].v + " in " + src);
      return ast;
    }
    var B = {
      sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs, sqrt: function (x) { return x < 0 ? 0 : Math.sqrt(x); }, floor: Math.floor, ceil: Math.ceil, round: Math.round, exp: Math.exp,
      log: function (x) { return x > 0 ? Math.log(x) : 0; }, atan2: Math.atan2, min: Math.min, max: Math.max, pow: function (a, b) { return a < 0 && b !== Math.floor(b) ? 0 : Math.pow(a, b); }, hypot: Math.hypot,
      clamp: function (x, a, b) { return x < a ? a : x > b ? b : x; },
      smooth: function (a, b, x) { var u = b === a ? (x >= b ? 1 : 0) : Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); },
      lerp: function (a, b, u) { return a + (b - a) * u; },
      crest: function (x) { var s = Math.sin(x); return s > 0 ? Math.pow(s, 1.6) : 0; },
      // On over `edge` seconds at `at`, held for `len`, off over `edge`: the splash's hold.
      ramp: function (x, at, len, edge) { edge = edge || 0.06; return x < at ? 0 : x < at + edge ? (x - at) / edge : x < at + len ? 1 : x < at + len + edge ? 1 - (x - at - len) / edge : 0; },
      // A crest of `width` (of the line) that starts wholly before the line at `at` and is wholly past it `dur` later: how far up the bar at `f` is.
      run: function (f, x, at, dur, width) { var u = (x - at) / dur; if (u < 0 || u > 1) return 0; var half = width / 2, c = u * (1 + width) - half, q = Math.abs(f - c) / half; return q >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * q); },
      noise: function (x) { return Math.sin(x * 1.7) * Math.sin(x * 0.61 + 2.1); },
    };
    function ev(n, ctx, funcs, depth) {
      var a, b;
      switch (n[0]) {
        case "n": return n[1];
        case "v": { var v = ctx[n[1]]; return typeof v === "number" && isFinite(v) ? v : 0; }
        case "neg": return -ev(n[1], ctx, funcs, depth);
        case "not": return ev(n[1], ctx, funcs, depth) ? 0 : 1;
        case "?": return ev(n[1], ctx, funcs, depth) ? ev(n[2], ctx, funcs, depth) : ev(n[3], ctx, funcs, depth);
        case "||": return (ev(n[1], ctx, funcs, depth) || ev(n[2], ctx, funcs, depth)) ? 1 : 0;
        case "&&": return (ev(n[1], ctx, funcs, depth) && ev(n[2], ctx, funcs, depth)) ? 1 : 0;
        case "call": {
          var name = n[1], args = n[2], f = funcs && funcs[name];
          if (f) {
            if ((depth || 0) > 8) return 0;
            var c2 = Object.create(ctx); for (var i = 0; i < f.args.length; i++) c2[f.args[i]] = i < args.length ? ev(args[i], ctx, funcs, depth) : 0;
            return fin(ev(f.ast, c2, funcs, (depth || 0) + 1));
          }
          var bf = B[name];
          if (bf) { var vals = []; for (var j = 0; j < args.length; j++) vals.push(ev(args[j], ctx, funcs, depth)); return fin(bf.apply(null, vals)); }
          var cf = ctx["fn:" + name];       // a function the renderer lends the program, such as height(i)
          if (typeof cf === "function") { var vs = []; for (var q = 0; q < args.length; q++) vs.push(ev(args[q], ctx, funcs, depth)); return fin(cf.apply(null, vs)); }
          return 0;
        }
      }
      a = ev(n[1], ctx, funcs, depth); b = ev(n[2], ctx, funcs, depth);
      switch (n[0]) {
        case "+": return a + b; case "-": return a - b; case "*": return a * b;
        case "/": return b === 0 ? 0 : a / b; case "%": return b === 0 ? 0 : a - Math.floor(a / b) * b;
        case "^": return fin(Math.pow(a, b));
        case "<": return a < b ? 1 : 0; case "<=": return a <= b ? 1 : 0; case ">": return a > b ? 1 : 0; case ">=": return a >= b ? 1 : 0;
        case "==": return a === b ? 1 : 0; case "!=": return a !== b ? 1 : 0;
      }
      return 0;
    }
    function fin(x) { return typeof x === "number" && isFinite(x) ? x : 0; }
    /* A compiled program: every expression parsed once, functions bound. */
    function compile(spec) {
      var P = { spec: spec, funcs: {}, vars: spec.vars || {}, springs: {}, shapes: {}, emit: [], mark: {}, errors: [] };
      function X(src, where) { try { return parse(src); } catch (e) { P.errors.push(where + ": " + e.message); return ["n", 0]; } }
      Object.keys(spec.funcs || {}).forEach(function (k) { var f = spec.funcs[k]; P.funcs[k] = { args: f.args || [], ast: X(f.expr, "funcs." + k) }; });
      Object.keys(spec.springs || {}).forEach(function (k) { var s = spec.springs[k]; P.springs[k] = { scope: s.scope === "shape" ? "shape" : "global", rest: +s.rest || 0, target: X(s.target || "0", "springs." + k + ".target"), rate: X(s.rate || "8", "springs." + k + ".rate"), damp: X(s.damp || "1", "springs." + k + ".damp") }; });
      Object.keys(spec.mark || {}).forEach(function (k) { P.mark[k] = X(spec.mark[k], "mark." + k); });
      Object.keys(spec.shapes || {}).forEach(function (id) { var sh = spec.shapes[id], c = { vars: sh.vars || {}, props: {} }; Object.keys(sh).forEach(function (k) { if (k !== "vars") c.props[k] = X(sh[k], "shapes." + id + "." + k); }); P.shapes[id] = c; });
      (spec.emit || []).forEach(function (e, n) {
        var c = { attach: e.attach, kind: e.kind, repeat: (e.repeat || []).map(function (r, j) { return X(r, "emit[" + n + "].repeat[" + j + "]"); }), as: e.as || [], color: e.color || "ink", opacity: X(e.opacity || "1", "emit[" + n + "].opacity"), width: X(e.width || "1", "emit[" + n + "].width") };
        if (Array.isArray(e.points)) c.points = e.points.map(function (p, j) { return [X(p[0], "emit[" + n + "].points[" + j + "].x"), X(p[1], "emit[" + n + "].points[" + j + "].y")]; });
        else if (e.points) c.gen = { count: X(e.points.count || "0", "emit[" + n + "].points.count"), as: e.points.as || "i", x: X(e.points.x || "0", "emit[" + n + "].points.x"), y: X(e.points.y || "0", "emit[" + n + "].points.y") };
        ["x1", "y1", "x2", "y2", "cx", "cy", "r"].forEach(function (k) { if (e[k] != null) c[k] = X(e[k], "emit[" + n + "]." + k); });
        P.emit.push(c);
      });
      return P;
    }
    return { ev: ev, compile: compile };
  })();
  /* A voice, performed: phrases with syllables in them, and pauses. Stands in
     for the microphone while the page speaks a sentence of its own. */
  var performed = { level: 0, t: 0, phrase: 0, until: 0, talking: false, tick: function (dt, on) {
    if (!on) { this.level += (0 - this.level) * Math.min(1, dt * 6); return; }
    this.t += dt;
    if (this.t >= this.until) { this.talking = !this.talking; this.t = 0; this.until = this.talking ? 0.9 + Math.random() * 1.6 : 0.5 + Math.random() * 1.1; this.phrase = Math.random() * 6.28; }
    var target = this.talking ? clamp(0.45 + 0.35 * Math.sin(this.t * 24 + this.phrase) + 0.2 * Math.sin(this.t * 9.3) + (Math.random() - 0.5) * 0.2, 0.08, 1) : 0.03 + Math.random() * 0.03;
    this.level += (target - this.level) * Math.min(1, dt * (target > this.level ? 22 : 7));
  } };
  function renderMark(svg, sp, fg, inset) {
    var m = sp.mark;
    svg.innerHTML = "";
    var vb = m.viewBox, L = Math.hypot(vb[2], vb[3]) * (36 / Math.max(1, 36 - 2 * (inset || 0)));
    svg.setAttribute("viewBox", [vb[0] + vb[2] / 2 - L / 2, vb[1] + vb[3] / 2 - L / 2, L, L].join(" "));
    var outer = document.createElementNS(NS, "g"); svg.appendChild(outer);
    var scene = { outer: outer, shapes: {} };
    m.shapes.forEach(function (sh) {
      var color = m.tint ? fg : sh.color, holder = document.createElementNS(NS, "g"), el, bars = null;
      outer.appendChild(holder);
      if (sh.kind === "rect") { el = document.createElementNS(NS, "rect"); el.setAttribute("x", sh.x); el.setAttribute("y", sh.y); el.setAttribute("width", sh.w); el.setAttribute("height", sh.h); el.setAttribute("rx", sh.rx || 0); el.setAttribute("fill", color); }
      else if (sh.kind === "circle") { el = document.createElementNS(NS, "circle"); el.setAttribute("cx", sh.cx); el.setAttribute("cy", sh.cy); el.setAttribute("r", sh.r); el.setAttribute("fill", color); }
      else if (sh.kind === "bars") {
        el = document.createElementNS(NS, "g"); el.setAttribute("stroke", color);
        var n = sh.heights.length, bdx = sh.x2 - sh.x1, bdy = sh.y2 - sh.y1, bL = Math.hypot(bdx, bdy) || 1, nx = -bdy / bL, ny = bdx / bL, sw = sh.swell || { thick: 1.3, height: 1.9 };
        bars = [];
        sh.heights.forEach(function (hh, i) {
          var t = (i + 0.5) / n, cx = sh.x1 + bdx * t, cy = sh.y1 + bdy * t, bar = document.createElementNS(NS, "line");
          el.appendChild(bar);
          var d = { el: bar, i: i, f: t, cx: cx, cy: cy, h0: hh, set: function (k, lean) {
            var h = hh * (1 + ((sw.height || 1.9) - 1) * k), w = (sh.thick || 6) * (1 + ((sw.thick || 1.3) - 1) * k), lx = (lean || 0) * (bdx / bL) * h, ly = (lean || 0) * (bdy / bL) * h;
            bar.setAttribute("x1", (cx - nx * h / 2).toFixed(2)); bar.setAttribute("y1", (cy - ny * h / 2).toFixed(2)); bar.setAttribute("x2", (cx + nx * h / 2 + lx).toFixed(2)); bar.setAttribute("y2", (cy + ny * h / 2 + ly).toFixed(2));
            bar.setAttribute("stroke-width", w.toFixed(2));
          } };
          d.set(0, 0); bars.push(d);
        });
      }
      else { el = document.createElementNS(NS, "line"); el.setAttribute("x1", sh.x1); el.setAttribute("y1", sh.y1); el.setAttribute("x2", sh.x2); el.setAttribute("y2", sh.y2); el.setAttribute("stroke", color); el.setAttribute("stroke-width", sh.width || 1); el.setAttribute("stroke-linecap", sh.cap || "butt"); if (sh.dash) el.setAttribute("stroke-dasharray", sh.dash.join(" ")); }
      holder.appendChild(el);
      scene.shapes[sh.id || ("#" + Object.keys(scene.shapes).length)] = { sh: sh, holder: holder, el: el, ink: color, bars: bars };
    });
    return scene;
  }
  function Program(scene, sp, levelOf) {
    var P = Lang.compile(sp.program || {}), m = sp.mark, vb = m.viewBox;
    var cx0 = vb[0] + vb[2] / 2, cy0 = vb[1] + vb[3] / 2, U = Math.min(vb[2], vb[3]), R = Math.hypot(vb[2], vb[3]) / 2;
    var sig = (sp.program && sp.program.colors && sp.program.colors.signal) || "#F4F1EA";
    var fps = (sp.program && sp.program.fps) || {}, settle = (sp.program && sp.program.settle) || {};
    var G = Object.create(null);
    Object.keys(P.vars).forEach(function (k) { G[k] = +P.vars[k]; });
    G.pi = Math.PI; G.tau = 2 * Math.PI; G.e = Math.E; G.cx = cx0; G.cy = cy0; G.U = U; G.R = R; G.vbw = vb[2]; G.vbh = vb[3];
    G.t = 0; G.rec = 0; G.since = 0; G.level = 0;
    var state = { t: 0, rec: 0, flipped: 0, level: 0, settling: false, done: null, raf: 0, last: 0 };
    var springs = {};                       // "name" or "name@shape" → { v, vel, prev }
    function spring(name, shapeId) { var key = shapeId ? name + "@" + shapeId : name; return springs[key] || (springs[key] = { v: P.springs[name].rest, vel: 0, prev: P.springs[name].rest }); }
    function evx(ast, ctx) { return Lang.ev(ast, ctx, P.funcs, 0); }
    var mix = function (a, b, k) {
      k = clamp(k, 0, 1); var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), out = 0, sh;
      for (sh = 16; sh >= 0; sh -= 8) { var ca = (pa >> sh) & 255, cb = (pb >> sh) & 255; out |= Math.round(ca + (cb - ca) * k) << sh; }
      return "#" + ("000000" + out.toString(16)).slice(-6);
    };
    // Each shape's context: its geometry, its own numbers, its springs.
    var shapes = Object.keys(scene.shapes).map(function (id) {
      var sc = scene.shapes[id], sh = sc.sh, ctx = Object.create(G), hx, hy;
      if (sh.kind === "rect") { hx = sh.x + sh.w / 2; hy = sh.y + sh.h / 2; ctx.w = sh.w; ctx.h = sh.h; }
      else if (sh.kind === "circle") { hx = sh.cx; hy = sh.cy; ctx.r = sh.r; }
      else {
        hx = (sh.x1 + sh.x2) / 2; hy = (sh.y1 + sh.y2) / 2;
        var dx = sh.x2 - sh.x1, dy = sh.y2 - sh.y1, L = Math.hypot(dx, dy) || 1;
        ctx.x1 = sh.x1; ctx.y1 = sh.y1; ctx.x2 = sh.x2; ctx.y2 = sh.y2; ctx.L = L; ctx.lx = dx / L; ctx.ly = dy / L; ctx.nx = -dy / L; ctx.ny = dx / L;
        var bx = -ctx.nx * 0.85 - ctx.lx * 0.35, by = -ctx.ny * 0.85 - ctx.ly * 0.35, bl = Math.hypot(bx, by) || 1; ctx.bx = bx / bl; ctx.by = by / bl;
        ctx.width = sh.width || 1;
        if (sh.kind === "bars") { ctx.thick = sh.thick || 6; ctx.cols = sh.heights.length; ctx.swh = (sh.swell && sh.swell.height) || 1.9; ctx.swt = (sh.swell && sh.swell.thick) || 1.3; ctx["fn:height"] = function (i) { var j = Math.max(0, Math.min(sh.heights.length - 1, Math.round(i))); return sh.heights[j]; }; }
      }
      ctx["home.x"] = hx; ctx["home.y"] = hy;
      var ddx = hx - cx0, ddy = hy - cy0, dl = Math.hypot(ddx, ddy) || 1; ctx["dir.x"] = ddx / dl; ctx["dir.y"] = ddy / dl;
      var comp = P.shapes[id] || { vars: {}, props: {} };
      Object.keys(comp.vars).forEach(function (k) { ctx[k] = +comp.vars[k]; });
      return { id: id, sc: sc, sh: sh, ctx: ctx, comp: comp, hx: hx, hy: hy };
    });
    var byId = {}; shapes.forEach(function (s) { byId[s.id] = s; });
    // What the program draws around a shape: a pool of elements per entry, behind the shape.
    var emits = P.emit.map(function (e) { return { e: e, els: [], host: byId[e.attach] }; });
    function element(em, n) {
      var el = em.els[n];
      if (!el) {
        el = document.createElementNS(NS, em.e.kind === "line" ? "line" : em.e.kind === "circle" ? "circle" : em.e.kind === "polygon" ? "polygon" : "polyline");
        el.setAttribute("stroke-linejoin", "round"); em.els[n] = el;
        em.host.sc.holder.insertBefore(el, em.host.sc.el);
      }
      return el;
    }
    function frame(now) {
      state.raf = requestAnimationFrame(frame);
      var want = state.rec ? (fps.rec || 60) : (fps.idle || 24);
      if (state.last && now - state.last < 1000 / want - 1) return;
      var dt = Math.min(1 / 20, state.last ? (now - state.last) / 1000 : 1 / 60); state.last = now;
      state.t += dt;
      // The voice: the page's own microphone when it is open, else a performed one while recording.
      var lv = levelOf ? levelOf() : null;
      if (lv == null) { performed.tick(dt, !!state.rec); lv = performed.level; }
      state.level = clamp(+lv || 0, 0, 1);
      G.t = state.t; G.rec = state.rec; G.since = state.t - state.flipped; G.level = state.level;
      // Global springs first, then everything else may read them.
      var quiet = true, eps = settle.eps != null ? settle.eps : 0.002;
      Object.keys(P.springs).forEach(function (name) {
        var s = P.springs[name]; if (s.scope !== "global") return;
        var st = spring(name); G.prev = st.prev; var target = evx(s.target, G), w = Math.max(0.1, evx(s.rate, G)), z = Math.max(0, evx(s.damp, G));
        st.prev = target; st.vel += (target - st.v) * w * w * dt - 2 * z * w * st.vel * dt; st.v += st.vel * dt; G[name] = st.v;
        if (Math.abs(st.v - target) > eps || Math.abs(st.vel) > eps * 10) quiet = false;
      });
      if (P.mark.scale || P.mark.rot || P.mark.opacity) {
        var ms = P.mark.scale ? evx(P.mark.scale, G) : 1, mr = P.mark.rot ? evx(P.mark.rot, G) : 0;
        scene.outer.setAttribute("transform", "translate(" + cx0 + " " + cy0 + ") rotate(" + mr.toFixed(2) + ") scale(" + ms.toFixed(4) + ") translate(" + (-cx0) + " " + (-cy0) + ")");
        if (P.mark.opacity) scene.outer.style.opacity = clamp(evx(P.mark.opacity, G), 0, 1).toFixed(3);
      }
      shapes.forEach(function (s) {
        var ctx = s.ctx, pr = s.comp.props;
        Object.keys(P.springs).forEach(function (name) {
          var sp2 = P.springs[name]; if (sp2.scope !== "shape") return;
          var st = spring(name, s.id); ctx.prev = st.prev; var target = evx(sp2.target, ctx), w = Math.max(0.1, evx(sp2.rate, ctx)), z = Math.max(0, evx(sp2.damp, ctx));
          st.prev = target; st.vel += (target - st.v) * w * w * dt - 2 * z * w * st.vel * dt; st.v += st.vel * dt; ctx[name] = st.v;
          if (Math.abs(st.v - target) > eps || Math.abs(st.vel) > eps * 10) quiet = false;
        });
        if (pr.dx || pr.dy || pr.rot || pr.scale) {
          var dx = pr.dx ? evx(pr.dx, ctx) : 0, dy = pr.dy ? evx(pr.dy, ctx) : 0, rot = pr.rot ? evx(pr.rot, ctx) : 0, sc = pr.scale ? evx(pr.scale, ctx) : 1;
          s.sc.holder.setAttribute("transform", "translate(" + dx.toFixed(2) + " " + dy.toFixed(2) + ") translate(" + s.hx + " " + s.hy + ") rotate(" + rot.toFixed(2) + ") scale(" + sc.toFixed(4) + ") translate(" + (-s.hx) + " " + (-s.hy) + ")");
        }
        if (pr.opacity) s.sc.holder.style.opacity = clamp(evx(pr.opacity, ctx), 0, 1).toFixed(3);
        if (pr.mix) { var col = mix(s.sc.ink, sig, evx(pr.mix, ctx)); if (s.sh.kind === "line") s.sc.el.setAttribute("stroke", col); else if (s.sh.kind === "bars") s.sc.el.setAttribute("stroke", col); else s.sc.el.setAttribute("fill", col); }
        if (s.sc.bars && (pr.rise || pr.lean)) s.sc.bars.forEach(function (b) {
          var bc = Object.create(ctx); bc.i = b.i; bc.f = b.f; bc.hgt = b.h0;
          var rise = pr.rise ? clamp(evx(pr.rise, bc), 0, 1) : 0; bc.rise = rise;
          var lean = pr.lean ? evx(pr.lean, bc) : 0;
          b.set(rise, lean);
        });
      });
      emits.forEach(function (em) {
        var e = em.e, host = em.host, used = 0; if (!host) return;
        var base = host.ctx, counts = e.repeat.map(function (r) { return Math.max(0, Math.min(64, Math.floor(evx(r, base)))); });
        var n0 = counts[0] != null ? counts[0] : 1, n1 = counts[1] != null ? counts[1] : 1, color = e.color === "signal" ? sig : host.sc.ink;
        for (var a = 0; a < n0; a++) for (var b = 0; b < n1; b++) {
          var ctx = Object.create(base); if (e.as[0]) ctx[e.as[0]] = a; if (e.as[1]) ctx[e.as[1]] = b;
          var el = element(em, used++), pts = [];
          if (e.points) e.points.forEach(function (p) { pts.push(evx(p[0], ctx).toFixed(2) + "," + evx(p[1], ctx).toFixed(2)); });
          else if (e.gen) { var cnt = Math.max(0, Math.min(64, Math.floor(evx(e.gen.count, ctx)))); for (var j = 0; j < cnt; j++) { ctx[e.gen.as] = j; pts.push(evx(e.gen.x, ctx).toFixed(2) + "," + evx(e.gen.y, ctx).toFixed(2)); } }
          if (e.kind === "line") { el.setAttribute("x1", evx(e.x1 || ["n", 0], ctx)); el.setAttribute("y1", evx(e.y1 || ["n", 0], ctx)); el.setAttribute("x2", evx(e.x2 || ["n", 0], ctx)); el.setAttribute("y2", evx(e.y2 || ["n", 0], ctx)); el.setAttribute("stroke", color); el.setAttribute("stroke-width", evx(e.width, ctx).toFixed(2)); }
          else if (e.kind === "circle") { el.setAttribute("cx", evx(e.cx || ["n", 0], ctx)); el.setAttribute("cy", evx(e.cy || ["n", 0], ctx)); el.setAttribute("r", Math.max(0, evx(e.r || ["n", 1], ctx))); el.setAttribute("fill", color); }
          else { el.setAttribute("points", pts.join(" ")); if (e.kind === "polygon") { el.setAttribute("fill", color); el.setAttribute("stroke", "none"); } else { el.setAttribute("fill", "none"); el.setAttribute("stroke", color); el.setAttribute("stroke-width", evx(e.width, ctx).toFixed(2)); } }
          el.style.opacity = clamp(evx(e.opacity, ctx), 0, 1).toFixed(3);
        }
        for (var u = used; u < em.els.length; u++) em.els[u].style.opacity = "0";
      });
      // Home: the recording is over and every spring is at rest, or its time is up.
      if (state.settling && (quiet || G.since > (settle.timeout != null ? settle.timeout : 1.4))) {
        Object.keys(springs).forEach(function (k) { springs[k].vel = 0; });
        state.settling = false; var d = state.done; state.done = null; if (d) d();
      }
    }
    if (!reduced) { state.last = 0; state.raf = requestAnimationFrame(frame); }
    return {
      start: function () { if (state.rec) return; state.rec = 1; state.flipped = state.t; state.settling = false; state.done = null; },
      stop: function (done) { if (!state.rec) { done(); return; } state.rec = 0; state.flipped = state.t; state.settling = true; state.done = done; if (reduced) { state.settling = false; done(); } },
      dispose: function () { cancelAnimationFrame(state.raf); state.raf = 0; },
    };
  }
    /* One key: `mic` is { mark, program, inset } as /v1/site sends it. */
    return function (svg, mic, fg, levelOf) {
      var prog = null, rec = false;
      function paint(m) {
        if (prog) prog.dispose();
        var sp = { mark: m.mark, program: m.program };
        prog = Program(renderMark(svg, sp, fg, m.inset), sp, levelOf);
        if (rec) prog.start();
      }
      paint(mic);
      return {
        start: function () { rec = true; prog.start(); },
        stop: function () { rec = false; prog.stop(function () {}); },
        repaint: paint,
      };
    };
  })();

  /* ---------------------------------------------------------------- the marks on the mic buttons */
  var marks = [];
  function markFor(btn) {
    if (!btn || btn._mark) return btn && btn._mark;
    var old = btn.querySelector("svg");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true"); svg.setAttribute("class", "tzmic");
    if (old) old.replaceWith(svg); else btn.appendChild(svg);
    var fg = getComputedStyle(btn).color || "#F3E2C6";
    var m = { btn: btn, svg: svg, k: null, live: false };
    reduced = true;
    try { m.k = TailzuMic(svg, TZ.site.mic || MIC, fg, function () { return m.live ? M.level : null; }); } catch (e) { /* the glyph stays */ }
    btn._mark = m; marks.push(m);
    return m;
  }
  /** The mark moves only while its mic is open: idle, the page runs no loop. */
  function markOn(m, on) {
    if (!m || !m.k) return;
    m.live = on;
    reduced = !on || TZ.calm;
    m.k.repaint(TZ.site.mic || MIC);
    if (on) m.k.start(); else m.k.stop();
    reduced = true;
  }
  function markAll() {
    ["listen", "deskListen", "secretSay"].forEach(function (id) { var b = document.getElementById(id); if (b && !b.hidden) markFor(b); });
  }
  TZ.on("site", function () { marks.forEach(function (m) { reduced = true; if (m.k) m.k.repaint(TZ.site.mic || MIC); }); });

  /* ---------------------------------------------------------------- the level */
  var M = { on: false, where: null, stream: null, ac: null, an: null, buf: null, level: 0, bands: [], timer: 0, above: 0, heard: false, btn: null, ui: null, last: 0 };
  var get = TZ.get, $ = TZ.$;
  function read(t, dt) {
    if (!M.an) return false;
    M.an.getByteFrequencyData(M.buf);
    var n = Math.floor(M.buf.length / 2), sum = 0;
    for (var i = 0; i < n; i++) sum += M.buf[i] / 255;
    M.level = Math.min(1, (sum / n) * 3.2);
    var b = [], N = M.buf.length;
    for (var k = 0; k < 12; k++) {
      var i0 = Math.floor(Math.pow(N, k / 12)), i1 = Math.max(i0 + 1, Math.floor(Math.pow(N, (k + 1) / 12))), s = 0;
      for (var j = i0; j < i1 && j < N; j++) s += M.buf[j];
      b.push(Math.min(1, s / (i1 - i0) / 255 * 1.6));
    }
    M.bands = b;
    if (M.level > 0.19) { M.above += dt; if (M.above >= 0.3 && !M.heard) { M.heard = true; TZ.heardVoice = true; TZ.track("tz_listen", { where: M.where, result: "voice" }); TZ.emit("voice", M.where); if (M.onVoice) M.onVoice(); } }
    else M.above = Math.max(0, M.above - dt);
    if (M.ui && M.ui.tick) M.ui.tick(M.level, M.bands);
    var B = TZ.blip.inst; if (B) { B.level(M.level); TZ.blip.wake(0); }
    return M.on;
  }
  function open(where, btn, ui) {
    if (M.on) { close(); if (M.where === where) return Promise.resolve(false); }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.resolve(false);
    M.where = where; M.btn = btn; M.ui = ui || null; M.heard = false; M.above = 0;
    btn.setAttribute("aria-pressed", "true");
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (s) {
      if (btn.getAttribute("aria-pressed") !== "true") { s.getTracks().forEach(function (tr) { tr.stop(); }); return false; }
      M.stream = s;
      try {
        M.ac = new (window.AudioContext || window.webkitAudioContext)();
        M.an = M.ac.createAnalyser(); M.an.fftSize = 128;
        M.ac.createMediaStreamSource(s).connect(M.an);
        M.buf = new Uint8Array(M.an.frequencyBinCount);
      } catch (e) { close(); return false; }
      M.on = true;
      btn.classList.remove("err");
      TZ.track("tz_listen", { where: where, result: "open" });
      var B = TZ.blip.inst; if (B) { B.live(true); }
      document.getElementById("hero").classList.add("hush");
      markOn(markFor(btn), true);
      if (M.ui && M.ui.open) M.ui.open();
      M.timer = setTimeout(close, 12000);
      TZ.sched.add(read);
      return true;
    }).catch(function () {
      btn.setAttribute("aria-pressed", "false");
      btn.classList.add("err");
      setTimeout(function () { btn.classList.remove("err"); }, 3200);
      TZ.track("tz_listen", { where: where, result: "denied" });
      TZ.toast(get("listen.blocked") || TZ.C.micDenied);
      if (TZ.blip.inst) TZ.blip.mood("oops", 1400);
      if (M.ui && M.ui.denied) M.ui.denied();
      return false;
    });
  }
  function close() {
    clearTimeout(M.timer);
    var was = M.on, ui = M.ui, heard = M.heard;
    M.on = false;
    if (M.stream) M.stream.getTracks().forEach(function (tr) { tr.stop(); });
    M.stream = null;
    if (M.ac) { try { M.ac.close(); } catch (e) { /* none */ } }
    M.ac = null; M.an = null; M.level = 0; M.bands = [];
    if (M.btn) { M.btn.setAttribute("aria-pressed", "false"); markOn(M.btn._mark, false); }
    var B = TZ.blip.inst; if (B) { B.live(false); B.level(0); TZ.blip.wake(300); }
    document.getElementById("hero").classList.remove("hush");
    if (ui && ui.close) ui.close();
    M.ui = null;
    if (was && heard && ui && ui.heard !== false) TZ.toast(get("listen.heard"));
  }
  TZ.on("escape", function () { if (M.on) close(); if (TZ.micDemo) TZ.micDemo.escape(); });
  TZ.on("calm", function () { marks.forEach(function (m) { if (!m.live) { reduced = true; if (m.k) m.k.repaint(TZ.site.mic || MIC); } }); });

  /* the hero's thread: talk to it */
  var thread = document.getElementById("lineThread"), bead = document.getElementById("listenBead"), lOpen = document.getElementById("listenOpen");
  var threadUi = {
    open: function () { thread.classList.add("live"); bead.classList.add("live"); TZ.setText(lOpen, "● " + (get("listen.live") || "Listening")); TZ.say(get("listen.live")); },
    tick: function (lv, bands) { var s = TZ.heroStr(); if (s) { s.talk = 1; s.bands = bands; s.wake(); } },
    close: function () { thread.classList.remove("live"); bead.classList.remove("live"); TZ.setText(lOpen, get("listen.open")); var s = TZ.heroStr(); if (s) { s.talk = 0; s.bands = null; s.pluck(.6); } },
  };

  /* ---------------------------------------------------------------- the three places */
  TZ.mic = {
    /** The hero's bead (desktop), or the round mic in the line (phones, demo only). */
    toggleThread: function () {
      var b = document.getElementById("listen");
      // demo:true only: the recorder is its own file, never loaded while the demo is off
      if (TZ.site.demo) { TZ.loadScript(TZ.lazyUrl("/js/mic-demo.js")).then(function () { if (TZ.micDemo) TZ.micDemo.toggle(b); }); return; }
      open("hero", b, threadUi);
    },
    /** #desk's "Let it hear you": the pill's thread rings with the visitor's voice, in amber. */
    toggleDesk: function (btn, note, run) {
      var was = M.on && M.where === "desk";
      open("desk", btn, {
        open: function () { note.classList.add("on"); TZ.setText(note, "● " + (get("listen.live") || "")); TZ.deskLive = true; var f = document.getElementById("deskPill"); if (f) TZ.tellPill(f, { knobs: { flags: { "desktop.pill.live": TZ.AMBER } } }); if (run) run("voice"); },
        close: function () { note.classList.remove("on"); TZ.setText(note, (get("listen.desk") || "Let it hear you") + " · " + (get("listen.note") || "")); TZ.deskLive = false; var f = document.getElementById("deskPill"); if (f) TZ.tellPill(f, { knobs: { flags: { "desktop.pill.live": "#F3E2C6" } } }); },
      });
      void was;
    },
    /** #free's "Say something to Blip": a voice held above 0.19 for 300 ms reveals the line. */
    toggleSecret: function (btn, reveal) {
      M.onVoice = function () { reveal(); setTimeout(close, 600); };
      open("free", btn, { heard: false });
    },
    level: function () { return M.level; },
  };
  TZ.micLive = function () { return M.on; };
  TZ.micBusy = function () { return M.on || !!(TZ.micDemo && TZ.micDemo.busy()); };
  // what the recorder (js/mic-demo.js) shares: the marks, the level, the hero's thread
  TZ.micParts = { markFor: markFor, markOn: markOn, M: M, thread: thread };
  TZ.micBands = function () { return M.on && M.bands.length ? M.bands : null; };
  markAll();
  // demo:true: the bead (desktop) and a round mic in the line (phones) say "Press. Say anything."
  function demoUi() {
    if (!TZ.site.demo) return;
    var b = document.getElementById("listen"), bd = document.getElementById("listenBead");
    bd.hidden = false;
    TZ.setText(document.getElementById("listenOpen"), get("hero.invite"));
    TZ.setText(document.getElementById("listenNote"), "");
    b.setAttribute("aria-labelledby", "listenOpen");
    markFor(b);
  }
  TZ.on("site", demoUi); demoUi();
})();
