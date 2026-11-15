# x0bot.com

No build, no framework, no dependencies. One static page, and the API behind
it for the backend's pages and the downloads.

```
index.html            the page: markup, one <style>, one inline <script> (GTM), a <noscript> head style; loads js/main.js
js/                   the page's script, one module per part: paper/ (grain, water, words, glitch), blip/ (figure, dots, walker, antenna, pour), page/ (opening, key, steps, screens, screen, arrivals, crowd, content), main.js
css/screens.css       the phone and laptop frames, the screen in them, the phone's status bar, the terminal and the Live Activity
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

Nothing waits for a scroll. A step that has finished arriving brings the next
one on by itself a beat or two later, so the whole thing plays through on its
own; a scroll only pushes it along, and a scroll back stops it playing by
itself from then on.

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
they never cover him.

Both screens are empty white when they arrive, and they fill the way a room
fills: **the bots walk in off the page**. One at a time a bot comes on at the
edge of the WINDOW, out on the sheet of words where Blip himself walks — its
steps sending the same rings through the water — and makes its way across to
the device it is heading for. It is already the size it will be on the glass,
walking along the line its floor will be on, so nothing about it changes when
it gets there: the devices are painted over that canvas, so the last of the
walk happens behind the frame, and it slips behind the bezel on the page and
comes out on the screen. Xode, Keylessbord, Plan Ease, Travel bot, Oracle,
Mail, Lingo and Meetings, and past the end of the roster it starts again — as
many as the screen is wide enough for, which is about fourteen on a laptop
and four on a phone.

Once on, nothing about them is laid out, **and none of them ever just
stands there.** A bot walks to a spot it picked at random, at a speed it
picked at random (it runs, strolls, ambles, skids, hops or bounds), changing
its mind on the way as often as not — and even on the way it is up to
something: a skip, a wave over its shoulder, a look round. Where it stops it
throws itself into two to five things one after another, out of eighteen:
backflips, cartwheels, handstands, a spin on the floor, jumps, spins, kicks,
a dance, a moonwalk, and between them the small talk — a wave, a look, a
stretch, a nod, a bounce, a point, a shrug, a peer, a scratch. The showy ones
come up about twice as often as the small talk, and between any two is a
breath of a quarter of a second, not a pause: it settles, looks about and
goes again. Then it walks somewhere else and starts over.

The flips and the cartwheels turn the whole figure over, which the renderer
does about a point part way up it (`roll`, `rollAt`). Each bot keeps the
shadow it stands in, which shrinks and fades as it leaves the floor, so a
jump reads as a jump and not as a bot hanging in the air.

It roams in two directions, not one: every walk also carries it nearer or
further, which makes it bigger or smaller and moves its floor up or down the
screen, and the ones in front pass over the ones behind. Now and then one
walks clean off an edge and comes back on from the other.

Each wears the colour the app gives it (TAILZU-BACKEND `src/bots/builtin.ts`,
with `experience/bots/palette.ts` for the hex) — the dots a pale wash of it,
the sticker under them a dark one — and each is drawn by the same renderer as
Blip himself, which takes an ink and a lit colour and falls back to his own.
Every bot has its own seed, so the second Xode is not the first one. The Blip
standing between the two devices is the page's own and is not one of them.

`js/page/arrivals.js` is the walk over, `js/page/crowd.js` the milling about
once on, and `js/page/screen.js` the screen around them (empty white, and the
phone's status bar).

**The troupe settles.** A few seconds after the last of them is on, they come
to a stop: each finishes whatever it is in the middle of, walks the short way
to a spot that leaves room for the one beside it, turns to us and stands,
breathing, its eye wandering. Only then will the page go on — asked to move
before that, it calls them in at once (and whoever is still on their way over
stops dawdling) and goes the moment they are standing.

**2, out again, and the screens go blank.** He comes back out: the antenna
floats up to where his head will be and throws his dots back to their places,
head first, each on a loose spring, so he settles with a little wobble,
standing small between the devices, himself again on the frame the last dot
lands (his clock stands still while he is in the antenna, so the dots are
exactly him). **The troupe goes the same way he went in,** at the same
moment: every dot of every bot becomes a particle pulled into that bot's own
antenna ball, nearest first, shrinking as it arrives, the ball swelling with
each one it swallows and popping when the last is in — in the bot's own
colours, not Blip's (`js/blip/pour.js`). Both screens are blank white again.

**3, the computer: a terminal.** Xode installed on a project. It types
itself — the real install line, the words `install.sh` prints, then `xode` run
in the project's folder — and freezes with the prompt waiting and the cursor
blinking. He walks out of the gap and stands in FRONT of the laptop (the page
puts him over the devices for as long as he is over there), on the floor it
stands on, below everything it is showing, and points up at it.

**4, the phone: the Live Activity.** The "Bots at work" notice, done: Ready to
ship, codes while you rest, its stages filled and a pull request opened. It
drops in under the status bar and freezes; the laptop keeps its terminal
while the phone has its turn; he walks over and points up at that one.

**5, back to the middle.** Both screens clear and he comes back to the gap,
facing us. Side by side he really walks over and back; one above the other
there is nowhere to walk, so he stays where he is and looks (and points) up
at the phone or down at the laptop. `js/page/content.js` is both beats, built
as DOM at a fixed design width and scaled to the glass like the status bar,
so the words stay crisp at whatever size the device is.

Up goes back the same way, and a beat come back to is simply there, finished,
rather than typing itself again (5 to 4: both beats back; 4 to 3: the phone's
goes; 3 to 2: both go and he returns to the middle; 2 to 1: back into the
antenna and the screens fill again; 1 to 0: the devices leave and he comes out
at the opening's size). A resize while he comes out ends it at once, him
standing at the new spot; a resize while he is over by a device keeps him
there, where that device now is. Under `prefers-reduced-motion` every change
is instant and nothing moves: the bots are simply on the glass, standing, and
each beat is simply there, finished, on the frame it is asked for.

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
