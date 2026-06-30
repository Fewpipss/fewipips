"""Add 'Same-account hedging' as a prohibited activity on /legal.

Inserts a new <li> with full description right BEFORE every existing
'Hedging between...' entry, plus appends to the Section 2 paragraph
form. /legal is server-rendered per CLAUDE.md (no chunk to update)."""
import os, sys
sys.stdout.reconfigure(encoding="utf-8")

LEGAL = r"C:\Users\Korisnik\AppData\Local\Temp\fewipips-latest\legal\index.html"

NEW_LI = (
    '<li><strong>Same-account hedging</strong> &mdash; '
    'Holding simultaneously opposing positions (both long and short) on the same symbol within a single account is prohibited. '
    'This includes directly offsetting positions and partial hedges intended to lock equity, neutralise drawdown, or game profit-target/loss-limit rules.'
    '</li>'
)

SIMPLE_ANCHOR = '<li>Hedging between multiple accounts</li>'
DETAILED_ANCHOR = '<li>Hedging between accounts (within Fewpips or across firms)</li>'

# Section 2 paragraph rewrite: insert "same-account hedging" between
# "extreme martingale/grid strategies, one-sided betting," and
# "hedging between accounts,".
PARA_OLD = (
    'Strictly forbidden: latency &amp; arbitrage, HFT &amp; system abuse, '
    'copy trading, group coordination, extreme martingale/grid strategies, '
    'one-sided betting, hedging between accounts, feed exploitation, '
    'multiple IPs without justification, account sharing or sale.'
)
PARA_NEW = (
    'Strictly forbidden: latency &amp; arbitrage, HFT &amp; system abuse, '
    'copy trading, group coordination, extreme martingale/grid strategies, '
    'one-sided betting, <strong>same-account hedging</strong> (holding '
    'simultaneously opposing positions on the same symbol within a single '
    'account, including partial hedges intended to lock equity, neutralise '
    'drawdown, or game profit-target/loss-limit rules), hedging between '
    'accounts, feed exploitation, multiple IPs without justification, '
    'account sharing or sale.'
)

with open(LEGAL, "r", encoding="utf-8") as f:
    h = f.read()

if "Same-account hedging" in h:
    print("  LEGAL: already patched"); sys.exit(0)

# Insert before each simple anchor
n1 = h.count(SIMPLE_ANCHOR)
h = h.replace(SIMPLE_ANCHOR, NEW_LI + SIMPLE_ANCHOR)
print(f"  LEGAL: inserted before SIMPLE_ANCHOR x{n1}")

# Insert before detailed anchor
n2 = h.count(DETAILED_ANCHOR)
h = h.replace(DETAILED_ANCHOR, NEW_LI + DETAILED_ANCHOR)
print(f"  LEGAL: inserted before DETAILED_ANCHOR x{n2}")

# Rewrite section 2 paragraph
if PARA_OLD in h:
    h = h.replace(PARA_OLD, PARA_NEW, 1)
    print("  LEGAL: section-2 paragraph rewritten")
else:
    print("  LEGAL: section-2 paragraph anchor not found")

with open(LEGAL, "w", encoding="utf-8", newline="") as f:
    f.write(h)

# Verify gate still GREEN - mll-uncapped check needs "highest balance" in legal
import subprocess
print(f"  LEGAL written ({len(h)} bytes)")
