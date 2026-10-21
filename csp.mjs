// The Content-Security-Policy of the home page (vercel.json, the header rule
// for "/(|index\\.html)") allows index.html's inline <script> and <style> by
// their sha256, so ANY edit to one of them — a hand edit, or
// tulmi/scripts/sync-site.mts rewriting the copy inside the script — changes
// its hash, and a stale hash stops that block from running.
// Run this after every such edit (and after every sync), then deploy both files:
//
//   node csp.mjs            write the hashes into vercel.json
//   node csp.mjs --check    exit 1 if vercel.json is stale
//
// It edits ONE value: the CSP of the home page's rule (not /demo/*'s, which
// allows no inline script at all), and in it only the hash runs after
// script-src 'self' and style-src 'self'. Every other directive is by hand.
// The file is edited in place (that one JSON string is swapped for its new
// value), so its layout, one rewrite to a line, is kept.
import { createHash } from "node:crypto";
import fs from "node:fs";

const at = (f) => new URL(f, import.meta.url);
const html = fs.readFileSync(at("index.html"), "utf8");
// Only attribute-less tags: the JSON-LD block is data, never executed, and needs no hash.
const hashes = (tag) => [...html.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))]
  .map((m) => `'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`).join(" ");
const before = fs.readFileSync(at("vercel.json"), "utf8");
const json = JSON.parse(before);
const rule = (json.headers || []).find((h) => h.source === "/(|index\\.html)");
const csp = rule && (rule.headers || []).find((h) => h.key === "Content-Security-Policy");
if (!csp) { console.error("vercel.json: no Content-Security-Policy on the /(|index\\.html) rule"); process.exit(1); }
const value = csp.value
  .replace(/script-src 'self'( 'sha256-[^']+')*/, `script-src 'self' ${hashes("script")}`)
  .replace(/style-src 'self'( 'sha256-[^']+')*/, `style-src 'self' ${hashes("style")}`);
const old = JSON.stringify(csp.value);
if (before.split(old).length !== 2) { console.error("vercel.json: the home page's CSP value must appear exactly once"); process.exit(1); }
const after = before.replace(old, () => JSON.stringify(value));
JSON.parse(after);
if (process.argv.includes("--check")) {
  if (after !== before) { console.error("vercel.json CSP is stale: run node csp.mjs"); process.exit(1); }
  console.log("CSP in sync");
} else {
  fs.writeFileSync(at("vercel.json"), after);
  console.log(after === before ? "CSP already in sync" : "vercel.json CSP updated");
}
