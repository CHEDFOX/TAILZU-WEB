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
source of the ground `#0F0D0B`, the ink `#F3E2C6` and the accent `#E8A23C`.
Change one there and change it here to match. The surfaces between and above
the ground are the site's own and are set out below; they are the same hue,
further up.

The ground is a warm near-black biased toward the accent's own hue, so the
amber sits *in* it rather than on it. There is one reading colour and it is
the amber's family; everything quieter is that same pale at a lower weight,
never a second hue. That is why the amber still means something — and it means
the same thing here as in the app: **what is still in play**. The word while
the waves are merging into it, the microphone while it is open, the step that
is running.

### The quiet end is set by contrast, not by taste

Measured against this ground, the pale at .36 alpha is **2.84:1** — under even
the 3:1 floor for large text. That one number was carrying the labels, the
platform line, the footer and the unselected tabs, and it is why the page read
as faded rather than as quiet. A faded page reads as an unfinished one
whatever its colours are. `--dim` is .52 (4.71:1, AA for small text) and
`--grey` is .62 (6.26:1). Same hue, same family, nothing new — the page just
stops whispering. `scratchpad/contrast.js` prints the table; if you lower one
of these, print it again.

### Three surfaces, not two

The app has a ground and a card, and two values over a whole page is what made
this hard rather than calm: everything was either the void or the one thing on
it. A page is also read further away and on a brighter screen than a phone in
the hand, where the same values sit darker and flatter. So the ground stays
exactly the app's and the ladder is built upward from it:

```
--ink    #0F0D0B   the app's ground, unchanged
--wash   #141110   whole sections — the sheet's middle, the downloads, the footer
--card   #211C17   the card
--raise  ink at 5.5%  the small things that sit ON a surface: pills, chips
```

`#211C17` is the ceiling and not a preference: above it `--dim` drops under
4.5:1 and the labels stop clearing AA. Run `scratchpad/contrast.js` against any
surface you are thinking of before you use it.

The wash lifts the middle of the sheet and settles back at both ends, so the
page breathes between the river and the downloads instead of being one
unbroken slab from the masthead to the footer — and it lands a shade lighter
than it started, because a dark page that gets darker to the bottom edge feels
like falling off it.

The download buttons are filled rather than drawn on the void. An outline on a
near-black ground is a hole with a line round it, and four of them in a row
read as a broken control.

### Light, not more colour

Two things carry the attraction, and neither is a second hue:

**A pool of light where the threads converge.** The eye goes to the brightest
place before it reads anything, so the brightest place should be where the
thing happens. A flat ground gives it nowhere to go and the whole band reads
as evenly busy. The pool is the page's own ink at four per cent, behind the
canvas.

**The card is lit from above**, like everything anybody has ever picked up: a
top edge catching the light, a shadow pooling under it. The two ends of its
gradient straddle the app's own card value, so it is the same material — it is
only being lit.

That is also why the mouth and the block beyond it ERASE rather than paint
ground. They used to fill with the ground colour, which was the same thing
while the ground was flat, and it is not any more — painting flat ink over the
right half of the pool cut a hard vertical edge down the middle of it.

There is still no paper half. Lighter is not the same as light: every surface
here is the same warm near-black further up the ladder, so the ground never
changes temperature and the amber never stops meaning what it means. A light
section would have been a second visual world; a third step on one ladder is
the same world with more air in it.

## The river

A hundred threads of handwritten speech arrive from every side — over the top,
across the left, up from underneath — and one word swallows them.

**There is no caret and no second stream.** The two sides of the picture were
only ever two because something stood between them. The threads run into the
word itself and dissolve as they arrive.

**They arrive across the letter, not onto a point.** A hundred curves ending
on one pixel pile up into a bright knot there, and a knot being erased is what
"cheap" looks like. The endpoints are spread over the height of the first
glyph, so the threads come in along its whole stem and the letter reads as
drinking them in rather than as a dot being wiped.

**The dissolve is along each thread, not a shape on the screen.** Every piece
of every word thins with ITS OWN distance to the gate, eased, over the last
hundred and fifty units, and reaches nothing exactly at the letter. A
screen-space ellipse could only ever approximate that, and wherever it was
wrong it was wrong as a visible edge — a thread still bright at the gate met
a straight cut. Taken at the piece's midpoint, so a long piece straddling the
gate is not drawn bright because its first letter was. Pieces at zero are not
drawn at all. There is no ellipse any more; the straight block past the gate
remains only as a guarantee, drawn over pixels that are already at zero.

**The gate is the word's own left edge, measured and not typed.** A number
typed by hand put the cut a few units off the glyph at one font size and a
dozen off at another. The convergence moves with the word for the same reason:
the curves have to END where it starts, or the gap comes straight back.

**The left is handwritten.** Speech is a person, and a person writes by
hand — so the mess arrives in handwriting and only the word that swallows it
is set in type. Hand in, type out: that contrast is the product. Caveat
carries the Latin, Kalam sits behind it for the Devanagari, and every other
script falls through, glyph by glyph, to whatever the machine has. One hand at
several weights rather than a font menu. Every thread is the one ink at a
lower weight — most near the ground, a few almost at full — so the left has
depth without a second colour in it.

The hand comes from the font host, and the canvas measures words in whatever
face it has at the time — so the river is laid out again once the hand has
arrived, or every word sits in the wrong place.

**The word is `SITE_UI.absorb`, and it is one word or two.** It is set at the
size of a thing that can swallow a hundred threads, so a third word does not
fit on a laptop — and it has to be read at a glance or it is not a
destination, it is just more text. A backend test holds it to two.

It carries a soft wash of the accent while the waves are merging into it, and
the wash deepens with how fast they are arriving — so a scroll is visible on
the word before the page has moved at all. With the microphone open it is the
accent outright and swells with the voice, scaled about its own left edge so
it grows into the space it is filling rather than sliding away from the
threads arriving at it.

A visitor's own sentence replaces the word the moment they have spoken, fitted
to whatever room the sliced viewBox leaves to the right of it. What it
actually absorbed beats what it claims to.

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

Each thread leaves its edge along its own bearing to the word, twisted by up
to thirty degrees, with a long first handle — so it over-swings and comes
round in an arc rather than jerking. The second handle points straight back
out of the word, so everything arrives level. Threads still cross, but the
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
There is no right-hand fade at all: everything past the convergence is erased
outright, so a gradient there would be drawn every frame over empty pixels.

Threads spend longer off-screen now, so fewer words are drawn per frame at the
same count: the same frame rate buys 104 threads where it bought 64.

**Depth is one number.** Bright, big and fast are the same thing — near. Dim,
small and slow are the same thing — far. Rolled separately they cancelled
each other and the eye could not build a space out of it. More threads are far
than near, which is also how things are.

**The breath.** One slow sine per thread, biggest at the far edge and nothing
at all by the word, folded into the translate so it costs a multiply per
piece. The field moves like something alive instead of like a diagram.

### The rules that keep a tangle from becoming a bug

- Each curve's control points step rightward, which makes x monotonic. That is
  the only thing standing between this and upside-down words.
- The last control point sits level with the word, so nothing arrives at an
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
- Nothing exists right of the gate on the canvas layer. A word is anchored at
  its START, so one arriving at the cursor hangs its own width past it, and
  every tail longer than the mouth's radius came out the far side and sat
  there as a ghost of a left-hand thread past the word. The curves all end level at the word, so a straight block
  from it to the edge costs one fill and cannot cut anything short — its left
  edge is buried inside the mouth's opaque core, so there is no seam.

## The waves take the scroll first, then the page moves

From the very top, the first 460 pixels of downward scroll are poured into the
flow instead of into the document: you push, the river answers, and only once
that budget is spent does the page start to move. After that it is ordinary
scrolling and never does it again. Past the hold the coupling is permanent and
free — every pixel of scroll, either way, feeds the flow, and it falls back
over about half a second once the page is still.

A budget in **pixels**, not a count of flicks: a trackpad sends thirty small
events where a mouse wheel sends three, and counting events made the hold four
times longer on one than on the other.

The guards are what keep it from being hostile: only from the very top, only
downward, never on touch — a phone has no wheel to intercept and stealing a
swipe is a far worse trade — and never under reduced motion. The whole thing
is over in well under a second and the way out is to keep doing exactly what
you were already doing. Verified: four flicks are absorbed, the fifth scrolls.

## The amber is sacred

It means one thing: **alive, right now**. It appears while the microphone is
open — on the button and on the word — and, softly, on the word whenever the
waves are merging into it, deepening with how fast they arrive. That last one
is a wash rather than the colour outright, and it is the accent doing its own
job: the merging IS the live thing on this page.

Nothing merely hovered, focused, selected or emphasised gets it. Those are the
pale at full weight, which is the app's rule. A kept word on the card is
underlined, not amber: a fact that survived is a record, not a thing still in
play.

The word's fill is set per frame in script, so there is no CSS rule for it. An
inline fill beats a class selector, and a rule that can never apply is worse
than no rule at all.

## The mark

The masthead carries the app icon and not the name. It is the icon redrawn as
seven shapes from its own measured geometry — the three squares' bounding
boxes, the tick positions of the hatched link, the dot's centre and colour
were read off `app/assets/icon.png` with a flood fill, not eyeballed — so the
one-file site stays one file and the mark is crisp at any size. The hatching
is a thick stroke with a short dash, which is what perpendicular ticks
collapse to at thirty pixels. It is the only place the amber is not about the
waves, because it is the only place the amber is the brand's own.

`tailzu-mark.svg` in the app repo is an older waveform mark and is not this.

## The titles

Two, none over four words, none in the accent: `Only the mess goes.` over the
card and `Free to start.` over the buttons. There is nothing over the river —
the river is the headline. A title is a claim and the thing under it is the
proof, so each stays short enough to be read after the proof rather than
instead of it. A backend test holds every one to four words.

The one over the card is set in **Shrikhand**, a fat, swinging display face
drawn for Gujarati and Latin together — the one funky thing on the page, and
funky in the product's own accent. Nothing else is set in it.

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

**The next thing, not the next filter.** Scrolling past a claim before its
refinement had landed used to jump straight to the following claim, so a quick
scroll showed three sentences being marked up and never one being written.
Forwards, the card now waits for the written line to arrive, then moves one
claim at a time so none is skipped — the arrival itself calls back to catch up
with wherever the scroll has got to. Backwards is always free: you have
already seen it. Verified by jumping straight to the third claim's position:
the card goes second, waits for its line, then third.

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
