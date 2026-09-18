# tailzu.space

One file. No build, no framework, no dependencies, no tracker.

```
index.html      the landing page — the stage, and the live microphone
```

`/privacy`, `/terms` and `/download` are served by the backend, which has
carried them as HTML since before there was a site. Publishing a file of the
same name here overrides the built-in page; deleting it brings the built-in
page back, so the legal text is never unreachable.

## The stage

The page's whole argument is one animation. Every word you spoke arrives as
loose debris; the words you meant fly into a line and the words you didn't
fall out of frame. Words the recogniser misheard change letters on the way in
and stay amber, so you can see exactly what was repaired — and exactly what
was left alone.

**None of it is choreographed.** A case is two strings, what was said and what
was written, and the page works out for itself which word became which with a
fuzzy longest-common-subsequence. That is the only reason the same animation
can run on a stranger's voice a second after they speak it, and the reason the
examples can be changed from the backend without anybody touching this file.

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

then `docker compose up -d --build backend`. With it off the stage still runs
and the button explains itself — nothing breaks, nothing is spent.

## Change the words

Not here. `SITE_UI` in the backend's `catalog.ts` is every string on this page
and every case on the stage; this file carries the same text inline only as a
fallback for the second before that answer arrives. Edit there, deploy, bump
the cache — the same move as every string in the app.
