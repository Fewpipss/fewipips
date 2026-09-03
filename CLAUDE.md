# fewpips.com - deploy protocol (READ THIS FIRST, EVERY TIME)

This repo is the **single source of truth** for the live site at **https://www.fewpips.com**.
It is managed by **two people with two Claudes** (Veljko + Djordje). These rules exist so
neither of us ever silently reverts the other's work. They are not optional.

## The one invariant
**`main` branch == production, always.** Cloudflare Pages auto-deploys `main`. Whatever is on
`main` is what's live. If the live site ever differs from `main`, that is a bug to fix, not a
new normal.

## 1. ALWAYS pull before you touch anything
Before reading or editing ANY file, get the current live version first:
```
bash scripts/sync.sh        # pulls main + reports any drift vs the live site
```
Never edit on a stale checkout. The whole problem this repo solves is people working from old copies.

## 2. NEVER deploy directly to production
Do **NOT** run `wrangler pages deploy ... --branch=main`, `netlify deploy --prod`, or push
straight to `main`. Direct uploads bypass git and are exactly what caused every past setback.

**The only way to ship is git:**
1. `git checkout -b feat/your-change` (branch off an up-to-date `main`)
2. Make edits (see "Editing gotchas" below)
3. `bash scripts/deploy-gate.sh .` -> must be **GREEN**
4. `git push -u origin feat/your-change` -> Cloudflare auto-builds a **preview** at `<branch>.fewpips.pages.dev`
5. Verify the preview (and run `bash ~/Desktop/Clients/_deploy-tools/verify-site.sh <preview-url> --ga G-67ZBBEE4JC --min-urls 15` if checking a live URL)
6. Open a PR -> the **Deploy Gate** Action runs automatically -> merge only when GREEN
7. Merge to `main` -> Cloudflare auto-deploys to production
8. Verify live: `bash ~/Desktop/Clients/_deploy-tools/verify-site.sh https://www.fewpips.com --ga G-67ZBBEE4JC --min-urls 15`

Preview-first ALWAYS, even for one word. The point is verifying the pipeline, not the change size.

## 3. The deploy gate protects durable artifacts
`durable-artifacts.json` lists everything that MUST survive every deploy (GA4 tag, sitemap,
popup function, brand casing "Fewpips", removed WC48 banner, rules/leverage/terms wording, ...).
`scripts/deploy-gate.sh` checks the build against it. A build that drops any of these is RED and
must not ship. This is what stops a fresh Next.js re-export from silently wiping things.

**Self-annealing:** the moment any deploy loses something, add a check to `durable-artifacts.json`
in the same fix. If you INTENTIONALLY change a protected behaviour (e.g. launch a new promo
banner), update the matching check in the same PR - the gate is a safety net, not a cage.

## 4. Editing gotchas (this is a Next.js static export)
- No build step runs in CI - Cloudflare uploads the repo as-is. Edits go to the built files here.
- `/legal/` is **server-rendered** -> edit `legal/index.html` only.
- `/terms/` is **client-hydrated** -> every text change must edit BOTH `terms/index.html` AND the
  terms chunk `_next/static/chunks/0he1vgjwt7klo.js`, word-for-word, or hydration reverts it.
- Homepage Compare/Challenges/Instruments (incl. leverage) render from chunk
  `_next/static/chunks/0fvh0xh4dp8x0.js` - HTML-only edits get wiped on hydration.
- After any chunk edit: `node --check <chunk>` and verify post-hydration with a real browser, not curl.
- Chunk filenames do NOT change when you edit them - CDN PoPs and browsers keep serving the
  old cached content under the same URL. After editing any `_next/static` chunk, RENAME the
  file (e.g. `..._0.js` -> `..._2.js`) and replace the old name in EVERY served file (HTML,
  .txt RSC payloads, other chunks). Do NOT use `?v=` queries on chunk script tags - the
  turbopack runtime matches chunks by exact URL and hydration silently stalls. Never set
  `immutable` on `/_next/static/*` in `_headers`.
- Same trap for IMAGES: optimizing an image in place keeps its URL, and `_headers` gives
  images a 30-day cache - CDN PoPs keep serving the old heavy file. Rename the image
  (e.g. `kyle.jpg` -> `kyle-b.jpg`) and update every reference (HTML, RSC .txt, chunks).

## 5. Secrets never go in code
This repo is public-readable. Never hardcode tokens/keys/webhook URLs. Use Cloudflare Pages
environment variables (encrypted) and read them from `ctx.env` in functions.

## If the live site doesn't match main
Someone deployed out of band. Don't pile on. Pull `main`, run the gate, and if `main` is the
correct version, redeploy it (merge an empty commit or re-trigger the Pages build). Then find
out who deployed directly and remind them of rule #2.
