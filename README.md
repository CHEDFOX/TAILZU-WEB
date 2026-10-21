# tailzu.space

No build, no framework, no dependencies. One static page, its clips, and the
API behind it for the backend's pages and the downloads.

```
index.html            the page: markup, one <style>, two inline <script>s (GTM, the page), and a <noscript> head style
media/                the deck's clips: <id>.webm (VP9), <id>.mp4 (H.264), <id>.webp (poster), clips-phone.json and clips-laptop.json (sizes and beats)
api/                  Meta's pixel and its Conversions API copy (see Meta's pixel)
vercel.json           rewrites to the API, headers, the home page's CSP, caching
csp.mjs               writes index.html's inline hashes into the home page's CSP
robots.txt, favicon.svg, favicon.ico, apple-touch-icon.png, icon-512.png, og.png, <key>.txt (IndexNow)
```

## The page

One sheet of paper, drawn in one script: the opening (a plane of tiny words
in the world's scripts that moves like water, the dotted bot walking in and
waving), then the blur moment where the "Take me home" key arrives in the
header, then six cards of device clips, then the Mac scene, then the links.
The page is held still until the key has landed. Under
`prefers-reduced-motion` nothing is held and the clips wait for a press.

The copy is the page's own (`STACK` and the Mac scene's lines in the script).
The cards read their clips' sizes and beats from `/media/clips-*.json`; each
clip plays its `.webm`, else its `.mp4`. Every clip on a card is a `<id>` in
`STACK`; `boss`, `marta` and `mummy` are cut but not on a card.

## The download is always a link

The key (`#home`) is `/download` in the markup; the script points it at what
this device installs: iPhone and iPad (iPadOS's desktop UA included) → the
App Store; Android → Google Play; Windows → the Microsoft installer; Mac →
the `.dmg`; Linux → the `.AppImage` (both straight from `api.tailzu.space`,
so a hundred megabytes never pass through Vercel); ChromeOS and anything
else → `/download`. Without JavaScript the `<noscript>` block says what
Tailzu is and links every device. Every download link carries `data-place`
(`mast`, `foot`, `noscript`) for the tag manager.

## After any change

```
cd TAILZU-BACKEND/tulmi && npx tsx scripts/sync-site.mts ../../TAILZU-WEB/index.html   # when the backend's head changed (runs csp.mjs too)
cd ../../TAILZU-WEB && node csp.mjs                                                    # after any edit to an inline <script> or <style>
```

Before a push both checks pass (the sync's `--check` runs `csp.mjs --check`):

```
cd TAILZU-BACKEND/tulmi && npx tsx scripts/sync-site.mts ../../TAILZU-WEB/index.html --check
```

A stale hash stops that block outright: a stale script hash is a blank page.

## What machines read

Only the head comes from the backend: between `SEO:HEAD` and `/SEO:HEAD`,
the title, summary, canonical, link card, icons and structured data (the
"head only" shape of `sync-site.mts`, which names no films and no questions,
since the page shows neither). Never edit between the markers; edit the
backend and sync. The page's words are drawn by its script; a crawler that
runs none reads the head and the `<noscript>` block.

`/languages`, `/languages/<name>`, `/faq`, `/ai-keyboard*`, `/voice-typing*`,
`/sitemap.xml`, `/llms.txt` and `/llms-full.txt` are the backend's (src/seo),
served through the rewrites and canonical here. `/privacy`, `/terms`,
`/pricing` and `/download` are served by the backend too; the page links
them by these paths.

## Publishing

The site is on Vercel, deployed from this repo: a push to `main` is the
deploy, live in under a minute. `vercel.json` proxies `/v1/site`,
`/v1/site/event`, `/site-events.js`, `/v1/demo/transcribe`, `/v1/pay/*`,
`/download`, the three installers, the backend's pages and the SEO files to
the API, and nothing else of it. `.vercelignore` keeps this file, `csp.mjs`
and `scratchpad/` off the site.

Headers: `X-Frame-Options: DENY` everywhere. The home page's CSP allows its
inline blocks by hash, the tag manager's `<noscript>` frame's one style
attribute by hash (`'unsafe-hashes'`), fonts from Google Fonts, media, posters
and the clips' json from this origin, and GTM's and Meta's hosts; nothing
else. `/media/*` is cached for a day and carries no version stamp, so a clip
re-cut under the same name reaches everyone within a day; a new name is
immediate.

## Google Tag Manager

GTM-KH975V6M, as Google hands it over: the loader straight after
`<meta charset>`, the `<noscript>` frame straight after `<body>`. Custom HTML
tags in the container will not run (inline script is allowed by hash only);
built-in tag templates do, and any other vendor the container loads needs its
hosts added to the CSP.

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
whose clock is in Europe.

## Look at it

Serve the folder (any static server; `file://` cannot fetch the clips' json)
and open it.

## The API's own copy

`api.tailzu.space/` answers with a 308 to `https://tailzu.space/` (the backend's
`src/routes/demo.ts`), so nobody lands on a stale copy of this page. Until that
backend release is out, the old hand-copied `~/tulmi/site/index.html` is still
served there; it would need `index.html` and `media/` together.
