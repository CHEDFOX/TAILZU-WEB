# x0bot.com

No build, no framework, no dependencies. One static page, its clips, and the
API behind it for the backend's pages and the downloads.

```
index.html            the page: markup, one <style>, two inline <script>s (GTM, the page), and a <noscript> head style
media/                the card's evidence: case<n>.webm (VP9), case<n>.mp4 (H.264), case<n>.webp (poster), each the app's own screen drawn by its own renderer; the Mac scene's pictures
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
header, then one card with six uses in it, then the Mac scene, then the links.
The page is held still until the key has landed. Under
`prefers-reduced-motion` nothing is held, every change is instant and the
clips wait for a press.

The card (scene two) is pinned while six screens of scroll go by, one per use.
Only what is inside it changes: the old words lift away, the screen dips to
black while the device morphs between phone and MacBook, the new words set in
and a note is written in the margin. The bot stands inside the card the whole
time, hops and glances at the new words at each change, then points at the
screen and follows the clip's beats. Each use is a stamp (bot, time), an odd
true situation, what happened, an honest aside, a handwritten note, and the
clip as proof; a quiet count fills as you scroll. Only the clip on show
plays; its neighbours preload.

The Mac scene (scene three) is one timeline driven by the scroll: the bot
walks in, jumps into the Mac's screen and shows a chat, a call with notes and
an Ask to Xode. Around the Mac, outside its screen: a running count of the
words he wrote for you (counted from the screen's own text), one handwritten
note in the margin per window, a receipt that prints at the end, and a last
line under the headline. Standing idle, he watches the pointer.

The copy is the page's own (`USES` and the Mac scene's lines in the script).
Screen 2 is a court: seven cases, one per bot, each a doubt, a witness and a
verdict, with the app's own screen as the evidence. Each case in `USES` names its
clip (`/media/<id>.webm`, else `.mp4`) and Blip's beats (`cuts`). The evidence is
drawn by the server's real renderer (TAILZU-BACKEND `tulmi/scripts/bots-render`)
with neutral sample content, then cut to 540x1170.

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
