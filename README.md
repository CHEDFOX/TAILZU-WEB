# tailzu.space

One file. No build, no framework, no dependencies, no tracker.

```
index.html      the landing page — the river, the card, and the live microphone
```

`/privacy`, `/terms` and `/download` are served by the backend, which has
carried them as HTML since before there was a site. Publishing a file of the
same name here overrides the built-in page; deleting it brings the built-in
page back, so the legal text is never unreachable.

## The colours are the app's

Not a palette for a website. `STATS_UI` in the backend's `catalog.ts` is the
source: ground `#0F0D0B`, card `#1A1714`, ink `#F3E2C6`, rule at 10% of the
ink, accent `#E8A23C`. Change one there and change it here to match.

The ground is a warm near-black biased toward the accent's own hue, so the
amber sits *in* it rather than on it. There is one reading colour and it is
the amber's family; everything quieter is that same pale at a lower weight,
never a second hue. That is why the amber still means something — and it means
the same thing here as in the app: **what is still in play**. The line that
leaves the caret, the word the sentence kept, the step that is running.

### The quiet end is set by contrast, not by taste

Measured against this ground, the pale at .36 alpha is **2.84:1** — under even
the 3:1 floor for large text. That one number was carrying the labels, the
platform line, the footer and the unselected tabs, and it is why the page read
as faded rather than as quiet. A faded page reads as an unfinished one
whatever its colours are. `--dim` is .52 (4.71:1, AA for small text) and
`--grey` is .62 (6.26:1). Same hue, same family, nothing new — the page just
stops whispering. `scratchpad/contrast.js` prints the table; if you lower one
of these, print it again.

### Light, not more colour

Two things carry the attraction, and neither is a second hue:

**A pool of light at the caret.** The eye goes to the brightest place before
it reads anything, so the brightest place should be where the thing happens. A
flat ground gives it nowhere to go and the whole band reads as evenly busy.
The pool is the page's own ink at four per cent, behind the canvas.

**The card is lit from above**, like everything anybody has ever picked up: a
top edge catching the light, a shadow pooling under it. The two ends of its
gradient straddle the app's own card value, so it is the same material — it is
only being lit.

That is also why the mouth and the block beyond it ERASE rather than paint
ground. They used to fill with the ground colour, which was the same thing
while the ground was flat, and it is not any more — painting flat ink over the
right half of the pool cut a hard vertical edge down the middle of it.

There is no paper half any more. A light section would be a second visual
world, and a colour cannot be sacred if the ground under it changes
temperature. What lifts the card off the ground is the card's own step up in
value and a hairline rule — the app's two moves, at a bigger size.

## The river

A tangle of handwritten speech arrives from every side — over the top, across
the left, up from underneath — converging on the caret, and one typeset line
goes the other way.

**The left is handwritten.** Speech is a person, and a person writes by
hand — so the mess arrives in handwriting and only the sentence leaving the
caret is set in type. Hand in, type out: that contrast is the product. Caveat
carries the Latin, Kalam sits behind it for the Devanagari, and every other
script falls through, glyph by glyph, to whatever the machine has. One hand at
several weights rather than a font menu. Every thread is the one ink at a
lower weight — most near the ground, a few almost at full — so the left has
depth without a second colour in it.

The hand comes from the font host, and the canvas measures words in whatever
face it has at the time — so the river is laid out again once the hand has
arrived, or every word sits in the wrong place.

**The right is not an example, it is the identity.** `SITE_UI.identity` is
what leaves the caret when nobody has spoken: what the product is, in the only
face on the page anybody chose, at a quarter of the inbound pace. A visitor's
own sentence replaces it the moment they press the button.

### One phrase per thread, not a ribbon

Each thread carries a single sentence and there is a beat of nothing before it
comes round again. Filling every curve end to end is what a river does; a
bombardment is separate things arriving.

It is also the whole reason there can be a hundred of them. The cost is linear in
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

### A current, not a scatter

Each thread leaves its edge along its own bearing to the caret, twisted by up
to thirty degrees, with a long first handle — so it over-swings and comes
round in an arc rather than jerking. The second handle points straight back
out of the caret, so everything arrives level. Threads still cross, but the
way silk does, not the way string does. The middle control point used to be
thrown anywhere on the page, and that gave kinks as often as crossings.

**They come from off the screen.** Every start is well outside the frame and
every thread is already at speed by the time it crosses the edge. Half enter
along the left — the band runs the full width, so its left edge *is* the edge
of the screen — and the quarter over the top and the quarter from beneath are
held to the left of the frame, so they come in through the two corners rather
than dropping in out of the middle of nowhere.

The edge fades are hung on the VISIBLE rectangle rather than on the viewBox,
and they are short. The drawing is sliced, so a fade at a fixed percentage of
the viewBox lands somewhere inside the frame at most window sizes — and a
thread that fades up inside the frame looks like it started there. The one
wide fade left is on the right, where the sentence leaving the caret should
dissolve into the page rather than run off a cliff.

Threads spend longer off-screen now, so fewer words are drawn per frame at the
same count: the same frame rate buys 104 threads where it bought 64.

**Depth is one number.** Bright, big and fast are the same thing — near. Dim,
small and slow are the same thing — far. Rolled separately they cancelled
each other and the eye could not build a space out of it. More threads are far
than near, which is also how things are.

**The breath.** One slow sine per thread, biggest at the far edge and nothing
at all by the caret, folded into the translate so it costs a multiply per
piece. The field moves like something alive instead of like a diagram.

**Born amber.** The line leaving the caret is amber for its first few words
and cools to the reading colour as it moves away — amber marks what is still
in play, in the app and here, and the words just written are the one thing on
the page that still is.

### The rules that keep a tangle from becoming a bug

- Each curve's control points step rightward, which makes x monotonic. That is
  the only thing standing between this and upside-down words.
- The last control point sits level with the caret, so nothing arrives at an
  angle and gets rotated where it meets the cursor.
- The middle one is thrown anywhere, and that is where the crossing comes from.
- Entry points go round-robin across the edges and evenly along each, and the
  two left-hand residues are offset half a slot from each other or they land
  in pairs on the same line. Leaving the side to chance clusters them, and
  clusters them differently at every count — the picture changed whenever the
  number did.
- Each run repeats until it is longer than its own curve, then wraps on one
  period. A lane shorter than its path drags a visible hole along it.
- A word is a straight run of glyphs and the line under it is not, so the
  angle is taken at the word's MIDDLE rather than its start — that halves the
  error for nothing — and a word whose heading turns more than about six
  degrees across its own length is drawn in pieces. Only on the bends, which
  is where the whole cost of fixing it lives. Drawn at one angle, a long word
  on a tight bend leaves the curve and the joint with the next one reads as a
  break in the line.
- One `setTransform` per piece, not `save`/`translate`/`rotate`/`restore`.
  Four calls become one, and it measured about twice as quick — which is what
  paid for the curve-following and then some.
- The edges fade inside the canvas rather than through a CSS mask, so a
  surface that is redrawn every frame is not also re-masked every frame.
- Nothing exists right of the caret on the canvas layer. A word is anchored at
  its START, so one arriving at the cursor hangs its own width past it, and
  every tail longer than the mouth's radius came out the far side and sat
  there as a ghost of a left-hand thread on the right, where only the written
  sentence belongs. The curves all end level at the caret, so a straight block
  from it to the edge costs one fill and cannot cut anything short — its left
  edge is buried inside the mouth's opaque core, so there is no seam.

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

The button is the only place the page speaks. There is no caption under it:
that it stops when you pause is what the button says once it reads Stop, that
your sentence came back clean is visible in the river in your own words, and
when the demo is resting there is no button at all — a control that does
nothing, with a line under it apologising, is worse than no control. What is
left, which is only ever an error, the button wears for a moment and then goes
back to being a button. That is why those strings are short enough to fit on
one.

It sits at the centre of the viewBox, which is the centre of the band, so the
button under it needs no arithmetic to line up.

## Scroll drives the current

The river walks on its own and rushes when the page moves: every pixel of
scroll, either way, is poured into the flow, and it falls back over about half
a second once the page is still. Nothing is intercepted and nothing is trapped
— the page scrolls exactly as it always did, the river answers it. Touch gets
it for free, because a swipe is a scroll.

This replaced a three-push surge that took the first scrolls for itself. A
page that will not move when asked is broken, however briefly.

## The amber is sacred

It appears in three places and they are one meaning: the caret while the
microphone is open, the button while it is open, and the words just born at
the caret. Alive, right now. Nothing merely hovered, focused, selected or
emphasised gets it — those are the pale at full weight, which is the app's
rule. A kept word on the card is underlined, not amber: a fact that survived
is a record, not a thing still in play.

## The titles

Three, none over four words, none in the accent: `Talk. It writes.` over the
river, `Only the mess goes.` over the card, `Free to start.` over the buttons.
A title is a claim and the thing under it is the proof, so each stays short
enough to be read after the proof rather than instead of it. A backend test
holds every one to four words.

## The card

Three claims, each shown rather than asserted. The raw line is marked word by
word — struck through where it goes, underlined where it must not move — a
pill names the reason, and the written line resolves underneath.

**Scroll picks the claim.** The track is three viewports tall and the card is
pinned in the middle of it, so how far you have scrolled through the track IS
which claim is on the card — forwards and backwards, at whatever speed you
move. Reading is the same gesture as advancing, so nobody waits for a carousel
and nobody misses one. The rail's bar stopped being a countdown and became a
position: it runs backwards when you do.

A tab still selects, but it selects by moving the page to where that claim
lives. A control that jumped the card without moving the page would leave the
scroll position lying about what you are looking at.

Where the window is too short to pin anything in, the css collapses the track,
the script sees a scrollable span of zero and the old timer takes over. That
check is the only thing deciding between the two, so there is no way for the
page to end up in a state where neither runs.

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
