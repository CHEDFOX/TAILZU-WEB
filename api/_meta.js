// Meta, from Vercel's settings: the dataset id and the Conversions API token
// are read here, at request time, from the project's environment variables
// (Vercel → the project → Settings → Environment Variables). A change there
// reaches the site on the next deploy.
//
// The API keeps its own copy of the dataset id and token (TAILZU-BACKEND,
// tulmi/.env) for what only it sees: an account made, its first dictation, a
// subscription paid for. This file is the site's half: the pixel and the Lead.
const { isIP } = require("node:net");

const env = process.env;

/** The first variable that is set, by name; then any whose name says what it
 *  is and whose value looks like one, so the name used in Vercel need not be
 *  exactly ours. */
function pick(names, nameLike, valueLike) {
  for (const n of names) if (env[n] && valueLike.test(env[n].trim())) return env[n].trim();
  for (const [n, v] of Object.entries(env)) if (nameLike.test(n) && v && valueLike.test(v.trim())) return v.trim();
  return "";
}

const config = () => ({
  pixelId: pick(["META_PIXEL_ID", "META_DATASET_ID"], /PIXEL|DATASET/i, /^\d{8,20}$/),
  // Meta's access tokens start "EAA".
  token: pick(["META_CAPI_TOKEN", "META_ACCESS_TOKEN"], /TOKEN|CAPI/i, /^EAA[\w-]{20,}$/),
  testCode: (env.META_TEST_EVENT_CODE || "").trim(),
  graph: /^v\d+\.\d+$/.test(env.META_GRAPH_VERSION || "") ? env.META_GRAPH_VERSION : "v26.0",
  skipEurope: (env.META_SKIP_EUROPE || "true").trim().toLowerCase() !== "false",
});

// --- The server's copy of a Lead ------------------------------------------------

const SITE_EVENTS = new Set(["Lead"]);
const SITE_KINDS = new Set(["mac", "windows", "linux", "iphone", "android"]);
const EVENT_ID = /^[A-Za-z0-9_-]{8,64}$/;
/** _fbp and _fbc look like "fb.1.1712345678901.AbCd…". */
const FB_COOKIE = /^fb\.\d\.\d{10,16}\.[\w.-]{1,256}$/;

function header(req, name) {
  const v = req.headers[name];
  return (Array.isArray(v) ? v[0] : v) || "";
}

function visitorIp(req) {
  for (const h of ["x-real-ip", "x-vercel-forwarded-for", "x-forwarded-for"]) {
    const first = header(req, h).split(",")[0].trim();
    if (first && isIP(first)) return first;
  }
  return undefined;
}

function cookieOf(req, name) {
  for (const part of header(req, "cookie").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) {
      try { return decodeURIComponent(part.slice(i + 1).trim()); } catch { return undefined; }
    }
  }
  return undefined;
}

/** The Conversions API body for one browser event, or null when it is not one
 *  of ours. Same name and id as the pixel's, so Meta counts it once. */
function leadPayload(req, body, now = Date.now()) {
  const b = body && typeof body === "object" ? body : {};
  const name = String(b.name ?? "");
  const id = String(b.id ?? "");
  const kind = String(b.kind ?? "");
  if (!SITE_EVENTS.has(name) || !EVENT_ID.test(id) || !SITE_KINDS.has(kind)) return null;
  const page = String(b.url ?? "");
  const url = /^https:\/\/(www\.)?tailzu\.space(\/[^\s]*)?$/.test(page) ? page.slice(0, 300) : "https://tailzu.space/";
  const user = {};
  const ip = visitorIp(req);
  if (ip) user.client_ip_address = ip;
  const ua = header(req, "user-agent");
  if (ua) user.client_user_agent = ua.slice(0, 512);
  const fbp = cookieOf(req, "_fbp") || (typeof b.fbp === "string" ? b.fbp : "");
  const fbc = cookieOf(req, "_fbc") || (typeof b.fbc === "string" ? b.fbc : "");
  if (FB_COOKIE.test(fbp)) user.fbp = fbp;
  if (FB_COOKIE.test(fbc)) user.fbc = fbc;
  return {
    event_name: name,
    event_time: Math.floor(now / 1000),
    event_id: id,
    action_source: "website",
    event_source_url: url,
    user_data: user,
    custom_data: { content_name: kind },
  };
}

/** Post it to the dataset, token in the body (never the URL, so it cannot end
 *  up in a log line). Throws on a refusal. */
async function postEvent(payload, fetchImpl = fetch) {
  const c = config();
  const res = await fetchImpl(`https://graph.facebook.com/${c.graph}/${c.pixelId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [payload],
      ...(c.testCode ? { test_event_code: c.testCode } : {}),
      access_token: c.token,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text().catch(() => "")).slice(0, 300)}`);
}

// --- The pixel ------------------------------------------------------------------

/**
 * The pixel, as every page of tailzu.space loads it (/site-events.js), the
 * pages the API renders through the site's proxy (/download, /pricing, /faq…)
 * included. The same script as the API's siteEventsScript (src/ads/meta.ts):
 * change one, change both.
 *
 * HELD BACK, with no banner to ask: for a visitor whose browser says not to
 * track (Global Privacy Control, Do Not Track), and — META_SKIP_EUROPE — for
 * one whose clock is in Europe, where a pixel needs consent first.
 */
function siteEventsScript() {
  const c = config();
  if (!c.pixelId) return "/* Meta is not set up: no META_PIXEL_ID in Vercel. */\n";
  return `/* Tailzu → Meta: the page view, and who goes on to get the app. Conversions API: ${c.token ? "on" : "off"}. */
(function () {
  "use strict";
  var ID = ${JSON.stringify(c.pixelId)};
  var SKIP_EUROPE = ${c.skipEurope ? "true" : "false"};
  var nav = window.navigator || {};
  if (nav.globalPrivacyControl === true || nav.doNotTrack === "1" || window.doNotTrack === "1") return;
  var tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  if (SKIP_EUROPE && /^(Europe\\/|Atlantic\\/(Azores|Canary|Faroe|Madeira|Reykjavik)$)/.test(tz)) return;

  // Meta's loader, as Meta publishes it.
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  window.fbq("init", ID);
  window.fbq("track", "PageView");
  var page = location.pathname.replace(/\\/+$/, "") || "/";
  if (page === "/download" || page === "/pricing") window.fbq("track", "ViewContent", { content_name: page.slice(1) });

  /** What a link gets: an installer, or a store. Nothing else is a lead. */
  function kindOf(href) {
    if (/\\/downloads\\/Tailzu\\.dmg$/.test(href)) return "mac";
    if (/\\/downloads\\/Tailzu-Setup\\.exe$/.test(href)) return "windows";
    if (/\\/downloads\\/Tailzu\\.AppImage$/.test(href)) return "linux";
    if (/^https:\\/\\/(apps|itunes)\\.apple\\.com\\//.test(href)) return "iphone";
    if (/^https:\\/\\/play\\.google\\.com\\//.test(href)) return "android";
    if (/^https:\\/\\/[^/]*(microsoft|windows)\\.com\\//.test(href)) return "windows";
    return "";
  }
  function cookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  }
  function newId() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  }
  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a) return;
    var kind = kindOf(a.href);
    if (!kind) return;
    var id = newId();
    window.fbq("track", "Lead", { content_name: kind }, { eventID: id });
    var body = JSON.stringify({ name: "Lead", id: id, kind: kind, url: location.href, fbp: cookie("_fbp"), fbc: cookie("_fbc") });
    try {
      if (nav.sendBeacon) nav.sendBeacon("/v1/site/event", new Blob([body], { type: "application/json" }));
      else fetch("/v1/site/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true });
    } catch (e) {}
  }, true);
})();
`;
}

module.exports = { config, leadPayload, postEvent, siteEventsScript };
