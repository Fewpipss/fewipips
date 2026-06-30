"""Add 'Rules' link to top header next to 'Terms', linking to /legal.

Per Nick's request 2026-06-30 20:07. Edits BOTH HTML pages (SSR) and the
nav chunk 16fasywtg1r_0.js (client hydration) word-for-word."""
import os, sys, glob, re
sys.stdout.reconfigure(encoding="utf-8")

ROOT = r"C:\Users\Korisnik\AppData\Local\Temp\fewipips-latest"
CHUNK = os.path.join(ROOT, "_next", "static", "chunks", "16fasywtg1r_0.js")

HTML_FILES = [
    "404/index.html", "404.html", "contact/index.html", "faq/index.html",
    "futures/index.html", "index.html", "legal/index.html",
    "terms/index.html", "_not-found/index.html",
]

# HTML: insert Rules link after Terms in each nav-toggle group.
# Two variants in body: nav-toggle (desktop) and nav-toggle nav-toggle--mm (mobile).
# Both end with `<a href="/terms" class="">Terms</a></div>` - we insert before </div>.
OLD_TERMS_LINK = '<a href="/terms" class="">Terms</a></div>'
NEW_TERMS_LINK = '<a href="/terms" class="">Terms</a><a href="/legal" class="">Rules</a></div>'

# On /terms page, Terms link has class="active"
OLD_TERMS_LINK_ACTIVE = '<a href="/terms" class="active">Terms</a></div>'
NEW_TERMS_LINK_ACTIVE = '<a href="/terms" class="active">Terms</a><a href="/legal" class="">Rules</a></div>'

# Chunk: two variants
# 1) Desktop: ...children:"Terms"})]})})]}),(0,r.jsxs)("div",{className:"nav-r"
# 2) Mobile (with onClick): ...children:"Terms"})]}),(0,r.jsx)("a",{href:"https://crm.fewpips.com/auth/signin",onClick:p
CHUNK_OLD_1 = ',(0,r.jsx)("a",{href:"/terms",className:d?"active":"",children:"Terms"})]})})]})'
CHUNK_NEW_1 = ',(0,r.jsx)("a",{href:"/terms",className:d?"active":"",children:"Terms"}),(0,r.jsx)("a",{href:"/legal",className:"",children:"Rules"})]})})]})'

CHUNK_OLD_2 = ',(0,r.jsx)("a",{href:"/terms",className:d?"active":"",onClick:p,children:"Terms"})]})'
CHUNK_NEW_2 = ',(0,r.jsx)("a",{href:"/terms",className:d?"active":"",onClick:p,children:"Terms"}),(0,r.jsx)("a",{href:"/legal",onClick:p,children:"Rules"})]})'

def patch_html(rel):
    p = os.path.join(ROOT, rel.replace("/", os.sep))
    if not os.path.exists(p):
        print(f"  {rel}: missing, skip"); return
    with open(p, "r", encoding="utf-8") as f:
        h = f.read()
    if 'href="/legal" class="">Rules' in h:
        print(f"  {rel}: already patched"); return
    cnt = h.count(OLD_TERMS_LINK)
    cnt_a = h.count(OLD_TERMS_LINK_ACTIVE)
    if cnt + cnt_a == 0:
        print(f"  {rel}: TERMS LINK NOT FOUND"); return
    if cnt:
        h = h.replace(OLD_TERMS_LINK, NEW_TERMS_LINK)
    if cnt_a:
        h = h.replace(OLD_TERMS_LINK_ACTIVE, NEW_TERMS_LINK_ACTIVE)
    cnt = cnt + cnt_a
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(h)
    print(f"  {rel}: patched x{cnt}")

def patch_chunk():
    with open(CHUNK, "r", encoding="utf-8") as f:
        c = f.read()
    if '"/legal",className:"",children:"Rules"' in c or '"/legal",onClick:p,children:"Rules"' in c:
        print("  CHUNK: already patched"); return
    n1 = c.count(CHUNK_OLD_1)
    n2 = c.count(CHUNK_OLD_2)
    if n1 != 1:
        print(f"  CHUNK: desktop anchor count={n1} (expected 1)"); return
    if n2 != 1:
        print(f"  CHUNK: mobile anchor count={n2} (expected 1)"); return
    c = c.replace(CHUNK_OLD_1, CHUNK_NEW_1, 1)
    c = c.replace(CHUNK_OLD_2, CHUNK_NEW_2, 1)
    with open(CHUNK, "w", encoding="utf-8", newline="") as f:
        f.write(c)
    print(f"  CHUNK: desktop+mobile patched ({len(c)} bytes)")

for rel in HTML_FILES:
    patch_html(rel)
patch_chunk()
print("Done.")
