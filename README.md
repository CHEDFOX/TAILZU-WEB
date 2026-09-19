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

Thirteen lanes of speech arrive over the top edge, across the left, and up
from underneath — speech does not queue politely from one side. They converge
on the caret, and one line goes the other way.

**The left is ugly on purpose.** Speech has no typography, so the lanes have
none either — each is set in whatever face the machine happens to have, at
whatever size, with no two agreeing: Comic Sans, Courier, Times, Verdana,
Trebuchet, Georgia, Arial, Lucida, Tahoma, Palatino. Nothing there is loaded
from a font host, because the whole point is that these are the defaults
nobody chose.

**The right is not an example, it is the identity.** `SITE_UI.identity` is
what leaves the caret when nobody has spoken: what the product is, in the only
face on the page anybody chose, at a quarter of the inbound pace. Everything
rushing in, one line leaving at reading speed. A visitor's own sentence
replaces it the moment they press the button, because that is the better
argument.

No two inbound speeds match and none is a multiple of another, so the
bombardment never falls into step with itself and starts reading as a pattern.
They carry interleaved cases, so a dozen scripts are on screen at once.

Every lane runs left to right and ends level at the caret: a path that doubles
back hangs its own glyphs upside down, and one that arrives at an angle
rotates the text where it meets the cursor. Each carries a `dy` of a third of
an em, because a textPath puts the BASELINE on the path and without it the
text floats above the line it is running along.

Each lane's stream repeats until it is longer than the curve it runs on, then
the whole thing is written twice. Doubling alone is not enough — a lane
carrying two short sentences is shorter than its path, and the offset then
drags a visible hole along it. The repeat guarantees one period covers the
curve; the doubling makes the wrap seamless.

The mask fades all four edges, not just the sides, because lanes now come over
the top and up from underneath and a lane chopped at the band's edge reads as
a rendering fault rather than as speech arriving from off-stage. It is on the
`<svg>`, not the container, so the caret over it stays crisp.

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
