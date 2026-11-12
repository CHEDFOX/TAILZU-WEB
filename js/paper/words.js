import { clamp, reduced, view } from "../util.js";
import { sample, wave } from "./water.js";

// ---- The words: the world's scripts, very small --------------------------
const WORDS = (
  "hello voice speak write words listen say|hola voz hablar escribir palabras|bonjour voix parler écrire mots|hallo Stimme sprechen schreiben Wörter|" +
  "olá voz falar escrever|ciao voce parlare scrivere|hej röst tala skriva|cześć głos mówić pisać|merhaba ses konuşmak yazmak|xin_chào giọng nói viết|" +
  "halo suara bicara menulis|habari sauti ongea andika|sawubona izwi khuluma bhala|sannu murya magana rubuta|kumusta boses magsalita sumulat|" +
  "hei ääni puhua kirjoittaa|szia hang beszélni írni|ahoj hlas mluvit psát|salut voce vorbi scrie|kaixo ahotsa|salve vox loqui scribere|aloha leo|kia_ora reo|" +
  "привет голос говорить писать слова|привіт голос говорити писати|γειά φωνή μιλάω γράφω λέξεις|բարեւ ձայն խոսել գրել|გამარჯობა ხმა ლაპარაკი წერა|" +
  "שלום קול לדבר לכתוב מילים|مرحبا صوت تكلم اكتب كلمات|سلام صدا نوشتن|آواز بولنا لکھنا|" +
  "नमस्ते आवाज़ बोलो लिखो शब्द|नमस्कार बोला लिहा|নমস্কার কণ্ঠ বলুন লিখুন শব্দ|ਆਵਾਜ਼ ਬੋਲੋ ਲਿਖੋ|નમસ્તે અવાજ બોલો લખો|ନମସ୍କାର କୁହ ଲେଖ|" +
  "வணக்கம் குரல் பேசு எழுது சொல்|నమస్కారం గొంతు మాట్లాడు రాయి|ನಮಸ್ಕಾರ ಧ್ವನಿ ಮಾತಾಡು ಬರೆ|നമസ്കാരം ശബ്ദം എഴുതൂ|ආයුබෝවන් හඬ ලියන්න|" +
  "สวัสดี เสียง พูด เขียน|ສະບາຍດີ ສຽງ ຂຽນ|សួស្តី សំឡេង និយាយ សរសេរ|မင်္ဂလာပါ အသံ ပြော ရေး|ሰላም ድምፅ ተናገር ጻፍ|" +
  "你好 声音 说话 写 文字|聲音 說話 寫字|こんにちは 声 話す 書く ことば|안녕하세요 목소리 말하다 쓰다|сайн_уу дуу|сәлем дауыс|" +
  "kya_haal_hai bolo_na likh_do bas_bol_do|ā ß ñ ø ж λ ש ع क ক த ష ಕ ജ ก あ ア 字 한 ა Ա ሀ ઝ ਖ ଓ é ç ğ ł ř ő"
).split("|").flatMap((g) => g.split(" ")).map((w) => w.replace(/_/g, " ")).filter(Boolean);

const wordsCv = document.getElementById("words"), wctx = wordsCv.getContext("2d");
let VW = 0, VH = 0, DPR = 1, FS = 7, LINE = 12;
let sprites = [], parts = [], atlasGrey = null, atlasGreen = null, restCv = null;

// Every word drawn once, into two sheets (dim ink, and green with its glow):
// the page then only copies from them.
function makeSprites() {
  WFONT = `400 ${FS}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif`;
  const font = (s) => `400 ${s}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif`;
  const m = document.createElement("canvas").getContext("2d"); m.font = font(FS);
  const pad = 4, AW = 1024;
  let x = 0, y = 0, rowH = 0;
  sprites = WORDS.map((w) => {
    const tw = Math.ceil(m.measureText(w).width) + 1, th = Math.ceil(FS * 1.7), bw = tw + pad * 2, bh = th + pad * 2;
    if (x + bw > AW) { x = 0; y += rowH; rowH = 0; }
    const sp = { word: w, w: tw, h: th, pad, bw, bh, ax: x, ay: y };
    x += bw; rowH = Math.max(rowH, bh);
    return sp;
  });
  const AH = y + rowH;
  const sheet = (green) => {
    const c = document.createElement("canvas"); c.width = Math.ceil(AW * DPR); c.height = Math.ceil(AH * DPR);
    const g = c.getContext("2d"); g.scale(DPR, DPR); g.font = font(FS); g.textBaseline = "middle";
    for (const sp of sprites) {
      const tx = sp.ax + pad, ty = sp.ay + pad + sp.h / 2;
      if (green) {
        g.shadowColor = "rgba(57,255,20,.95)"; g.shadowBlur = 5 * DPR; g.fillStyle = "#2EE84C"; g.fillText(sp.word, tx, ty);
        g.shadowBlur = 0; g.fillStyle = "#26D943"; g.fillText(sp.word, tx, ty);
      } else { g.fillStyle = "#1C1A17"; g.fillText(sp.word, tx, ty); }
    }
    return c;
  };
  atlasGrey = sheet(false); atlasGreen = sheet(true);
}
function layout() {
  parts = []; lineStart = [];
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let y = LINE * .6; y < VH + LINE; y += LINE) {
    let x = -rnd() * 30;
    lineStart.push(parts.length);
    while (x < VW + 10) {
      const s = sprites[Math.floor(rnd() * sprites.length)];
      // Some words a shade darker than the rest, so the plane is not a grid.
      parts.push({ s, x, y, cx: x + s.w / 2, cy: y, a: .07 + rnd() * .12 });
      x += s.w + FS * (.55 + rnd() * 1.1);
    }
  }
  restCv = document.createElement("canvas"); restCv.width = wordsCv.width; restCv.height = wordsCv.height;
  const g = restCv.getContext("2d"); g.setTransform(DPR, 0, 0, DPR, 0, 0);
  for (const p of parts) drawPart(g, p, 0, 0, 0);
}
function drawPart(g, p, ox, oy, e) {
  const s = p.s, dx = p.x - s.pad + ox, dy = p.y - s.h / 2 - s.pad + oy;
  const sx = s.ax * DPR, sy = s.ay * DPR, sw = s.bw * DPR, sh = s.bh * DPR;
  g.globalAlpha = p.a * (1 - e * .55);
  g.drawImage(atlasGrey, sx, sy, sw, sh, dx, dy, s.bw, s.bh);
  if (e > .04) { g.globalAlpha = Math.min(.92, (e - .04) * 1.3); g.drawImage(atlasGreen, sx, sy, sw, sh, dx, dy, s.bw, s.bh); }
  g.globalAlpha = 1;
}

let wordsDirty = true, lineStart = [], WFONT = "";
// THE GLITCH, on the plane: the word under the cursor flickers into ones
// and zeros and resolves back, left to right (the page's own text does the
// same, below). part index -> its run.
const GL = new Map();
function planeWordAt(x, y) {
  const li = Math.round((y - LINE * .6) / LINE);
  if (li < 0 || li >= lineStart.length) return -1;
  const a = lineStart[li], b = li + 1 < lineStart.length ? lineStart[li + 1] : parts.length;
  for (let k = a; k < b; k++) { const p = parts[k]; if (x >= p.x - 1 && x <= p.x + p.s.w + 1 && Math.abs(y - p.y) <= LINE / 2) return k; }
  return -1;
}
export function glitchPlane(x, y) {
  if (reduced) return;
  const k = planeWordAt(x, y);
  if (k < 0 || GL.has(k)) return;
  const tok = Array.from(parts[k].s.word);
  GL.set(k, { t0: performance.now(), dur: Math.min(720, 240 + tok.length * 44), tok, rnd: [], flip: 0 });
}
// Only words the water is moving are touched. Last frame's are first put
// back from the plane at rest; this frame's are lifted out of it (their
// resting place cleared) and drawn where the water puts them.
let dirty = new Float32Array(4 * 8192), nDirty = 0, nextDirty = new Float32Array(4 * 8192);
const MOV = new Int32Array(8192), MOX = new Float32Array(8192), MOY = new Float32Array(8192), MOE = new Float32Array(8192);
export function drawWords() {
  const g = wctx;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (wordsDirty) { g.clearRect(0, 0, VW, VH); g.drawImage(restCv, 0, 0, VW, VH); nDirty = 0; wordsDirty = false; }
  if (wave.max < .008 && !nDirty && !GL.size) return;
  for (let i = 0; i < nDirty; i++) {
    const x = dirty[i * 4], y = dirty[i * 4 + 1], w = dirty[i * 4 + 2], h = dirty[i * 4 + 3];
    g.clearRect(x, y, w, h); g.drawImage(restCv, x * DPR, y * DPR, w * DPR, h * DPR, x, y, w, h);
  }
  let n = 0;
  if (wave.max >= .008) for (let k = 0; k < parts.length && n < 8192; k++) {
    const p = parts[k]; sample(p.cx, p.cy); const u = wave.u, ux = wave.x, uy = wave.y;
    // Seen through moving water: words slide down the slope and ride the swell.
    const ox = -ux * 16, oy = -uy * 16 - u * 4.5, e = clamp(Math.abs(u) * 1.25 + (Math.abs(ux) + Math.abs(uy)) * .9);
    if ((Math.abs(ox) + Math.abs(oy) < .3 && e < .04) || GL.has(k)) continue;
    MOV[n] = k; MOX[n] = ox; MOY[n] = oy; MOE[n] = e; n++;
    g.clearRect(p.x - .5, p.y - p.s.h * .42, p.s.w + 1, p.s.h * .84);
  }
  let m = 0;
  for (let j = 0; j < n; j++) {
    const p = parts[MOV[j]], s = p.s, ox = MOX[j], oy = MOY[j];
    drawPart(g, p, ox, oy, MOE[j]);
    // What to put back next frame: the resting place and where it was drawn, as one box.
    const x0 = Math.floor(p.x - s.pad + Math.min(0, ox)) - 1, y0 = Math.floor(p.y - s.h / 2 - s.pad + Math.min(0, oy)) - 1;
    const x1 = Math.ceil(p.x - s.pad + s.bw + Math.max(0, ox)) + 1, y1 = Math.ceil(p.y - s.h / 2 - s.pad + s.bh + Math.max(0, oy)) + 1;
    const cx0 = Math.max(0, x0), cy0 = Math.max(0, y0), cx1 = Math.min(VW, x1), cy1 = Math.min(VH, y1);
    if (cx1 > cx0 && cy1 > cy0) { nextDirty[m * 4] = cx0; nextDirty[m * 4 + 1] = cy0; nextDirty[m * 4 + 2] = cx1 - cx0; nextDirty[m * 4 + 3] = cy1 - cy0; m++; }
  }
  if (GL.size) {
    const now = performance.now();
    g.font = WFONT; g.textBaseline = "middle"; g.fillStyle = "#1C1A17";
    for (const [k, r] of GL) {
      const p = parts[k], s = p.s, q = (now - r.t0) / r.dur;
      const bx = Math.max(0, Math.floor(p.x - s.pad)), by = Math.max(0, Math.floor(p.y - s.h / 2 - s.pad));
      if (m < 8192) { nextDirty[m * 4] = bx; nextDirty[m * 4 + 1] = by; nextDirty[m * 4 + 2] = Math.min(VW - bx, s.bw + 1); nextDirty[m * 4 + 3] = Math.min(VH - by, s.bh + 1); m++; }
      if (q >= 1) { GL.delete(k); continue; }   // put back from the plane at rest next frame
      if (now - r.flip > 46) { r.rnd = r.tok.map(() => (Math.random() < .5 ? "0" : "1")); r.flip = now; }
      // Resolved from the left, a little ahead of time.
      const front = Math.min(r.tok.length, Math.floor(r.tok.length * q * 1.12));
      g.clearRect(p.x - .5, p.y - s.h * .42, s.w + 1, s.h * .84);
      g.save(); g.beginPath(); g.rect(p.x - 1, p.y - s.h / 2, s.w + 2, s.h); g.clip();
      g.globalAlpha = Math.min(.7, Math.max(.3, p.a * 2.8));
      g.fillText(r.tok.slice(0, front).join("") + r.rnd.slice(front).join(""), p.x, p.y);
      g.restore();
    }
    g.globalAlpha = 1;
  }
  const t = dirty; dirty = nextDirty; nextDirty = t; nDirty = m;
}


/** Sizes the words' canvas to the window and lays the words out again (after a resize). */
export function fitWords() {
  VW = view.w; VH = view.h; DPR = view.dpr;
  FS = VW < 640 ? 5.8 : 6.4; LINE = VW < 640 ? 9.5 : 10.5;
  wordsCv.width = Math.round(VW * DPR); wordsCv.height = Math.round(VH * DPR);
  makeSprites(); layout();
  wordsDirty = true;
}
/** Draw the plane at rest again on the next frame (after the water is reset). */
export function redrawWords() { wordsDirty = true; }
