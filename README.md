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

A tangle of speech arrives from every side — over the top, across the left, up
from underneath — converging on the caret, and one line goes the other way.

**The left is ugly on purpose.** Speech has no typography, so the curves have
none: each takes whatever face the machine happens to have, at whatever size,
with whatever tracking, some of it squeezed. Nothing is loaded from a font
host, because the point is that these are the defaults nobody chose. Most sit
a shade above the ground and a few come up almost to paper, so it has depth
rather than being one even wash.

**The right is not an example, it is the identity.** `SITE_UI.identity` is
what leaves the caret when nobody has spoken: what the product is, in the only
face on the page anybody chose, at a quarter of the inbound pace. A visitor's
own sentence replaces it the moment they press the button.

### One phrase per thread, not a ribbon

Each thread carries a single sentence and there is a beat of nothing before it
comes round again. Filling every curve end to end is what a river does; a
bombardment is separate things arriving.

It is also the whole reason there can be sixty of them. The cost is linear in
words drawn per frame, and a filled curve at thread weight is forty words
where a phrase is seven — so the same frame buys six times the threads. Thin
type alone does the opposite: smaller words mean MORE of them fit along the
same curve, and the first attempt at thinning cost frame rate rather than
buying it.

Each thread also starts at its own phase. Without that they all set off
together and arrive as one clump, which is what sixty threads look like when
they are really one.

### Why the tangle is on a canvas

It started as SVG `<textPath>` elements. Changing one's `startOffset` re-lays
its whole string out along its curve, and that is a layout the browser cannot
skip — freezing the offsets alone took the page from 23fps back to 59.

The canvas version is not free either. Its cost is linear in the words drawn
per frame, measured on one machine: 112 words 53fps, 343 words 38fps, 735
words 19fps. `TANGLE` is therefore a number chosen by measurement, not by
taste — raise it and you are spending frame rate. Fourteen curves crossing
from every side already reads as a tangle.

Worth knowing if you touch this: an isolated benchmark drawing the same word
count, at the same canvas size, in the same faces and the same scripts, runs
at 60fps. The gap between that and the page is not explained. Several
plausible culprits were ruled out by measurement — the mask, layer promotion,
the drift transform, complex-script shaping, font switching, the radial
gradient, page height — so if you change this, measure it rather than reason
about it.

### The rules that keep a tangle from becoming a bug

- Each curve's control points step rightward, which makes x monotonic. That is
  the only thing standing between this and upside-down words.
- The last control point sits level with the caret, so nothing arrives at an
  angle and gets rotated where it meets the cursor.
- The middle one is thrown anywhere, and that is where the crossing comes from.
- Entry points go round-robin across the three edges and evenly along each.
  Leaving the side to chance clusters them, and clusters them differently at
  every count — the picture changed whenever the number did.
- Each run repeats until it is longer than its own curve, then wraps on one
  period. A lane shorter than its path drags a visible hole along it.
- Words are placed once each, at the angle under their first letter. A
  transform per glyph is five times the work for a difference nobody can see
  on curves this long.
- The edges fade inside the canvas rather than through a CSS mask, so a
  surface that is redrawn every frame is not also re-masked every frame.

## The caret

Where a logo or a device would go there is a text cursor. Everything this
product does ends at somebody's cursor, so the cursor is what the speech runs
into and what the sentence comes out of — not an object standing in for the
product, the product's own destination.

It blinks at 530ms on, 530ms off, which is the rate a real one blinks at; any
faster reads as an error state, any slower as a dying battery. With the
microphone open it stops blinking, turns amber and breathes with the voice,
so the thing growing and shrinking is the point the words are about to be
written at. Clicking it starts the microphone, and so does the button below.

It sits at the centre of the viewBox, which is the centre of the band, so the
button under it needs no arithmetic to line up.

## The surge

The first three scrolls from the top drive the river instead of the page. Each
one kicks the flow into a rush that falls back over about half a second, and
after the third the page scrolls normally and never does it again.

It is held to three, and only from the very top, and never on a scroll upward,
because a page that will not move when you ask it to is broken. The whole
thing is over in about a second and the way out is to keep doing what you were
already doing. It does not run on touch: a phone has no wheel to intercept,
and stealing a swipe is a far worse trade than stealing a scroll.

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
