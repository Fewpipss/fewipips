"""Doc-driven FAQ + page edits. Replaces existing answers with doc's
text, appends only truly new Q&As. Edits both faq/index.html and the
FAQ chunk _next/static/chunks/0tg_rdy2h4ey0.js word-for-word."""
import os, sys, re, json
sys.stdout.reconfigure(encoding="utf-8")

ROOT = r"C:\Users\Korisnik\AppData\Local\Temp\fewipips-latest"
FAQ_HTML = os.path.join(ROOT, "faq", "index.html")
FAQ_CHUNK = os.path.join(ROOT, "_next", "static", "chunks", "0tg_rdy2h4ey0.js")
HOME_HTML = os.path.join(ROOT, "index.html")
FUTURES_HTML = os.path.join(ROOT, "futures", "index.html")

# (Question, NewAnswer) - replace existing answer wherever the question appears.
REPLACE_QA = [
    # Challenges & rules
    ("What are the core rules for the 1-Step Challenge?",
     "10% profit target, 4% daily loss limit, 6%–10% max loss (account size-dependent), 2-5 trading days minimum (account size-dependent), EAs allowed with pre-approval."),
    ("What's the difference between Daily Loss Limit and Maximum Loss Limit?",
     "Daily Loss is a per-day cap that resets at 00:00 server time. Maximum Loss is a trailing drawdown based on your highest point of equity."),
    ("What happens if I breach a loss limit?",
     "If you breach your daily loss limit your account is automatically paused until the server resets. If you breach your daily loss limit twice within 7 days, you will breach your account and it will be closed. If you breach your Maximum loss limit your account is automatically closed."),
    ("Am I permitted to use a VPN or VPS?",
     "Yes. You are permitted to use VPN as long as the IP address is not from a restricted jurisdiction. Traders are welcome to use a VPN across all Fewpips Challenge and Funded accounts. For VPS, you must purchase the Add-on at the time of purchasing your account. This cannot be added after purchase."),
    ("Are Expert Advisors (EAs) allowed?",
     "Yes. Fewpips supports EAs provided they comply with our ethical trading standards. Prior approval required. If you wish to use an EA, please email support@fewpips.com outlining your strategy."),
    ("Which trading activities are strictly prohibited?",
     "Please visit https://www.fewpips.com/legal to view all prohibited activities."),
    # Instant accounts
    ("What's the Instant profit split?",
     "Tier 1 Split: 70% – First 3 successful withdrawals. Tier 2 Split: 80% – Next 3 successful withdrawals. Tier 3 Split: 90% – After 6 consecutive withdrawals."),
    ("How much does each Instant account cost?",
     "$3K = $79, $5K = $149, $10K = $239, $25K = $549, $50K = $999."),
    ("What rules apply on Instant accounts?",
     "5–10% max loss (size-dependent), 2–5 minimum trading days, 40% consistency rule. To ensure you are compliant with all rules, please visit https://www.fewpips.com/legal."),
    ("Is there a passing reward for Instant?",
     "There is no passing reward for instant accounts as it is instantly funded."),
    # Payouts & funded accounts
    ("How long does payout processing take?",
     "We strive to authorise and process all withdrawal requests within 24 hours or less."),
    ("When can I request a payout?",
     "You must be in profit, meet the minimum trading days (depending on your account and size), complete the designated cycle, and adhere to all rules. To ensure you are compliant with all rules, please visit https://www.fewpips.com/legal."),
    ("What payout methods are supported?",
     "Our payout method is cryptocurrency and the following cryptos can be selected when withdrawing: USDT (ERC20 Network), USDC (ERC20 Network) and BTC. Minimum withdrawal $50 USD."),
    ("When do I complete KYC?",
     "Identity verification must be completed before you purchase an account with Fewpips if you are paying with Credit/Debit card. If you are purchasing a challenge with cryptocurrency, KYCs are not required."),
    # Futures
    ("What is the minimum withdrawal on Futures?",
     "$100 USD per request. Payouts processed in USDT (ERC20 Network), USDC (ERC20 Network) and BTC."),
    ("What is Fewpips Futures?",
     "Fewpips Futures is our Futures-based CFD program — trade 41 instruments across indices, metals, energies, agricultural commodities, European bonds, and volatility products with no overnight swap fees. Payouts as fast as every 5 business days on 1-Step, every 14 days or grow your account by 5% or more for an on-demand payout on an Instant Account."),
    ("What are Fewpips Futures?",
     "Fewpips Futures is our Futures-based CFD program — trade 41 instruments across indices, metals, energies, agricultural commodities, European bonds, and volatility products with no overnight swap fees. Payouts as fast as every 5 business days on 1-Step, every 14 days or grow your account by 5% or more for an on-demand payout on an Instant Account."),
]

# Brand new Q&A to APPEND to a specific category (Q, A, category_name)
APPEND_QA = [
    ("Are there withdrawal fees?",
     "Fewpips does charge 3% withdrawal fees on the total withdrawal amount.",
     "Affiliate program"),
]

# ============================================================
# 1) FAQ chunk: replace existing answers + append new
# ============================================================
def patch_faq_chunk():
    with open(FAQ_CHUNK, "r", encoding="utf-8") as f:
        c = f.read()
    changed = False

    # Replace existing q+a pairs (pattern: {q:"...",a:"..."})
    for q, new_a in REPLACE_QA:
        # Locate {q:"<q>",a:"<old_a>"}
        # The pattern matches the q literal (JSON-style escaped), then captures the a value (anything not unescaped quote)
        # Escape q for JS string
        q_js = q.replace('\\', '\\\\').replace('"', '\\"')
        new_a_js = new_a.replace('\\', '\\\\').replace('"', '\\"')
        pattern = re.compile(r'\{q:"' + re.escape(q_js) + r'",a:"((?:[^"\\]|\\.)*)"\}', re.DOTALL)
        m = pattern.search(c)
        if not m:
            print(f"  CHUNK: not found Q '{q[:50]}'")
            continue
        old_a = m.group(1)
        if old_a == new_a_js:
            continue  # already up to date
        c = c[:m.start()] + f'{{q:"{q_js}",a:"{new_a_js}"}}' + c[m.end():]
        changed = True
        print(f"  CHUNK: updated '{q[:50]}'")

    # Append new Q&As to category
    for q, a, cat in APPEND_QA:
        if q in c:
            continue
        # Find category opening: name:"<cat>",items:[ ... ]
        anchor = f'name:"{cat}",items:['
        i = c.find(anchor)
        if i < 0:
            print(f"  CHUNK: category not found '{cat}'")
            continue
        start = i + len(anchor)
        depth = 1; j = start
        while j < len(c) and depth > 0:
            ch = c[j]
            if ch == '[': depth += 1
            elif ch == ']': depth -= 1
            j += 1
        close = j - 1
        q_js = q.replace('"', '\\"')
        a_js = a.replace('"', '\\"')
        c = c[:close] + ',' + f'{{q:"{q_js}",a:"{a_js}"}}' + c[close:]
        changed = True
        print(f"  CHUNK: appended '{q[:50]}' to {cat}")

    if changed:
        with open(FAQ_CHUNK, "w", encoding="utf-8", newline="") as f:
            f.write(c)
        print(f"  FAQ chunk written ({len(c)} bytes)")

# ============================================================
# 2) FAQ HTML: replace existing answers + append new
# ============================================================
def esc_html(s):
    return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("'","&#x27;")

def linkify(s):
    return re.sub(r'(https?://[^\s<&]+)', r'<a href="\1">\1</a>', s)

def faq_item_html(q, a):
    a_inner = linkify(esc_html(a))
    return (
        '<div class="faq-item">'
        f'<button class="faq-q">{esc_html(q)}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>'
        f'<div class="faq-a"><p>{a_inner}</p></div>'
        '</div>'
    )

def patch_faq_html():
    with open(FAQ_HTML, "r", encoding="utf-8") as f:
        h = f.read()
    changed = False

    # Replace existing answers: find faq-q with question, then replace <p> inside next faq-a
    for q, new_a in REPLACE_QA:
        q_html = esc_html(q)
        anchor = f'<button class="faq-q">{q_html}<svg'
        i = h.find(anchor)
        if i < 0:
            # Try alternative encodings
            anchor2 = f'<button class="faq-q">{q.replace("&","&amp;").replace("&#x27;","&#x27;")}<svg'
            i = h.find(anchor2)
        if i < 0:
            print(f"  HTML: not found Q '{q[:50]}'")
            continue
        # Find next <p>...</p>
        p_start = h.find('<p>', i)
        p_end = h.find('</p>', p_start) if p_start >= 0 else -1
        if p_start < 0 or p_end < 0:
            print(f"  HTML: <p> not found after Q '{q[:50]}'")
            continue
        new_p_inner = linkify(esc_html(new_a))
        if h[p_start+3:p_end] == new_p_inner:
            continue
        h = h[:p_start+3] + new_p_inner + h[p_end:]
        changed = True
        print(f"  HTML: updated '{q[:50]}'")

    # Append new Q&As to category in HTML
    for q, a, cat in APPEND_QA:
        if q in h:
            continue
        marker = f'<h2 class="faq-cat-name">{cat}</h2>'
        i = h.find(marker)
        if i < 0:
            cat_alt = cat.replace("&","&amp;")
            marker = f'<h2 class="faq-cat-name">{cat_alt}</h2>'
            i = h.find(marker)
        if i < 0:
            print(f"  HTML: category not found '{cat}'")
            continue
        list_start = h.find('<div class="faq-list">', i)
        if list_start < 0: continue
        # Walk balanced divs
        depth = 0
        j = list_start
        while j < len(h):
            if h.startswith('<div', j):
                depth += 1
                j = h.find('>', j) + 1
            elif h.startswith('</div>', j):
                depth -= 1
                if depth == 0:
                    h = h[:j] + faq_item_html(q, a) + h[j:]
                    changed = True
                    print(f"  HTML: appended '{q[:50]}' to {cat}")
                    break
                j += 6
            else:
                j += 1

    if changed:
        with open(FAQ_HTML, "w", encoding="utf-8", newline="") as f:
            f.write(h)
        print(f"  FAQ HTML written ({len(h)} bytes)")

# ============================================================
# 3) Home + Futures post-hydration injection (disclaimer + leverage + center CTA)
# ============================================================
DISCLAIMER_HTML_RAW = (
    'Please read our <a href="https://www.fewpips.com/legal">Trading Rules</a> '
    'and <a href="https://www.fewpips.com/terms">Terms &amp; Conditions</a> '
    'before placing your first trade. It is your responsibility as the account holder '
    'to understand and comply with the Fewpips rules under which your account is evaluated.'
)

INJECT_TEMPLATE = (
    '<style id="doc-patch-css">'
    '.cmp-disclaimer-doc{font-size:13px;color:rgba(255,255,255,.55);text-align:center;max-width:880px;margin:20px auto 0;padding:0 24px;line-height:1.55}'
    '.cmp-disclaimer-doc a{color:rgba(255,255,255,.78);text-decoration:underline}'
    '.cmp-disclaimer-doc a:hover{color:#fff}'
    '.ready-prove-center{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}'
    '.ready-prove-center > *{margin-left:auto;margin-right:auto}'
    '</style>'
    '<script id="doc-patch-js">'
    '(function(){'
    'var TEXT=' + json.dumps(DISCLAIMER_HTML_RAW) + ';'
    'function addDisclaimer(){'
    'if(document.querySelector(".cmp-disclaimer-doc"))return;'
    'var wrap=document.querySelector(".cmp-table-wrap")||document.querySelector(".cfg-body");'
    'if(!wrap)return;'
    'var p=document.createElement("p");p.className="cmp-disclaimer-doc";p.innerHTML=TEXT;'
    'var parent=wrap.closest(".c")||wrap.parentNode;'
    'parent.appendChild(p)}'
    'function addLeverage(){'
    'document.querySelectorAll(".cfg-body ul.rules").forEach(function(ul){'
    'if(ul.querySelector(".rules-leverage-doc"))return;'
    'var has=false;'
    'ul.querySelectorAll("li .rn").forEach(function(rn){if(/leverage/i.test(rn.textContent))has=true});'
    'if(has)return;'
    'var li=document.createElement("li");li.className="rules-leverage-doc";'
    'li.innerHTML="<span class=\\"rn\\">Leverage</span><span class=\\"rv\\">1:20</span>";'
    'ul.appendChild(li)})}'
    'function centerReady(){'
    'var sec=document.querySelector(".fcta, section.fcta");'
    'if(sec){sec.classList.add("ready-prove-center");var c=sec.querySelector(".c, .container");if(c)c.classList.add("ready-prove-center")}'
    'document.querySelectorAll("h2,h3").forEach(function(h){'
    'if(/ready to prove your edge/i.test(h.textContent)){'
    'var p=h.closest("section, .fcta, .cta-section");'
    'if(p){p.classList.add("ready-prove-center")}}})}'
    'function go(opts){'
    'if(opts && opts.lev)addLeverage();'
    'addDisclaimer();'
    'centerReady()}'
    'var IS_FUTURES=' + json.dumps('FUTURES_FLAG') + ';'
    'var opts={lev:IS_FUTURES==="1"};'
    'if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",function(){setTimeout(function(){go(opts)},500)})}'
    'else{setTimeout(function(){go(opts)},500)}'
    'var obs=new MutationObserver(function(){go(opts)});'
    'obs.observe(document.body,{childList:true,subtree:true});'
    'setInterval(function(){go(opts)},2500);'
    '})();</script>'
)

def patch_page(path, is_futures):
    with open(path, "r", encoding="utf-8") as f:
        h = f.read()
    if "doc-patch-css" in h:
        print(f"  {os.path.basename(os.path.dirname(path)) or 'HOME'}: already patched")
        return
    inject = INJECT_TEMPLATE.replace(json.dumps('FUTURES_FLAG'), json.dumps('1' if is_futures else '0'))
    h = h.replace("</body>", inject + "</body>", 1)
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(h)
    print(f"  {os.path.basename(os.path.dirname(path)) or 'HOME'} patched ({len(h)} bytes)")

# Run
patch_faq_chunk()
patch_faq_html()
patch_page(HOME_HTML, is_futures=False)
patch_page(FUTURES_HTML, is_futures=True)
print("Done.")
