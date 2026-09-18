# tailzu.space

One file. No build, no framework, no dependencies, no tracker.

```
index.html      the landing page — the river, the card, and the live microphone
```

`/privacy`, `/terms` and `/download` are served by the backend, which has
carried them as HTML since before there was a site. Publishing a file of the
same name here overrides the built-in page; deleting it brings the built-in
page back, so the legal text is never unreachable.

## The river

One line runs across the page. Everything anybody ever said travels along it
from the left, is swallowed at the microphone, and leaves to the right as a
written sentence — grey sans going in, white serif coming out.

It is a single SVG `<path>` with two `<textPath>` elements on it, clipped
either side of the capsule. That is why the change appears to happen *at* the
microphone rather than near it, and why the button can sit exactly on the line
at any window width: the curve is drawn through the centre of the viewBox, and
the capsule is centred on the same point.

The path runs left to right on purpose. A path that doubles back hangs its own
glyphs upside down, which is the first thing that goes wrong with this effect.

The stream is written twice and the offset slides through exactly one half
before jumping back, so the loop has no seam — the frame before the jump and
the frame after it are the same picture.

Press the button and your own clip replaces the stream: the mess you actually
said flows in, your sentence flows out, and the page stops arguing.

## The card

Three claims, each shown rather than asserted. The raw line is marked word by
word — struck through where it goes, amber where it must not move — a pill
names the reason, and the written line resolves underneath.

The words to mark are named in the backend (`steps[].cut` / `steps[].keep`)
and matched on letters and digits only, lowercased, so `ramesh` marks
`Ramesh.` in the sentence. A test checks every listed word actually appears in
the line it belongs to: a word that matches nothing marks nothing, and the
animation quietly stops making the claim.

## Look at it

Open `index.html` in a browser. It fetches its copy and download state from
`https://api.tailzu.space`; to point somewhere else, set `data-api` on the
`<html>` tag. Everything it asks for has an inline fallback, so it is a
complete page before the first byte of that answer arrives.

## Publish

```
scp index.html root@91.108.104.168:~/tulmi/site/
```

Live within a minute — the backend reads the file per request, so there is no
restart and no cache bump.

## Turn the microphone on

It is off until the server says otherwise, because it is an unauthenticated
route that spends a recogniser call and a model call per press. In
`~/tulmi/tulmi/.env`:

```
DEMO_ENABLED=true
DEMO_MAX_SECONDS=15     # a pitch, not a dictation
DEMO_PER_MINUTE=6       # per address
```

then `docker compose up -d --build backend`. With it off the river still runs
and the button explains itself — nothing breaks, nothing is spent.

## Change the words

Not here. `SITE_UI` in the backend's `catalog.ts` is every string on this page,
every pair in the river and every claim on the card; this file carries the same
text inline only as a fallback for the second before that answer arrives. Edit
there, deploy, bump the cache — the same move as every string in the app.

Copy is never markup. The page sets all of it as text, so an `<em>` in a string
here would print as an `<em>`, not render as one.
