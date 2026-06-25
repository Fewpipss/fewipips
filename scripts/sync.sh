#!/usr/bin/env bash
# sync.sh - get the current live version before doing any work.
# Pulls main fast-forward-only, then reports whether the live site matches main.
# Run this FIRST, every session. See CLAUDE.md.

set -uo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" || exit 1

LIVE="https://www.fewpips.com"
GA="G-67ZBBEE4JC"
HOME_FILE="$(mktemp)"
trap 'rm -f "$HOME_FILE"' EXIT

echo "==> Fetching latest from git..."
git fetch --quiet origin || { echo "git fetch failed"; exit 1; }

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" = "main" ]; then
  git pull --ff-only --quiet origin main && echo "    main is up to date ($(git rev-parse --short HEAD))" \
    || { echo "    !! main has diverged - resolve manually before editing"; exit 1; }
else
  BEHIND=$(git rev-list --count "HEAD..origin/main" 2>/dev/null || echo "?")
  echo "    on branch '$BRANCH' ($BEHIND commits behind origin/main)"
fi

echo "==> Checking live site vs main (durable markers)..."
curl -fsS "$LIVE/" -o "$HOME_FILE" 2>/dev/null
warn=0
chk(){ if [ "$1" = "ok" ]; then printf '    ok   %s\n' "$2"; else printf '    WARN %s\n' "$2"; warn=$((warn+1)); fi; }
has(){ grep -qF "$1" "$HOME_FILE"; }

[ -s "$HOME_FILE" ] && chk ok "home reachable" || chk bad "home NOT reachable"
has "$GA"         && chk ok "GA4 present"   || chk bad "GA4 MISSING on live"
has "wc48-banner" && chk bad "WC48 banner is BACK on live (drift!)" || chk ok "no WC48 banner"
has "FewPips"     && chk bad "wrong-cased 'FewPips' on live (drift!)" || chk ok "brand casing ok"
POP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$LIVE/api/popup-signup" 2>/dev/null)
[ "$POP" = "405" ] && chk bad "popup function MISSING (POST=405, drift!)" || chk ok "popup function live (POST=$POP)"

echo "----------------------------------------------------------"
if [ "$warn" -eq 0 ]; then
  echo " Live matches main on all markers. Safe to start work."
else
  echo " $warn marker(s) off - live may have drifted from main."
  echo " If main is the correct version, redeploy it (see CLAUDE.md)."
fi
