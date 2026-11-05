#!/bin/sh
# xode: Xode in the terminal. Installs it with npm, then `xode` works in any project folder.
#   curl -fsSL https://x0bot.com/install.sh | bash
set -e

say() { printf '%s\n' "$1"; }

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  say "xode needs Node.js 20 or later. Get it at https://nodejs.org, then run this again."
  exit 1
fi

major=$(node -p 'process.versions.node.split(".")[0]')
if [ "$major" -lt 20 ]; then
  say "xode needs Node.js 20 or later; this computer has $(node -v). Update it at https://nodejs.org, then run this again."
  exit 1
fi

say "Installing xode…"
if ! npm install -g @xooteqlab/xode@latest; then
  say ""
  say "That didn't finish. If it said permission denied, run:"
  say "  sudo npm install -g @xooteqlab/xode@latest"
  exit 1
fi

say ""
say "Done. In your project's folder, run:"
say "  xode"
