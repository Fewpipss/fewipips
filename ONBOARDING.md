# Onboarding - fewpips.com (for Djordje + his Claude)

One-time setup so your Claude always works from the exact live version and nothing
ever silently reverts. After this, the rules live in `CLAUDE.md` (your Claude reads it automatically).

## Why this exists
We both manage this site. Until now, deploys went out via direct upload (wrangler/netlify),
which bypassed git - so the repo went stale and each person's deploy reverted the other's work.
From now on, **git is the only way to deploy** and `main` is always exactly what's live.

## One-time setup
1. Clone the repo (you already have push access as the `Fewpipss` owner):
   ```
   git clone https://github.com/Fewpipss/fewipips.git
   cd fewipips
   ```
2. Confirm you can pull and that the gate runs:
   ```
   bash scripts/sync.sh          # pulls main + checks live matches it
   bash scripts/deploy-gate.sh . # should print GREEN
   ```

## Every time you (or your Claude) change the site
Follow `CLAUDE.md`. Short version:
1. `bash scripts/sync.sh` (always start here - gets the live version)
2. `git checkout -b feat/your-change`
3. Edit, then `bash scripts/deploy-gate.sh .` until GREEN
4. `git push -u origin feat/your-change` -> preview at `<branch>.fewpips.pages.dev`
5. Open a PR, wait for the **Deploy Gate** check to pass, merge to `main`
6. Cloudflare auto-deploys `main`. Done.

## If you re-export the site from your Next.js source
A fresh export usually DROPS things that only live in the built output: the GA4 tag,
`sitemap.xml`, the `functions/api/popup-signup.ts` popup endpoint, brand casing, the
per-instrument leverage matrix, the 48h/$10 terms, etc. The deploy gate will catch these
and go RED. Re-add what it flags (or, better, add them to your source so exports keep them)
before merging. `durable-artifacts.json` is the full checklist.

## The one hard rule
**Never `wrangler pages deploy --branch=main` or `netlify deploy --prod` by hand.**
That's what broke things before. Deploy = merge to `main`.
