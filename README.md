# tailzu.space

Four pages. No build, no framework, no dependencies, no tracker.

```
index.html      the landing page — and the live demo
privacy.html    the Privacy Policy
terms.html      the Terms of Service
download.html   the installers
site.css        the shell the last three share
```

`index.html` is deliberately self-contained: it is the page that has to paint
fast, and it carries its own machinery. The other three are documents, so they
share one stylesheet rather than three copies of it drifting apart.

## Look at it

Open any of them in a browser. They will fetch copy and download state from
`https://api.tailzu.space`. To point somewhere else, set `data-api` on the
`<html>` tag.

`site.css` is linked as `/site.css`, so opening a file directly shows the
document unstyled. To see it properly, serve the folder:

```
python3 -m http.server 8000     # then open http://localhost:8000/privacy.html
```

## Publish

```
scp index.html privacy.html terms.html download.html site.css \
    root@91.108.104.168:~/tulmi/site/
```

Live within a minute — the backend reads these per request, so there is no
restart and no cache bump. Publish one file or all five.

The backend keeps its own copies of privacy, terms and download as a
fallback. A file published here wins; delete it and the built-in page is back,
so the legal text is never unreachable.

## Turn the demo on

The microphone is off until the server says otherwise, because it is an
unauthenticated route that spends real recogniser and model calls. In
`~/tulmi/tulmi/.env`:

```
DEMO_ENABLED=true
DEMO_MAX_SECONDS=15     # a pitch, not a dictation
DEMO_PER_MINUTE=6       # per address
```

then `docker compose up -d --build backend`. With it off the page shows the
apps and hides the mic — nothing breaks, nothing is spent.

## Change the words

Not here. `SITE_UI` in the backend's `catalog.ts` is every string on the
landing page; this repo only carries the same text inline as a fallback for
the second before that answer arrives. Edit there, deploy, bump the cache —
the same move as every string in the app.

The legal text is the exception: it lives in `privacy.html` and `terms.html`
as words, because a policy is a document and not configuration.
