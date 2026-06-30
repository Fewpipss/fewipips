"""Direct surgical edits for home disclaimer + futures leverage/disclaimer.
No JS injection, no post-hydration tricks. Edits BOTH body HTML AND
the React chunk so hydration preserves the additions."""
import os, sys, re
sys.stdout.reconfigure(encoding="utf-8")

ROOT = r"C:\Users\Korisnik\AppData\Local\Temp\fewipips-latest"
HOME = os.path.join(ROOT, "index.html")
FUTURES = os.path.join(ROOT, "futures", "index.html")
HOME_CHUNK = os.path.join(ROOT, "_next", "static", "chunks", "0fvh0xh4dp8wq.js")
FUT_CHUNK = os.path.join(ROOT, "_next", "static", "chunks", "0uj1y.q_i1wzs.js")

DISCLAIMER_PLAIN = (
    "Please read our Trading Rules (https://www.fewpips.com/legal) "
    "and Terms & Conditions (https://www.fewpips.com/terms) before placing your first trade. "
    "It is your responsibility as the account holder to understand and comply with the "
    "Fewpips rules under which your account is evaluated."
)

DISCLAIMER_HTML_LINKS = (
    'Please read our <a href="https://www.fewpips.com/legal">Trading Rules</a> '
    'and <a href="https://www.fewpips.com/terms">Terms &amp; Conditions</a> '
    'before placing your first trade. It is your responsibility as the account holder '
    'to understand and comply with the Fewpips rules under which your account is evaluated.'
)

DISCLAIMER_CSS = (
    '<style id="cmp-disclaimer-css">'
    '.cmp-disclaimer-doc{font-size:11px;color:rgba(255,255,255,.45);text-align:left;margin:18px 0 0;padding:0;line-height:1.5;max-width:none}'
    '.cmp-disclaimer-doc a{color:rgba(255,255,255,.6);text-decoration:underline}'
    '.cmp-disclaimer-doc a:hover{color:#fff}'
    '</style>'
)

# ============================================================
# HOME: disclaimer below cmp-note
# ============================================================
def patch_home():
    with open(HOME, "r", encoding="utf-8") as f:
        h = f.read()
    with open(HOME_CHUNK, "r", encoding="utf-8") as f:
        c = f.read()

    # 1) Add CSS in <head> (once)
    if "cmp-disclaimer-css" not in h:
        h = h.replace("</head>", DISCLAIMER_CSS + "</head>", 1)

    # 2) Body HTML: insert disclaimer p after cmp-note p
    if 'class="cmp-disclaimer-doc"' not in h:
        old_close = '</p></div></section><div class="dv" aria-hidden="true"></div><section class="sec faq"'
        new_close = f'</p><p class="cmp-disclaimer-doc">{DISCLAIMER_HTML_LINKS}</p></div></section><div class="dv" aria-hidden="true"></div><section class="sec faq"'
        if old_close in h:
            h = h.replace(old_close, new_close, 1)
            print("  HOME HTML: disclaimer p inserted")
        else:
            print("  HOME HTML: anchor not found, skipped body insertion")

    # 3) Chunk: insert disclaimer as sibling jsx after cmp-note
    if 'cmp-disclaimer-doc' not in c:
        # Find unique end: events."})] (1-Step branch terminal)
        anchor = 'events."})]'
        if c.count(anchor) == 1:
            disclaimer_js = (
                ',(0,a.jsx)("p",{className:"cmp-disclaimer-doc",children:'
                + repr(DISCLAIMER_PLAIN).replace("'", '"')
                + '})'
            )
            c = c.replace(anchor, 'events."})' + disclaimer_js + ']', 1)
            print("  HOME CHUNK: disclaimer sibling jsx inserted")
        else:
            print(f"  HOME CHUNK: anchor count={c.count(anchor)} - skipped")

    with open(HOME, "w", encoding="utf-8", newline="") as f:
        f.write(h)
    with open(HOME_CHUNK, "w", encoding="utf-8", newline="") as f:
        f.write(c)

# ============================================================
# FUTURES: leverage row in rules arrays + disclaimer below table
# ============================================================
def patch_futures():
    with open(FUTURES, "r", encoding="utf-8") as f:
        h = f.read()
    with open(FUT_CHUNK, "r", encoding="utf-8") as f:
        c = f.read()

    # 1) CSS in <head>
    if "cmp-disclaimer-css" not in h:
        h = h.replace("</head>", DISCLAIMER_CSS + "</head>", 1)

    # 2) Chunk: add Leverage entry to rules arrays.
    # Insert BEFORE {name:"EAs"...} in each rules array
    if 'name:"Leverage",value:"1:20"' not in c:
        new_entry = '{name:"Leverage",value:"1:20",highlight:!0},{name:"EAs"'
        old_target = '{name:"EAs"'
        before_count = c.count(old_target)
        c = c.replace(old_target, new_entry)
        after_count = c.count('name:"Leverage",value:"1:20"')
        print(f"  FUT CHUNK: leverage entry added {after_count}x (EAs occurrences was {before_count})")

    # 3) Body HTML: add Leverage li before EAs li in rules ul
    leverage_li = '<li><span class="rn">Leverage</span><span class="rv g">1:20</span></li>'
    if leverage_li not in h:
        # Replace EAs li to be preceded by Leverage li
        eas_pattern = '<li><span class="rn">EAs</span>'
        cnt = h.count(eas_pattern)
        h = h.replace(eas_pattern, leverage_li + eas_pattern)
        print(f"  FUT HTML: leverage li inserted {cnt}x")

    # 4) HTML: disclaimer below pricing area. Find a stable anchor:
    # Look for the end of cfg pricing section. The cfg section is `<section class="cfg" id="...">`
    # Find next `</section>` after `cfg-body`
    if 'cmp-disclaimer-doc' not in h:
        # Anchor after the cfg section close
        # Use unique substring: closing of <section class="cfg" id="pricing">
        # Find first <section class="cfg"
        cfg_open = h.find('<section class="cfg"')
        if cfg_open >= 0:
            # Walk to find matching </section> - simple approach since no nested sections inside cfg typically
            cfg_close_pos = h.find('</section>', cfg_open)
            if cfg_close_pos >= 0:
                insert_at = cfg_close_pos  # before </section>
                disclaimer_p = f'<p class="cmp-disclaimer-doc">{DISCLAIMER_HTML_LINKS}</p>'
                h = h[:insert_at] + disclaimer_p + h[insert_at:]
                print("  FUT HTML: disclaimer p inserted before cfg </section>")
            else:
                print("  FUT HTML: cfg </section> close not found")
        else:
            print("  FUT HTML: cfg section not found")

    # 5) Chunk: mirror disclaimer in futures cfg JSX (find suitable place)
    # The cfg renders rules + price. To not over-engineer, skip chunk-side mirror
    # for futures disclaimer; rely on HTML + observer if React wipes.
    # NOTE: If React removes, will need to also patch the cfg jsx structure.

    with open(FUTURES, "w", encoding="utf-8", newline="") as f:
        f.write(h)
    with open(FUT_CHUNK, "w", encoding="utf-8", newline="") as f:
        f.write(c)

patch_home()
patch_futures()
print("Done.")
