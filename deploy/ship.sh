#!/usr/bin/env bash
#
# The site on the VPS: pull main, publish its files as a new release, switch to
# it in one step, and install the nginx config made from vercel.json, but only
# once nginx accepts it. Run by GitHub on every push to main (.github/workflows/
# deploy.yml), through a key that can run nothing else; or by hand:
#
#   ssh root@91.108.104.168 /opt/x0bot-site/deploy/ship.sh
#
#   /opt/x0bot-site             this repo, cloned (only root reads it)
#   /var/www/x0bot.com/releases one folder per deploy, the last five kept
#   /var/www/x0bot.com/current  the one nginx serves (a link, switched in one step)
#
# Back to the release before:  ROLLBACK=1 /opt/x0bot-site/deploy/ship.sh
#
# The nginx server is shared with the API and the VPS's other sites, so a config
# nginx refuses is never left in place: the old file goes back and the deploy
# fails, with nginx's reason. The files are published either way; nothing that
# was serving stops.

set -euo pipefail

main() {
  local repo="${SITE_REPO:-/opt/x0bot-site}" web="${SITE_WEB:-/var/www/x0bot.com}"
  local conf="${SITE_CONF:-/etc/nginx/sites-available/x0bot.com}" link="${SITE_LINK:-/etc/nginx/sites-enabled/x0bot.com}"
  local cert="/etc/letsencrypt/live/x0bot.com/fullchain.pem"
  mkdir -p "$web/releases" /var/www/letsencrypt

  if [ "${ROLLBACK:-}" = "1" ]; then
    local now before
    now="$(readlink -f "$web/current" || true)"
    before="$(ls -1dt "$web"/releases/* | grep -vxF "$now" | head -n1 || true)"
    [ -n "$before" ] || { echo "no release before this one to go back to"; exit 1; }
    ln -sfn "$before" "$web/current.next" && mv -Tf "$web/current.next" "$web/current"
    echo "back to $(basename "$before")"
    return
  fi

  # ---- the code: main as GitHub has it ----
  if [ -z "${NO_PULL:-}" ]; then
    git -C "$repo" fetch -q origin main
    git -C "$repo" reset -q --hard origin/main
  fi
  local sha subject
  sha="$(git -C "$repo" rev-parse --short HEAD)"
  subject="$(git -C "$repo" log -1 --format=%s)"

  # ---- the files: everything but what was never the site (.vercelignore, and the repo's own machinery) ----
  local rel="$web/releases/$sha"
  rsync -a --delete \
    --exclude-from="$repo/.vercelignore" \
    --exclude='.git' --exclude='.github' --exclude='.vercelignore' --exclude='vercel.json' \
    --exclude='deploy/' --exclude='api/' --exclude='scripts/' --exclude='WORKING-ON.md' \
    "$repo/" "$rel/"
  ln -sfn "$rel" "$web/current.next" && mv -Tf "$web/current.next" "$web/current"

  # ---- nginx: the TLS config once the certificate exists, the plain one until then ----
  local src="$repo/deploy/nginx/x0bot.http.conf"
  [ -f "$cert" ] && src="$repo/deploy/nginx/x0bot.conf"
  if ! cmp -s "$src" "$conf"; then
    local backup=""
    if [ -f "$conf" ]; then backup="$conf.before"; cp "$conf" "$backup"; fi
    cp "$src" "$conf"
    ln -sfn "$conf" "$link"
    local why
    if why="$(nginx -t 2>&1)"; then
      systemctl reload nginx 2>/dev/null || nginx -s reload
      echo "nginx: $(basename "$src") is live"
    else
      if [ -n "$backup" ]; then mv "$backup" "$conf"; else rm -f "$conf" "$link"; fi
      echo "nginx refused the new config, so the old one stays. nginx said:"
      echo "$why"
      exit 1
    fi
    rm -f "$conf.before"
  fi

  # ---- the last five releases are kept, for ROLLBACK=1 ----
  ls -1dt "$web"/releases/* | tail -n +6 | xargs -r rm -rf

  echo "live: $sha  $subject"
}

main "$@"
