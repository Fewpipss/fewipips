"""Add a Fewpips Telegram GROUP link (https://t.me/fewpips_traders) to the
footer, right after the existing Support Telegram icon. Also relabel the
existing icon aria-label from "Telegram" -> "Telegram Support" to
distinguish for screen readers.

Only touches the FOOTER Telegram anchor:
- 6 HTML pages (home, contact, faq, futures, legal, terms)
- 4 hydrated chunks that carry the footer JSX
  (016m.r.pztibl.js, 0he1vgjwt7klm.js, 0tg_rdy2h4ey0.js, 0uj1y.q_i1wzs.js)

Does NOT touch 16fasywtg1r_0.js because there Telegram link is a chat FAB
widget with `chat-fab--telegram` class, not the footer social row.
"""
import sys, glob, re
sys.stdout.reconfigure(encoding="utf-8")

# ============================================================
# HTML side
# ============================================================
OLD_HTML = (
    '<a href="https://t.me/FewpipsSupport" target="_blank" rel="noopener" aria-label="Telegram">'
    '<svg viewBox="0 0 24 24" fill="currentColor">'
    '<path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"></path>'
    '</svg></a>'
)

NEW_HTML = (
    # Existing support anchor with relabeled aria-label
    '<a href="https://t.me/FewpipsSupport" target="_blank" rel="noopener" aria-label="Telegram Support">'
    '<svg viewBox="0 0 24 24" fill="currentColor">'
    '<path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"></path>'
    '</svg></a>'
    # New group anchor
    '<a href="https://t.me/fewpips_traders" target="_blank" rel="noopener" aria-label="Telegram Group">'
    '<svg viewBox="0 0 24 24" fill="currentColor">'
    '<path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"></path>'
    '</svg></a>'
)

def patch_html(path):
    with open(path, "r", encoding="utf-8") as f: c = f.read()
    if 'fewpips_traders' in c:
        print(f"  {path}: already patched"); return
    n = c.count(OLD_HTML)
    if n == 0:
        print(f"  {path}: HTML anchor not found"); return
    c = c.replace(OLD_HTML, NEW_HTML)
    with open(path, "w", encoding="utf-8", newline="") as f: f.write(c)
    print(f"  {path}: patched x{n}")

# ============================================================
# Chunk side - dupe the JSX anchor with same alias
# ============================================================
def patch_chunk(path):
    with open(path, "r", encoding="utf-8") as f: c = f.read()
    if 'fewpips_traders' in c:
        print(f"  {path}: already patched"); return
    # Match: (0,X.jsx)("a",{href:"https://t.me/FewpipsSupport",target:"_blank",rel:"noopener","aria-label":"Telegram",children:(0,X.jsx)("svg",{...},...)})
    # But svg is deeply nested. Easier: find `"aria-label":"Telegram"` where preceding is FewpipsSupport, and inspect until anchor closes.
    # Strategy: match the outer anchor by tracking parens.
    marker = '"https://t.me/FewpipsSupport",target:"_blank",rel:"noopener","aria-label":"Telegram",children:'
    pos = c.find(marker)
    if pos < 0:
        print(f"  {path}: chunk marker not found"); return
    # Find the opening (0,X.jsx)("a",{ starting before this position
    # Search backwards for `(0,X.jsx)("a",{href:`
    anchor_start = c.rfind('(0,', 0, pos)
    if anchor_start < 0:
        print(f"  {path}: could not locate anchor start"); return
    # Extract the alias between `(0,` and `.jsx`
    alias_match = re.match(r'\(0,([a-zA-Z_$][a-zA-Z0-9_$]*)\.jsx', c[anchor_start:anchor_start+30])
    if not alias_match:
        print(f"  {path}: could not extract alias"); return
    alias = alias_match.group(1)
    # Now find the closing of this anchor: track parens starting from anchor_start's opening (
    # The pattern is (0,X.jsx)("a",{...})
    # After anchor_start, find first `(`. That's the outermost of the jsx call.
    call_open = c.find('(', anchor_start + 3)  # skip past `(0,`
    # Actually jsx call is (0,X.jsx)("a",{...}) - the outer paren is at anchor_start
    # Skip the first `(...)` group which is (0,X.jsx). Track from the SECOND `(` which starts the arg tuple.
    first_paren_close = c.find(')', anchor_start)
    if first_paren_close < 0:
        print(f"  {path}: no first paren close"); return
    args_open = c.find('(', first_paren_close)
    if args_open < 0:
        print(f"  {path}: no args paren open"); return
    depth = 0
    end = None
    for i in range(args_open, len(c)):
        ch = c[i]
        if ch == '(': depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        print(f"  {path}: could not find anchor end"); return
    old_anchor = c[anchor_start:end]
    # Sanity check
    if 'FewpipsSupport' not in old_anchor or 'svg' not in old_anchor:
        print(f"  {path}: extracted anchor invalid"); return
    # Build new: existing anchor with aria-label -> "Telegram Support", then comma + new group anchor
    support_anchor = old_anchor.replace('"aria-label":"Telegram"', '"aria-label":"Telegram Support"', 1)
    group_anchor = old_anchor.replace('"https://t.me/FewpipsSupport"', '"https://t.me/fewpips_traders"', 1).replace('"aria-label":"Telegram"', '"aria-label":"Telegram Group"', 1)
    new_anchor = support_anchor + ',' + group_anchor
    c = c[:anchor_start] + new_anchor + c[end:]
    with open(path, "w", encoding="utf-8", newline="") as f: f.write(c)
    print(f"  {path}: patched (alias={alias}, len +{len(new_anchor)-len(old_anchor)})")

# ============================================================
# Run
# ============================================================
HTML = ["index.html", "contact/index.html", "faq/index.html",
        "futures/index.html", "legal/index.html", "terms/index.html"]
CHUNKS = ["_next/static/chunks/016m.r.pztibl.js",
          "_next/static/chunks/0he1vgjwt7klm.js",
          "_next/static/chunks/0tg_rdy2h4ey0.js",
          "_next/static/chunks/0uj1y.q_i1wzs.js"]

print("--- HTML ---")
for p in HTML: patch_html(p)
print("--- CHUNKS ---")
for p in CHUNKS: patch_chunk(p)
print("Done.")
