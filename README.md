# x0bot.com

No build, no framework, no dependencies. One static page, its clips, and the
API behind it for the backend's pages and the downloads.

```
index.html            the page: markup, one <style>, two inline <script>s (GTM, the page), and a <noscript> head style
media/                the card's evidence: case<n>.webm (VP9), case<n>.mp4 (H.264), case<n>.webp (poster), the phone's screen, and case<n>-desk.* the computer's for the cases on both screens, each the app's own screen drawn by its own renderer; the Mac scene's pictures
api/                  Meta's pixel and its Conversions API copy (see Meta's pixel)
vercel.json           rewrites to the API, headers, the home page's CSP, caching
csp.mjs               writes index.html's inline hashes into the home page's CSP
robots.txt, og.png, <key>.txt (IndexNow)
favicon.ico, favicon-32x32.png, favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png, site.webmanifest
                      the app icon, cut from the brand's master picture (favicon.svg carries the same picture, for the backend's head)
```

## The page

One sheet of paper, drawn in one script: the opening (a plane of tiny words
in the world's scripts that moves like water, the dotted bot walking in and
waving), then the blur moment where the "Take me home" key arrives in the
header, then one card with seven cases in it, then the Mac scene, then the links.
The page is held still until the key has landed. Under
`prefers-reduced-motion` nothing is held, every change is instant and the
clips wait for a press.

The card (scene two) is pinned while seven screens of scroll go by, one per
case. In it stand a MacBook and a phone with the bot between them, in one
place and at one size the whole time. Only what is inside changes: the old
words lift away, each screen's old clip holds until the new one is up over it
(never a black screen), the new words set in and the verdict is stamped.
Cases 1, 2, 3 and 5 show both screens; for 4, 6 and 7 the MacBook steps back,
small and dim, holding its last picture, and only the phone plays. A case's
two clips run on one clock: the clip that starts first leads (its own time is
the clock while it plays, so the other never drifts), each holds its last
frame when done, and both start again together when the later one has ended.
The phone can come in later (cases 2 and 3): until then it sleeps on its lock
screen (wallpaper, clock, the island), and on the beat it opens on its clip
half a second later. Only where the app really sends a push does a
notification drop in first: in case 2 it is Xode's "X0 Bot needs you" push
with the question, just as the computer asks it (the server's
`push.code_needs_you` text); Notes sends none, so in case 3 the phone just wakes. The lock
screen comes up over the old clip in a swap, and over the last frame when the
case loops. At each change the bot hops and glances at the new words, then
follows the case's beats, turning to the screen each beat is about (the
MacBook up on his left, the phone on his right) to present it, tap it or give
a thumb up; the MacBook, above him, gets an arm raised up and out at it.
On a laptop the words sit on the right; across the rest the phone stands on
the floor at the right, the MacBook up on its own plane at the left, its top
about level with the phone's, and the bot on the floor between them, under
the MacBook's front corner (his antenna just below its screen, so he covers
neither screen). The MacBook gets about 1.6 times the phone's screen area, as
its clip has about 1.6 times the pixels (at 1440x900 its screen is 431 px
wide, the phone 411 px tall). On a phone the words are on top, the MacBook
under them, the phone below it on the right and the bot on the phone's floor
beside it, as big as the room beside the phone allows. Where the browser refuses to play (autoplay off, low
power mode) the card stops asking and shows the play button. Each case is a kick (which bot), a doubt, a
witness and its statement, an aside, a verdict stamp, and the evidence; a
quiet count fills as you scroll. Only the clips on show play; the next and
previous cases' preload.

The Mac scene (scene three) is one timeline driven by the scroll: the bot
walks in, jumps into the Mac's screen and shows a chat, a call with notes and
an Ask to Xode. Around the Mac, outside its screen: a running count of the
words he wrote for you (counted from the screen's own text), one handwritten
note in the margin per window, a receipt that prints at the end, and a last
line under the headline. Standing idle, he watches the pointer.

The copy is the page's own (`USES` and the Mac scene's lines in the script).
Screen 2 is a court: seven cases, one per bot, each a doubt, a witness and a
verdict, with the app's own screens as the evidence. Each case in `USES` says
which screens it shows (`screens`: `"both"` or `"phone"`), whether the phone
comes in later (`wake`: `at`, the second on the case's clock its clip starts and
the phone wakes, and, only for a push the app really sends, `title` and `says`,
the notification's title and text; left out, both clips start at 0) and Blip's beats (`cuts`: from, to, a
pose, and `on`, `"desk"` or `"phone"`, the screen the beat is about). Its clips are `/media/<id>.webm` (else `.mp4`, `.webp` the
poster) on the phone and `/media/<id>-desk.*` on the MacBook. The evidence is
drawn by the server's real renderer (TAILZU-BACKEND `tulmi/scripts/bots-render`)
with neutral sample content, then cut to 540x1170 (the phone) and 1280x800 (the
computer, the MacBook screen's 16:10).

## The download is always a link

The key (`#home`) is `/download` in the markup; the script points it at what
this device installs: iPhone and iPad (iPadOS's desktop UA included) → the
App Store; Android → Google Play; Windows → the Microsoft installer; Mac →
the `.dmg`; Linux → the `.AppImage` (both straight from `api.x0bot.com`,
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
them by these paths. So is `/delete-account` (Google Play's account
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

`api.x0bot.com/` answers with a 308 to `https://x0bot.com/` (the backend's
`src/routes/demo.ts`), so nobody lands on a stale copy of this page. Until that
backend release is out, the old hand-copied `~/tulmi/site/index.html` is still
served there; it would need `index.html` and `media/` together.
