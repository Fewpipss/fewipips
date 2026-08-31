#!/usr/bin/env bash
# Auto-refresh the /proof sitemap entry. Called by deploy-gate.sh, so every
# cert batch that goes through the mandatory gate bumps lastmod on its own -
# no manual sitemap step, ever (Veljko 31.8: SEO/AEO requirement).
# CI-safe: on a clean tree this is a no-op.
set -euo pipefail
cd "$(dirname "$0")/.."

TODAY=$(date +%Y-%m-%d)

# ensure the /proof entry exists at all
if ! grep -q '<loc>https://www.fewpips.com/proof/</loc>' sitemap.xml; then
  ENTRY="  <url>\n    <loc>https://www.fewpips.com/proof/</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>"
  perl -0pi -e "s|</urlset>|${ENTRY}\n</urlset>|" sitemap.xml
  echo "[proof-sitemap] /proof entry ADDED (lastmod ${TODAY})"
  exit 0
fi

# proof content changed in the working tree -> bump lastmod to today
if ! git diff --quiet --stat HEAD -- proof/ certs/full/ downloads/ payout-emails/ 2>/dev/null \
   || [ -n "$(git status --porcelain proof/ certs/full/ downloads/ payout-emails/ 2>/dev/null)" ]; then
  perl -0pi -e "s|(<loc>https://www\.fewpips\.com/proof/</loc>\s*<lastmod>)[0-9-]+(</lastmod>)|\${1}${TODAY}\${2}|" sitemap.xml
  echo "[proof-sitemap] proof content changed -> lastmod ${TODAY}"
else
  echo "[proof-sitemap] no proof changes, lastmod untouched"
fi
