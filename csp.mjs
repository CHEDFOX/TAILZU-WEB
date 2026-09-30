// The Content-Security-Policy in vercel.json allows index.html's inline
// <script> and <style> by their sha256, so ANY edit to either — a hand edit,
// or tulmi/scripts/sync-site.mts rewriting the FAQ copy inside the script —
// changes the hash, and a stale hash stops the page's script from running.
// Run this after every such edit (and after every sync), then deploy both files:
//
//   node csp.mjs            write the hashes into vercel.json
//   node csp.mjs --check    exit 1 if vercel.json is stale
import { createHash } from "node:crypto";
import fs from "node:fs";

const at = (f) => new URL(f, import.meta.url);
const html = fs.readFileSync(at("index.html"), "utf8");
// Only attribute-less tags: the JSON-LD block is data, never executed, and needs no hash.
const hashes = (tag) => [...html.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))]
  .map((m) => `'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`).join(" ");
const before = fs.readFileSync(at("vercel.json"), "utf8");
const after = before
  .replace(/script-src 'self'( 'sha256-[^']+')*/g, `script-src 'self' ${hashes("script")}`)
  .replace(/style-src 'self'( 'sha256-[^']+')*/g, `style-src 'self' ${hashes("style")}`);
if (process.argv.includes("--check")) {
  if (after !== before) { console.error("vercel.json CSP is stale: run node csp.mjs"); process.exit(1); }
  console.log("CSP in sync");
} else {
  fs.writeFileSync(at("vercel.json"), after);
  console.log(after === before ? "CSP already in sync" : "vercel.json CSP updated");
}
