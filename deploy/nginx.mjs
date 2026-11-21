// The site's nginx config, made from vercel.json, so the routes and headers
// have one source whichever host serves them, and csp.mjs keeps working.
//
//   node deploy/nginx.mjs            write deploy/nginx/x0bot.conf and x0bot.http.conf
//   node deploy/nginx.mjs --check    exit 1 if either is stale
//
// x0bot.conf is the live config, with TLS. x0bot.http.conf is the one before the
// certificate exists: the same site over plain HTTP, plus next.x0bot.com as a
// preview name, so it can be looked at before the domain is moved (README.md,
// "Publishing"). deploy/ship.sh installs whichever fits.
//
// It reads the subset of vercel.json this site uses, and refuses anything else
// rather than guess: a literal path, ":name", ":name*", ":name(regex)" and a bare
// "(regex)"; rewrites to the API at the same path, or to one of this repo's own
// functions under /api (which the API now serves itself, at the source path);
// redirects bound to a host; headers by path.
import fs from "node:fs";

const at = (f) => new URL(f, import.meta.url);
const API_ORIGIN = "https://api.x0bot.com";   // where vercel.json sends what the site does not serve itself
const BACKEND = "http://127.0.0.1:8770";      // the same API, as nginx on the VPS reaches it (TAILZU-BACKEND docker-compose.yml)
const SITE = "x0bot.com";
const WWW = "www.x0bot.com";
const PREVIEW = "next.x0bot.com";
const ROOT = "/var/www/x0bot.com/current";
const ACME = "/var/www/letsencrypt";
const CERT = "/etc/letsencrypt/live/x0bot.com";
// Vercel's own default for a file the headers do not name: always check back, then use the copy if it is unchanged.
const DEFAULT_CACHE = "public, max-age=0, must-revalidate";

const vercel = JSON.parse(fs.readFileSync(at("../vercel.json"), "utf8"));
const fail = (msg) => { console.error(`deploy/nginx.mjs: ${msg}`); process.exit(1); };

// ---- a vercel.json path, as a regex nginx and JavaScript both read ----
function toRegex(source) {
  let out = "", i = 0;
  const group = () => {                 // a "(…)" with any nesting, returned with its parentheses
    let depth = 0, j = i;
    for (; j < source.length; j++) {
      if (source[j] === "\\") { j++; continue; }
      if (source[j] === "(") depth++;
      else if (source[j] === ")" && --depth === 0) break;
    }
    if (depth !== 0 && j >= source.length) fail(`unbalanced group in ${source}`);
    const g = source.slice(i, j + 1); i = j + 1; return g;
  };
  while (i < source.length) {
    const c = source[i];
    if (c === ":") {
      const m = /^:([A-Za-z_]\w*)/.exec(source.slice(i));
      if (!m) fail(`a ":" with no name in ${source}`);
      i += m[0].length;
      if (source[i] === "(") out += group();
      else if (source[i] === "*") { out += "(.*)"; i++; }
      else out += "([^/]+)";
    } else if (c === "(") out += group();
    else { out += /[.+?^${}[\]|\\]/.test(c) ? "\\" + c : c; i++; }
  }
  return `^${out}$`;
}
const isLiteral = (s) => !/[:(*]/.test(s);
// "/a/:b(x|y)" and "/a/:b" are the same path: the regex only narrows what :b may be
const bare = (s) => s.replace(/:([A-Za-z_]\w*)\((?:[^()]|\([^()]*\))*\)/g, ":$1");
// a path the source would match, for asking which rewrites a host-bound redirect leaves alone
function sample(source) {
  return source.replace(/:([A-Za-z_]\w*)\*/g, "x").replace(/:([A-Za-z_]\w*)\(([^)]*)\)/g, (_, n, re) => re.split("|")[0].replace(/\\/g, ""))
    .replace(/:([A-Za-z_]\w*)/g, "x");
}

// ---- headers: the rule for every path, and the rules for some ----
const everyPath = vercel.headers.filter((h) => h.source === "/(.*)");
if (everyPath.length !== 1) fail('expected exactly one header rule for "/(.*)"');
const GLOBAL = everyPath[0].headers;
const globalKeys = GLOBAL.map((h) => h.key.toLowerCase());
const q = (v) => { if (v.includes('"')) fail(`a header value with a double quote: ${v}`); return `"${v}"`; };
const addHeaders = (list, pad) => list.map((h) => `${pad}add_header ${h.key} ${q(h.value)} always;`).join("\n");

const fileRules = vercel.headers.filter((h) => h.source !== "/(.*)").map((h) => {
  const type = h.headers.find((x) => x.key.toLowerCase() === "content-type");
  const rest = h.headers.filter((x) => x.key.toLowerCase() !== "content-type");
  const hasCache = rest.some((x) => x.key.toLowerCase() === "cache-control");
  return { source: h.source, re: toRegex(h.source), type: type && type.value.split(";")[0].trim(), headers: hasCache ? rest : [...rest, { key: "Cache-Control", value: DEFAULT_CACHE }] };
});

// The site's own files, as ship.sh publishes them (everything but what it leaves out).
const LEFT_OUT = new Set([...fs.readFileSync(at("../.vercelignore"), "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")),
  ".git", ".github", ".vercelignore", "vercel.json", "deploy", "api", "scripts", "WORKING-ON.md"]);
function publicFiles(dir = "", out = []) {
  for (const e of fs.readdirSync(at("../" + dir), { withFileTypes: true })) {
    const rel = dir + e.name;
    if (LEFT_OUT.has(rel)) continue;
    if (e.isDirectory()) publicFiles(rel + "/", out); else out.push("/" + rel);
  }
  return out;
}
const FILES = publicFiles();
// Vercel merges every header rule that matches a path; nginx answers from one location. So no file may match two.
for (const f of FILES) {
  const hits = fileRules.filter((r) => new RegExp(r.re).test(f));
  if (hits.length > 1) fail(`${f} matches two header rules (${hits.map((h) => h.source).join(", ")}); nginx would apply only one`);
}
// Types nginx's mime.types does not have, as Vercel sends them.
const MORE_TYPES = { ".webmanifest": "application/manifest+json" };
const typed = FILES.filter((f) => Object.keys(MORE_TYPES).some((x) => f.endsWith(x))).map((f) => {
  const rule = fileRules.find((r) => new RegExp(r.re).test(f));
  return { path: f, type: MORE_TYPES[Object.keys(MORE_TYPES).find((x) => f.endsWith(x))], headers: rule ? rule.headers : [{ key: "Cache-Control", value: DEFAULT_CACHE }] };
});

// ---- rewrites: what the API answers under the site's own name ----
const rewrites = vercel.rewrites.map((r) => {
  let to;
  if (r.destination.startsWith(API_ORIGIN + "/")) {
    to = r.destination.slice(API_ORIGIN.length);
    if (to !== bare(r.source)) fail(`rewrite ${r.source} goes to a different path on the API (${to}); teach deploy/nginx.mjs that first`);
  } else if (r.destination.startsWith("/api/")) {
    to = r.source;                       // the function is gone; the API answers the same path (TAILZU-BACKEND src/routes/site/sitePages.ts)
  } else fail(`rewrite ${r.source} → ${r.destination}: only the API and /api functions are understood`);
  return { source: r.source, re: toRegex(r.source), literal: isLiteral(r.source) };
});

// ---- redirects: host-bound, all to x0bot.com ----
const byHost = new Map();
for (const r of vercel.redirects) {
  const host = (r.has || []).find((h) => h.type === "host");
  if (!host || (r.has || []).length !== 1) fail(`redirect ${r.source}: only a redirect bound to one host is understood`);
  const m = /^https:\/\/x0bot\.com\/:([A-Za-z_]\w*)\*$/.exec(r.destination);
  if (!m) fail(`redirect ${r.source} → ${r.destination}: only "https://x0bot.com/:name*" is understood`);
  const key = `${r.source}|${r.statusCode}`;
  if (!byHost.has(key)) byHost.set(key, { re: toRegex(r.source), status: r.statusCode, hosts: [] });
  byHost.get(key).hosts.push(host.value);
}
if (byHost.size !== 1) fail("expected one redirect rule shared by the old hosts");
const OLD = [...byHost.values()][0];

// ---- the pieces of a server block ----
const P = "        ";
const proxy = () => `${P}proxy_pass ${BACKEND};
${P}proxy_http_version 1.1;
${P}# The name Vercel sent: the API has always answered these under its own name, and builds its links from it.
${P}proxy_set_header Host api.x0bot.com;
${P}proxy_set_header X-Forwarded-Host $host;
${P}proxy_set_header X-Forwarded-Proto $scheme;
${P}proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
${P}proxy_set_header X-Real-IP $remote_addr;
${P}proxy_read_timeout 300s;
${globalKeys.map((k) => `${P}proxy_hide_header ${GLOBAL.find((h) => h.key.toLowerCase() === k).key};`).join("\n")}
${addHeaders(GLOBAL, P)}`;

function rewriteLocations(list) {
  return list.map((r) => `    # vercel.json: rewrite ${r.source}\n    location ${r.literal ? `= ${r.source}` : `~ ${r.re}`} {\n${proxy()}\n    }`).join("\n\n");
}
function fileLocations() {
  const out = typed.map((t) => `    # ${t.path}: a type nginx does not know, as Vercel sends it\n    location = ${t.path} {\n${P}types { }\n${P}default_type ${t.type};\n${addHeaders(GLOBAL, P)}\n${addHeaders(t.headers, P)}\n${P}try_files $uri =404;\n    }`);
  out.push(...fileRules.map((f) => {
    const loc = isLiteral(f.source) ? `location = ${f.source}` : `location ~ ${f.re}`;
    const roots = new RegExp(f.re).test("/");
    const lines = [
      ...(f.type ? [`${P}types { }`, `${P}default_type ${f.type};`] : []),
      addHeaders(GLOBAL, P),
      addHeaders(f.headers, P),
      `${P}try_files ${roots ? "$uri /index.html" : "$uri"} =404;`,
    ];
    return `    # vercel.json: headers for ${f.source}\n    ${loc} {\n${lines.join("\n")}\n    }`;
  }));
  out.push(`    # every other file: the headers for every path, and Vercel's default caching\n    location / {\n${addHeaders(GLOBAL, P)}\n${addHeaders([{ key: "Cache-Control", value: DEFAULT_CACHE }], P)}\n${P}try_files $uri =404;\n    }`);
  return out.join("\n\n");
}
const common = `    # No access log: no visitor's address is written to disk (TAILZU-BACKEND docs/trust.md 8.3), as for the API.
    access_log off;
    charset utf-8;
    gzip on;
    gzip_vary on;
    gzip_comp_level 5;
    gzip_types text/css application/javascript application/json image/svg+xml text/plain application/manifest+json;`;
const acme = `    # Let's Encrypt's check for the certificate (certbot certonly --webroot -w ${ACME})
    location ^~ /.well-known/acme-challenge/ {
        root ${ACME};
        default_type text/plain;
    }`;
const listen = (tls) => tls ? `    listen 443 ssl http2;\n    ssl_certificate ${CERT}/fullchain.pem;\n    ssl_certificate_key ${CERT}/privkey.pem;` : "    listen 80;";

function config(tls) {
  // the old hosts: pages go to x0bot.com; what vercel.json's redirect leaves alone is proxied as before
  const oldRe = new RegExp(OLD.re);
  const kept = rewrites.filter((r) => !oldRe.test(sample(r.source)));
  const site = `# x0bot.com: the site's own files, and the API's pages under its name
server {
${listen(tls)}
    server_name ${tls ? SITE : `${SITE} ${PREVIEW}`};
${common}
    root ${ROOT};
    index index.html;
${tls ? "" : acme + "\n"}
${rewriteLocations(rewrites)}

${fileLocations()}
}`;
  const www = `# www.x0bot.com: the same site's other name (TAILZU-BACKEND docs/domain-x0bot.md); 308 keeps a POST a POST
server {
${listen(tls)}
    server_name ${WWW};
${common}
${tls ? "" : acme + "\n"}    location / {
${addHeaders(GLOBAL, P)}
${P}return 308 https://${SITE}$request_uri;
    }
}`;
  const old = `# ${OLD.hosts.join(", ")}: the old address (README.md, "The old address, tailzu.space")
server {
${listen(tls)}
    server_name ${OLD.hosts.join(" ")};
${common}
${tls ? "" : acme + "\n"}
${rewriteLocations(kept)}

    # vercel.json: redirect ${vercel.redirects[0].source}
    location ~ ${OLD.re} {
${addHeaders(GLOBAL, P)}
${P}return ${OLD.status} https://${SITE}/$1$is_args$args;
    }

    # what the redirect leaves alone and nothing proxies: as on Vercel, not found
    location / {
${addHeaders(GLOBAL, P)}
${P}return 404;
    }
}`;
  const plain = `# Plain HTTP: Let's Encrypt's check, and everything else to HTTPS
server {
    listen 80;
    server_name ${[SITE, WWW, ...OLD.hosts].join(" ")};
    access_log off;
${acme}
    location / {
        return 301 https://$host$request_uri;
    }
}`;
  const head = `# GENERATED by deploy/nginx.mjs from vercel.json. Do not edit: change vercel.json and run  node deploy/nginx.mjs
# ${tls ? "The live config, with TLS (certificate: certbot, cert-name x0bot.com)." : "Before the certificate: the same site over plain HTTP, with next.x0bot.com as a preview name."}
# Installed by deploy/ship.sh as /etc/nginx/sites-available/x0bot.com, only once nginx -t accepts it.
`;
  return [head, ...(tls ? [plain] : []), site, www, old].join("\n") + "\n";
}

const outputs = [["nginx/x0bot.conf", config(true)], ["nginx/x0bot.http.conf", config(false)]];
const check = process.argv.includes("--check");
let stale = false, wrote = 0;
for (const [file, text] of outputs) {
  const path = at(file);
  const now = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
  if (now === text) continue;
  if (check) { console.error(`deploy/${file} is stale: run node deploy/nginx.mjs`); stale = true; }
  else { fs.mkdirSync(at("nginx/"), { recursive: true }); fs.writeFileSync(path, text); console.log(`wrote deploy/${file}`); wrote++; }
}
if (check) { if (stale) process.exit(1); console.log("nginx config in sync"); }
else if (!wrote) console.log("nginx config already in sync");
