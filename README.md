# tailzu.space

No framework, no dependencies, one small build step (the page's own scripts are
minified). A static page, a few scripts beside it, short films, and the API
behind it for the words and the downloads.

```
index.html            the page: markup, one <style>, three inline <script>s (GTM, the boot line, the copy C)
src/js/site.js        eager (defer): copy, shape, routing, the buttons, motion, Blip and its bubble, the hero and its film, the spine
src/js/play.js        lazy: the films below the hero, the sections' copy from /v1/site, Blip's section perches, the toys (crumble, typing, Ctrl twice, dust)
src/js/sections.js    lazy: the comb, beads, saboteur, race, reel, dial, desk stage, llm/dev, Ask, finale, secret, knot
src/js/mic.js         lazy: the level-only microphone and the phone's mic-key renderer
src/js/mic-demo.js    lazy, demo:true only: the recorder under the demo's contract
js/<the above>.js     what is served: built from src/js/ by scripts/min.mjs (never edit these)
js/blip.js            Blip, the presenter (a copy of the desktop app's, unchanged)
js/pill.js            the desktop app's pill, unchanged; with pillSplit.js (its springs) and knobs.js
demo/pill.html        the real pill in a frame, driven over postMessage by demo/pill-bridge.js
demo/ask.html         the Ask preview: a stand-in app, the guide, drive.js playing the runs
media/                the films (H.264 .mp4), posters (.avif/.webp), captions (.vtt), the QR
api/                  Meta's pixel and its Conversions API copy (see Meta's pixel)
vercel.json           rewrites to the API, headers, the two CSPs, caching
csp.mjs               writes index.html's inline hashes into the home page's CSP
scripts/min.mjs       builds js/ from src/js/ (esbuild's minify, no bundling); --check fails when js/ is stale
scripts/stamp.mjs     writes the ?v= stamps on every /js/ and /media/ reference
robots.txt, favicon.svg, favicon.ico, apple-touch-icon.png, icon-512.png, og.png, <key>.txt (IndexNow)
```

## After any change

Four steps, in this order, every time, before a push:

```
cd TAILZU-BACKEND/tulmi && npx tsx scripts/sync-site.mts ../../TAILZU-WEB/index.html   # only when the backend's copy changed
cd ../../TAILZU-WEB
node scripts/min.mjs              # src/js/*.js -> js/*.js (esbuild: npm i -g esbuild, or the backend's node_modules beside this repo)
node scripts/stamp.mjs            # /js and /media are cached for a year: every reference carries ?v=<sha256, 8 hex>
node csp.mjs                      # the inline <script>s and <style> are allowed by hash
node scripts/min.mjs --check && node scripts/stamp.mjs --check && node csp.mjs --check
```

A stale stamp serves yesterday's script for a year. A stale hash stops the
page's script or styles outright, so the page is built to read without them:
every download is a real `<a href>` before any script runs, and the copy is in
the markup.

## What machines read

The page's words come from `/v1/site` once its script runs; most crawlers do
not run it. So the backend also writes them INTO the HTML, between the `SEO:`
markers: the title, summary, canonical, link card, icons and structured data
in the head, and the hero lines, the said/wrote pairs, the languages, the copy
object `C` and the questions in the body. Never edit between the markers; edit
the backend and sync (above). `--check` on the sync fails when the page and
the backend disagree.

`/languages`, `/languages/<name>`, `/faq`, `/ai-keyboard*`, `/voice-typing*`,
`/sitemap.xml`, `/llms.txt` and `/llms-full.txt` are the backend's (src/seo),
served through the rewrites and canonical here. `/privacy`, `/terms`,
`/pricing` and `/download` are served by the backend too.

## What the page takes from /v1/site

All optional; without an answer (fetch blocked, API down) the page is complete
from `C` and its own defaults.

| key | what it does |
| --- | --- |
| `copy` | deep-merged into `C`; every string on the page |
| `theme` | colour tokens by name (`ink`, `cream`, `indigo`, …) |
| `layout.order`, `layout.hidden`, `layout.bands` | section order, sections left out, each section's band (`cream`, `ink`, `indigo`, `violet`); an unknown id or band is ignored, and a section the order leaves out rides after its predecessor in the source |
| `meta` | title and description |
| `downloads` | the installer links and versions, per platform |
| `demo`, `maxSeconds`, `perMinute`, `freeWords` | the recorder (off unless `demo` is true) |
| `mic` | the phone's mic key: mark, program, inset |
| `ask` | `"off"` (default: the Ask section stays hidden), `"soon"`, `"live"` |

## The download is always a link

`js/site.js:route()` decides one primary download per visitor and writes it
into every primary pill (`#heroPill`, `#mastPill`, `#finaleYes`, `#footPill`)
before anyone can click: iPhone and iPad (including iPadOS's desktop UA) → the
App Store; Android → Google Play; Windows → the Microsoft installer; Mac →
the `.dmg`; Linux → the `.AppImage`; ChromeOS and anything else → `/download`.
`?os=ios|android|win|mac|linux|chromeos|other` overrides it, for QA. An
installer click keeps the page where it is and runs the pill's loading → done
states; a store click just navigates.

## Motion, and Calm

One `requestAnimationFrame` scheduler (`TZ.sched`) runs every moving thing
and sleeps when nothing moves. The springs are the desktop pill's own
(`js/pillSplit.js`): pull-out 120/24 for things coming apart, pull-in 240/16
for things going home. The threads are a wave equation on nodes 6 px apart.

The **Calm** switch in the masthead (and `prefers-reduced-motion`) turns all
of it into the still version: the boot line in the head sets `html.calm`
before first paint, from `localStorage["tz.calm"]` or the media query, so
nothing moves even for a frame. Films never autoplay under Calm.

## Blip

The presenter from the desktop app (`js/blip.js`, unchanged) perches on each
section's edge, looks at the pointer, peeks over the stand-in field while the
desk demo writes, and answers a few pokes. Its lines are in `C.blip`.

## The microphone

The page's microphone measures **loudness only** and says so; nothing leaves
the page. The recorder that sends a clip to `/v1/demo/transcribe` exists
(`js/mic.js`), under the contract the API has always had, but stays off
until `/v1/site` says `demo: true`. In `~/tulmi/tulmi/.env`:

```
DEMO_ENABLED=true
DEMO_MAX_SECONDS=15     # a pitch, not a dictation
DEMO_PER_MINUTE=6       # per address
```

then `docker compose up -d --build backend`. With it off nothing breaks and
nothing is spent.

## The mic key is the phone's

The keyboard's mic key, wherever the page draws it, runs the same renderer the
phones do: the mark drawn from the server's geometry, moved by the server's
program. Both come with `/v1/site` as `mic`; `js/mic.js` carries a copy
between `MIC-BEGIN` and `MIC-END` for when the server has not answered. A new
mic key is a backend deploy; refresh the copy when the program changes.

## Publishing

The site is on Vercel, deployed from this repo: a push to `main` is the
deploy, live in under a minute. `vercel.json` proxies `/v1/site`,
`/v1/site/event`, `/site-events.js`, `/v1/demo/transcribe`, `/v1/pay/*`,
`/download`, the three installers, the backend's pages and the SEO files to
the API, and nothing else of it. `.vercelignore` keeps this file, `csp.mjs`,
`scripts/` and `scratchpad/` off the site.

Headers: the home page has its own CSP (inline blocks by hash, media and
frames from this origin, Google Fonts, GTM, Meta's pixel); `/demo/*` has a
stricter one with no inline script at all, and may be framed by this origin
only (every other path: `X-Frame-Options: DENY`). `/js/*` and `/media/*` are
`immutable` for a year, which is why the stamps matter.

## Meta's pixel

`<script src="/site-events.js">` in the head is Meta's pixel. Vercel serves
it, from `api/site-events.js` through the rewrite in `vercel.json`, with the
dataset id from the project's environment variables: `META_PIXEL_ID`, and
`META_CAPI_TOKEN` for the Conversions API. A change there needs a redeploy.
Until the id is set the file is one comment.

It reports the page view, `ViewContent` on /download and /pricing, and `Lead`
when a link to an installer or a store is clicked. Each Lead is also posted
to `/v1/site/event` (`api/site-event.js`), which copies it to the Conversions
API under the same event id.

It does not load for a visitor whose browser asks not to be tracked (Global
Privacy Control, Do Not Track), nor, while there is no consent banner, for one
whose clock is in Europe. The page's own analytics events (`TZ.track`) follow
the same gate (`js/site.js:consent()` mirrors `api/_meta.js`: change one,
change both).

## Look at it

Serve the folder (any static server) and open it. It fetches its copy from
`https://api.tailzu.space`; to point somewhere else, set `data-api` on the
`<html>` tag.

## The API's own copy

`api.tailzu.space/` answers with a 308 to `https://tailzu.space/` (the backend's
`src/routes/demo.ts`), so nobody lands on a stale copy of this page. Until that
backend release is out, the old hand-copied `~/tulmi/site/index.html` is still
served there; it would need `index.html`, `js/`, `media/` and `demo/` together.

## Change the words

Not here. `SITE_UI` in the backend's `catalog.ts` is every string on this
page; this file carries the same text inline (`C`) only as a fallback. Edit
there, deploy, sync. Copy is never markup: the page sets all of it as text.
