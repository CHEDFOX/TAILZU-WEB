#!/usr/bin/env bash
#
# Does the site answer the way it should? Every route vercel.json names, the
# headers, what must never be served, and the other names (www, tailzu.space).
#
#   deploy/check.sh                                  the live site, over HTTPS, wherever DNS points
#   deploy/check.sh --http --ip 91.108.104.168       the VPS before the domain moves (the plain-HTTP config)
#   deploy/check.sh --ip 91.108.104.168              the VPS over HTTPS, whatever DNS says
#
# Nothing is written anywhere; it only asks.

set -uo pipefail
scheme=https ip="" insecure=""
while [ $# -gt 0 ]; do
  case "$1" in
    --http) scheme=http ;;
    --ip) ip="$2"; shift ;;
    --insecure) insecure="-k" ;;            # a test certificate, for a dry run
    *) echo "unknown option $1"; exit 2 ;;
  esac
  shift
done
port=443; [ "$scheme" = http ] && port=80
resolve=()
# --ip talks to that address and nothing else: straight there, past any proxy this machine is set to use
if [ -n "$ip" ]; then resolve+=(--noproxy "*"); for h in x0bot.com www.x0bot.com tailzu.space www.tailzu.space; do resolve+=(--resolve "$h:$port:$ip" --resolve "$h:80:$ip"); done; fi

pass=0 fail=0
ok()  { printf '  \033[32mPASS\033[0m  %s\n' "$1"; pass=$((pass+1)); }
bad() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; fail=$((fail+1)); }

# t  <what>  <url>  <status regex>  [header regex ...]   (headers are matched case-insensitively, one line each)
t() {
  local what="$1" url="$2" want="$3"; shift 3
  local head code range=()
  # only the big files are asked for a byte (a range on anything else would answer 206)
  case "$url" in */downloads/*|*/media/*) range=(-r 0-0) ;; esac
  head="$(curl -sS $insecure "${resolve[@]}" --max-time 20 -o /dev/null -D - "${range[@]}" "$url" 2>&1 | tr -d '\r')"
  code="$(printf '%s\n' "$head" | awk 'toupper($1) ~ /^HTTP/ {c=$2} END {print c}')"
  if ! printf '%s' "$code" | grep -qE "^($want)$"; then bad "$what: $url answered ${code:-nothing}, wanted $want"; return; fi
  local h
  for h in "$@"; do
    if ! printf '%s\n' "$head" | grep -qiE "$h"; then bad "$what: $url has no header matching /$h/"; return; fi
  done
  ok "$what ($code)"
}

S="$scheme://x0bot.com"
echo "x0bot.com, its own files"
t "the home page" "$S/" 200 "^content-type: text/html" "^content-security-policy: default-src 'none'; script-src 'self' 'sha256-" "^strict-transport-security: max-age=63072000" "^x-frame-options: DENY"
t "the home page by name" "$S/index.html" 200 "^content-security-policy: default-src 'none'"
t "its script" "$S/js/main.js" 200 "^content-type: application/javascript" "^cache-control: public, max-age=0, must-revalidate"
t "its styles" "$S/css/site.css" 200 "^content-type: text/css"
t "the link preview" "$S/og.png" 200 "^cache-control: public, max-age=86400"
t "an icon" "$S/favicon.svg" 200 "^cache-control: public, max-age=604800"
t "the web manifest" "$S/site.webmanifest" 200 "^content-type: application/manifest\+json" "^cache-control: public, max-age=604800"
t "the installer script" "$S/install.sh" 200 "^content-type: text/plain" "^cache-control: public, max-age=300"
t "robots.txt" "$S/robots.txt" 200 "^cache-control: public, max-age=3600"
t "a clip" "$S/media/meet/call-1.mp4" "200|206" "^content-type: video/mp4" "^cache-control: public, max-age=604800"
t "a page that is not there" "$S/no-such-page" 404

echo "never served"
for p in /README.md /archi.md /csp.mjs /WORKING-ON.md /vercel.json /.vercelignore /.git/HEAD /.github/workflows/deploy.yml /deploy/ship.sh /api/_meta.js /scripts/gen-web-icons.py; do
  t "$p" "$S$p" 404
done

echo "the API's pages and routes, under the site's name"
for p in /pricing /privacy /privacy/providers /terms /support /faq /device /delete-account /languages /ai-keyboard /ai-keyboard/android /voice-typing /voice-typing/windows /sitemap.xml /llms.txt /llms-full.txt; do
  t "$p" "$S$p" 200 "^strict-transport-security: max-age=63072000" "^x-frame-options: DENY"
done
t "the site's data" "$S/v1/site" 200 "^content-type: application/json"
t "Meta's pixel" "$S/site-events.js" 200 "^content-type: application/javascript"
t "Apple's app-links file" "$S/.well-known/apple-app-site-association" 200
t "the download page" "$S/download" "200|30[1278]"
t "an installer" "$S/downloads/Tailzu.dmg" "200|206|30[1278]"

echo "the other names"
t "www goes to x0bot.com, query and all" "$scheme://www.x0bot.com/pricing?from=www" 308 "^location: https://x0bot.com/pricing\?from=www$"
t "tailzu.space pages go to x0bot.com" "$scheme://tailzu.space/pricing?ref=old" 301 "^location: https://x0bot.com/pricing\?ref=old$"
t "www.tailzu.space too" "$scheme://www.tailzu.space/" 301 "^location: https://x0bot.com/$"
t "tailzu.space still serves /v1 (a POST survives no redirect)" "$scheme://tailzu.space/v1/site" 200
t "tailzu.space still serves the installers (old desktop builds follow no redirect)" "$scheme://tailzu.space/downloads/Tailzu.dmg" "200|206|302|307"
t "tailzu.space still serves app links (Apple refuses one behind a redirect)" "$scheme://tailzu.space/.well-known/apple-app-site-association" 200
if [ "$scheme" = https ]; then
  t "plain HTTP goes to HTTPS" "http://x0bot.com/pricing" 301 "^location: https://x0bot.com/pricing$"
fi

echo
if [ "$fail" -eq 0 ]; then printf '\033[32mall %d checks pass\033[0m\n' "$pass"; else printf '\033[31m%d of %d checks failed\033[0m\n' "$fail" "$((pass+fail))"; exit 1; fi
