// The page's own scripts are written readable in src/js/ and served minified from js/ (same
// names, so nothing that loads them changes). Run it after any edit under src/js/, then
// stamp.mjs (the new bytes get new ?v= stamps), then csp.mjs:
//
//   node scripts/min.mjs            write js/<name>.js from src/js/<name>.js
//   node scripts/min.mjs --check    exit 1 if any js/ file is not the build of its source
//
// esbuild's transform only (no bundling, no renames across files): whitespace, comments and
// local names go; behaviour stays. The app's own files (blip.js, pillSplit.js, pill.js,
// knobs.js) are copies from TAILZU-DESKTOP, kept unchanged and never built here.
// esbuild is found as a package (npm i -g esbuild, or ESBUILD=<path to its package>), or in
// the backend's node_modules beside this repo.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const check = process.argv.includes("--check");
const require = createRequire(import.meta.url);
function esbuild() {
  const tries = [process.env.ESBUILD, "esbuild", path.join(root, "../TAILZU-BACKEND/tulmi/node_modules/esbuild")].filter(Boolean);
  for (const t of tries) { try { return require(t); } catch (e) { /* next */ } }
  console.error("esbuild not found: npm i -g esbuild, or set ESBUILD=<path to the esbuild package>");
  process.exit(2);
}
const { transformSync } = esbuild();
const src = path.join(root, "src/js"), out = path.join(root, "js");
let stale = 0;
for (const f of fs.readdirSync(src).filter((f) => f.endsWith(".js")).sort()) {
  const code = fs.readFileSync(path.join(src, f), "utf8");
  const r = transformSync(code, { minify: true, target: "es2020", charset: "utf8", legalComments: "none", sourcefile: "src/js/" + f });
  const built = "/* tailzu.space " + f + ": built from src/js/" + f + " by scripts/min.mjs. Edit the source, not this file. */\n" + r.code;
  const dest = path.join(out, f), now = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : "";
  if (now === built) continue;
  stale++;
  if (check) { console.error("stale: js/" + f); continue; }
  fs.writeFileSync(dest, built);
  console.log("built js/" + f, code.length, "->", built.length);
}
if (check) { if (stale) process.exit(1); console.log("js in sync"); }
