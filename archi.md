# x0bot.com — architecture

The public site for X0 Bot. One static page with its clips, three small serverless functions, and a set of
rewrites that put the backend's pages (pricing, privacy, downloads, SEO pages) under the same domain. No build
step, no framework, no dependencies. Deployed by Vercel on every push to `main`.

## Layout

```
index.html              the page: markup, one <style>, the tag manager and the page script inline, a <noscript> fallback
media/                  the clips on the cards
  <id>.webm / .mp4      each clip in VP9 (preferred) and H.264
  <id>.webp             its poster frame
  clips-phone.json      the phone cards: clip ids, sizes, beats
  clips-laptop.json     the laptop cards: clip ids, sizes, beats
api/                    Vercel serverless functions (Node)
  _meta.js              shared Meta pixel / Conversions API helpers (reads the dataset id and token from Vercel env)
  site-event.js         POST /v1/site/event: a page event (e.g. a download press) sent to Meta's Conversions API
  site-events.js        GET /site-events.js: the pixel loader script
vercel.json             redirects (tailzu.space → x0bot.com), rewrites to the API, security headers, the page's CSP, caching
csp.mjs                 writes the hashes of index.html's inline blocks into vercel.json's CSP (`node csp.mjs`, `--check`)
robots.txt              crawler rules (search engines and answer engines allowed by name)
<key>.txt               the IndexNow key file
og.png                  the link-preview image
favicon.*, apple-touch-icon.png, icon-*.png, site.webmanifest
                        the app icon in every size browsers and phones ask for (kept at the root, where they look)
README.md               how the page behaves, what to run after a change, how publishing works
.vercelignore           files kept off the deployed site (README.md, archi.md, csp.mjs)
```

## Where to find things

| Looking for | Where |
|---|---|
| The page's copy and the card stack | `index.html`, the page script (`STACK`, the Mac scene's lines) |
| Which clip plays on which card, and when | `media/clips-phone.json`, `media/clips-laptop.json` |
| The download button's per-device target | `index.html` (the `#home` key's script) |
| The `<head>` (title, canonical, structured data) | between `SEO:HEAD` markers in `index.html`, written by the backend's `tulmi/scripts/sync-site.mts`; never edit by hand |
| Pricing, privacy, terms, support, delete-account, FAQ, language and SEO pages, and `/device` (signing in to Xode in the terminal) | served by the backend (`api.x0bot.com`), mapped here in `vercel.json` `rewrites` |
| Desktop installers (`Tailzu-Setup.exe`, `Tailzu.dmg`, `Tailzu.AppImage`) | proxied from `api.x0bot.com/downloads/` by `vercel.json` |
| Installing `xode` (Xode in the terminal) in one line | `install.sh` (`curl -fsSL https://x0bot.com/install.sh \| bash`) and `install.ps1` (`irm https://x0bot.com/install.ps1 \| iex`), served as text by `vercel.json` `headers`; both run `npm install -g @xooteqlab/xode` |
| Meta pixel and Conversions API | `api/` (site side); the backend keeps its own copy for account events |
| Security headers and the CSP | `vercel.json` `headers`; hashes kept current by `csp.mjs` |
| The old domain's behaviour | `vercel.json` `redirects` (pages 301 to x0bot.com; `/v1`, `/downloads`, `/.well-known`, `/api` still proxied) |

## How it fits together

- The browser loads `index.html`; the page script draws the opening, then the cards, reading clip sizes from
  `media/clips-*.json` and playing `.webm` (else `.mp4`).
- Everything dynamic belongs to the backend: Vercel rewrites `/v1/...`, `/download`, the installers and the
  backend's pages to `api.x0bot.com`, so the site never handles accounts, payments or large files itself.
- Only the page's own analytics run here (`api/`), with credentials from Vercel's environment variables.

## Working on it

- After editing an inline `<script>` or `<style>`: `node csp.mjs` (a stale hash blanks the page).
- After the backend's head changed: from `TAILZU-BACKEND/tulmi`, `npx tsx scripts/sync-site.mts ../../TAILZU-WEB/index.html`
  (add `--check` before pushing).
- Publishing: push to `main`; Vercel deploys in under a minute.
