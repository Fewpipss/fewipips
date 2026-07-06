"""Tighten nav spacing so Rules link fits in one row.

- nav-toggle a padding 6px 16px -> 6px 11px (tighter Resources group)
- nav-c gap 4 -> 2
- nav-r gap 10 -> 6 (Log In + Get Funded cluster tighter on right edge)

Edits the CSS chunk in place (single source for all pages)."""
import sys
sys.stdout.reconfigure(encoding="utf-8")

CSS = r"C:\Users\Korisnik\AppData\Local\Temp\fewipips-latest\_next\static\chunks\02xahk5pcwh-8.css"

with open(CSS, "r", encoding="utf-8") as f:
    c = f.read()

if "padding:6px 11px!important" in c:
    print("CSS: already tightened"); sys.exit(0)

REPLACEMENTS = [
    # nav-toggle inner link padding (the Resources group: FAQ/Contact/Terms/Rules)
    ('.nav-toggle a{transition:all .3s var(--ease);color:var(--t3);letter-spacing:.01em;border-radius:100px;font-size:.78rem;font-weight:600;padding:6px 16px!important}',
     '.nav-toggle a{transition:all .3s var(--ease);color:var(--t3);letter-spacing:.01em;border-radius:100px;font-size:.78rem;font-weight:600;padding:6px 11px!important}'),
    # nav-c gap
    ('.nav-c{align-items:center;gap:4px;list-style:none;display:flex}',
     '.nav-c{align-items:center;gap:2px;list-style:none;display:flex}'),
    # nav-r gap (Log In + Get Funded gap)
    ('.nav-r{align-items:center;gap:10px;display:flex}',
     '.nav-r{align-items:center;gap:6px;display:flex}'),
]

for old, new in REPLACEMENTS:
    n = c.count(old)
    if n != 1:
        print(f"  anchor count={n}, expected 1 for: {old[:60]}...")
        continue
    c = c.replace(old, new, 1)
    print(f"  replaced: {old[:60]}...")

with open(CSS, "w", encoding="utf-8", newline="") as f:
    f.write(c)
print(f"CSS written ({len(c)} bytes)")
