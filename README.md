# x0bot.com

No build, no framework, no dependencies. One static page, and the API behind
it for the backend's pages and the downloads.

```
index.html            the page: markup (the film, the views, the bots, the close), the tag manager inline, a <noscript> fallback; loads js/main.js
media/face.svg        Blip's face, the mark in the mast (the film's vector icon, on its own)
js/                   the page's script: paper/ (grain, water, words, glitch: the fabric), stage.js (the fabric's loop, the hand and the scroll on the water, the key), main.js (the film and the views), minis.js and blip/ (the small bots)
css/site.css          everything the page looks like
media/meet/           three short muted clips of people on a video call, for the meeting card (Mixkit, free stock video)
api/                  Meta's pixel as Vercel served it; unused on the VPS (see Meta's pixel)
vercel.json           rewrites to the API, headers, the home page's CSP, caching: the one place they are written
csp.mjs               writes index.html's inline hashes into the home page's CSP, then remakes deploy/nginx/
deploy/               the VPS: nginx.mjs (vercel.json → nginx config), nginx/ (its output), ship.sh, check.sh
.github/workflows/    deploy.yml: a push to main checks, then ships to the VPS
robots.txt, og.png, <key>.txt (IndexNow)
favicon.ico, favicon-32x32.png, favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png, site.webmanifest
                      the app icon, cut from the brand's master picture (favicon.svg carries the same picture, for the backend's head)
```

## The page

One sheet of paper, the fabric, under an ordinary page that scrolls: textured
off-white paper, a field of tiny words in the world's scripts that the water
moves, and the page's own words flickering into 0/1 under the pointer
(`js/paper/`). The pointer and the scroll both disturb the water
(`js/stage.js`). Nothing on it has a title: each view shows rather than says.

1. **The opening** (`#hero`). "A team of bots / to do the hard things", centred,
   a line under it, and two ways in: "Take me home" (the key) and "See it work"
   (down to the film). Under them, X0 itself rising over the horizon
   (`js/hero.js`): the peeking bot, huge, in its own dithered dots; on a visit
   only its antennae are up at first, then it comes up slowly and its eye
   follows the pointer. In front of it the team goes by without end, each bot at
   its own pace, now and then hopping, waving or looking up at it. It turns
   with the field: drawn twice, ink on the paper and light on the dark, laid
   together through a map of the field under it, every frame.
2. **The film** (`#stage`). One small white card and a camera; the card stands
   on the bottom of the window and opens up into a box with a desktop and a phone in it. One
   conversation, in four parts, named in the tabs under the box (Tasks, Food,
   Chat, Arrived), which show how far each has got and jump to one:
   - **Tasks**: "hey X0" and "Here, at your service.", then two things asked in
     passing and answered in a word ("Move my 4 pm to Friday.", "Tell Rahul
     yes for Sunday."), not followed through.
   - **Food**: the card opens into the screens. "I'm hungry." is said; the bot
     (the real one, drawn like the small bots) walks in along the bottom of the
     desktop and does the choosing under a deck of food cards: flicks the pizza
     away, picks the burger, fries and cold coffee one by one, "Done."; and on
     the phone, "Order placed", arriving in 31 minutes.
   - **Chat**: back in the card, one more thing asked ("Book a cab for 9
     tomorrow."), then "Is everything sorted?" and its answer, "All is handled.
     Have a peaceful dinner, we'll meet soon."
   - **Arrived**: the card fades into the phone, alone in the middle and standing
     up out of the box; "Your food has arrived", and the bot's face puts itself
     together on its screen.
   It starts when it is scrolled to; the card comes back with the face at the
   end and it all goes round again.
3. **The two promises, the plans and the close**: phone and computer,
   staying in charge, free to start, and the key again with every device
   under it and three plain facts. Beside it, **X and 0 against Blip**
   (`js/game.js`): the visitor is X, Blip the green 0 (a zero, not an O); he
   greets them by their time of day, plays well but can be beaten, keeps the
   score, and each finished round sinks into the water.

With reduced motion the film and the stories show their last frame.

**The dark half** (`#shade`, drawn in `js/stage.js`): the fabric is light paper
with dark words in some places and dark with light words in others, and the
two merge softly. Each view says where its dark is (`SHADE`: the film along
the bottom, under the card; the plans going dark into the close; the close
dark), the views are blended across their seams, and the result is drawn into
a small canvas laid over the fabric as a difference with warm white, so paper,
grain and words all turn over together. The mast goes dark when the top of
the window is.

**The small Blip** (`js/minis.js`): one little Blip on a skateboard, in the
film, once the card has opened into the desktop and the phone: he drops onto the
box's edge and rides the top edges of the two boxes, flips off their ends, turns
round in the air and jumps the gap between them (and up onto the phone when it
stands up out of the box at the end); he ollies over the pointer. Over the card
itself there is none. On one canvas over the page that never takes the pointer,
running, and with reduced motion there are none. He is drawn by the desktop
app's own renderer, `js/blip/blip.js`, copied from TAILZU-DESKTOP
`src/shared/blip.js` with one addition, the peeking bot's `ball()` (where its
antenna's ball was drawn, for the opening's glow): keep it when copying anew; its moves, which the app compiles at run time from its
catalog, are sampled once into `js/blip/moves.js` by
`node scripts/gen-blip-moves.mjs` (run it again when the catalog or the
renderer changes, after copying `blip.js` anew). `js/blip/kit.js` puts those
moves back into the renderer, for the small bots and the food story's Blip alike.

## The download is always a link

Both keys (`[data-get]`, in the mast and at the close) say "Take me home" and
are `/download` in the markup; `js/stage.js` points them at what this device
installs and names the device under the words ("X0 Bot for Mac"): iPhone and iPad (iPadOS's desktop UA included) → the
App Store; Android → Google Play; Windows → the Microsoft installer; Mac →
the `.dmg`; Linux → the `.AppImage` (both straight from `api.x0bot.com`,
so a hundred megabytes never pass through the site's server); ChromeOS and anything
else → `/download`. Without JavaScript the `<noscript>` block says what
Tailzu is and links every device. Every download link carries `data-place`
(`mast`, `noscript`) for the tag manager.

## After any change

```
cd TAILZU-BACKEND/tulmi && npx tsx scripts/sync-site.mts ../../TAILZU-WEB/index.html   # when the backend's head changed (runs csp.mjs too)
cd ../../TAILZU-WEB && node csp.mjs                                                    # after any edit to an inline <script> or <style> (js/ needs none)
node deploy/nginx.mjs                                                                   # after any edit to vercel.json (csp.mjs runs it too)
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

The same server still answers tailzu.space and www.tailzu.space, for
the apps already installed and links already out there. `vercel.json`'s
`redirects` send every page there to the same path on x0bot.com (301), and
leave alone what is not a page: `/v1/*` (a POST does not survive a redirect),
`/downloads/*` (desktop builds up to 0.4.4 take their update only from
tailzu.space, and follow no redirect off it), `/.well-known/*` (Apple and
Google refuse an app-links file behind a redirect) and `/api/*`. Those keep
being proxied to the API exactly as on x0bot.com. The nginx config made from
`vercel.json` does the same, so this file decides (TAILZU-BACKEND
docs/domain-x0bot.md). www.x0bot.com goes to x0bot.com (308).

## Publishing

The site is on the VPS (91.108.104.168), behind the same nginx as the API: a
push to `main` is the deploy, live in under a minute, once the repo has the
secrets `VPS_SSH_KEY` and `VPS_KNOWN_HOSTS` (without them, deploy by hand with the
command below). GitHub checks that
`deploy/nginx/` and the CSP are in sync, then logs in with a key that can run
only `deploy/ship.sh`, which pulls main, copies the site into a new release
under `/var/www/x0bot.com/releases`, switches `current` to it in one step, and
installs the nginx config only if nginx accepts it (otherwise the old one
stays and the deploy fails). The last five releases are kept.

```
ssh root@91.108.104.168 /opt/x0bot-site/deploy/ship.sh               # deploy by hand
ssh root@91.108.104.168 ROLLBACK=1 /opt/x0bot-site/deploy/ship.sh    # back to the release before
deploy/check.sh                                                       # does the live site answer as it should?
```

`vercel.json` is still where routes and headers are written; `deploy/nginx.mjs`
turns it into `deploy/nginx/x0bot.conf` (and `x0bot.http.conf`, the plain-HTTP
config used until the certificate exists), and refuses anything in it that it
does not know how to say in nginx. `vercel.json` proxies `/v1/site`,
`/v1/site/event`, `/site-events.js`, `/v1/demo/transcribe`, `/v1/pay/*`,
`/v1/account/deletion*`, `/download`, the three installers, the backend's pages and the SEO files to
the API (sent as `api.x0bot.com`, with the visitor's address), and nothing else
of it. `.vercelignore` keeps this file, `archi.md` and `csp.mjs` off the site;
`ship.sh` also leaves out the repo's own machinery (`deploy/`, `api/`,
`scripts/`, `.github/`, `vercel.json`). nginx keeps no access log for the site.

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

`<script src="/site-events.js">` in the head is Meta's pixel. The API serves
it (src/routes/site/sitePages.ts) through the rewrite in `vercel.json`, with
the dataset id from the server's `.env`: `META_PIXEL_ID`, and
`META_CAPI_TOKEN` for the Conversions API. A change there needs the API
restarted. Until the id is set the file is one comment. (`api/` is the copy
Vercel ran, kept until the move is settled.)

It reports the page view, `ViewContent` on /download and /pricing, and `Lead`
when a link to an installer or a store is clicked. Each Lead is also posted
to `/v1/site/event`, which copies it to the Conversions
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
