#!/usr/bin/env python3
"""Build /help-index.json - the content the Fewpips help hub (help-hub.js) searches.

Everything in the index is scraped from what is already live on this site, never typed
by hand, so the widget can never contradict /faq/, /legal/ or the blog:

  questions + answers  <- FAQ_CATEGORIES in the FAQ page chunk (_next/static/chunks/0tg_rdy2h4*.js)
  guides               <- <title> + meta description of every blog/<slug>/index.html
  links                <- the fixed set of help pages

Re-run it after any FAQ or blog change:  python3 scripts/build-help-index.py
"""
import glob
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# One card row per FAQ category: the icon the hub draws and the blog guides it offers
# as "read the full guide" after an answer. Slugs are verified against blog/ below.
CATEGORY_META = {
    "Getting started": ("rocket", ["what-is-a-prop-firm", "account-types-and-sizes", "platform-access-and-login"]),
    "Challenges & rules": ("target", ["how-to-pass-prop-firm-challenge", "prohibited-trading-explained", "how-the-consistency-rule-works"]),
    "Instant accounts": ("bolt", ["instant-funded-accounts", "one-step-vs-two-step-prop-firm-challenge", "static-vs-trailing-drawdown"]),
    "Payouts & funded accounts": ("wallet", ["how-prop-firm-payouts-work", "how-to-request-a-payout", "how-the-payout-audit-works"]),
    "Add-ons": ("plus", ["refunds-add-ons-resets", "what-the-challenge-fee-pays-for", "cheapest-prop-firm-challenges"]),
    "Futures": ("chart", ["prop-firm-weekend-holding", "loss-limits-explained", "prop-firm-drawdown-rules"]),
    "Affiliate program": ("users", ["best-prop-firms-for-beginners", "fewpips-eligibility-by-country"]),
}

LINKS = [
    {"t": "Payout proof", "u": "/proof/", "d": "Every payout certificate we have issued, with the trader, the amount and the date."},
    {"t": "Trader reviews", "u": "/reviews/", "d": "What funded traders say about Fewpips on 12 independent review platforms."},
    {"t": "Trading rules", "u": "/legal/", "d": "The full rule book: drawdown, consistency, prohibited trading, payouts."},
    {"t": "All FAQs", "u": "/faq/", "d": "Every question we get asked, split by CFDs and Futures."},
    {"t": "Futures challenges", "u": "/futures/", "d": "Futures account sizes, rules and pricing."},
    {"t": "Contact us", "u": "/contact/", "d": "Email, Telegram, WhatsApp and our social channels."},
    {"t": "Terms of service", "u": "/terms/", "d": "The agreement that covers every Fewpips account."},
]


def faq_categories():
    """Pull FAQ_CATEGORIES out of the FAQ chunk (a JS object literal, so node parses it)."""
    chunks = sorted(glob.glob(os.path.join(ROOT, "_next/static/chunks/0tg_rdy2h4*.js")))
    if not chunks:
        sys.exit("build-help-index: FAQ chunk not found")
    src = open(chunks[-1], encoding="utf-8", errors="replace").read()
    marker = '"FAQ_CATEGORIES",0,'
    start = src.index(marker) + len(marker)
    depth, i = 0, start
    while True:  # walk to the matching ], skipping string literals
        c = src[i]
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                break
        elif c == '"':
            i += 1
            while src[i] != '"':
                i += 2 if src[i] == "\\" else 1
        i += 1
    node = os.path.expanduser("~/.local/bin/node")
    out = subprocess.run(
        [node, "-e", "console.log(JSON.stringify(" + src[start:i + 1] + "))"],
        capture_output=True, text=True, check=True,
    )
    return json.loads(out.stdout)


def guides():
    found = []
    for path in sorted(glob.glob(os.path.join(ROOT, "blog/*/index.html"))):
        slug = os.path.basename(os.path.dirname(path))
        html = open(path, encoding="utf-8", errors="replace").read(80000)
        m = re.search(r"<title>(.*?)</title>", html, re.S)
        title = re.sub(r"\s*\|\s*Fewpips.*$", "", m.group(1).strip()) if m else slug
        d = re.search(r'<meta name="description" content="([^"]*)"', html)
        found.append({"s": slug, "t": html_unescape(title), "d": html_unescape((d.group(1) if d else "")[:170])})
    return found


def html_unescape(s):
    return (s.replace("&amp;", "&").replace("&#x27;", "'").replace("&quot;", '"')
             .replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " "))


def main():
    cats_src = faq_categories()
    all_guides = guides()
    known = {g["s"] for g in all_guides}

    cats = []
    for c in cats_src:
        icon, related = CATEGORY_META.get(c["name"], ("help", []))
        missing = [s for s in related if s not in known]
        if missing:
            sys.exit("build-help-index: unknown blog slug(s) %s for category %r" % (missing, c["name"]))
        cats.append({
            "n": c["name"],
            "i": icon,
            "g": related,
            "items": [{"q": html_unescape(it["q"]), "a": html_unescape(it["a"])} for it in c["items"]],
        })

    index = {"v": 1, "cats": cats, "guides": all_guides, "links": LINKS}
    dest = os.path.join(ROOT, "help-index.json")
    with open(dest, "w", encoding="utf-8") as fh:
        json.dump(index, fh, ensure_ascii=False, separators=(",", ":"))
    questions = sum(len(c["items"]) for c in cats)
    print("help-index.json: %d categories, %d questions, %d guides, %d links, %d bytes"
          % (len(cats), questions, len(all_guides), len(LINKS), os.path.getsize(dest)))


if __name__ == "__main__":
    main()
