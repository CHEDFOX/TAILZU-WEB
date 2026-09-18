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

Three lanes of speech pour in from the left, are swallowed at the microphone,
and one sentence leaves to the right — small dim sans going in, large bright
serif coming out. Many in, one out: the shape of the picture is the shape of
the product.

It is four SVG `<path>` elements with a `<textPath>` on each, clipped either
side of the capsule. There are no bands behind the text: speech runs on the
page itself, and a mask on the `<svg>` — not on the container, so the capsule
over it stays crisp — dissolves both ends into the ground rather than letting
the viewport cut them off. No two inbound lanes run at the same speed, because equal
speeds beat against each other and read as one repeating pattern rather than
three separate people talking at once; they carry interleaved cases rather
than consecutive ones, so three scripts are on screen at once. A radial ink
gradient over the crossing dissolves the mess into the microphone instead of
chopping it off at a clip edge.

All four lanes are drawn through the centre of the viewBox, which is where the
capsule is centred — that is what keeps the button exactly on the crossing at
any window width, and why the change appears to happen *at* the microphone
rather than near it.

Every lane runs left to right on purpose. A path that doubles back hangs its
own glyphs upside down, which is the first thing that goes wrong with this
effect.

The stream is written twice and the offset slides through exactly one half
before jumping back, so the loop has no seam — the frame before the jump and
the frame after it are the same picture.

Press the button and your own clip replaces the stream: the mess you actually
said flows in, your sentence flows out, and the page stops arguing.

## The mark is the filter

The pill in the middle is gone; the brand mark does the job it was drawn for.
Speech goes into the first box, the second one blinks amber twice and rests,
the hatch between the second and third carries it across, and the sentence
leaves from the amber tip. Clicking the mark starts the microphone, and so
does the button under it.

The hatch keeps the mark's own drawing at rest — all ticks one length, only
the colour travelling, the way the boxes light in sequence in the splash.
Varying their length instead bows the run into a coil and stops it being the
logo. While the microphone is open the length *is* the level meter, because
then it is carrying something real.

The button's position is measured from the mark, not set as a percentage: the
svg is sliced, so the mark lands at a different place and size at every window
width. It is measured more than once, too — the first measurement can land
before the band has its final box.

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
