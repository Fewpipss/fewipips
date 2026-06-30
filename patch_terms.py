"""Insert Communications & Public Conduct as new section 12 in terms.
Edits both terms/index.html AND _next/static/chunks/0he1vgjwt7klm.js
(both word-for-word to survive React hydration).
Renumbers existing 'Contact' (12) -> 13."""
import os, sys
sys.stdout.reconfigure(encoding="utf-8")

HTML = r"C:\Users\Korisnik\AppData\Local\Temp\fewipips-latest\terms\index.html"
CHUNK = r"C:\Users\Korisnik\AppData\Local\Temp\fewipips-latest\_next\static\chunks\0he1vgjwt7klm.js"

# --- HTML insertion ---
NEW_HTML_SECTION = (
    '<h3>12. Communications &amp; Public Conduct</h3>'
    '<p>We welcome honest feedback about your experience with Fewpips, including critical reviews, and we will never penalise you for sharing a genuine opinion.</p>'
    '<p>The following conduct is prohibited and may, where it is unlawful, result in suspension or termination of your account and/or the pursuit of legal remedies:</p>'
    '<p>(a) publishing statements of fact about Fewpips, its staff, or its services that you know to be false, or that are made with reckless disregard for their truth, where such statements are defamatory or cause demonstrable harm to the firm;</p>'
    '<p>(b) abusive, threatening, harassing, or discriminatory communications directed at Fewpips staff, whether made privately or on any public platform, review site, or social media channel;</p>'
    '<p>(c) impersonating Fewpips or any member of its team, or publishing the private or confidential information of any Fewpips employee or representative; and</p>'
    '<p>(d) coordinated, repeated, or malicious activity intended to harass Fewpips staff or to damage the firm through knowingly false claims.</p>'
    '<p>Nothing in this section restricts your right to leave honest reviews, to express genuine opinions about your experience, to raise a concern with a regulator or dispute-resolution body, or to exercise any right available to you under applicable consumer-protection law.</p>'
)

with open(HTML, 'r', encoding='utf-8') as f:
    h = f.read()

if 'Communications &amp; Public Conduct' in h:
    print("  HTML: already patched (skipping)")
else:
    # Step 1: renumber Contact 12 -> 13 (must do FIRST so we don't conflict with our new 12)
    OLD_CONTACT_HTML = '<h3>12. Contact</h3>'
    NEW_CONTACT_HTML = '<h3>13. Contact</h3>'
    if h.count(OLD_CONTACT_HTML) != 1:
        raise SystemExit(f"FAIL: expected 1 occurrence of '{OLD_CONTACT_HTML}', got {h.count(OLD_CONTACT_HTML)}")
    h = h.replace(OLD_CONTACT_HTML, NEW_CONTACT_HTML, 1)
    # Step 2: insert new section 12 BEFORE the now-13. Contact h3
    insert_anchor = NEW_CONTACT_HTML
    i = h.find(insert_anchor)
    h = h[:i] + NEW_HTML_SECTION + h[i:]
    with open(HTML, 'w', encoding='utf-8', newline='') as f:
        f.write(h)
    print(f"  HTML patched: {len(NEW_HTML_SECTION)} chars inserted")

# --- JS chunk insertion (must mirror exact React render order) ---
def jsx_h3(text):
    return f'(0,i.jsx)("h3",{{children:"{text}"}})'

def jsx_p(text):
    return f'(0,i.jsx)("p",{{children:"{text}"}})'

NEW_JS_NODES = ','.join([
    jsx_h3('12. Communications & Public Conduct'),
    jsx_p('We welcome honest feedback about your experience with Fewpips, including critical reviews, and we will never penalise you for sharing a genuine opinion.'),
    jsx_p('The following conduct is prohibited and may, where it is unlawful, result in suspension or termination of your account and/or the pursuit of legal remedies:'),
    jsx_p('(a) publishing statements of fact about Fewpips, its staff, or its services that you know to be false, or that are made with reckless disregard for their truth, where such statements are defamatory or cause demonstrable harm to the firm;'),
    jsx_p('(b) abusive, threatening, harassing, or discriminatory communications directed at Fewpips staff, whether made privately or on any public platform, review site, or social media channel;'),
    jsx_p('(c) impersonating Fewpips or any member of its team, or publishing the private or confidential information of any Fewpips employee or representative; and'),
    jsx_p('(d) coordinated, repeated, or malicious activity intended to harass Fewpips staff or to damage the firm through knowingly false claims.'),
    jsx_p('Nothing in this section restricts your right to leave honest reviews, to express genuine opinions about your experience, to raise a concern with a regulator or dispute-resolution body, or to exercise any right available to you under applicable consumer-protection law.'),
])

with open(CHUNK, 'r', encoding='utf-8') as f:
    j = f.read()

if 'Communications & Public Conduct' in j:
    print("  CHUNK: already patched (skipping)")
else:
    OLD_CONTACT_JS = '(0,i.jsx)("h3",{children:"12. Contact"})'
    NEW_CONTACT_JS = '(0,i.jsx)("h3",{children:"13. Contact"})'
    if j.count(OLD_CONTACT_JS) != 1:
        raise SystemExit(f"FAIL: expected 1 '{OLD_CONTACT_JS}', got {j.count(OLD_CONTACT_JS)}")
    j = j.replace(OLD_CONTACT_JS, NEW_CONTACT_JS, 1)
    # Insert new nodes BEFORE the 13. Contact node
    insert_anchor = NEW_CONTACT_JS
    idx = j.find(insert_anchor)
    j = j[:idx] + NEW_JS_NODES + ',' + j[idx:]
    with open(CHUNK, 'w', encoding='utf-8', newline='') as f:
        f.write(j)
    print(f"  CHUNK patched: {len(NEW_JS_NODES)} chars inserted")

print("Done.")
