#!/usr/bin/env python3
"""Build fp-help/index.json - the search index behind the chat help panel (fp-help/fp-help.js).

Sources are the live site files, so the panel never says anything the site does not:
  - every FAQ question + answer from the FAQ chunk (FAQ_CATEGORIES, all 7 categories)
  - every blog post's title, description and URL from blog/*/index.html

Called by deploy-gate.sh on every run: locally it rewrites the index when the FAQ or a blog
post changed (commit the result), in CI (--check) it fails the gate if the committed index
is stale. Deterministic output, so a clean tree is a no-op.
"""
import glob, html, json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "fp-help", "index.json")


def faq_chunk():
    page = open(os.path.join(ROOT, "faq", "index.html"), encoding="utf-8").read()
    for name in re.findall(r'/_next/static/chunks/([A-Za-z0-9_.~-]+\.js)', page):
        path = os.path.join(ROOT, "_next", "static", "chunks", name)
        if os.path.exists(path):
            src = open(path, encoding="utf-8").read()
            if "FAQ_CATEGORIES" in src:
                return src
    sys.exit("[help-index] FAQ_CATEGORIES chunk not found via faq/index.html")


JS_ESC = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f", "v": "\v", "0": "\0"}


def js_literal_to_json(src, start):
    """Convert the JS array literal at src[start] to JSON text. The minifier mixes
    "..." and '...' strings and leaves keys unquoted, so json.loads cannot read it raw."""
    out, depth, i = [], 0, start
    while True:
        ch = src[i]
        if ch in "\"'":
            quote, i, val = ch, i + 1, []
            while src[i] != quote:
                if src[i] == "\\":
                    nxt = src[i + 1]
                    if nxt == "u":
                        val.append(chr(int(src[i + 2:i + 6], 16)))
                        i += 6
                        continue
                    val.append(JS_ESC.get(nxt, nxt))
                    i += 2
                    continue
                val.append(src[i])
                i += 1
            out.append(json.dumps("".join(val), ensure_ascii=False))
        elif ch.isalpha() or ch == "_":
            m = re.match(r"[A-Za-z_$][\w$]*", src[i:])
            out.append(json.dumps(m.group(0)))  # bare object key
            i += len(m.group(0)) - 1
        else:
            out.append(ch)
            if ch in "[{":
                depth += 1
            elif ch in "]}":
                depth -= 1
                if depth == 0:
                    return "".join(out)
        i += 1


def faq_items():
    src = faq_chunk()
    start = src.index("[", src.index('"FAQ_CATEGORIES"'))
    cats = json.loads(js_literal_to_json(src, start))
    return [{"c": c["name"], "q": it["q"], "a": it["a"]} for c in cats for it in c["items"]]


def blog_posts():
    posts = []
    for path in sorted(glob.glob(os.path.join(ROOT, "blog", "*", "index.html"))):
        page = open(path, encoding="utf-8").read()
        title = re.search(r"<title>(.*?)</title>", page, re.S)
        desc = re.search(r'<meta name="description" content="([^"]*)"', page)
        date = re.search(r'"datePublished":\s*"([0-9-]{10})', page)
        if not title:
            continue
        slug = os.path.basename(os.path.dirname(path))
        posts.append({
            "t": html.unescape(title.group(1)).replace(" | Fewpips Blog", "").strip(),
            "d": html.unescape(desc.group(1)).strip() if desc else "",
            "u": "/blog/%s/" % slug,
            "p": date.group(1) if date else "",
        })
    return posts


def main():
    data = {"faq": faq_items(), "blog": blog_posts()}
    out = json.dumps(data, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n"
    old = open(OUT, encoding="utf-8").read() if os.path.exists(OUT) else ""
    if out == old:
        print("[help-index] fresh (%d FAQ, %d posts)" % (len(data["faq"]), len(data["blog"])))
        return 0
    if "--check" in sys.argv:
        print("[help-index] STALE - run scripts/help-index.py and commit fp-help/index.json")
        return 1
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w", encoding="utf-8").write(out)
    print("[help-index] rebuilt (%d FAQ, %d posts)" % (len(data["faq"]), len(data["blog"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
