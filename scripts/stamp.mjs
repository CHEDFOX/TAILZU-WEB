// Immutable caching needs versioned URLs. vercel.json serves /js/* and
// /media/* with "public, max-age=31536000, immutable", so every reference to
// them carries ?v=<the first 8 hex of the file's SHA-256>. This rewrites those
// references in index.html and in demo/*.html (the frames the page opens);
// run it after any change to a file under js/ or media/, and after a sync.
//
//   node scripts/stamp.mjs            rewrite the ?v= stamps
//   node scripts/stamp.mjs --check    exit 1 if any stamp is stale
//
// The stamps live in src/href/content attributes (and the lazy list in the
// <meta name="tz:lazy">), never inside an inline <script> or <style>, so
// stamping changes no CSP hash. A file that is missing keeps its stamp and
// is reported.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const pages = ["index.html", ...fs.readdirSync(path.join(root, "demo")).filter((f) => f.endsWith(".html")).map((f) => "demo/" + f)];
const check = process.argv.includes("--check");
const memo = new Map();
const missing = new Set();
function stamp(rel) {
  if (memo.has(rel)) return memo.get(rel);
  const file = path.join(root, rel);
  let v = null;
  if (fs.existsSync(file)) v = createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 8);
  else missing.add(rel);
  memo.set(rel, v);
  return v;
}
let stale = 0;
for (const page of pages) {
  const file = path.join(root, page);
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(/\/((?:js|media)\/[\w.\-]+)\?v=([0-9a-z]*)/g, (m, rel, old) => {
    const v = stamp(rel);
    return v ? `/${rel}?v=${v}` : m;
  });
  if (after !== before) {
    stale++;
    if (!check) { fs.writeFileSync(file, after); console.log(`stamped ${page}`); }
  }
}
if (missing.size) console.warn("not found (stamp kept): " + [...missing].join(", "));
if (check) {
  if (stale) { console.error(`${stale} page(s) carry stale ?v= stamps: run node scripts/stamp.mjs`); process.exit(1); }
  console.log("stamps in sync");
} else if (!stale) console.log("stamps already in sync");
