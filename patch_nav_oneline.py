"""Force nav into one row across desktop widths.

The previous tightening was not enough. On medium desktop widths "How It
Works" and "Log In" wrap to 2 lines.

Fix:
1. white-space:nowrap on every nav link/button (prevents 2-line wraps)
2. Further reduce padding on nav-c links and nav-cta
3. Reduce nav-login padding
4. Reduce nav .c container side padding so nav-r touches the right edge
"""
import sys
sys.stdout.reconfigure(encoding="utf-8")

CSS = r"C:\Users\Korisnik\AppData\Local\Temp\fewipips-latest\_next\static\chunks\02xahk5pcwh-8.css"

with open(CSS, "r", encoding="utf-8") as f:
    c = f.read()

# 1) nav-c a: pad 7px 14px -> 6px 9px + nowrap + smaller font
OLD1 = '.nav-c a{color:var(--t3);transition:all .3s var(--ease);border-radius:8px;padding:7px 14px;font-size:.82rem;font-weight:500}'
NEW1 = '.nav-c a{color:var(--t3);transition:all .3s var(--ease);border-radius:8px;padding:6px 9px;font-size:.78rem;font-weight:500;white-space:nowrap}'

# 2) nav-login: pad 7px 14px -> 6px 8px + nowrap
OLD2 = '.nav-login{color:var(--t3);padding:7px 14px;font-size:.82rem;font-weight:500;transition:color .3s}'
NEW2 = '.nav-login{color:var(--t3);padding:6px 8px;font-size:.78rem;font-weight:500;transition:color .3s;white-space:nowrap}'

# 3) nav-cta: pad 9px 20px -> 8px 14px + nowrap
OLD3 = '.nav-cta{background:var(--grad);color:#000;transition:all .4s var(--ease);letter-spacing:.01em;border-radius:9px;padding:9px 20px;font-size:.8rem;font-weight:700}'
NEW3 = '.nav-cta{background:var(--grad);color:#000;transition:all .4s var(--ease);letter-spacing:.01em;border-radius:9px;padding:8px 14px;font-size:.78rem;font-weight:700;white-space:nowrap}'

# 4) nav-toggle a: already 6px 11px; add nowrap
OLD4 = '.nav-toggle a{transition:all .3s var(--ease);color:var(--t3);letter-spacing:.01em;border-radius:100px;font-size:.78rem;font-weight:600;padding:6px 11px!important}'
NEW4 = '.nav-toggle a{transition:all .3s var(--ease);color:var(--t3);letter-spacing:.01em;border-radius:100px;font-size:.78rem;font-weight:600;padding:6px 11px!important;white-space:nowrap}'

# 5) nav-c: ensure flex-wrap stays nowrap (default for flex is nowrap, but be explicit)
OLD5 = '.nav-c{align-items:center;gap:2px;list-style:none;display:flex}'
NEW5 = '.nav-c{align-items:center;gap:2px;list-style:none;display:flex;flex-wrap:nowrap}'

REPLACEMENTS = [(OLD1, NEW1), (OLD2, NEW2), (OLD3, NEW3), (OLD4, NEW4), (OLD5, NEW5)]

for i, (old, new) in enumerate(REPLACEMENTS, 1):
    n = c.count(old)
    if n != 1:
        print(f"  [{i}] anchor count={n} (expected 1): {old[:80]}")
        continue
    c = c.replace(old, new, 1)
    print(f"  [{i}] replaced")

# 6) Append nav-in container override: reduce left/right padding so nav-r touches right edge.
# .c has padding 0 28px; override only inside .nav with a tighter value.
OVERRIDE = '.nav .c{padding:0 16px}.nav-c li{white-space:nowrap}'
if OVERRIDE not in c:
    c = c + OVERRIDE
    print("  [6] appended .nav .c padding override + li nowrap")

with open(CSS, "w", encoding="utf-8", newline="") as f:
    f.write(c)
print(f"CSS written ({len(c)} bytes)")
