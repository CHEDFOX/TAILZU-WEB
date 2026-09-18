# tailzu.space

One file. No build, no framework, no dependencies.

`index.html` is the landing page. Its words come from the backend
(`GET /v1/site`), its download buttons appear only for installers that are
actually published, and its microphone is real: a visitor talks, the backend
writes it clean, and the download button is asked for on top of proof they
just made.

## Publish

```
scp index.html root@91.108.104.168:~/tulmi/site/
```

Live within a minute. The backend serves `~/tulmi/site/index.html` at
`tailzu.space/` and sends `/` to `/download` until that file exists.

## Turn the demo on

The microphone is off until the server says otherwise, because it is an
unauthenticated route that spends real recogniser and model calls. In
`~/tulmi/tulmi/.env`:

```
DEMO_ENABLED=true
DEMO_MAX_SECONDS=15     # a pitch, not a dictation
DEMO_PER_MINUTE=6       # per address
```

then `docker compose up -d --build backend`. With it off, the page shows the
apps and hides the mic — nothing breaks, nothing is spent.

## Change the words

Not here. `SITE_UI` in the backend's `catalog.ts` is every string on the page;
this file only carries fallbacks for the second before that answer arrives.
Edit there, deploy, bump the cache — the same move as every string in the app.

## Preview locally

Open `index.html` in a browser. It will point at `https://api.tailzu.space`
for copy and the demo; set `data-api` on the `<html>` tag to point elsewhere.
