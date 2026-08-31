#!/usr/bin/env python3
"""
gen-proof-seo.py - regenerate the machine-readable SEO for /proof from the ONE
source of truth: the DATA object embedded in proof/index.html.

What it (re)writes, with zero manual editing, every time a certificate/email is
added to that DATA array:
  1. The JSON-LD (Organization + ItemList of every funded certificate, with the
     payout amount + month) between the <!--PROOF-JSONLD:start/end--> markers in
     proof/index.html - so Google / ChatGPT / Perplexity can parse names, amounts
     and dates.
  2. The <lastmod> of the https://www.fewpips.com/proof entry in sitemap.xml, and
     the entry itself if it is missing.

Run locally (`python3 scripts/gen-proof-seo.py`) or in CI on every push that
touches proof/** (see .github/workflows/proof-seo.yml). Idempotent: if nothing
changed it leaves the files byte-for-byte identical and exits 0.

Usage:
  python3 scripts/gen-proof-seo.py [--check]
    --check  : do not write; exit 1 if regeneration WOULD change anything
               (used by the deploy gate / CI to catch a stale sitemap or JSON-LD).
"""
import json, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "proof", "index.html")
SITEMAP = os.path.join(ROOT, "sitemap.xml")
PROOF_URL = "https://www.fewpips.com/proof"
CHECK = "--check" in sys.argv

MONTHS = {
    "april": "2026-04", "may": "2026-05", "june": "2026-06",
    "july": "2026-07", "august": "2026-08", "september": "2026-09",
    "october": "2026-10", "november": "2026-11", "december": "2026-12",
}


def extract_array(html, key):
    """Pull the `key:[ ... ]` array of {src,name,month,amount} objects out of the
    inline DATA object without executing JS."""
    m = re.search(key + r"\s*:\s*\[(.*?)\]\s*(?:,\s*certs|};)", html, re.S)
    if not m:
        m = re.search(key + r"\s*:\s*\[(.*?)\]", html, re.S)
    body = m.group(1)
    items = []
    for obj in re.finditer(r"\{[^{}]*\}", body):
        o = obj.group(0)
        name = re.search(r'name:"([^"]*)"', o)
        month = re.search(r'month:"([^"]*)"', o)
        amount = re.search(r"amount:([0-9.]+)", o)
        if name and month and amount:
            items.append({
                "name": name.group(1),
                "month": month.group(1),
                "amount": float(amount.group(1)),
            })
    return items


def build_jsonld(certs, emails):
    # One payout per (name, month); a cert and an email are two proofs of the same one.
    uniq = {}
    for e in emails:
        uniq[(e["month"], e["name"])] = e["amount"]
    for c in certs:
        uniq.setdefault((c["month"], c["name"]), c["amount"])
    total = round(sum(uniq.values()), 2)

    org = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "fewpips",
        "url": "https://www.fewpips.com",
        "logo": "https://www.fewpips.com/fewpips-logo.png",
        "sameAs": ["https://www.fewpips.com/reviews/"],
    }

    list_items = []
    for i, c in enumerate(certs, 1):
        list_items.append({
            "@type": "ListItem",
            "position": i,
            "item": {
                "@type": "CreativeWork",
                "name": "Funded trader payout certificate - " + c["name"],
                "creditText": "fewpips verified payout",
                "temporalCoverage": MONTHS.get(c["month"], "2026"),
                "about": {
                    "@type": "MonetaryAmount",
                    "currency": "USD",
                    "value": round(c["amount"], 2),
                },
            },
        })

    itemlist = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "fewpips Proof of Payouts - funded trader certificates",
        "description": (
            "Verified funded-trader payout certificates from fewpips. "
            + str(len(certs)) + " certificates, "
            + "$" + format(total, ",.2f") + " in verified payouts."
        ),
        "url": PROOF_URL,
        "numberOfItems": len(certs),
        "itemListElement": list_items,
    }

    def block(obj):
        return ('<script type="application/ld+json">\n'
                + json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
                + "\n</script>")

    return "\n" + block(org) + "\n" + block(itemlist) + "\n", total, len(uniq)


def splice(html, new_block):
    start = "<!--PROOF-JSONLD:start-->"
    end = "<!--PROOF-JSONLD:end-->"
    a = html.index(start) + len(start)
    b = html.index(end)
    return html[:a] + new_block + html[b:]


def update_sitemap(xml, lastmod):
    entry = (
        "  <url>\n"
        "    <loc>" + PROOF_URL + "</loc>\n"
        "    <lastmod>" + lastmod + "</lastmod>\n"
        "    <changefreq>weekly</changefreq>\n"
        "    <priority>0.9</priority>\n"
        "  </url>\n"
    )
    if PROOF_URL + "</loc>" in xml:
        # replace existing block (either pretty or single-line form)
        xml = re.sub(
            r"[ \t]*<url>\s*<loc>" + re.escape(PROOF_URL) + r"</loc>.*?</url>\s*\n",
            entry, xml, count=1, flags=re.S)
        return xml
    return xml.replace("</urlset>", entry + "</urlset>")


def main():
    html = open(INDEX, encoding="utf-8").read()
    certs = extract_array(html, "certs")
    emails = extract_array(html, "emails")
    if not certs:
        print("ERROR: no certificates parsed from proof/index.html", file=sys.stderr)
        sys.exit(2)

    block, total, payouts = build_jsonld(certs, emails)
    new_html = splice(html, block)

    xml = open(SITEMAP, encoding="utf-8").read()
    today = datetime.date.today().isoformat()
    # keep the existing lastmod if the JSON-LD (i.e. the data) did not change,
    # so unrelated runs don't churn the date; bump to today when data changed.
    existing = re.search(
        r"<loc>" + re.escape(PROOF_URL) + r"</loc>\s*<lastmod>([0-9-]+)</lastmod>", xml)
    data_changed = (new_html != html)
    lastmod = today if (data_changed or not existing) else existing.group(1)
    new_xml = update_sitemap(xml, lastmod)

    changed = (new_html != html) or (new_xml != xml)
    if CHECK:
        if changed:
            print("STALE: /proof SEO out of date - run scripts/gen-proof-seo.py")
            sys.exit(1)
        print("OK: /proof JSON-LD + sitemap up to date")
        return

    if new_html != html:
        open(INDEX, "w", encoding="utf-8").write(new_html)
    if new_xml != xml:
        open(SITEMAP, "w", encoding="utf-8").write(new_xml)
    print("proof SEO regenerated: %d certs, %d payouts, $%s total, lastmod %s"
          % (len(certs), payouts, format(total, ",.2f"), lastmod))


if __name__ == "__main__":
    main()
