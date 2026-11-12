# x0bot.com

No build, no framework, no dependencies. One static page, and the API behind
it for the backend's pages and the downloads.

```
index.html            the page: markup, one <style>, one inline <script> (GTM), a <noscript> head style; loads js/main.js
js/                   the page's script, one module per part: paper/ (grain, water, words, glitch), blip/ (figure, dots, walker, antenna), page/ (opening, key, steps, screens, welcome), main.js
css/screens.css       the phone and laptop frames, the app screen in them, the phone's status bar
media/                welcome-phone.webp and welcome-desk.webp: the app's first screen, from the app's own renderers (see The page)
api/                  Meta's pixel and its Conversions API copy (see Meta's pixel)
vercel.json           rewrites to the API, headers, the home page's CSP, caching
csp.mjs               writes index.html's inline hashes into the home page's CSP
robots.txt, og.png, <key>.txt (IndexNow)
favicon.ico, favicon-32x32.png, favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png, site.webmanifest
                      the app icon, cut from the brand's master picture (favicon.svg carries the same picture, for the backend's head)
```

## The page

One sheet of paper, one screen tall, that never scrolls: a scroll, a swipe
(up for on, down for back) or a key (arrows, Page Up and Down, Space) moves it
one step instead, one change at a time (a move made during one plays after
it). The modules in `js/` draw it; `main.js` runs one frame loop for all of
them.

**0, the opening.** A plane of tiny words in the world's scripts that moves
like water; the dotted bot walks in from the right to the middle and waves
(his steps and each wave of his hand send rings through the words); then the
blur moment where the "Take me home" key arrives at the top left and the name
follows at the top right. After that the words answer the pointer (a move
sends a ripple, a press a bigger one, the word under it flickers into ones
and zeros) and the bot watches it. A move made while he is still walking in
waits for him to reach the middle.

**1, into the antenna, and the app's first screen.** The bot pours into his
antenna: every dot of him becomes a particle on a spring of its own, the ones
nearest the antenna's ball let go first, each pulled in with a little swirl
and shrinking as it arrives, and the ball swells and wobbles as it swallows
them. When nearly all of him is in, the stalk lets go of where his head was
and falls to the floor in the middle, where it stands: a springy rod with the
ball on top that never quite keeps still. As he pours, a phone and a laptop
come in on springs, each from its side: on a wide window side by side on one
floor (the phone on the left, the laptop, the bigger, on the right, the
antenna between them, the three centred together); on a tall one the phone
above and the laptop below, and there they wait until all of him is in, so
they never cover him. Both show the app's real first screen, the Bots app's
Welcome (Blip waving, "Hi, I'm X0.", "Everything here is a bot. Tell them
what you need; they do the work.", and on the window the list of first
bots), drawn by the app's own renderers, with the Start button and the link
under it painted out: the page moves on without a press. To make them again:
`cd TAILZU-BACKEND/tulmi && npx tsx scripts/bots-render/render.ts bots.welcome --out <dir>`,
paint white over the button and the link, and save the phone at 780 x 1688
and the window at 1600 x 1000 as WebP in `media/`.

**2, out again.** On the next move (or by itself four seconds after step 1
first settles; never again after the visitor has come back to it) he comes
back out: the antenna floats up to where his head will be and throws his dots
back to their places, head first, each on a loose spring, so he settles with
a little wobble, standing small between the devices, himself again on the
frame the last dot lands (his clock stands still while he is in the antenna,
so the dots are exactly him).

Up goes back the same way (2 to 1: back into the antenna; 1 to 0: the devices
leave and he comes out at the opening's size). A resize while he comes out
ends it at once, him standing at the new spot. Under `prefers-reduced-motion`
every change is instant and nothing moves.

## The download is always a link

The key (`#home`) is `/download` in the markup; the script points it at what
this device installs: iPhone and iPad (iPadOS's desktop UA included) → the
App Store; Android → Google Play; Windows → the Microsoft installer; Mac →
the `.dmg`; Linux → the `.AppImage` (both straight from `api.x0bot.com`,
so a hundred megabytes never pass through Vercel); ChromeOS and anything
else → `/download`. Without JavaScript the `<noscript>` block says what
Tailzu is and links every device. Every download link carries `data-place`
(`mast`, `noscript`) for the tag manager.

## After any change

```
cd TAILZU-BACKEND/tulmi && npx tsx scripts/sync-site.mts ../../TAILZU-WEB/index.html   # when the backend's head changed (runs csp.mjs too)
cd ../../TAILZU-WEB && node csp.mjs                                                    # after any edit to an inline <script> or <style> (js/ needs none)
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
`/pricing` and `/download` are served by the backend too, at these paths
(the home page has no links to them for now; the key goes straight to the
download). So is `/delete-account` (Google Play's account
deletion link: sign in with an emailed code and ask for the account to be
deleted, without the app), with the three API calls it makes,
`/v1/account/deletion` and `/v1/account/deletion/web/{code,verify}`.

## The old address, tailzu.space

The same Vercel project still answers tailzu.space and www.tailzu.space, for
the apps already installed and links already out there. `vercel.json`'s
`redirects` send every page there to the same path on x0bot.com (301), and
leave alone what is not a page: `/v1/*` (a POST does not survive a redirect),
`/downloads/*` (desktop builds up to 0.4.4 take their update only from
tailzu.space, and follow no redirect off it), `/.well-known/*` (Apple and
Google refuse an app-links file behind a redirect) and `/api/*`. Those keep
being proxied to the API exactly as on x0bot.com. In Vercel's Domains
settings both tailzu.space names are attached to production with no
redirect of their own, so this file decides (TAILZU-BACKEND
docs/domain-x0bot.md).

## Publishing

The site is on Vercel, deployed from this repo: a push to `main` is the
deploy, live in under a minute. `vercel.json` proxies `/v1/site`,
`/v1/site/event`, `/site-events.js`, `/v1/demo/transcribe`, `/v1/pay/*`,
`/v1/account/deletion*`, `/download`, the three installers, the backend's pages and the SEO files to
the API, and nothing else of it. `.vercelignore` keeps this file, `archi.md`
and `csp.mjs` off the site.

Headers: `X-Frame-Options: DENY` everywhere. The home page's CSP allows its
inline blocks by hash, the tag manager's `<noscript>` frame's one style
attribute by hash (`'unsafe-hashes'`), fonts from Google Fonts, images from
this origin, and GTM's and Meta's hosts; nothing else.

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

Serve the folder (any static server) and open it.

## The API's own copy

`api.x0bot.com/` answers with a 308 to `https://x0bot.com/` (the backend's
`src/routes/demo.ts`), so nobody lands on a stale copy of this page. Until that
backend release is out, the old hand-copied `~/tulmi/site/index.html` is still
served there.
