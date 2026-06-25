#!/usr/bin/env bash
# deploy-gate.sh - build-file gate for fewpips.com (and any site using this pattern).
#
# Static checks against the BUILD FILES (no network) so a re-export / edit that
# silently drops a durable artifact FAILS before it can ever deploy. Runs locally
# AND in CI (.github/workflows/gate.yml on every PR).
#
# Usage:
#   scripts/deploy-gate.sh [build_dir] [--manifest path]
#   build_dir defaults to the repo root (the dir this script's parent lives in).
#   manifest  defaults to <build_dir>/durable-artifacts.json
#
# Exit 0 = GREEN (every durable artifact present) -> safe to deploy.
# Exit 1 = RED  (something is missing) -> DO NOT deploy / block the merge.
#
# Complements verify-site.sh, which checks a LIVE/preview URL after deploy.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"   # default: repo root
MANIFEST=""

while [ $# -gt 0 ]; do
  case "$1" in
    --manifest) MANIFEST="$2"; shift 2;;
    -*) echo "unknown arg: $1"; exit 2;;
    *) BUILD_DIR="${1%/}"; shift;;
  esac
done
[ -z "$MANIFEST" ] && MANIFEST="$BUILD_DIR/durable-artifacts.json"

if ! command -v python3 >/dev/null 2>&1; then echo "python3 required"; exit 2; fi
[ -f "$MANIFEST" ] || { echo "manifest not found: $MANIFEST"; exit 2; }
[ -d "$BUILD_DIR" ] || { echo "build dir not found: $BUILD_DIR"; exit 2; }

BUILD_DIR="$BUILD_DIR" MANIFEST="$MANIFEST" python3 - <<'PY'
import json, os, re, sys

build = os.environ["BUILD_DIR"]
manifest = os.environ["MANIFEST"]

with open(manifest) as f:
    m = json.load(f)

# Text files we scan for "present"/"absent" checks. Skip binaries/assets.
TEXT_EXT = (".html", ".js", ".css", ".txt", ".xml", ".json", ".ts", ".svg")
# Skip the repo's own tooling/docs - they legitimately contain check patterns
# (e.g. durable-artifacts.json lists "FewPips"/"wc48-banner" as things to forbid).
# We only want to scan SITE content.
SKIP_DIRS = {".git", "node_modules", "scripts", ".github"}
SKIP_FILES = {"durable-artifacts.json", "CLAUDE.md", "ONBOARDING.md", "README.md"}

def text_files():
    for root, dirs, files in os.walk(build):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fn in files:
            if fn in SKIP_FILES:
                continue
            if fn.endswith(TEXT_EXT):
                yield os.path.join(root, fn)

def route_pages():
    # every index.html (route) plus root-level *.html (e.g. 404.html), minus _next
    for root, dirs, files in os.walk(build):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and d != "_next"]
        for fn in files:
            if fn == "index.html" or (root == build and fn.endswith(".html")):
                yield os.path.join(root, fn)

def read(p):
    try:
        with open(p, encoding="utf-8", errors="ignore") as fh:
            return fh.read()
    except Exception:
        return ""

GREEN = "\033[32mPASS\033[0m"
RED = "\033[31mFAIL\033[0m"
fails = []
passes = 0

print("=" * 56)
print(f" Deploy gate: {m.get('site','(site)')}")
print(f" build: {build}")
print("=" * 56)

for c in m["checks"]:
    cid = c["id"]; t = c["type"]; desc = c.get("desc", cid)
    ok = False; detail = ""

    if t == "file_exists":
        ok = os.path.isfile(os.path.join(build, c["path"]))
        detail = c["path"]

    elif t == "in_all_pages":
        pat = c["pattern"]; missing = []
        for p in route_pages():
            if pat not in read(p):
                missing.append(os.path.relpath(p, build))
        ok = not missing
        detail = "all pages" if ok else f"{len(missing)} missing: " + ", ".join(missing[:6])

    elif t == "present":
        pat = c["pattern"]
        ok = any(pat in read(p) for p in text_files())
        detail = f"'{pat}'"

    elif t == "present_in":
        pat = c["pattern"]; fp = os.path.join(build, c["path"])
        ok = os.path.isfile(fp) and pat in read(fp)
        detail = f"'{pat}' in {c['path']}"

    elif t == "absent":
        pat = c["pattern"]; hits = []
        for p in text_files():
            if pat in read(p):
                hits.append(os.path.relpath(p, build))
        ok = not hits
        detail = f"'{pat}' not found" if ok else f"found in {len(hits)}: " + ", ".join(hits[:6])

    elif t == "sitemap_min_urls":
        fp = os.path.join(build, c["path"]); n = 0
        if os.path.isfile(fp):
            n = len(re.findall(r"<loc>", read(fp)))
        ok = n >= int(c["min"])
        detail = f"{n} URLs (need >= {c['min']})"

    else:
        ok = False; detail = f"unknown check type '{t}'"

    print(f"  [{GREEN if ok else RED}] {cid}: {desc}")
    print(f"          -> {detail}")
    if ok: passes += 1
    else: fails.append(cid)

print("=" * 56)
if fails:
    print(f" \033[31mRED - {len(fails)} check(s) FAILED, {passes} passed. DO NOT deploy.\033[0m")
    print(f" failed: {', '.join(fails)}")
    print("=" * 56)
    sys.exit(1)
else:
    print(f" \033[32mGREEN - all {passes} durable artifacts present. Safe to deploy.\033[0m")
    print("=" * 56)
    sys.exit(0)
PY
