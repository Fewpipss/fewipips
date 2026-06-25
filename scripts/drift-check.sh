#!/usr/bin/env bash
# drift-check.sh - runtime check that the LIVE site still matches what main should serve.
# Used by .github/workflows/drift-check.yml on a schedule. Exit 1 = drift detected.
#
# Usage: scripts/drift-check.sh [https://www.fewpips.com]

set -uo pipefail
LIVE="${1:-https://www.fewpips.com}"
GA="G-67ZBBEE4JC"
HOME_FILE="$(mktemp)"
trap 'rm -f "$HOME_FILE"' EXIT
fail=0
red(){ printf 'DRIFT  %s\n' "$1"; fail=$((fail+1)); }
ok(){  printf 'ok     %s\n' "$1"; }
# grep a file (never pipe a big var into grep -q under pipefail -> SIGPIPE false-fail)
has(){ grep -qF "$1" "$HOME_FILE"; }

curl -fsS "$LIVE/" -o "$HOME_FILE" 2>/dev/null
[ -s "$HOME_FILE" ] && ok "home reachable" || red "home NOT reachable"

has "$GA"          && ok "GA4 present"                || red "GA4 missing on live"
has "wc48-banner"  && red "WC48 promo banner is back on live" || ok "no WC48 banner"
has "FewPips"      && red "wrong-cased 'FewPips' on live"     || ok "brand casing ok"

POP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$LIVE/api/popup-signup" 2>/dev/null)
[ "$POP" = "405" ] && red "popup function missing (POST=405)" || ok "popup function live (POST=$POP)"

SM=$(curl -s -o /dev/null -w "%{http_code}" "$LIVE/sitemap.xml" 2>/dev/null)
[ "$SM" = "200" ] && ok "sitemap 200" || red "sitemap.xml HTTP $SM"

if [ "$fail" -eq 0 ]; then echo "GREEN - live matches main."; exit 0
else echo "RED - $fail drift signal(s). Live deployed out of band or main not deployed."; exit 1; fi
